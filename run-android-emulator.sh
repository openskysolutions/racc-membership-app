#!/bin/bash

# Quick Android Emulator Runner for Apple Silicon Mac
# This script opens Android Studio where you can select an emulator

set -e

echo "🤖 RACC Android Emulator Quick Start"
echo "===================================="
echo ""

# Set up environment
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH
export JAVA_HOME=~/.sdkman/candidates/java/17.0.9-tem

echo "📱 On Apple Silicon Macs, use Android Studio to run emulators"
echo ""
echo "Steps:"
echo "1. Android Studio will open shortly"
echo "2. Look for the device dropdown at the top"
echo "3. Select a device (create one if needed)"
echo "4. Click the green ▶ Run button"
echo ""

# Check if we need to build first
if [ ! -d "android/app/build" ]; then
    echo "🔨 First-time setup: Building app..."
    npm run build:mobile
    npx cap sync android
fi

echo "🚀 Opening Android Studio..."
npx cap open android

echo ""
echo "💡 Pro Tips:"
echo "  • Use ARM64 system images for best performance"
echo "  • Recommended: Pixel 7 with API 33+"
echo "  • Enable hardware acceleration in AVD settings"
echo ""
echo "📖 See docs/ANDROID_EMULATOR_GUIDE.md for details"
