# Email Not Sending - Production Troubleshooting Guide

## Problem
Confirmation emails are not being sent from the production server, but they work fine locally.

## Quick Diagnosis

### On Production Server (DO Droplet)

1. **SSH into the server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Navigate to the application directory:**
   ```bash
   cd /root/racc-membership-app/ghl-api
   ```

3. **Run the diagnostic script:**
   ```bash
   ./check-email-config.sh
   ```

   This will check:
   - ✅ .env file exists
   - ✅ Required email environment variables are set
   - ✅ Email service API endpoint responds
   - ✅ Can connect to SMTP server

### Alternative: Test via API

```bash
# Test email configuration
curl https://members.richfieldareachamber.com/api/auth/test-email

# Test sending confirmation code
curl -X POST https://members.richfieldareachamber.com/api/auth/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

## Common Issues & Solutions

### Issue 1: Missing Environment Variables

**Symptoms:**
- `/test-email` returns "Email service not configured"
- Logs show "Email transporter not initialized"

**Solution:**
```bash
# Check if variables are set
cd /root/racc-membership-app/ghl-api
grep EMAIL .env
grep SMTP .env

# If missing, add them:
nano .env
```

Required variables:
```env
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@richfieldareachamber.com
EMAIL_FROM_NAME=Richfield Area Chamber of Commerce
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
```

After updating, restart the service:
```bash
pm2 restart ghl-api
pm2 logs ghl-api --lines 50
```

### Issue 2: Firewall Blocking SMTP Port

**Symptoms:**
- Email timeout after 15 seconds
- Cannot connect to SMTP server

**Solution:**
```bash
# Check if port 587 is open
nc -zv your-smtp-server.com 587

# Or test telnet
telnet your-smtp-server.com 587

# If blocked, check firewall
ufw status
ufw allow out 587/tcp
```

### Issue 3: Invalid SMTP Credentials

**Symptoms:**
- Connection succeeds but emails don't send
- Logs show authentication errors

**Solution:**
1. Verify credentials are correct
2. For Gmail: Use App Password, not regular password
3. Test credentials manually:
   ```bash
   # Install swaks if needed
   apt-get install swaks
   
   # Test SMTP
   swaks --to test@example.com \
     --from $EMAIL_FROM \
     --server $SMTP_HOST \
     --port $SMTP_PORT \
     --auth-user $SMTP_USER \
     --auth-password $SMTP_PASS
   ```

### Issue 4: .env File Not Loaded

**Symptoms:**
- Variables are set in .env but API returns "not set"
- Environment check shows all false

**Solution:**
```bash
# Check if .env file is in the correct location
ls -la /root/racc-membership-app/ghl-api/.env

# Check PM2 ecosystem configuration
pm2 describe ghl-api

# Restart with explicit env file
pm2 restart ghl-api --update-env
pm2 save
```

### Issue 5: Wrong SMTP Server/Port

**Symptoms:**
- Connection timeout
- Cannot resolve hostname

**Common SMTP configurations:**

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Office 365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

**SendGrid:**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
```

**Mailgun:**
```env
EMAIL_PROVIDER=mailgun
MAILGUN_USER=postmaster@your-domain.mailgun.org
MAILGUN_PASS=your-mailgun-password
```

## Checking Server Logs

### Real-time logs:
```bash
pm2 logs ghl-api
```

### Search for email errors:
```bash
pm2 logs ghl-api --lines 500 | grep -i email
pm2 logs ghl-api --lines 500 | grep "❌"
pm2 logs ghl-api --lines 500 | grep "⚠️"
```

### Look for these log messages:

**Successful:**
```
✅ Confirmation email sent successfully to email@example.com
```

**Failed:**
```
❌ Email service returned false for email@example.com
❌ Email transporter not initialized
⚠️ Email sending error for email@example.com: timeout
```

## Testing Locally

If production isn't working, test locally first:

```bash
# In ghl-api directory
cd /Users/schott/Projects/racc-membership-app/ghl-api

# Set up environment variables
cp .env.example .env
# Edit .env with production SMTP settings

# Start server
npm run dev

# In another terminal, test
curl -X POST http://localhost:5005/api/auth/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

## Code Changes Made

### 1. Enhanced Email Service Logging
- Added startup logging showing provider and configuration
- Validates credentials before creating transporter
- Returns `null` if credentials missing

### 2. Connection Timeouts
- `connectionTimeout: 10000ms` - Connection establishment
- `greetingTimeout: 10000ms` - Server greeting
- `socketTimeout: 15000ms` - Socket inactivity
- Endpoint timeout: 15 seconds total

### 3. Improved Error Messages
- Clear error messages in logs
- Debug information in development mode
- Hints about what to check

### 4. Enhanced Test Endpoint
`GET /api/auth/test-email` now shows:
- Environment variables status
- Connection test result
- Configuration details
- Helpful suggestions

## Production Deployment Checklist

- [ ] Environment variables set in `/root/racc-membership-app/ghl-api/.env`
- [ ] SMTP credentials verified
- [ ] Port 587 (or 465) open in firewall
- [ ] Code deployed: `git pull && npm install && npm run build`
- [ ] Service restarted: `pm2 restart ghl-api`
- [ ] Test endpoint: `/api/auth/test-email` returns success
- [ ] Test send confirmation: Email received in inbox
- [ ] Check logs: `pm2 logs ghl-api` shows no errors

## Still Not Working?

1. **Check PM2 process status:**
   ```bash
   pm2 status
   pm2 describe ghl-api
   ```

2. **Check system logs:**
   ```bash
   journalctl -u pm2-root -n 100
   ```

3. **Verify Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

4. **Check available disk space:**
   ```bash
   df -h
   ```

5. **Contact support with:**
   - Output from `./check-email-config.sh`
   - Last 100 lines of PM2 logs
   - Result from `/api/auth/test-email`
