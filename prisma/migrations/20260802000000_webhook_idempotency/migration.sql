-- Idempotence des webhooks Vapi : un même corps d'événement ne peut être
-- traité qu'une seule fois, même après retry réseau ou requêtes concurrentes.
ALTER TABLE "call_events"
  ADD COLUMN IF NOT EXISTS "event_fingerprint" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "call_events_event_fingerprint_key"
  ON "call_events"("event_fingerprint");
