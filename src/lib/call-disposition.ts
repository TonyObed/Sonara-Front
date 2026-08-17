type TranscriptEntry = { role: string; message: string };

export type CallDisposition = "COMPLETED" | "CALLBACK_REQUESTED" | "TEMPORARILY_UNAVAILABLE" | "REFUSED" | "INCOMPLETE";

export function inferCallDisposition(
  data: Record<string, unknown> | undefined,
  successEvaluation: unknown,
  transcript: TranscriptEntry[]
): CallDisposition {
  const raw = typeof data?.callDisposition === "string"
    ? data.callDisposition
    : typeof data?.call_disposition === "string"
    ? data.call_disposition
    : "";
  const normalized = raw.trim().toUpperCase().replace(/[ -]+/g, "_");
  if (["COMPLETED", "CALLBACK_REQUESTED", "TEMPORARILY_UNAVAILABLE", "REFUSED", "INCOMPLETE"].includes(normalized)) {
    return normalized as CallDisposition;
  }

  const clientText = transcript
    .filter((entry) => entry.role === "user")
    .map((entry) => entry.message)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/je refuse|ne veux pas|pas interesse|arretez|ne rappelez pas/.test(clientText)) {
    return "REFUSED";
  }
  if (/rappel|rappelez|plus tard|pas (?:le temps|disponible|maintenant)|occupe|indisponible/.test(clientText)) {
    return "TEMPORARILY_UNAVAILABLE";
  }
  if (successEvaluation === true || `${successEvaluation}`.toLowerCase() === "true") return "COMPLETED";
  return "INCOMPLETE";
}
