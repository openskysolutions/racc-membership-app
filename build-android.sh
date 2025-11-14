#!/bin/bash

# Android Build Script for RACC Membership App
# Ensures proper Java version and builds release AAB for Google Play Store

set -e  # Exit on error

echo "🚀 Starting Android Build Process..."
echo ""

# Set Java 17
export JAVA_HOME=~/.sdkman/candidates/java/17.0.9-tem
export PATH=$JAVA_HOME/bin:$PATH

# Verify Java version
echo "📋 Checking Java version..."
java -version
echo ""

if ! java -version 2>&1 | grep -q "version \"17"; then
    echo "❌ Error: Java 17 is required but not active"
    echo "Please run: sdk use java 17.0.9-tem"
    exit 1
fi

echo "✅ Java 17 confirmed"
echo ""

# Check if keystore exists
if [ ! -f "android/racc-upload-key.keystore" ] && [ ! -f "android/key.properties" ]; then
    echo "⚠️  Warning: No keystore found!"
    echo "This is needed for release builds."
    echo ""
    echo "To generate a keystore, run:"
    echo "  cd android"
    echo "  keytool -genkey -v -keystore racc-upload-key.keystore \\"
    echo "    -alias racc-upload-key \\"
    echo "    -keyalg RSA -keysize 2048 -validity 10000"
    echo ""
    echo "Then create android/key.properties with your keystore details."
    echo ""
    read -p "Continue without signing? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build web assets
echo "🔨 Building web assets for production..."
npm run build:mobile:prod
echo ""

# Sync with Android
echo "🔄 Syncing with Android project..."
npx cap sync android
echo ""

# Navigate to android directory
cd android

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean
echo ""

# Build release AAB
echo "📦 Building release AAB..."
if [ -f "key.properties" ]; then
    echo "Using signing configuration from key.properties"
    ./gradlew bundleRelease
else
    echo "Building unsigned AAB"
    ./gradlew bundleRelease
fi
echo ""

# Check if build succeeded
if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📍 AAB Location:"
    echo "   android/app/build/outputs/bundle/release/app-release.aab"
    echo ""
    
    # Show file size
    SIZE=$(du -h app/build/outputs/bundle/release/app-release.aab | cut -f1)
    echo "📊 Bundle Size: $SIZE"
    echo ""
    
    # Also build debug APK for testing
    echo "🔨 Building debug APK for testing..."
    ./gradlew assembleRelease
    
    if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
        APK_SIZE=$(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)
        echo "✅ APK built successfully!"
        echo "   android/app/build/outputs/apk/release/app-release.apk"
        echo "   Size: $APK_SIZE"
        echo ""
        echo "💡 To install APK on device:"
        echo "   adb install app/build/outputs/apk/release/app-release.apk"
    fi
    
    echo ""
    echo "🎉 Build Complete!"
    echo ""
    echo "Next Steps:"
    echo "1. Test the APK on a physical device"
    echo "2. Upload the AAB to Google Play Console"
    echo "3. Fill out store listing details"
    echo "4. Submit for review"
    echo ""
    echo "📚 See docs/ANDROID_DEPLOYMENT_GUIDE.md for details"
else
    echo "❌ Build failed!"
    echo "Check the error messages above."
    exit 1
fi
