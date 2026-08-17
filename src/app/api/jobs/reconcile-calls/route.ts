// POST /api/jobs/reconcile-calls — récupération prudente des appels bloqués.
// Ce job est prévu pour être planifié par le futur scheduler de production.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleError, ok, unauthorized } from "@/lib/response";
import { recomputeCampaignStatus } from "@/lib/campaign-status";

const ACTIVE_CALL_STATUSES = ["INITIATED", "RINGING", "IN_PROGRESS"] as const;
const GRACE_MS = Number(process.env.CALL_RECONCILE_GRACE_MINUTES ?? 10) * 60_000;

type VapiMessage = {
  role?: string;
  message?: string;
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
  analysis?: { summary?: string };
  artifact?: { recordingUrl?: string; messages?: VapiMessage[] };
  messages?: VapiMessage[];
};

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
        campaign: { select: { id: true, maxRetries: true, maxDuration: true } },
      },
      take: 100,
    });

    let recovered = 0;
    let recoveredTests = 0;
    const affectedCampaigns = new Set<string>();
    for (const call of candidates) {
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
    const vapiKey = process.env.VAPI_API_KEY;
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
    }

    await Promise.all([...affectedCampaigns].map(recomputeCampaignStatus));
    return ok({ recovered, recoveredTests, examined: candidates.length, examinedTests: testCandidates.length });
  } catch (error) {
    return handleError(error);
  }
}
