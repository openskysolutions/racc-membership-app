-- Manual migration: split referral "leadContact" into leadPhone (required) + leadEmail (optional)
-- and add an optional leadBusinessName. Applies to referrals and non_member_referrals.
-- Run this SQL directly in your PostgreSQL database (or `npx prisma db push`).

ALTER TABLE "referrals"
  ADD COLUMN IF NOT EXISTS "leadPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "leadEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "leadBusinessName" TEXT;

ALTER TABLE "non_member_referrals"
  ADD COLUMN IF NOT EXISTS "leadPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "leadEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "leadBusinessName" TEXT;

-- Backfill from the old single field: anything containing "@" was an email, the rest a phone/other.
UPDATE "referrals"
  SET "leadEmail" = CASE WHEN "leadContact" LIKE '%@%' THEN "leadContact" END,
      "leadPhone" = CASE WHEN "leadContact" LIKE '%@%' THEN '' ELSE "leadContact" END
  WHERE "leadPhone" IS NULL;

UPDATE "non_member_referrals"
  SET "leadEmail" = CASE WHEN "leadContact" LIKE '%@%' THEN "leadContact" END,
      "leadPhone" = CASE WHEN "leadContact" LIKE '%@%' THEN '' ELSE "leadContact" END
  WHERE "leadPhone" IS NULL;

ALTER TABLE "referrals" ALTER COLUMN "leadPhone" SET NOT NULL;
ALTER TABLE "non_member_referrals" ALTER COLUMN "leadPhone" SET NOT NULL;

ALTER TABLE "referrals" DROP COLUMN IF EXISTS "leadContact";
ALTER TABLE "non_member_referrals" DROP COLUMN IF EXISTS "leadContact";
