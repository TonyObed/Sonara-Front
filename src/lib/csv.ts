const EXCEL_DELIMITER = ";";

function escapeCsvValue(value: unknown): string {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  // Empêche Excel et LibreOffice d'interpréter une cellule comme une formule.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** CSV UTF-8 compatible avec les paramètres régionaux francophones d'Excel. */
export function toExcelCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "\uFEFF";

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvValue).join(EXCEL_DELIMITER),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(EXCEL_DELIMITER)
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}
