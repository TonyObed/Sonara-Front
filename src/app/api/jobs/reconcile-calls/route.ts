// POST /api/jobs/reconcile-calls — récupération prudente des appels bloqués.
// Ce job est prévu pour être planifié par le futur scheduler de production.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleError, ok, unauthorized } from "@/lib/response";
import { recomputeCampaignStatus } from "@/lib/campaign-status";
import { getAnalysisQuality, measureConversationLatency } from "@/lib/call-quality";
import { inferCallDisposition } from "@/lib/call-disposition";

const ACTIVE_CALL_STATUSES = ["INITIATED", "RINGING", "IN_PROGRESS"] as const;
const GRACE_MS = Number(process.env.CALL_RECONCILE_GRACE_MINUTES ?? 10) * 60_000;

type VapiMessage = {
  role?: string;
  message?: string;
  time?: number;
  endTime?: number;
  secondsFromStart?: number;
};

type VapiCallRecord = {
  status?: string;
  endedReason?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  summary?: string;
  recordingUrl?: string;
  analysis?: { summary?: string; structuredData?: Record<string, unknown>; successEvaluation?: string };
  artifact?: { recordingUrl?: string; messages?: VapiMessage[] };
  messages?: VapiMessage[];
};

function sentimentScore(data?: Record<string, unknown>) {
  if (!data) return null;
  for (const key of ["sentimentScore", "sentiment_score", "score", "satisfactionScore"]) {
    const value = data[key];
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN;
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(10, parsed));
  }
  return null;
}

function insightTopics(data?: Record<string, unknown>) {
  const value = data?.topics ?? data?.keywords ?? data?.themes;
  if (!Array.isArray(value)) return null;
  const topics = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 20);
  return topics.length ? topics : null;
}

function finalStatusForVapiCall(call: VapiCallRecord) {
  const reason = `${call.status ?? ""} ${call.endedReason ?? ""}`.toLowerCase();
  if (reason.includes("voicemail") || reason.includes("answering-machine")) return "VOICEMAIL" as const;
  if (reason.includes("no-answer") || reason.includes("no_answer")) return "NO_ANSWER" as const;
  if (reason.includes("busy")) return "BUSY" as const;
  if (reason.includes("failed") || reason.includes("error")) return "FAILED" as const;
  return "COMPLETED" as const;
}

function formatVapiMessages(messages: VapiMessage[] | undefined) {
  return (messages ?? [])
    .filter((message) => typeof message.message === "string" && message.message.trim().length > 0)
    .map((message) => ({
      speaker: message.role === "assistant" ? "IA" : "Client",
      text: message.message,
      timestamp:
        message.secondsFromStart === undefined
          ? undefined
          : `${Math.floor(message.secondsFromStart / 60)}:${String(Math.floor(message.secondsFromStart % 60)).padStart(2, "0")}`,
    }));
}

export async function POST(request: NextRequest) {
  try {
    const expectedKey = process.env.INTERNAL_JOB_KEY;
    if (process.env.NODE_ENV === "production" && (!expectedKey || expectedKey.length < 16)) {
      return unauthorized("Configuration serveur invalide.");
    }
    if (request.headers.get("x-internal-key") !== (expectedKey ?? "dev-key")) {
      return unauthorized("Clé interne invalide.");
    }

    const candidates = await db.call.findMany({
      where: { status: { in: [...ACTIVE_CALL_STATUSES] } },
      include: {
        contact: { select: { id: true, attempts: true } },
        campaign: { select: { id: true, maxRetries: true, retryDelayMinutes: true, maxDuration: true } },
      },
      take: 100,
    });

    let recovered = 0;
    let recoveredFromVapi = 0;
    let repairedAnalyses = 0;
    let recoveredTests = 0;
    const affectedCampaigns = new Set<string>();
    const vapiKey = process.env.VAPI_API_KEY;
    for (const call of candidates) {
      // Un webhook peut être perdu alors que Vapi possède déjà le rapport final.
      // On consulte d'abord Vapi et on récupère les vraies données plutôt que
      // de transformer directement l'appel en échec après le délai de grâce.
      if (vapiKey && call.vapiCallId) {
        try {
          const response = await fetch(`https://api.vapi.ai/call/${call.vapiCallId}`, {
            headers: { Authorization: `Bearer ${vapiKey}` },
            cache: "no-store",
          });
          if (response.ok) {
            const remote = (await response.json()) as VapiCallRecord;
            const isTerminal = remote.status === "ended" || remote.status === "failed" || Boolean(remote.endedAt);
            if (isTerminal) {
              const status = finalStatusForVapiCall(remote);
              const messages = remote.artifact?.messages ?? remote.messages ?? [];
              const transcript = formatVapiMessages(messages);
              const summary = remote.analysis?.summary ?? remote.summary ?? null;
              const structuredData = remote.analysis?.structuredData;
              const disposition = inferCallDisposition(structuredData, remote.analysis?.successEvaluation, messages.map((message) => ({ role: message.role ?? "", message: message.message ?? "" })));
              const retryable = ["CALLBACK_REQUESTED", "TEMPORARILY_UNAVAILABLE", "INCOMPLETE"].includes(disposition);
              const shouldRetry = (status !== "COMPLETED" || retryable) && disposition !== "REFUSED" && call.contact.attempts + 1 < call.campaign.maxRetries;
              const nextRetryAt = shouldRetry ? new Date(Date.now() + call.campaign.retryDelayMinutes * 60_000) : null;
              const durationSec = remote.durationSeconds ?? (remote.startedAt && remote.endedAt
                ? Math.max(0, Math.round((new Date(remote.endedAt).getTime() - new Date(remote.startedAt).getTime()) / 1000))
                : null);
              const conversationLatency = measureConversationLatency(messages);
              const analysisQuality = getAnalysisQuality({ summary, structuredData, transcriptEntries: transcript.length });

              const transitioned = await db.$transaction(async (tx) => {
                const updated = await tx.call.updateMany({
                  where: { id: call.id, status: { in: [...ACTIVE_CALL_STATUSES] } },
                  data: {
                    status,
                    durationSec,
                    startedAt: remote.startedAt ? new Date(remote.startedAt) : call.startedAt,
                    endedAt: remote.endedAt ? new Date(remote.endedAt) : new Date(),
                    transcript,
                    summary,
                    recordingUrl: remote.artifact?.recordingUrl ?? remote.recordingUrl ?? null,
                  },
                });
                if (updated.count === 0) return false;
                await tx.callEvent.create({ data: { callId: call.id, eventType: "reconciled-end-of-call", payload: remote as object } });
                await tx.callInsight.upsert({
                  where: { callId: call.id },
                  create: { callId: call.id, sentimentScore: sentimentScore(structuredData), answers: (structuredData ?? undefined) as never, topics: insightTopics(structuredData) as never, providerMeta: { disposition, analysisQuality, conversationLatency, source: "vapi-reconciliation", nextRetryAt: nextRetryAt?.toISOString() ?? null } as never },
                  update: { sentimentScore: sentimentScore(structuredData), answers: (structuredData ?? undefined) as never, topics: insightTopics(structuredData) as never, providerMeta: { disposition, analysisQuality, conversationLatency, source: "vapi-reconciliation", nextRetryAt: nextRetryAt?.toISOString() ?? null } as never },
                });
                await tx.contact.update({
                  where: { id: call.contact.id },
                  data: { status: shouldRetry ? "PENDING" : status === "COMPLETED" ? "COMPLETED" : status === "VOICEMAIL" ? "VOICEMAIL" : "FAILED", attempts: { increment: 1 }, lastCalledAt: new Date(), nextRetryAt },
                });
                return true;
              });
              if (transitioned) {
                recovered += 1;
                recoveredFromVapi += 1;
                affectedCampaigns.add(call.campaign.id);
              }
              continue;
            }
          }
        } catch (error) {
          console.error("[Reconcile campaign call]", call.id, error);
        }
      }

      const expiresAt = call.updatedAt.getTime() + call.campaign.maxDuration * 1000 + GRACE_MS;
      if (expiresAt > Date.now()) continue;

      // Condition sur le statut : un webhook arrivé entre-temps gagne la course.
      const updated = await db.call.updateMany({
        where: { id: call.id, status: { in: [...ACTIVE_CALL_STATUSES] } },
        data: { status: "FAILED", endedAt: new Date() },
      });
      if (updated.count === 0) continue;

      const retry = call.contact.attempts + 1 < call.campaign.maxRetries;
      await db.contact.update({
        where: { id: call.contact.id },
        data: {
          status: retry ? "PENDING" : "FAILED",
          attempts: { increment: 1 },
          lastCalledAt: new Date(),
          nextRetryAt: retry
            ? new Date(Date.now() + call.campaign.retryDelayMinutes * 60_000)
            : null,
        },
      });
      recovered++;
      affectedCampaigns.add(call.campaign.id);
    }

    // Les appels test n'ont pas de campagne : ils ne passaient donc jamais par
    // la reconciliation et restaient ind\u00e9finiment \u00e0 RINGING si le webhook manquait.
    const testCandidates = await db.testCall.findMany({
      where: { status: { in: [...ACTIVE_CALL_STATUSES] }, vapiCallId: { not: null } },
      take: 100,
    });
    if (vapiKey) {
      for (const testCall of testCandidates) {
        try {
          const response = await fetch(`https://api.vapi.ai/call/${testCall.vapiCallId}`, {
            headers: { Authorization: `Bearer ${vapiKey}` },
            cache: "no-store",
          });
          if (!response.ok) continue;

          const remote = (await response.json()) as VapiCallRecord;
          const isTerminal =
            remote.status === "ended" ||
            remote.status === "failed" ||
            Boolean(remote.endedAt);
          if (!isTerminal) continue;

          const durationSec =
            remote.durationSeconds ??
            (remote.startedAt && remote.endedAt
              ? Math.max(0, Math.round((new Date(remote.endedAt).getTime() - new Date(remote.startedAt).getTime()) / 1000))
              : null);
          const status = finalStatusForVapiCall(remote);
          const updated = await db.testCall.updateMany({
            where: { id: testCall.id, status: { in: [...ACTIVE_CALL_STATUSES] } },
            data: {
              status,
              durationSec,
              startedAt: remote.startedAt ? new Date(remote.startedAt) : testCall.startedAt,
              endedAt: remote.endedAt ? new Date(remote.endedAt) : new Date(),
              transcript: formatVapiMessages(remote.artifact?.messages ?? remote.messages),
              summary: remote.analysis?.summary ?? remote.summary ?? null,
              recordingUrl: remote.artifact?.recordingUrl ?? remote.recordingUrl ?? null,
              error: status === "COMPLETED" ? null : remote.endedReason ?? "Appel termine sans resultat exploitable.",
            },
          });
          recoveredTests += updated.count;
        } catch (error) {
          console.error("[Reconcile test call]", testCall.id, error);
        }
      }

      // Deuxième filet de sécurité : un webhook final peut arriver sans son
      // analyse, puis Vapi compléter le résumé quelques secondes plus tard.
      // On répare uniquement les appels récents incomplets, sans modifier leur
      // statut, leur crédit ou le compteur de tentatives.
      const analysisCandidates = await db.call.findMany({
        where: {
          vapiCallId: { not: null },
          endedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          OR: [{ summary: null }, { insight: { is: null } }],
        },
        include: { insight: true },
        orderBy: { endedAt: "desc" },
        take: 50,
      });
      for (const call of analysisCandidates) {
        try {
          const response = await fetch(`https://api.vapi.ai/call/${call.vapiCallId}`, {
            headers: { Authorization: `Bearer ${vapiKey}` },
            cache: "no-store",
          });
          if (!response.ok) continue;
          const remote = (await response.json()) as VapiCallRecord;
          const messages = remote.artifact?.messages ?? remote.messages ?? [];
          const transcript = formatVapiMessages(messages);
          const summary = remote.analysis?.summary ?? remote.summary ?? call.summary;
          const structuredData = remote.analysis?.structuredData;
          if (!summary && !structuredData && transcript.length === 0) continue;

          const disposition = inferCallDisposition(structuredData, remote.analysis?.successEvaluation, messages.map((message) => ({ role: message.role ?? "", message: message.message ?? "" })));
          const conversationLatency = measureConversationLatency(messages);
          const analysisQuality = getAnalysisQuality({ summary, structuredData, transcriptEntries: transcript.length });
          await db.$transaction([
            db.call.update({
              where: { id: call.id },
              data: {
                summary: summary ?? undefined,
                ...(transcript.length ? { transcript } : {}),
              },
            }),
            db.callInsight.upsert({
              where: { callId: call.id },
              create: { callId: call.id, sentimentScore: sentimentScore(structuredData), answers: (structuredData ?? undefined) as never, topics: insightTopics(structuredData) as never, providerMeta: { disposition, analysisQuality, conversationLatency, source: "vapi-analysis-repair" } as never },
              update: { sentimentScore: sentimentScore(structuredData) ?? call.insight?.sentimentScore, answers: (structuredData ?? call.insight?.answers ?? undefined) as never, topics: (insightTopics(structuredData) ?? call.insight?.topics ?? undefined) as never, providerMeta: { disposition, analysisQuality, conversationLatency, source: "vapi-analysis-repair" } as never },
            }),
            db.callEvent.create({ data: { callId: call.id, eventType: "analysis-repaired", payload: { analysisQuality, source: "vapi" } } }),
          ]);
          repairedAnalyses += 1;
        } catch (error) {
          console.error("[Repair call analysis]", call.id, error);
        }
      }
    }

    await Promise.all([...affectedCampaigns].map(recomputeCampaignStatus));
    return ok({ recovered, recoveredFromVapi, recoveredTests, repairedAnalyses, examined: candidates.length, examinedTests: testCandidates.length });
  } catch (error) {
    return handleError(error);
  }
}
