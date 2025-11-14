# iOS Deployment Guide - RACC Membership App

## Prerequisites

✅ **Completed:**
- [x] Xcode 26.1 installed
- [x] Capacitor configured
- [x] iOS platform added
- [x] Web assets built

**Required for App Store deployment:**
- [ ] Apple Developer Account ($99/year)
- [ ] iOS device registered in Apple Developer Portal
- [ ] App Store Connect app created
- [ ] Provisioning profiles and certificates

## Development Workflow

### 1. Build and Sync

```bash
# Build the web app for mobile (uses production API endpoints)
npm run build:mobile:prod

# Sync web assets to iOS
npx cap sync ios
```

**Important:** Always use `build:mobile:prod` instead of `build` for mobile deployments. This ensures the app uses production API endpoints instead of localhost.

### 2. Open in Xcode

```bash
# Open iOS project in Xcode
npx cap open ios
```

Or manually open: `/Users/schott/Projects/racc-membership-app/ios/App/App.xcworkspace`

### 3. Configure Signing in Xcode

1. Open the project in Xcode
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Select your **Team** (requires Apple Developer account)
5. Xcode will automatically manage signing certificates and provisioning profiles

### 4. Run on Physical Device

1. Connect your iPhone/iPad via USB
2. Trust the computer on your device if prompted
3. Select your device from the device dropdown in Xcode (top toolbar)
4. Click the **Play** button or press `Cmd + R`
5. On first run, go to **Settings > General > VPN & Device Management** on your device and trust the developer certificate

## Testing on Multiple Devices

### Using TestFlight (Recommended for Beta Testing)

1. **Create App in App Store Connect:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+" → "New App"
   - Fill in app information
   - Bundle ID: `com.racc.membership`

2. **Archive the App:**
   ```bash
   # Build for release
   npm run build
   npx cap sync ios
   ```
   
   In Xcode:
   - Select **Any iOS Device (arm64)** as destination
   - Product → Archive
   - Once archived, click **Distribute App**
   - Choose **App Store Connect**
   - Follow the wizard

3. **Upload to TestFlight:**
   - Upload will process in App Store Connect
   - Add external testers via email
   - Testers download TestFlight app and get access to your app

### Direct Installation (Development)

For testing on your own devices without TestFlight:

1. **Register Devices:**
   - Get device UDID: Connect device → Finder → Click device → Click name to reveal UDID
   - Add to Apple Developer Portal: Certificates, Identifiers & Profiles → Devices

2. **Build with Development Provisioning:**
   - Xcode will include registered devices
   - Install directly via Xcode (Run button)

## App Store Deployment

### 1. Prepare App Assets

Required assets for App Store:
- App Icon (1024x1024px)
- Screenshots for different device sizes
- Privacy Policy URL
- Support URL
- App description and metadata

### 2. Update App Information

Update in `capacitor.config.json`:
```json
{
  "appId": "com.racc.membership",
  "appName": "RACC Membership",
  "version": "1.0.0"
}
```

Update in `ios/App/App/Info.plist`:
- Privacy descriptions (Camera, Photo Library, etc.)
- Permissions your app needs

### 3. Build for Production

```bash
# Ensure you're building production assets
npm run build
npx cap sync ios
```

In Xcode:
1. Update version/build number in **General** tab
2. Select **Any iOS Device (arm64)**
3. Product → Archive
4. Distribute → App Store Connect
5. Upload

### 4. Submit for Review

1. Go to App Store Connect
2. Select your app → App Store tab
3. Add version information
4. Upload screenshots
5. Fill out all required fields
6. Submit for Review

## Common Issues and Solutions

### Issue: "Unable to install app"
**Solution:** Check that device UDID is registered and provisioning profile is up to date

### Issue: Build fails with signing error
**Solution:** 
- Revoke existing certificates in Apple Developer Portal
- Let Xcode automatically manage signing
- Ensure bundle ID matches in all configs

### Issue: "App installation failed" on device
**Solution:** 
- Trust developer certificate: Settings → General → VPN & Device Management
- Ensure device iOS version is compatible

### Issue: White screen on app launch
**Solution:**
- Check that `dist` folder contains built files
- Run `npx cap sync ios` after building
- Check browser console in Xcode for JavaScript errors

## Useful Commands

```bash
# Full rebuild and sync
npm run build && npx cap sync ios

# Open in Xcode
npx cap open ios

# Check Capacitor status
npx cap doctor

# Update Capacitor plugins
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap sync ios
```

## App Configuration

### Bundle Identifier
- Development: `com.racc.membership`
- Production: `com.racc.membership` (same, or use different if needed)

### Version Management
- Update version in `package.json`
- Update CFBundleShortVersionString in iOS project
- Increment build number for each TestFlight/App Store upload

## Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [TestFlight](https://developer.apple.com/testflight/)

## Next Steps

1. ✅ Build web app (`npm run build`)
2. ✅ Add iOS platform (`npx cap add ios`)
3. 🔄 Open in Xcode (`npx cap open ios`)
4. ⏳ Configure signing & capabilities
5. ⏳ Test on iPhone/iPad
6. ⏳ Set up TestFlight for beta testing
7. ⏳ Submit to App Store
