export interface TimedTranscriptEntry {
  role?: string;
  message?: string;
  time?: number;
  endTime?: number;
  secondsFromStart?: number;
}

export interface ConversationLatency {
  averageResponseMs: number | null;
  p95ResponseMs: number | null;
  samples: number;
}

function entryStart(entry: TimedTranscriptEntry): number | null {
  const value = entry.time ?? entry.secondsFromStart;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function entryEnd(entry: TimedTranscriptEntry): number | null {
  const value = entry.endTime ?? entry.time ?? entry.secondsFromStart;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Mesure le délai perçu entre la fin d'une intervention client et le début de
 * la réponse suivante de l'assistante. Les valeurs aberrantes (> 30 s) sont
 * ignorées car elles correspondent généralement à un silence ou à une reprise.
 */
export function measureConversationLatency(entries: TimedTranscriptEntry[]): ConversationLatency {
  const samples: number[] = [];

  for (let index = 0; index < entries.length - 1; index += 1) {
    const current = entries[index];
    if (current.role !== "user") continue;

    const userEnd = entryEnd(current);
    if (userEnd == null) continue;

    const nextAssistant = entries.slice(index + 1).find((entry) => entry.role === "assistant");
    if (!nextAssistant) continue;
    const assistantStart = entryStart(nextAssistant);
    if (assistantStart == null) continue;

    const delayMs = Math.round((assistantStart - userEnd) * 1000);
    if (delayMs >= 0 && delayMs <= 30_000) samples.push(delayMs);
  }

  if (!samples.length) return { averageResponseMs: null, p95ResponseMs: null, samples: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const averageResponseMs = Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
  const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return { averageResponseMs, p95ResponseMs: sorted[p95Index], samples: samples.length };
}

export function getAnalysisQuality(input: {
  summary?: string | null;
  structuredData?: Record<string, unknown> | null;
  transcriptEntries: number;
}) {
  const hasSummary = Boolean(input.summary?.trim());
  const hasStructuredData = Boolean(input.structuredData && Object.keys(input.structuredData).length);

  if (hasSummary && hasStructuredData) return "COMPLETE" as const;
  if (hasSummary || hasStructuredData || input.transcriptEntries > 0) return "PARTIAL" as const;
  return "MISSING" as const;
}
