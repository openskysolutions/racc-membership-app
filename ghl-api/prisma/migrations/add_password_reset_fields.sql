-- Manual migration to add password reset fields to users table
-- Run this SQL directly in your PostgreSQL database

-- Add password reset token and expiry fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiry" TIMESTAMP(3);

-- Create index on passwordResetToken for faster lookups
CREATE INDEX IF NOT EXISTS "users_passwordResetToken_idx" ON users("passwordResetToken");

-- Verify the columns were added
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE 'password%';
