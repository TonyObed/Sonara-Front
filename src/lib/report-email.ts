type ReportEmailInput = {
  recipients: string[];
  reportName: string;
  campaignName?: string | null;
};

export type ReportEmailResult =
  | { status: "sent"; id?: string }
  | { status: "skipped"; reason: "not-configured" };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

/** Envoi transactionnel sans SDK afin de garder le build léger sur Vercel. */
export async function sendReportReadyEmail(input: ReportEmailInput): Promise<ReportEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_EMAIL_FROM;
  if (!apiKey || !from) return { status: "skipped", reason: "not-configured" };

  const appUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl) throw new Error("APP_URL est requis pour envoyer les rapports.");

  const reportLabel = escapeHtml(input.campaignName ?? input.reportName);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.recipients,
      subject: `Votre rapport Sonara est prêt — ${input.campaignName ?? input.reportName}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#15171a;line-height:1.55">
          <h2 style="margin:0 0 12px">Votre rapport Sonara est prêt</h2>
          <p>${reportLabel} a été généré et peut être téléchargé depuis votre espace sécurisé.</p>
          <p><a href="${appUrl}/dashboard/reports" style="display:inline-block;padding:11px 18px;border-radius:8px;background:#0052ff;color:#fff;text-decoration:none">Ouvrir mes rapports</a></p>
          <p style="font-size:12px;color:#6b7280">Le fichier n'est pas joint à l'email afin de préserver la confidentialité des données clients.</p>
        </div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Envoi du rapport refusé (${response.status})${detail ? ` : ${detail.slice(0, 180)}` : ""}`);
  }
  const payload = await response.json().catch(() => ({})) as { id?: string };
  return { status: "sent", id: payload.id };
}
