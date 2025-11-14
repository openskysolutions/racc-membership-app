# Apple App Store Resubmission - Quick Checklist

**Version:** 1.0 → 1.0 (metadata update only, no new build needed)  
**Date:** November 11, 2025

---

## 🚀 Quick Steps (2-3 hours total)

### ✅ 1. Update Screenshots (1-3 hours)

```bash
# Build and open in Xcode
npm run build:mobile:prod && npx cap sync ios && npx cap open ios
```

**In Xcode:**
- Select **iPhone 15 Pro Max**
- Run app (⌘R)
- Navigate to key screens and take 3-5 screenshots (⌘S)
- Screenshots save to Desktop

**Upload to App Store Connect:**
1. Login → Your App → Version 1.0
2. "View All Sizes in Media Manager"
3. Select 6.7" Display
4. Upload new screenshots showing **actual app UI in use**

**Must show:** Home, Member Directory, Events, Profile (not just login screens)

---

### ✅ 2. Respond to Business Model Questions (15 min)

**Login to App Store Connect → Resolution Center → Reply to App Review**

**Copy/paste this response:**

> Dear App Review Team,
> 
> **Business Model Clarification:**
> 
> 1. **Users:** Existing paid members of the Richfield Area Chamber of Commerce only
> 2. **Purchase Location:** Memberships purchased at richfieldchamber.org (outside the app)
> 3. **Content Accessed:** Member directory, events, nominations, profile - all included with paid membership
> 4. **No IAP:** App contains zero in-app purchases. All payments handled externally by the Chamber
> 5. **User Type:** B2B - business owners and professionals, not consumers or families
> 
> This is a "Reader App" (3.1.3a) providing mobile access to services purchased externally. No payment processing or subscriptions exist within the app.

---

### ✅ 3. Point Out Account Deletion Feature (5 min)

**Add to same App Review response:**

> **Account Deletion Location:**
> 
> The app includes account deletion as required:
> 1. Log in → Navigate to **Profile** page
> 2. Scroll to bottom → **"Danger Zone"** section  
> 3. Click **"Delete Account"** button
> 4. Confirm by typing "delete my account"
> 5. Account immediately and permanently deleted
> 
> No customer service contact required. Feature is fully self-service within the app.

---

### ✅ 4. Resubmit (5 min)

1. Verify screenshots uploaded ✓
2. Verify responses submitted ✓
3. Click **"Resubmit for Review"**
4. Wait 1-3 days for Apple response

---

## 📋 Pre-Submission Verification

- [ ] New screenshots show **real app UI** (not promotional graphics)
- [ ] Screenshots are **1290x2796** (iPhone 6.7")
- [ ] **3-5 screenshots** showing core features
- [ ] Business model response submitted
- [ ] Account deletion location specified
- [ ] (Optional) Test account credentials ready if Apple requests

---

## 🎯 Expected Outcome

**NO NEW BUILD REQUIRED** - This is a metadata and communication fix only.

Apple should approve once they see:
1. Updated screenshots showing actual app
2. Clear explanation that you're a members-only portal (no IAP)
3. Confirmation that account deletion exists and where to find it

---

## 📞 Need Help?

- Detailed plan: `docs/APPLE_APP_STORE_RESUBMISSION_PLAN.md`
- Apple Support: https://developer.apple.com/contact/app-store/
- Resolution Center: App Store Connect → Your App → App Review
