# Google Play Store Deployment - Next Steps

## ✅ What's Been Done

1. **Android Platform Added**
   - ✅ Android project created in `android/` directory
   - ✅ Capacitor configured for Android
   - ✅ Build configuration updated
   - ✅ Version set to 1.1.0

2. **Build Configuration**
   - ✅ Java 17 configured in `android/local.properties`
   - ✅ Code minification enabled for release builds
   - ✅ Version code and name updated in `build.gradle`

3. **Documentation Created**
   - ✅ `docs/ANDROID_DEPLOYMENT_GUIDE.md` - Complete deployment guide
   - ✅ `docs/ANDROID_QUICK_CHECKLIST.md` - Quick reference checklist
   - ✅ `build-android.sh` - Automated build script

4. **Security Setup**
   - ✅ Updated `.gitignore` to protect sensitive files
   - ✅ Prepared for keystore configuration

## 🔨 What You Need to Do Next

### Step 1: Generate Signing Key (Required for Play Store)

This is a **ONE-TIME** setup. The keystore is needed to sign your app for release.

```bash
cd android

keytool -genkey -v -keystore racc-upload-key.keystore \
  -alias racc-upload-key \
  -keyalg RSA -keysize 2048 -validity 10000
```

You'll be asked for:
- **Keystore password** - CREATE A STRONG PASSWORD AND SAVE IT!
- **Key password** - CREATE A STRONG PASSWORD AND SAVE IT!
- Your name
- Organization name (Richfield Area Chamber of Commerce)
- City (Richfield)
- State (Minnesota)
- Country code (US)

**CRITICAL**: Save these passwords securely! You'll need them for every future update.

### Step 2: Create Key Properties File

Create `android/key.properties` with this content (replace with YOUR passwords):

```properties
storePassword=YOUR_KEYSTORE_PASSWORD_HERE
keyPassword=YOUR_KEY_PASSWORD_HERE
keyAlias=racc-upload-key
storeFile=racc-upload-key.keystore
```

**IMPORTANT**: This file is already in `.gitignore` and will NOT be committed.

### Step 3: Update Build Configuration

Add the signing configuration to `android/app/build.gradle`:

1. Open the file
2. Add this at the top (before the `android {` block):

```gradle
// Load keystore properties
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

3. Add this inside the `android {` block (after `defaultConfig`):

```gradle
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
```

4. Update the `buildTypes` section:

```gradle
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
```

### Step 4: Build the Release AAB

#### Option A: Use the Build Script (Easiest)
```bash
./build-android.sh
```

This will:
- ✅ Check Java version
- ✅ Build production web assets
- ✅ Sync with Android
- ✅ Build signed AAB
- ✅ Build test APK

#### Option B: Use Android Studio
```bash
npm run cap:open:android
```

Then in Android Studio:
1. **Build** → **Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Select your keystore (`racc-upload-key.keystore`)
4. Enter passwords
5. Choose **release** variant
6. Click **Finish**

#### Option C: Command Line
```bash
# Set Java 17
export JAVA_HOME=~/.sdkman/candidates/java/17.0.9-tem
export PATH=$JAVA_HOME/bin:$PATH

# Build and sync
npm run cap:sync:android:prod

# Build AAB
cd android
./gradlew bundleRelease
```

### Step 5: Test the Build

```bash
# Build test APK
cd android
./gradlew assembleRelease

# Install on connected device
adb install app/build/outputs/apk/release/app-release.apk

# Test everything!
```

### Step 6: Prepare Store Assets

Create these graphics in `app-store-assets/android/`:

1. **App Icon**: 512x512 PNG (32-bit, transparency allowed)
2. **Feature Graphic**: 1024x500 JPEG or PNG
3. **Phone Screenshots**: 
   - Minimum 2 screenshots
   - 16:9 or 9:16 aspect ratio
   - At least 320px minimum dimension
   - Up to 3840px maximum dimension
4. **Tablet Screenshots** (optional but recommended):
   - 7-inch tablet screenshots
   - 10-inch tablet screenshots

### Step 7: Create Google Play Developer Account

1. Go to https://play.google.com/console
2. Pay $25 one-time registration fee
3. Complete account setup and verification

### Step 8: Create App Listing

In Google Play Console:

1. **Create App**
   - Name: Richfield Area Chamber of Commerce
   - Language: English (United States)
   - Type: App
   - Category: Business
   - Free/Paid: Free

2. **Store Listing**
   - Short description (50 chars max)
   - Full description (4000 chars max)
   - Upload graphics
   - Add screenshots
   - Contact email: support@openskydev.com

3. **Privacy Policy**
   - **REQUIRED**: You must have a privacy policy URL
   - If you don't have one, you'll need to create it
   - Host it on https://www.raccmn.org/privacy-policy

4. **Content Rating**
   - Fill out the questionnaire
   - Should get "Everyone" or "Everyone 10+"

5. **App Content**
   - Data safety form
   - Target audience
   - News apps declaration (if applicable)
   - COVID-19 contact tracing (No)

### Step 9: Upload and Release

1. Go to **Release** → **Production**
2. Click **Create new release**
3. Upload your AAB: `android/app/build/outputs/bundle/release/app-release.aab`
4. Enter release notes:
   ```
   Initial release - Version 1.1.0
   
   Features:
   • Member directory
   • Event calendar
   • Chamber news and updates
   • Quick access to member resources
   • Mobile-optimized interface
   ```
5. Review everything
6. Click **Review release**
7. Click **Start rollout to Production**

### Step 10: Wait for Review

- Review typically takes **1-7 days** (usually 2-3 days)
- You'll receive email notifications about status
- Check the Play Console for updates

## 📋 Pre-Submission Checklist

Before submitting to Google Play:

- [ ] Keystore generated and backed up securely
- [ ] App builds and installs successfully
- [ ] All features tested on physical device
- [ ] App icon and graphics prepared
- [ ] Screenshots captured
- [ ] Privacy policy URL ready
- [ ] Store listing text written
- [ ] Content rating completed
- [ ] Data safety form filled out
- [ ] Release notes prepared
- [ ] Version numbers correct (1.1.0, versionCode 1)

## 🔧 Useful Commands

```bash
# Build and open Android Studio
npm run cap:open:android

# Build production and sync
npm run cap:sync:android:prod

# Use the automated build script
./build-android.sh

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk

# View device logs
adb logcat | grep Capacitor

# Check connected devices
adb devices
```

## 📚 Documentation

- **Full Guide**: `docs/ANDROID_DEPLOYMENT_GUIDE.md`
- **Quick Checklist**: `docs/ANDROID_QUICK_CHECKLIST.md`
- **Build Script**: `build-android.sh`

## 🆘 Need Help?

If you encounter issues:

1. Check `docs/ANDROID_DEPLOYMENT_GUIDE.md` - Troubleshooting section
2. Ensure Java 17 is active: `java -version`
3. Clean and rebuild: `cd android && ./gradlew clean && ./gradlew bundleRelease --stacktrace`
4. Check Android Studio for any sync issues

## 📝 Notes

- The Android project is now in the `android/` directory
- Android Studio should be open (or opening)
- First build will take longer (downloads dependencies)
- The keystore must be backed up securely - if lost, you cannot update the app
- Google Play requires AAB format (not APK) for uploads
- Test thoroughly before submitting!

---

**Ready to build?** Start with Step 1: Generate Signing Key

Good luck with your Google Play Store deployment! 🚀
