# App Store Deployment Checklist - RACC Membership App

**Current Status:** Ready for App Store Submission  
**App Version:** 1.1.6  
**Bundle ID:** com.racc.membership  
**App Name:** Richfield Area Chamber of Commerce

---

## Pre-Deployment Checklist

### ✅ 1. Apple Developer Account Setup
- [ ] Apple Developer Program membership active ($99/year)
- [ ] Team configured in Apple Developer Portal
- [ ] Agreement, tax, and banking info complete in App Store Connect

### ✅ 2. App Store Connect Setup
- [ ] App created in App Store Connect
  - Bundle ID: `com.racc.membership`
  - App Name: Choose between:
    - "RACC Membership" (short)
    - "Richfield Area Chamber of Commerce" (full)
    - "RACC" (concise)
- [ ] App Store listing information prepared (see below)

### ✅ 3. Code & Build Preparation
- [x] Code committed to git (working tree clean)
- [x] Version updated to 1.1.6
- [ ] Production build tested locally
- [ ] All features working on physical iOS device
- [ ] No console errors in Safari Web Inspector

### ✅ 4. App Assets & Media

#### Required Screenshots (generate for these sizes):
- [ ] 6.9" Display (iPhone 16 Pro Max) - 1320x2868 pixels
- [ ] 6.7" Display (iPhone 15 Pro Max) - 1290x2796 pixels  
- [ ] 6.5" Display (iPhone 11 Pro Max) - 1242x2688 pixels
- [ ] 5.5" Display (iPhone 8 Plus) - 1242x2208 pixels
- [ ] iPad Pro (12.9-inch) - 2048x2732 pixels
- [ ] iPad Pro (12.9-inch) - 2732x2048 pixels (landscape)

**Tip:** You only need 1-3 sizes. App Store will accept the closest match.

#### App Icon
- [ ] 1024x1024px PNG (no transparency, no rounded corners)
- [ ] Icon already configured in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- [ ] Verify icon looks good in Xcode

#### Optional Media
- [ ] App Preview videos (15-30 seconds, optional but recommended)

### ✅ 5. App Store Listing Content

#### Required Text Content
- [ ] **App Name** (30 characters max)
  - Suggestion: "RACC Membership"
  
- [ ] **Subtitle** (30 characters max)
  - Suggestion: "Chamber of Commerce Portal"
  
- [ ] **Description** (4000 characters max)
  ```
  The official mobile app for members of the Richfield Area Chamber of Commerce.
  
  Features:
  • View member directory
  • Access chamber events and calendar
  • Manage your membership profile
  • Connect with local businesses
  • Stay updated with chamber news
  • Quick access to member benefits
  
  Exclusive to RACC members.
  ```

- [ ] **Keywords** (100 characters max, comma-separated)
  - Suggestion: "chamber,commerce,business,networking,richfield,membership,local,community,minnesota"

- [ ] **Promotional Text** (170 characters, editable without review)
  - Suggestion: "Connect with the Richfield Area business community! Access events, member directory, and exclusive benefits on the go."

- [ ] **What's New** (for version 1.1.0)
  - Suggestion: "Initial release of the RACC Membership mobile app with member directory, events, and profile management."

#### Required URLs
- [ ] **Privacy Policy URL**
  - Current: Add to RACC website or use app's privacy page
  - Format: `https://richfieldchamber.org/privacy-policy`

- [ ] **Support URL** (optional but recommended)
  - Suggestion: `https://richfieldchamber.org/support` or `mailto:support@richfieldchamber.org`

- [ ] **Marketing URL** (optional)
  - Your website: `https://richfieldchamber.org`

#### App Information
- [ ] **Primary Category:** Business
- [ ] **Secondary Category:** Social Networking (optional)
- [ ] **Content Rating:** 4+ (suitable for all ages)
- [ ] **Copyright:** `© 2025 Richfield Area Chamber of Commerce`

### ✅ 6. App Privacy Details

You'll need to declare data collection practices:

- [ ] **Data Used to Track You:** None (unless you add analytics)
- [ ] **Data Linked to You:**
  - [ ] Name
  - [ ] Email Address
  - [ ] User Content (if uploading photos/files)
  - [ ] Contact Info (if storing contact details)
- [ ] **Data Not Linked to You:**
  - [ ] Diagnostics (if using crash reporting)

**Purpose:** App Functionality, Developer's Advertising or Marketing

### ✅ 7. Build & Archive

Run these commands to prepare the production build:

```bash
# 1. Build production web assets
npm run build:mobile:prod

# 2. Sync to iOS
npx cap sync ios

# 3. Open in Xcode
npx cap open ios
```

In Xcode:
- [ ] Select **Any iOS Device (arm64)** from device dropdown
- [ ] **Product → Archive**
- [ ] Verify version: 1.1.0
- [ ] Set build number (e.g., 1, 2, 3... increment for each upload)

### ✅ 8. Submit to App Store

1. **Distribute Archive:**
   - [ ] In Xcode Organizer, click **Distribute App**
   - [ ] Select **App Store Connect**
   - [ ] Choose **Upload**
   - [ ] Select automatic signing
   - [ ] Review and Upload

2. **Wait for Processing:**
   - [ ] Build will appear in App Store Connect (10-30 minutes)
   - [ ] Check for any processing errors

3. **Complete App Store Connect:**
   - [ ] Go to App Store Connect → My Apps → Your App
   - [ ] Click **+** next to "iOS App" to add new version
   - [ ] Select your uploaded build
   - [ ] Fill in all version information
   - [ ] Upload screenshots
   - [ ] Add app description, keywords, etc.

4. **Submit for Review:**
   - [ ] Review all information
   - [ ] Click **Submit for Review**
   - [ ] Answer export compliance questions (usually "No" for encryption)
   - [ ] Wait for Apple's review (1-3 days typically)

---

## Quick Commands Reference

```bash
# Production build and sync
npm run build:mobile:prod && npx cap sync ios

# Open Xcode
npx cap open ios

# Check Capacitor status
npx cap doctor

# Version bump (update package.json manually first)
npm version patch  # 1.1.0 → 1.1.1
npm version minor  # 1.1.0 → 1.2.0
npm version major  # 1.1.0 → 2.0.0
```

---

## Common Pre-Submission Issues

### 1. Missing Privacy Policy
**Error:** "You must provide a privacy policy URL"  
**Solution:** Add a privacy policy page to RACC website

### 2. Missing Export Compliance
**Question:** "Does your app use encryption?"  
**Answer:** If using standard HTTPS only (no custom encryption), answer "No"

### 3. Icon Transparency
**Error:** "App icon contains transparency"  
**Solution:** Ensure icon PNG has no alpha channel

### 4. Screenshot Requirements
**Error:** "You must provide screenshots"  
**Solution:** Take screenshots from Simulator or device using Xcode's screenshot tool

### 5. Bundle ID Mismatch
**Error:** "Bundle ID doesn't match App Store Connect"  
**Solution:** Ensure `com.racc.membership` is consistent everywhere

---

## Post-Submission

### During Review (1-3 days)
- [ ] Respond promptly to any Apple questions
- [ ] Check App Store Connect for status updates
- [ ] Monitor email for review feedback

### After Approval
- [ ] App appears in App Store (usually within 24 hours)
- [ ] Test downloading from App Store
- [ ] Share App Store link with members
- [ ] Monitor reviews and ratings
- [ ] Plan for future updates

### App Store Link Format
```
https://apps.apple.com/us/app/[app-name]/id[app-id]
```

---

## Version Management Strategy

For future updates:

1. **Patch (1.1.x):** Bug fixes, minor tweaks
2. **Minor (1.x.0):** New features, improvements
3. **Major (x.0.0):** Major redesigns, breaking changes

Always increment build number for each TestFlight or App Store upload!

---

## Need Help?

- **Apple Developer Support:** https://developer.apple.com/contact/
- **App Store Connect Guide:** https://help.apple.com/app-store-connect/
- **Capacitor iOS Docs:** https://capacitorjs.com/docs/ios
- **RACC Dev Support:** support@openskydev.com

---

**Ready to deploy? Start with Step 1 (Apple Developer Account) if not already set up!**
