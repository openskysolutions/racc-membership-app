# Android Quick Deployment Checklist

Quick reference for deploying to Google Play Store.

## ✅ Pre-Deployment Checklist

### Environment Setup
- [ ] Android Studio installed and updated
- [ ] Java 17 configured: `export JAVA_HOME=~/.sdkman/candidates/java/17.0.9-tem`
- [ ] Android SDK installed (API 33+)
- [ ] Environment variables set in `~/.zshrc`

### Code & Build
- [ ] All features tested and working
- [ ] Version updated in `android/app/build.gradle`:
  - [ ] `versionCode` incremented
  - [ ] `versionName` updated
- [ ] **Mobile build created**: `npm run build:mobile:prod` ⚠️ CRITICAL
- [ ] Synced to Android: `npx cap sync android`
- [ ] No critical errors or warnings

### App Assets
- [ ] App icon (512x512px) prepared
- [ ] Feature graphic (1024x500px) prepared
- [ ] Screenshots captured (minimum 2):
  - [ ] Phone screenshots
  - [ ] Tablet screenshots (optional but recommended)
- [ ] Splash screen tested

### Signing Configuration
- [ ] Keystore file generated (first time only)
- [ ] `android/key.properties` created with passwords
- [ ] Keystore and passwords backed up securely
- [ ] `key.properties` added to `.gitignore`
- [ ] Signing config added to `build.gradle`

### App Content
- [ ] Privacy policy URL ready
- [ ] Store listing description written
- [ ] Contact email configured
- [ ] Content rating questionnaire completed
- [ ] Data safety form filled out

## 🚀 Build Steps

### 1. Set Java Version
```bash
export JAVA_HOME=~/.sdkman/candidates/java/17.0.9-tem
export PATH=$JAVA_HOME/bin:$PATH
java -version  # Should show 17.x.x
```

### 2. Build Production
```bash
# CRITICAL: Build for mobile (uses production API endpoints)
npm run build:mobile:prod

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

**⚠️ Important:** Always use `build:mobile:prod` for deployments! Regular `build` uses localhost which won't work on devices.

### 3. Generate Signed AAB
In Android Studio:
1. Build → Generate Signed Bundle / APK
2. Choose "Android App Bundle"
3. Select keystore and enter passwords
4. Choose "release" variant
5. Click Finish

Or via command line:
```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 4. Test Release Build
```bash
# Build APK for testing
cd android
./gradlew assembleRelease

# Install on device
adb install app/build/outputs/apk/release/app-release.apk

# Test thoroughly!
```

## 📦 Play Console Upload

### Create Release
1. Open Google Play Console
2. Go to Release → Production
3. Click "Create new release"
4. Upload `app-release.aab`
5. Add release notes
6. Review and rollout

### Release Notes Template
```
Version 1.1.0

What's New:
• New feature description
• Bug fixes and improvements
• Performance enhancements

For support: support@openskydev.com
```

## 🔍 Testing Checklist

- [ ] App launches successfully
- [ ] All navigation flows work
- [ ] Login/authentication works
- [ ] Network requests succeed
- [ ] Images and assets load
- [ ] No crashes or ANRs
- [ ] Splash screen displays correctly
- [ ] Permissions work (if any)
- [ ] Back button behavior correct
- [ ] Deep linking works (if configured)

## 📊 Post-Release

- [ ] Monitor crash reports in Play Console
- [ ] Check ratings and reviews
- [ ] Respond to user feedback
- [ ] Track installation metrics
- [ ] Plan next update

## 🆘 Quick Troubleshooting

### Build Fails
```bash
cd android
./gradlew clean
./gradlew --stop
./gradlew bundleRelease --stacktrace
```

### Java Version Issue
```bash
# Check version
java -version

# Set Java 17
export JAVA_HOME=~/.sdkman/candidates/java/17.0.9-tem
export PATH=$JAVA_HOME/bin:$PATH
```

### Signing Issue
- Verify keystore path in `key.properties`
- Check passwords are correct
- Ensure keystore file exists

### Sync Issues
```bash
# Force clean resync
rm -rf android
npm run cap:add:android
npm run cap:sync:android:prod
```

## 📝 Version Numbers

Current Version: `1.1.0`
Version Code: `1`

For each release:
- Increment `versionCode` by 1
- Update `versionName` semantically

## 🔗 Quick Links

- [Full Android Deployment Guide](./ANDROID_DEPLOYMENT_GUIDE.md)
- [Google Play Console](https://play.google.com/console)
- [Capacitor Android Docs](https://capacitorjs.com/docs/android)

---

Last updated: November 13, 2025
