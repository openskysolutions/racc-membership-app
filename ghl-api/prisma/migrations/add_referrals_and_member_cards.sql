-- CreateTable
CREATE TABLE "member_cards" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "publicId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "showPhone" BOOLEAN NOT NULL DEFAULT true,
    "showEmail" BOOLEAN NOT NULL DEFAULT true,
    "showWebsite" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" SERIAL NOT NULL,
    "referrerBusinessId" TEXT NOT NULL,
    "referrerUserId" INTEGER NOT NULL,
    "recipientBusinessId" TEXT NOT NULL,
    "recipientUserId" INTEGER,
    "leadName" TEXT NOT NULL,
    "leadContact" TEXT NOT NULL,
    "note" TEXT,
    "temperature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "hiddenByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_testimonials" (
    "id" SERIAL NOT NULL,
    "referralId" INTEGER NOT NULL,
    "authorUserId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_points" (
    "id" SERIAL NOT NULL,
    "businessId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'none',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_cards_userId_key" ON "member_cards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_cards_publicId_key" ON "member_cards"("publicId");

-- CreateIndex
CREATE INDEX "referrals_referrerBusinessId_idx" ON "referrals"("referrerBusinessId");

-- CreateIndex
CREATE INDEX "referrals_recipientBusinessId_idx" ON "referrals"("recipientBusinessId");

-- CreateIndex
CREATE INDEX "referrals_recipientUserId_idx" ON "referrals"("recipientUserId");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "referrals"("status");

-- CreateIndex
CREATE INDEX "referrals_createdAt_idx" ON "referrals"("createdAt");

-- CreateIndex
CREATE INDEX "referral_testimonials_referralId_idx" ON "referral_testimonials"("referralId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_points_businessId_key" ON "referral_points"("businessId");

-- AddForeignKey
ALTER TABLE "member_cards" ADD CONSTRAINT "member_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_testimonials" ADD CONSTRAINT "referral_testimonials_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

