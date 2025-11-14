# Android App Icons & Splash Screens

This document explains the app icon and splash screen setup for the Android version of the RACC Membership App.

## ✅ Current Setup

All Android app icons and splash screens have been successfully generated and configured.

### Generated Assets

**App Icons:**
- ✅ Adaptive icons (foreground + background layers) for all densities
- ✅ Legacy icons for older Android versions
- ✅ Round icons for launchers that support them
- ✅ Multiple densities: ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi

**Splash Screens:**
- ✅ Portrait and landscape orientations
- ✅ Light and dark mode variants
- ✅ Multiple screen densities
- ✅ Total: 87 assets generated (2.9 MB)

## Source Files

The assets are generated from these source files:

- **Icon**: `resources/icon.png` (801x801px)
- **Splash**: `resources/splash.png` (2733x2733px)

### Recommended Source Specifications

For best results:
- **Icon**: 1024x1024px PNG (transparent background)
- **Splash**: 2732x2732px PNG (square, content in safe zone)

## Location of Generated Assets

All Android assets are located in:
```
android/app/src/main/res/
├── mipmap-ldpi/          # Low density (120dpi)
├── mipmap-mdpi/          # Medium density (160dpi)
├── mipmap-hdpi/          # High density (240dpi)
├── mipmap-xhdpi/         # Extra high density (320dpi)
├── mipmap-xxhdpi/        # Extra extra high density (480dpi)
├── mipmap-xxxhdpi/       # Extra extra extra high density (640dpi)
├── drawable/             # Default splash
├── drawable-land-*/      # Landscape splash screens
├── drawable-port-*/      # Portrait splash screens
├── drawable-night/       # Dark mode splash
└── drawable-*-night-*/   # Dark mode variants for orientations
```

## Configuration

### Capacitor Config (`capacitor.config.json`)

```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "launchAutoHide": true,
      "launchFadeOutDuration": 1000,
      "backgroundColor": "#ffffff",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER",
      "showSpinner": false,
      "splashFullScreen": true,
      "splashImmersive": true
    }
  }
}
```

### Android Styles (`android/app/src/main/res/values/styles.xml`)

```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="android:background">@drawable/splash</item>
</style>
```

### Android Colors (`android/app/src/main/res/values/colors.xml`)

```xml
<color name="colorPrimary">#1e40af</color>
<color name="colorPrimaryDark">#1e3a8a</color>
<color name="colorAccent">#3b82f6</color>
<color name="splashBackground">#ffffff</color>
```

## Adaptive Icons

Android 8.0+ (API 26+) uses adaptive icons with two layers:

1. **Foreground**: The main icon content (from your icon.png)
2. **Background**: A solid background layer (white by default)

This allows the system to:
- Apply different shapes (circle, squircle, rounded square)
- Add visual effects
- Ensure consistency across the OS

## How to Update Icons/Splash

### Method 1: Update Source and Regenerate (Recommended)

1. Update your source files:
   - `resources/icon.png` (1024x1024px recommended)
   - `resources/splash.png` (2732x2732px recommended)

2. Regenerate all assets:
   ```bash
   npx @capacitor/assets generate --android
   ```

3. Sync to Android:
   ```bash
   npx cap sync android
   ```

### Method 2: Manual Customization

For advanced customization, manually edit files in:
```
android/app/src/main/res/mipmap-*/
android/app/src/main/res/drawable*/
```

Then sync:
```bash
npx cap sync android
```

## Splash Screen Behavior

The splash screen displays when:
- App is launched (cold start)
- App is resumed after being killed by system

Configuration options:
- **launchShowDuration**: Time to show splash (2000ms = 2 seconds)
- **launchAutoHide**: Auto-hide when app is ready
- **launchFadeOutDuration**: Fade-out animation time (1000ms)
- **splashFullScreen**: Use full screen (true)
- **splashImmersive**: Immersive mode on Android (true)

## Testing Icons and Splash

### Test App Icon

1. Install the app on device/emulator:
   ```bash
   cd android
   ./gradlew installDebug
   ```

2. Check the app drawer for your icon
3. Try on different launchers (if available)
4. Test on Android 7 (legacy) and Android 12+ (adaptive)

### Test Splash Screen

1. Launch the app (cold start)
2. Force-close and relaunch
3. Test in both portrait and landscape
4. Test in light and dark mode (Android 10+)

### Common Issues

**Icon appears pixelated:**
- Source icon resolution too low
- Regenerate from higher resolution source

**Splash screen doesn't fill screen:**
- Check `androidScaleType` setting
- Ensure splash image is large enough
- Try different scale types: CENTER, CENTER_CROP, FIT_XY

**Wrong colors:**
- Update `backgroundColor` in capacitor.config.json
- Check colors.xml for theme colors

**Splash shows too long/short:**
- Adjust `launchShowDuration`
- Ensure `launchAutoHide` is true

## Play Store Requirements

For Google Play Store submission, you'll need:

### App Icon
- **512x512px** PNG (32-bit with alpha)
- For the Play Console listing only
- Different from the launcher icon

### Feature Graphic
- **1024x500px** PNG or JPG
- Displayed in the Play Store
- Should include app icon and branding

### Screenshots
- At least 2 screenshots required
- Recommended: 4-8 screenshots
- Portrait: 16:9 aspect ratio (e.g., 1080x1920)
- Landscape: 9:16 aspect ratio (optional)

These are for the Play Store listing, NOT the app itself.

## Asset Generation Command Reference

```bash
# Generate all platform assets
npx @capacitor/assets generate

# Generate Android only
npx @capacitor/assets generate --android

# Generate iOS only
npx @capacitor/assets generate --ios

# Preview before generating (dry run)
npx @capacitor/assets generate --android --dry-run
```

## Troubleshooting

### Assets not updating in build

```bash
# Clean build
cd android
./gradlew clean

# Sync and rebuild
cd ..
npx cap sync android
cd android
./gradlew assembleDebug
```

### Generate specific asset type

```bash
# Icon only
npx @capacitor/assets generate --android --iconOnly

# Splash only
npx @capacitor/assets generate --android --splashOnly
```

### Check generated assets

```bash
# List all icon files
find android/app/src/main/res/mipmap-* -name "ic_launcher*"

# List all splash files
find android/app/src/main/res/drawable* -name "splash.png"

# Check file sizes
du -sh android/app/src/main/res/mipmap-*
du -sh android/app/src/main/res/drawable*
```

## Best Practices

1. **Use high-resolution source files** - Better to downscale than upscale
2. **Keep safe zones** - Important content in center 80% of icon
3. **Test on real devices** - Emulators may not show true appearance
4. **Check all densities** - Don't just test on high-end devices
5. **Verify colors** - Test in light and dark modes
6. **Keep it simple** - Icons should be recognizable at small sizes
7. **Consistent branding** - Match iOS and web versions

## Resources

- [Android Icon Design Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Adaptive Icons Documentation](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Splash Screen API Guide](https://developer.android.com/develop/ui/views/launch/splash-screen)
- [Capacitor Assets CLI](https://github.com/ionic-team/capacitor-assets)

---

**Status**: ✅ All assets generated and configured  
**Last Updated**: November 13, 2025  
**Next Steps**: Test on Android device/emulator
