# Android Deployment Guide - Google Play Store

This guide will walk you through building and deploying the RACC Membership App to the Google Play Store.

## Prerequisites

### Required Software
- ✅ Android Studio (installed)
- ✅ Node.js and npm (installed)
- ✅ Capacitor (installed)

### Android Studio Setup
1. Open Android Studio
2. Go to **Settings/Preferences** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Ensure you have:
   - Android SDK Platform 33+ (Android 13+)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator (optional, for testing)

### Environment Variables
Add to your `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Then run: `source ~/.zshrc`

## Step 1: Add Android Platform

```bash
# Add Android platform to the project (one-time)
npm run cap:add:android
```

This creates the `android/` directory with the native Android project.

## Step 2: Build for Mobile and Sync

```bash
# CRITICAL: Always build for mobile first (uses production API endpoints)
npm run build:mobile:prod

# Then sync to Android
npx cap sync android
```

**⚠️ Important:** Always use `build:mobile:prod` instead of `build` for mobile deployments. The mobile build uses production API endpoints (`https://api.raccwi.com`) instead of localhost, which is essential for the app to function on devices.

## Step 3: Configure Android App

### Update `android/app/build.gradle`

Key configurations to verify/update:
```gradle
android {
    namespace "com.racc.membership"
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.racc.membership"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Update Version for Each Release
Before each new release:
1. Increment `versionCode` (must be higher than previous)
2. Update `versionName` to match (e.g., "1.1.1", "1.2.0")

## Step 4: Generate App Icons and Splash Screens

```bash
# Generate Android assets from your icon source
npx @capacitor/assets generate --android
```

Your icon should be at least 1024x1024px. Place it at:
- `resources/icon.png` (or configure in `capacitor.config.json`)

## Step 5: Create Signing Key (First Time Only)

### Generate Upload Key
```bash
# Navigate to android directory
cd android

# Generate keystore (run once)
keytool -genkey -v -keystore racc-upload-key.keystore \
  -alias racc-upload-key \
  -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (SAVE THIS!)
# - Key password (SAVE THIS!)
# - Your name and organization details
```

**CRITICAL**: Save the keystore file and passwords securely! You'll need them for all future updates.

### Configure Gradle for Signing

Create `android/key.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=racc-upload-key
storeFile=racc-upload-key.keystore
```

**IMPORTANT**: Add `key.properties` to `.gitignore`:
```bash
echo "android/key.properties" >> .gitignore
echo "android/*.keystore" >> .gitignore
```

Update `android/app/build.gradle`:
```gradle
// Add at the top, before android block
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Step 6: Build Release APK/AAB

### For Google Play Store (AAB - Required)
```bash
# Open Android Studio
npm run cap:open:android

# In Android Studio:
# 1. Select "Build" → "Generate Signed Bundle / APK"
# 2. Choose "Android App Bundle"
# 3. Select your keystore and enter passwords
# 4. Choose "release" build variant
# 5. Click "Finish"

# The AAB will be at:
# android/app/release/app-release.aab
```

### Alternative: Command Line Build
```bash
cd android

# Clean build
./gradlew clean

# Build release AAB
./gradlew bundleRelease

# The AAB will be at:
# app/build/outputs/bundle/release/app-release.aab
```

### For Testing: Build APK
```bash
cd android
./gradlew assembleRelease

# The APK will be at:
# app/build/outputs/apk/release/app-release.apk
```

## Step 7: Test the Release Build

### Install on Physical Device
```bash
# Enable USB debugging on your Android device
# Connect device via USB

# Install APK
cd android
adb install app/build/outputs/apk/release/app-release.apk

# View logs
adb logcat | grep Capacitor
```

### Test Checklist
- [ ] App launches without crashing
- [ ] All navigation works
- [ ] Network requests succeed
- [ ] Icons and splash screen display correctly
- [ ] No console errors
- [ ] Permissions work (if any)
- [ ] Deep linking works (if configured)

## Step 8: Google Play Console Setup

### 1. Create Google Play Developer Account
- Go to https://play.google.com/console
- Pay one-time $25 registration fee
- Complete account verification

### 2. Create App in Console
1. Click "Create app"
2. Enter app details:
   - **App name**: Richfield Area Chamber of Commerce
   - **Default language**: English (United States)
   - **App type**: App
   - **Free or Paid**: Free
3. Accept declarations and create app

### 3. Complete Store Listing

#### App Details
- **App name**: Richfield Area Chamber of Commerce
- **Short description**: (50 characters max)
  ```
  Official membership app for RACC members
  ```
- **Full description**: (4000 characters max)
  ```
  The official mobile app for members of the Richfield Area Chamber of Commerce.
  
  Features:
  • Access member directory
  • View chamber events and calendar
  • Stay updated with chamber news
  • Member benefits and resources
  • Quick contact to chamber office
  • And much more!
  
  This app is exclusively for RACC members. Download today to stay connected with your local business community.
  ```

#### Graphics
Required assets (prepare these):
- **App icon**: 512x512 PNG (32-bit)
- **Feature graphic**: 1024x500 PNG or JPG
- **Phone screenshots**: 2-8 screenshots (minimum 2)
  - Resolution: 16:9 or 9:16 aspect ratio
  - Minimum dimension: 320px
  - Maximum dimension: 3840px
- **7-inch tablet screenshots**: Optional but recommended
- **10-inch tablet screenshots**: Optional but recommended

Use the `app-store-assets/` directory structure similar to iOS.

#### Categorization
- **App category**: Business
- **Tags**: business, chamber, membership, networking
- **Contact details**:
  - Email: support@openskydev.com
  - Phone: (optional)
  - Website: https://www.raccmn.org

#### Privacy Policy
- Upload or link to privacy policy (REQUIRED)

### 4. Content Rating
1. Go to "Content rating" section
2. Fill out questionnaire about app content
3. Receive rating (likely "Everyone" or "Everyone 10+")

### 5. App Content
Complete all required sections:
- **Privacy policy**: URL required
- **App access**: Explain if login is required
- **Ads**: Does your app contain ads? (No)
- **Data safety**: Complete data safety form
  - What data do you collect?
  - How is it used?
  - Is it shared with third parties?

### 6. Target Audience
- Select age groups your app is designed for
- Specify if it's designed for children

## Step 9: Create Release

### 1. Production Track
1. Go to "Release" → "Production"
2. Click "Create new release"
3. Upload your AAB file (`app-release.aab`)
4. Enter release notes:
   ```
   Initial release of the RACC Membership App
   
   • Member directory
   • Event calendar
   • Chamber news and updates
   • Quick access to member resources
   ```

### 2. Review and Roll Out
1. Review all information
2. Click "Review release"
3. If everything is green, click "Start rollout to Production"

### Alternative: Closed Testing First
For safer initial deployment:
1. Go to "Release" → "Testing" → "Closed testing"
2. Create testing track
3. Add test users (email addresses)
4. Upload AAB
5. Test with internal team first
6. Promote to Production when ready

## Step 10: App Review Process

- **Review time**: 1-7 days (usually 2-3 days)
- **Status**: Check in Play Console dashboard
- **Common rejection reasons**:
  - Missing privacy policy
  - Incomplete store listing
  - App crashes on launch
  - Permissions not properly explained
  - Restricted content

## Updating the App

### For Each Update:
1. Update version in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment by 1
   versionName "1.1.1"  // Follow semantic versioning
   ```

2. Build and sync:
   ```bash
   npm run cap:sync:android:prod
   ```

3. Build release AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

4. Upload to Play Console:
   - Go to "Release" → "Production"
   - Create new release
   - Upload new AAB
   - Add release notes describing changes
   - Roll out to production

## Monitoring and Analytics

### Play Console Metrics
- Installs and uninstalls
- Ratings and reviews
- Crashes and ANRs (App Not Responding)
- Pre-launch reports

### Crash Reporting
Consider integrating:
- Firebase Crashlytics
- Sentry
- Bugsnag

## Troubleshooting

### Common Build Issues

#### "SDK location not found"
Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

#### Gradle build fails
```bash
cd android
./gradlew clean
./gradlew --stop
./gradlew bundleRelease --stacktrace
```

#### Signing errors
- Verify `key.properties` paths are correct
- Check keystore file exists
- Confirm passwords are correct

#### Capacitor sync issues
```bash
# Force clean and resync
rm -rf android
npm run cap:add:android
npm run cap:sync:android:prod
```

### App Crashes on Launch

Check logs:
```bash
adb logcat | grep -E "AndroidRuntime|Capacitor"
```

Common causes:
- Missing permissions in `AndroidManifest.xml`
- Network security config issues
- WebView errors
- Plugin configuration issues

## Best Practices

### Security
- ✅ Never commit keystore files or passwords to Git
- ✅ Use Play App Signing (Google manages keys)
- ✅ Enable code obfuscation (ProGuard/R8)
- ✅ Implement SSL pinning for sensitive APIs

### Performance
- ✅ Enable minification in release builds
- ✅ Optimize images and assets
- ✅ Test on low-end devices
- ✅ Monitor app size

### Updates
- ✅ Test thoroughly before releasing
- ✅ Use staged rollouts (10% → 50% → 100%)
- ✅ Monitor crash reports after updates
- ✅ Have rollback plan ready

## Quick Reference Commands

```bash
# Development
npm run cap:run:android          # Build, sync, and open Android Studio

# Production Build
npm run cap:sync:android:prod    # Sync production build

# Build AAB
cd android && ./gradlew bundleRelease

# Build APK
cd android && ./gradlew assembleRelease

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk

# View logs
adb logcat | grep Capacitor
```

## Resources

- [Android Developer Guide](https://developer.android.com/guide)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Signing Best Practices](https://developer.android.com/studio/publish/app-signing)

## Support

For issues specific to this app:
- Email: support@openskydev.com
- GitHub: openskysolutions/racc-membership-app

---

Last updated: November 13, 2025
