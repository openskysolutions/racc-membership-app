# Password Reset Database Migration

Since Prisma Migrate is not working, here are alternative methods to update your database:

## Option 1: Use Prisma DB Push (Recommended)

This syncs your Prisma schema with the database without using migrations:

```bash
cd ghl-api
npx prisma db push
```

This will read your `schema.prisma` file and apply the changes directly to your database.

## Option 2: Run SQL Manually

If `db push` doesn't work, you can run the SQL directly:

1. **Connect to your PostgreSQL database** using your preferred client (psql, pgAdmin, etc.)

2. **Run the migration SQL**:
   ```bash
   psql -h <your-host> -U <your-user> -d <your-database> -f prisma/migrations/add_password_reset_fields.sql
   ```

   Or copy and paste this SQL into your database client:
   ```sql
   ALTER TABLE users 
   ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
   ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiry" TIMESTAMP(3);
   
   CREATE INDEX IF NOT EXISTS "users_passwordResetToken_idx" ON users("passwordResetToken");
   ```

3. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## Verify the Migration

After running either option, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name LIKE 'password%';
```

You should see:
- `passwordHash`
- `passwordResetToken`
- `passwordResetTokenExpiry`

## Testing the Password Reset Flow

1. **Start the backend server** (if not already running)
2. **Navigate to the login page** in your frontend
3. **Click "Forgot password?"**
4. **Enter your email** and check your inbox for the reset link
5. **Click the reset link** and set a new password

## Troubleshooting

If emails aren't being sent, check your email service configuration in `.env`:
- `EMAIL_PROVIDER` (smtp or sendgrid)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` for SMTP
- `SENDGRID_API_KEY` for SendGrid
- `EMAIL_FROM` (sender email address)
- `FRONTEND_URL` (for reset link generation)
