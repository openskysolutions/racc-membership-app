# Mobile Development Setup Guide

## Quick Start - iOS Device Testing

### 1. Configure Environment Variables

Your Mac's local IP: **192.168.200.0**

The `.env.mobile.local` file has been created with your IP address:
```bash
VITE_API_BASE_URL=http://192.168.200.0:3000/api
```

### 2. Start Backend Server

The backend server is now configured to accept connections from your local network.

```bash
cd ghl-api
npm run build && npm start
```

The server will be accessible at:
- Local: http://localhost:3000/api
- Network: http://192.168.200.0:3000/api

### 3. Build and Deploy to iOS

```bash
# Build the app with mobile environment variables
npm run build:mobile

# Sync to iOS (copies dist folder to ios/App/App/public)
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Or use the combined command:
```bash
npm run cap:run:ios
```

### 4. Run on Device

In Xcode:
1. Select your iPhone/iPad from the device dropdown
2. Click Run (▶️) or press `Cmd + R`
3. The app will install and launch on your device

## Troubleshooting

### Issue: "Failed to fetch" errors on device

**Solution:** Ensure both devices are on the same Wi-Fi network

1. Check your Mac's IP hasn't changed:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `.env.mobile.local` if IP changed

3. Rebuild and sync:
   ```bash
   npm run cap:run:ios
   ```

### Issue: Backend not accessible from phone

**Solution:** Check firewall settings

1. Open System Settings > Network > Firewall
2. Ensure Node.js is allowed to accept incoming connections
3. Or temporarily disable firewall for testing

### Issue: CORS errors

**Solution:** The backend CORS is now configured to accept:
- All local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- Capacitor app schemes (capacitor://localhost)

If still seeing CORS errors, restart the backend server.

## Environment Files

- `.env` - Default web development (not committed)
- `.env.local` - Local web development overrides (not committed)
- `.env.mobile` - Mobile production config (committed)
- `.env.mobile.local` - Mobile development config with your IP (not committed)

## NPM Scripts

### Mobile Development
```bash
npm run build:mobile        # Build with .env.mobile.local
npm run cap:sync:ios        # Build and sync to iOS
npm run cap:run:ios         # Build, sync, and open Xcode
```

### Platform Management
```bash
npm run cap:add:ios         # Add iOS platform (one-time)
npm run cap:add:android     # Add Android platform (one-time)
npm run cap:open:ios        # Open iOS project in Xcode
npm run cap:open:android    # Open Android in Android Studio
```

## Development Workflow

### Daily Development Loop

1. **Start Backend** (one terminal):
   ```bash
   cd ghl-api
   npm run build && npm start
   ```

2. **Build and Deploy** (another terminal):
   ```bash
   npm run cap:run:ios
   ```

3. **Make Changes** to React components

4. **Rebuild and Sync**:
   ```bash
   npm run cap:sync:ios
   ```

5. **In Xcode**: Click Run to reload app on device

### Hot Reload (Advanced)

For faster development, you can enable live reload:

1. Update `.env.mobile.local`:
   ```bash
   VITE_API_BASE_URL=http://192.168.200.0:3000/api
   VITE_DEV_SERVER_URL=http://192.168.200.0:5173
   ```

2. Start Vite dev server:
   ```bash
   npm run dev
   ```

3. Update `capacitor.config.json`:
   ```json
   {
     "server": {
       "url": "http://192.168.200.0:5173",
       "cleartext": true
     }
   }
   ```

4. Rebuild and run in Xcode - app will load from dev server with hot reload

⚠️ **Remember to remove `server.url` before building for production!**

## Production Deployment

### For TestFlight/App Store

1. Update `.env.mobile` with production API URL:
   ```bash
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

2. Remove any `server.url` from `capacitor.config.json`

3. Build for production:
   ```bash
   npm run build:mobile
   npx cap sync ios
   ```

4. In Xcode:
   - Select **Any iOS Device (arm64)**
   - Product → Archive
   - Distribute to App Store Connect

## Testing Checklist

- [ ] Backend server running on http://192.168.200.0:3000
- [ ] Both Mac and iPhone/iPad on same Wi-Fi network
- [ ] `.env.mobile.local` has correct IP address
- [ ] Firewall allows Node.js connections
- [ ] App built with `npm run build:mobile`
- [ ] Capacitor synced with `npx cap sync ios`
- [ ] Device selected in Xcode
- [ ] Developer certificate trusted on device (Settings → General → VPN & Device Management)

## Network Requirements

- **Same Wi-Fi**: Mac and mobile device must be on same network
- **Firewall**: Mac firewall must allow incoming connections on port 3000
- **HTTPS**: Not required for local network during development
- **VPN**: Disable VPN on Mac or device if connection issues occur

## Next Steps

After testing locally:
1. Deploy backend to production server
2. Update `.env.mobile` with production URL
3. Test with production backend
4. Submit to TestFlight for beta testing
5. Submit to App Store

## Useful Commands

```bash
# Get your Mac's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Check backend is accessible from network
curl http://192.168.200.0:3000/api/health

# View Capacitor configuration
npx cap doctor

# Clean and rebuild
rm -rf dist ios/App/App/public
npm run cap:run:ios
```
