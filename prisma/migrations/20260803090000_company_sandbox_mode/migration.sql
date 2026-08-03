-- Une entreprise sandbox peut tester les campagnes sans blocage ni débit de crédits.
-- Le paramètre est stocké par entreprise : aucune exception n'est codée sur son nom.
ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "is_sandbox" BOOLEAN NOT NULL DEFAULT false;
