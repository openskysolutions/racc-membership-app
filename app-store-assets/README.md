# App Store Assets

This directory contains all assets needed for App Store submission.

## Directory Structure

```
app-store-assets/
├── screenshots/           # App Store screenshots
│   ├── iphone-6.9/       # iPhone 16 Pro Max (1320x2868)
│   ├── iphone-6.7/       # iPhone 15 Pro Max (1290x2796)
│   └── ipad-pro-12.9/    # iPad Pro 12.9" (2048x2732)
├── icon/                 # App icon (1024x1024)
└── preview-videos/       # Optional preview videos
```

## Taking Screenshots

### Method 1: Using Xcode Simulator (Recommended)

1. **Build and run in simulator:**
   ```bash
   npm run build:mobile:prod && npx cap sync ios && npx cap open ios
   ```

2. **Select a device in Xcode:**
   - iPhone 16 Pro Max (6.9")
   - iPhone 15 Pro Max (6.7")
   - iPad Pro 12.9"

3. **Run the app** (Cmd + R)

4. **Navigate to key screens** you want to showcase:
   - Login/Welcome screen
   - Member Directory
   - Events Calendar
   - Member Profile
   - Benefits/Features

5. **Take screenshots:**
   - **Simulator menu:** Device → Trigger Screenshot (Cmd + S saves to Desktop)
   - **macOS Screenshot:** Cmd + Shift + 4, then click simulator window
   - Screenshots save to Desktop by default

6. **Move screenshots to appropriate folders:**
   ```bash
   # Example
   mv ~/Desktop/Screenshot*.png app-store-assets/screenshots/iphone-6.9/
   ```

### Method 2: Using Physical Device + Xcode

1. **Connect your iPhone/iPad**
2. **Run the app from Xcode**
3. **In Xcode:** Window → Devices and Simulators
4. **Select your device → Take Screenshot button**
5. Screenshots appear in Xcode window, drag to save

### Method 3: On Device (then transfer)

1. **On iOS device:** Press Side Button + Volume Up simultaneously
2. **Screenshots save to Photos app**
3. **AirDrop or USB transfer** to Mac
4. **Move to appropriate folder**

## Screenshot Requirements

### Required Sizes

You need screenshots for **at least ONE** of these sizes:

| Device | Size (pixels) | Folder |
|--------|---------------|--------|
| iPhone 16 Pro Max | 1320 x 2868 | `iphone-6.9/` |
| iPhone 15 Pro Max | 1290 x 2796 | `iphone-6.7/` |
| iPad Pro 12.9" | 2048 x 2732 | `ipad-pro-12.9/` |

**Tip:** Apple accepts the closest size match. Take 3-5 screenshots from ONE device size initially.

### Recommended Screenshots (3-5 total)

1. **Home/Dashboard** - First impression
2. **Member Directory** - Core feature
3. **Events** - Show calendar/events
4. **Profile/Account** - User management
5. **Benefits/Features** - Value proposition

### Naming Convention

Use descriptive names for easy management:

```
01-home-screen.png
02-member-directory.png
03-events-calendar.png
04-member-profile.png
05-benefits.png
```

### Screenshot Tips

✅ **Do:**
- Use real or realistic sample data
- Show key features and value
- Keep UI clean (no errors/loading states)
- Use light mode (generally preferred)
- Show full screen (including status bar)

❌ **Don't:**
- Include personal information
- Show empty states or errors
- Use developer/debug UI
- Include offensive content
- Add borders or device frames (Apple does this)

## App Icon

### Requirements
- Size: 1024 x 1024 pixels
- Format: PNG (no transparency)
- No rounded corners (Apple adds these)
- Color space: sRGB or P3

### Current Icon
The app icon is already configured in:
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

To update the App Store icon, export a 1024x1024 version and save to:
```
app-store-assets/icon/app-icon-1024.png
```

## Preview Videos (Optional)

- Length: 15-30 seconds
- Orientation: Portrait or Landscape
- Format: MOV or MP4
- Show key features in action

**Note:** Videos are optional but highly recommended for better conversion.

## Uploading to App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → App Store tab
3. Scroll to "App Store Screenshots"
4. Drag and drop screenshots from the appropriate folder
5. Arrange in the order you want users to see them

## Quick Screenshot Workflow

```bash
# 1. Build and open simulator
npm run build:mobile:prod && npx cap sync ios && npx cap open ios

# 2. In Xcode: Select device (iPhone 16 Pro Max)
# 3. Run app (Cmd + R)
# 4. Navigate through app and take screenshots (Cmd + S)
# 5. Organize screenshots

# Move from Desktop to project
mv ~/Desktop/Screenshot*.png app-store-assets/screenshots/iphone-6.9/

# Rename for clarity
cd app-store-assets/screenshots/iphone-6.9/
mv Screenshot\ 2025-11-06\ at\ 10.30.45\ AM.png 01-home-screen.png
```

## Resources

- [App Store Screenshot Specifications](https://help.apple.com/app-store-connect/#/devd274dd925)
- [iOS Screenshot Guidelines](https://developer.apple.com/design/human-interface-guidelines/screenshots)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)

---

**Next Steps:**
1. Take 3-5 screenshots using Method 1 (Simulator)
2. Save to appropriate folder
3. Review and rename files
4. Ready for App Store Connect upload!
