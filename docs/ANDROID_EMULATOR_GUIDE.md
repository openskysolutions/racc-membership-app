# Running RACC App in Android Emulator

## Quick Start - Android Studio (Recommended)

1. **Android Studio should be open** with your project
   - If not, run: `npm run cap:open:android`

2. **Select a device**:
   - Look for the device dropdown at the top (next to the green play button)
   - Click it and select one of your emulators:
     - **Medium_Phone_API_35** (Latest, Android 14)
     - **Pixel_4_API_30** (Good balance)
     - **Pixel_3a_API_30_x86** (Fast performance)

3. **Run the app**:
   - Click the green **▶ Run** button (or press Ctrl+R)
   - The emulator will start automatically
   - Your app will install and launch

## Option 2: Command Line

### Start Emulator First
```bash
# Set up environment
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH

# Start an emulator (choose one)
emulator -avd Medium_Phone_API_35 &         # Latest Android 14
emulator -avd Pixel_4_API_30 &              # Android 11
emulator -avd Pixel_3a_API_30_x86 &         # Android 11 (x86, faster)
```

Wait for the emulator to fully boot (you'll see the home screen), then:

```bash
# Build and install
cd android
./gradlew installDebug

# Or use the run script
cd ..
npm run cap:run:android
```

## Option 3: Quick Development Script

Create a quick run script:

```bash
#!/bin/bash
# run-android-dev.sh

export ANDROID_HOME=~/Library/Android/sdk
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH
export JAVA_HOME=~/.sdkman/candidates/java/17.0.9-tem

# Build mobile version
npm run build:mobile

# Sync to Android
npx cap sync android

# Open in Android Studio (will let you select emulator)
npx cap open android
```

## Available Emulators

| Emulator | Android Version | Best For |
|----------|----------------|----------|
| Medium_Phone_API_35 | Android 14 (API 35) | Latest features & testing |
| Pixel_4_API_30 | Android 11 (API 30) | Popular device |
| Pixel_3a_API_30_x86 | Android 11 (API 30) | Fast performance |
| Pixel_3_API_30 | Android 11 (API 30) | Testing |

## Tips

### Speed Up Emulator
- Use x86 images (faster than ARM)
- Enable Hardware Acceleration:
  - macOS: Automatically uses Hypervisor.framework
- Increase RAM in AVD settings (4GB recommended)

### Create New Emulator
If you want a different device:

1. In Android Studio: **Tools** → **Device Manager**
2. Click **Create Device**
3. Choose a device definition (e.g., Pixel 7)
4. Select system image (API 33+ recommended)
5. Configure settings and finish

### Hot Reload During Development

For faster development iteration:

```bash
# Terminal 1: Run the dev server
npm run dev

# Terminal 2: Start with live reload
cd android
./gradlew installDebug
adb shell am start -n com.racc.membership/.MainActivity

# Your app will connect to localhost:5173
# Changes will hot-reload in the emulator!
```

**Note**: For this to work, update `capacitor.config.json`:
```json
{
  "server": {
    "url": "http://10.0.2.2:5173",
    "cleartext": true
  }
}
```

(10.0.2.2 is how Android emulator accesses host machine's localhost)

## Troubleshooting

### Emulator Won't Start
```bash
# Kill any stuck processes
killall qemu-system-x86_64

# Try cold boot
emulator -avd Medium_Phone_API_35 -no-snapshot-load
```

### App Won't Install
```bash
# Uninstall old version
adb uninstall com.racc.membership

# Clear and rebuild
cd android
./gradlew clean
./gradlew installDebug
```

### Check Logs
```bash
# View all logs
adb logcat

# Filter for your app
adb logcat | grep -i capacitor

# Clear logs first
adb logcat -c
```

### App Crashes
```bash
# Get crash reports
adb logcat AndroidRuntime:E *:S

# Or in Android Studio:
# View → Tool Windows → Logcat
```

## Quick Commands Reference

```bash
# List emulators
emulator -list-avds

# Start specific emulator
emulator -avd Medium_Phone_API_35

# Check running devices
adb devices

# Install debug build
cd android && ./gradlew installDebug

# Uninstall app
adb uninstall com.racc.membership

# View logs
adb logcat | grep Capacitor

# Take screenshot
adb shell screencap /sdcard/screen.png
adb pull /sdcard/screen.png
```

---

**Recommended**: Use Android Studio for the best development experience with debugging, log viewing, and device management all in one place.
