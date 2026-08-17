import { config } from "dotenv";
import { inferCampaignQuestions } from "../src/lib/campaign-questions";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db");
  const campaigns = await db.campaign.findMany({
    select: { id: true, aiBrief: true, questions: { orderBy: { position: "asc" } } },
  });

  let campaignsUpdated = 0;
  let questionsCreated = 0;
  let questionsUpdated = 0;
  for (const campaign of campaigns) {
    const questions = inferCampaignQuestions(campaign.aiBrief);
    if (questions.length === 0) continue;
    const before = new Map(campaign.questions.map((question) => [question.key, question]));
    await db.$transaction(
      questions.map((question) => db.campaignQuestion.upsert({
        where: { campaignId_key: { campaignId: campaign.id, key: question.key } },
        create: { ...question, campaignId: campaign.id },
        update: { label: question.label, kind: question.kind, position: question.position },
      }))
    );
    const created = questions.filter((question) => !before.has(question.key)).length;
    const updated = questions.filter((question) => {
      const previous = before.get(question.key);
      return previous && (previous.label !== question.label || previous.kind !== question.kind || previous.position !== question.position);
    }).length;
    if (created > 0 || updated > 0) campaignsUpdated += 1;
    questionsCreated += created;
    questionsUpdated += updated;
  }

  console.log(JSON.stringify({ campaignsScanned: campaigns.length, campaignsUpdated, questionsCreated, questionsUpdated }));
  await db.$disconnect();
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
