# Email Timeout Fix - `/api/auth/send-confirmation`

## Problem
The `/api/auth/send-confirmation` endpoint was hanging and timing out on the production server, causing poor user experience during account connection flow.

## Root Causes
1. **No connection timeouts** - Nodemailer transporter had no timeout configurations, causing indefinite hangs when SMTP server is unresponsive
2. **Long timeout period** - Original 30-second timeout was too long for good UX
3. **No connection pooling** - Each request created new connections, potentially exhausting server resources
4. **Insufficient error logging** - Hard to diagnose issues in production

## Implemented Solutions

### 1. Added Nodemailer Connection Timeouts
Added three critical timeout configurations to all email providers:

```typescript
{
  connectionTimeout: 10000,  // 10 seconds to establish connection
  greetingTimeout: 10000,    // 10 seconds for server greeting
  socketTimeout: 15000,      // 15 seconds for socket inactivity
}
```

### 2. Added Connection Pooling for SMTP
Configured connection pooling to reuse connections and prevent exhaustion:

```typescript
{
  pool: true,              // Enable connection pooling
  maxConnections: 5,       // Max 5 concurrent connections
  maxMessages: 100,        // Max 100 messages per connection
  rateDelta: 1000,        // Rate limiting window (1 second)
  rateLimit: 10,          // Max 10 emails per second
}
```

### 3. Reduced Endpoint Timeout
Reduced the race condition timeout from 30 seconds to 15 seconds:
- Faster failure response for users
- Prevents long hanging requests
- Still allows reasonable time for email delivery

### 4. Added Double-Layer Timeout Protection
- **Layer 1**: Nodemailer internal timeouts (10-15s)
- **Layer 2**: `sendMail()` promise race timeout (12s)
- **Layer 3**: Endpoint-level promise race timeout (15s)

### 5. Improved Error Logging
Added more descriptive error messages with emoji indicators:
- `✅` Success
- `⚠️` Warning/timeout
- `❌` Critical failure

## Verification Steps

### 1. Test Email Configuration
```bash
curl https://members.richfieldareachamber.com/api/auth/test-email
```

Expected response:
```json
{
  "message": "Email service is configured correctly",
  "provider": "smtp",
  "fromEmail": "noreply@richfieldareachamber.com"
}
```

### 2. Test Send Confirmation
```bash
curl -X POST https://members.richfieldareachamber.com/api/auth/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Should respond within 15 seconds (likely much faster):
```json
{
  "message": "Confirmation code sent successfully"
}
```

### 3. Check Server Logs
SSH into DO droplet and check logs:
```bash
# If using PM2
pm2 logs ghl-api --lines 100

# Or check application logs
tail -f /path/to/app/logs/app.log
```

Look for:
- `✅ Confirmation email sent successfully to [email]`
- `⚠️ Email sending error` (if timeouts occur)
- `⚠️ Failed to send confirmation email` (if email service fails)

## Production Deployment

### 1. Environment Variables to Check
Ensure these are set on the DO droplet:

```env
# Required
EMAIL_PROVIDER=smtp
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password

# Optional
SMTP_SECURE=false
EMAIL_FROM=noreply@richfieldareachamber.com
EMAIL_FROM_NAME=Richfield Area Chamber of Commerce
```

### 2. Deploy Changes
```bash
# On DO droplet
cd /path/to/racc-membership-app/ghl-api
git pull origin main  # or your deployment branch
npm install
npm run build
pm2 restart ghl-api
```

### 3. Monitor After Deployment
```bash
# Watch logs in real-time
pm2 logs ghl-api

# Check status
pm2 status
```

## Troubleshooting

### Issue: Still timing out after 15 seconds
**Possible causes:**
- SMTP server is down or unreachable
- Firewall blocking SMTP port (587 or 465)
- Invalid SMTP credentials

**Debug steps:**
1. Test SMTP connection manually:
   ```bash
   telnet your-smtp-server.com 587
   ```

2. Check if credentials are valid

3. Verify firewall rules allow outbound SMTP

### Issue: Emails not received
**Possible causes:**
- Email sent but marked as spam
- SMTP credentials invalid
- FROM address not authorized

**Debug steps:**
1. Check server logs for "✅ Email sent successfully"
2. Check spam folder
3. Verify SPF/DKIM records for sending domain
4. Test with `/api/auth/test-email` endpoint

### Issue: "Email transporter not initialized"
**Possible causes:**
- Missing or invalid environment variables
- Nodemailer initialization failed

**Debug steps:**
1. Check environment variables are set
2. Look for initialization error in startup logs:
   ```bash
   pm2 logs ghl-api --lines 200 | grep "Email service"
   ```
3. Should see: `📧 Email service initialized with provider: smtp`

## Performance Expectations

With these changes:
- **Success case**: Response in 1-3 seconds
- **SMTP slow**: Response in 10-15 seconds (timeout kicks in)
- **SMTP down**: Response in 15 seconds (endpoint timeout)
- **Old behavior**: Hung indefinitely or 30+ seconds

## Testing in Development

```bash
# In ghl-api directory
npm run dev

# In another terminal
curl -X POST http://localhost:5005/api/auth/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

In development mode, the confirmation code is logged to console for testing.

## Related Files
- `/ghl-api/src/services/emailService.ts` - Email service with timeouts
- `/ghl-api/src/routes/auth.ts` - Send confirmation endpoint
- `/ghl-api/src/templates/emails.ts` - Email templates
