ALTER TABLE "contacts"
ADD COLUMN "next_retry_at" TIMESTAMP(3);

CREATE INDEX "contacts_campaign_id_next_retry_at_idx"
ON "contacts"("campaign_id", "next_retry_at");

-- Les contacts déjà en attente après une tentative conservent le délai défini
-- par leur campagne au lieu d'être rappelés immédiatement au déploiement.
UPDATE "contacts" AS contact
SET "next_retry_at" = contact."last_called_at" + (campaign."retry_delay_minutes" * INTERVAL '1 minute')
FROM "campaigns" AS campaign
WHERE contact."campaign_id" = campaign."id"
  AND contact."status" = 'PENDING'
  AND contact."attempts" > 0
  AND contact."last_called_at" IS NOT NULL;

-- Un appel décroché mais non exploitable ne doit pas fermer définitivement le
-- contact. Les anciens résultats Vapi contiennent déjà successEvaluation=false.
UPDATE "contacts" AS contact
SET "status" = 'PENDING',
    "next_retry_at" = NOW()
FROM "campaigns" AS campaign
WHERE contact."campaign_id" = campaign."id"
  AND contact."status" = 'COMPLETED'
  AND contact."attempts" < campaign."max_retries"
  AND EXISTS (
    SELECT 1
    FROM "calls" AS call
    JOIN "call_insights" AS insight ON insight."call_id" = call."id"
    WHERE call."contact_id" = contact."id"
      AND call."status" = 'COMPLETED'
      AND LOWER(COALESCE(insight."provider_meta"->>'successEvaluation', '')) = 'false'
  );

-- Nettoie les consignes qui avaient été concaténées à la dernière question.
UPDATE "campaign_questions"
SET "label" = REGEXP_REPLACE(
  "label",
  '\s+(Ton objectif|Reste chaleureuse|Si la personne|À la fin|A la fin|Après cette|Apres cette).*$','', 'i'
)
WHERE "label" ~* '\s+(Ton objectif|Reste chaleureuse|Si la personne|À la fin|A la fin|Après cette|Apres cette)';
