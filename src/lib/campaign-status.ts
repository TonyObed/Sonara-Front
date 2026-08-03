import { db } from "@/lib/db";

/**
 * Une campagne ne peut être terminée que lorsqu'il ne reste ni contact
 * réclamable ni appel Vapi encore actif. Cette règle est partagée entre le
 * scheduler et le webhook afin d'éviter des états contradictoires.
 */
export async function recomputeCampaignStatus(campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true, maxRetries: true },
  });

  if (!campaign || campaign.status !== "RUNNING") return { completed: false };

  const [remainingContacts, activeCalls] = await Promise.all([
    db.contact.count({
      where: {
        campaignId,
        OR: [
          { status: "CALLING" },
          { status: "PENDING", attempts: { lt: campaign.maxRetries } },
        ],
      },
    }),
    db.call.count({
      where: {
        campaignId,
        status: { in: ["INITIATED", "RINGING", "IN_PROGRESS"] },
      },
    }),
  ]);

  if (remainingContacts > 0 || activeCalls > 0) return { completed: false };

  const updated = await db.campaign.updateMany({
    where: { id: campaignId, status: "RUNNING" },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return { completed: updated.count === 1 };
}
