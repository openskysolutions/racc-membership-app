#!/bin/bash

# Verify Android Icons and Splash Screens
# Quick check to ensure all assets are in place

echo "🔍 Verifying Android Icons and Splash Screens"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS=0
FAILED=0

# Check icon directories
echo "📱 Checking App Icons..."
ICON_DENSITIES=("ldpi" "mdpi" "hdpi" "xhdpi" "xxhdpi" "xxxhdpi")
for density in "${ICON_DENSITIES[@]}"; do
    DIR="android/app/src/main/res/mipmap-$density"
    if [ -d "$DIR" ]; then
        COUNT=$(ls "$DIR"/ic_launcher*.png 2>/dev/null | wc -l)
        if [ $COUNT -ge 3 ]; then
            echo -e "${GREEN}✓${NC} $density: $COUNT icon files found"
            ((SUCCESS++))
        else
            echo -e "${RED}✗${NC} $density: Missing icons (found $COUNT, expected 3+)"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗${NC} $density: Directory missing"
        ((FAILED++))
    fi
done

echo ""
echo "🖼️  Checking Splash Screens..."

# Check splash drawable directories
SPLASH_COUNT=$(find android/app/src/main/res/drawable* -name "splash.png" 2>/dev/null | wc -l)
if [ $SPLASH_COUNT -ge 10 ]; then
    echo -e "${GREEN}✓${NC} Found $SPLASH_COUNT splash screen variants"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} Only found $SPLASH_COUNT splash screens (expected 10+)"
    ((FAILED++))
fi

# Check night mode splash screens
NIGHT_COUNT=$(find android/app/src/main/res/drawable*night* -name "splash.png" 2>/dev/null | wc -l)
if [ $NIGHT_COUNT -ge 5 ]; then
    echo -e "${GREEN}✓${NC} Found $NIGHT_COUNT dark mode splash screens"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠${NC}  Only found $NIGHT_COUNT dark mode splash screens"
fi

echo ""
echo "⚙️  Checking Configuration..."

# Check AndroidManifest.xml
if grep -q "@mipmap/ic_launcher" android/app/src/main/AndroidManifest.xml; then
    echo -e "${GREEN}✓${NC} AndroidManifest.xml references app icon"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} AndroidManifest.xml missing icon reference"
    ((FAILED++))
fi

# Check styles.xml
if grep -q "@drawable/splash" android/app/src/main/res/values/styles.xml; then
    echo -e "${GREEN}✓${NC} styles.xml references splash screen"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} styles.xml missing splash reference"
    ((FAILED++))
fi

# Check capacitor config
if grep -q "SplashScreen" capacitor.config.json; then
    echo -e "${GREEN}✓${NC} capacitor.config.json has SplashScreen plugin configured"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} capacitor.config.json missing SplashScreen configuration"
    ((FAILED++))
fi

# Check colors.xml
if [ -f "android/app/src/main/res/values/colors.xml" ]; then
    echo -e "${GREEN}✓${NC} colors.xml exists"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠${NC}  colors.xml not found (optional)"
fi

echo ""
echo "📊 Asset Sizes..."

# Show sizes
MIPMAP_SIZE=$(du -sh android/app/src/main/res/mipmap-* 2>/dev/null | awk '{sum+=$1} END {print sum}')
DRAWABLE_SIZE=$(du -sh android/app/src/main/res/drawable* 2>/dev/null | tail -1 | awk '{print $1}')

echo "   App Icons: ~$(du -sch android/app/src/main/res/mipmap-* 2>/dev/null | tail -1 | awk '{print $1}')"
echo "   Splash Screens: ~$(du -sch android/app/src/main/res/drawable* 2>/dev/null | tail -1 | awk '{print $1}')"

echo ""
echo "📋 Summary"
echo "=========="
echo -e "${GREEN}✓ Passed:${NC} $SUCCESS"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}✗ Failed:${NC} $FAILED"
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All icons and splash screens are properly configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Build the app: ./build-android.sh"
    echo "2. Test on device/emulator"
    echo "3. Verify icon appears in launcher"
    echo "4. Verify splash screen displays on launch"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please review above.${NC}"
    echo ""
    echo "To regenerate assets:"
    echo "  npx @capacitor/assets generate --android"
    echo "  npx cap sync android"
    exit 1
fi
