CREATE TABLE IF NOT EXISTS "test_calls" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "vapi_call_id" TEXT,
  "phone" TEXT NOT NULL,
  "first_name" TEXT,
  "ai_voice" TEXT NOT NULL,
  "ai_brief" TEXT NOT NULL,
  "ai_temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "status" "CallStatus" NOT NULL DEFAULT 'INITIATED',
  "duration_sec" INTEGER,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "transcript" JSONB,
  "summary" TEXT,
  "recording_url" TEXT,
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "test_calls_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "test_calls_vapi_call_id_key" ON "test_calls"("vapi_call_id");
CREATE INDEX IF NOT EXISTS "test_calls_company_id_created_at_idx" ON "test_calls"("company_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "test_calls" ADD CONSTRAINT "test_calls_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
