ALTER TABLE "campaigns"
ALTER COLUMN "ai_voice_model" SET DEFAULT 'eleven_flash_v2_5';

UPDATE "campaigns"
SET "ai_voice_model" = 'eleven_flash_v2_5'
WHERE "ai_voice_model" = 'eleven_turbo_v2_5';
