# RACC Logo Customization Guide

## 🖼️ **Updating Your Logo in RACC Templates**

The RACC templates include editable logo areas that you can easily customize with your organization's branding.

---

## 📍 **Logo Locations**

### **Header Logo (Primary)**
- **Location:** Top left of header
- **Visibility:** Shows on all pages
- **Links to:** Homepage (customizable)
- **Size:** 60px height, auto width (max 200px)

### **Footer Logo**
- **Location:** Left section of footer
- **Visibility:** Bottom of all pages
- **Links to:** Homepage (customizable)  
- **Size:** 80px height, auto width (max 200px)

### **Mobile Menu Logo**
- **Location:** Top of mobile slide-out menu
- **Visibility:** Mobile devices only
- **Links to:** Homepage (customizable)
- **Size:** 50px height, auto width

---

## 🔄 **How to Change Logos**

### **Step 1: Prepare Your Logo Files**

**Recommended Specifications:**
- **Format:** PNG with transparent background (preferred)
- **Alternative:** JPG or SVG
- **Header Logo:** 200x80px maximum
- **Footer Logo:** 200x80px maximum (light/white version)
- **Mobile Logo:** 150x60px maximum

**Logo Versions Needed:**
- **Light Version:** For dark backgrounds (footer)
- **Dark Version:** For light backgrounds (header)
- **Mobile Version:** Simplified or condensed if needed

### **Step 2: Upload to WordPress Media**

1. **WordPress Admin > Media > Add New**
2. **Upload your logo files:**
   - `your-logo.png` (header version)
   - `your-logo-light.png` (footer version)
   - `your-logo-mobile.png` (mobile version, optional)
3. **Note the file URLs** or remember the filenames

### **Step 3: Update Header Logo**

1. **Edit page** using RACC header template in DIVI Builder
2. **Click on the Logo Image module** (first column)
3. **Image Settings:**
   - **Image:** Click to select from media library
   - **Choose your uploaded logo**
   - **Image Alt Text:** "Your Organization Logo"
   - **Image Title Text:** "Your Organization Name"
4. **Link Settings:**
   - **Image Link URL:** `/` (homepage) or custom URL
   - **Link Target:** Same window
5. **Design Tab (Optional):**
   - **Sizing:** Adjust max-width if needed
   - **Spacing:** Add margins if needed
   - **Effects:** Add hover effects
6. **Save Changes**

### **Step 4: Update Footer Logo**

1. **Edit page** using RACC footer template in DIVI Builder
2. **Click on the Footer Logo Image module**
3. **Image Settings:**
   - **Image:** Select your light/white logo version
   - **Alt Text:** "Your Organization Logo"
   - **Title Text:** "Your Organization Name"
4. **Link Settings:**
   - **URL:** `/` (homepage) or custom URL
5. **Save Changes**

### **Step 5: Update Mobile Menu Logo**

1. **Edit page** using RACC mobile menu template in DIVI Builder
2. **Look for the Code module** containing mobile menu HTML
3. **Edit the img src** in the code:
   ```html
   <img src="/wp-content/uploads/your-logo-mobile.png" alt="Your Logo" class="racc-mobile-logo">
   ```
4. **Or create separate Image module** for easier editing
5. **Save Changes**

---

## 🎨 **Logo Styling Options**

### **Size Adjustments**

**Header Logo:**
1. Click logo Image module
2. **Design Tab > Sizing:**
   - **Width:** Set max-width (200px recommended)
   - **Height:** Set max-height (60px recommended)
   - **Object Fit:** Contain (maintains proportions)

**Footer Logo:**
1. Click footer logo Image module
2. **Design Tab > Sizing:**
   - **Width:** Adjust as needed
   - **Height:** Keep proportional

### **Positioning**

**Alignment:**
- **Header:** Left-aligned (default)
- **Footer:** Left-aligned (default)
- **Mobile:** Centered in header

**Custom Positioning:**
1. **Design Tab > Spacing:**
   - **Margin:** Add space around logo
   - **Padding:** Add space inside module

### **Hover Effects**

1. **Design Tab > Image:**
   - **Image Filters:** Add hover opacity
   - **Transform:** Add hover scale effect
   - **Transition Duration:** 300ms (smooth)

**Example Hover Effect:**
- **Hover Opacity:** 80% (subtle fade)
- **Hover Transform Scale:** 105% (slight grow)

---

## 🔍 **Logo Optimization Tips**

### **File Size**
- **Keep under 100KB** for fast loading
- **Compress images** before upload
- **Use appropriate format:** PNG for transparency, JPG for photos

### **Responsive Design**
- **Test on mobile devices** to ensure readability
- **Consider simplified mobile version** if original is complex
- **Ensure minimum 40px height** on smallest screens

### **Accessibility**
- **Always include alt text** describing the logo
- **Use descriptive title text**
- **Ensure good contrast** with background

### **Brand Consistency**
- **Use same logo** across all locations when possible
- **Maintain color consistency** with your brand guidelines
- **Keep proportions** consistent

---

## ✅ **Testing Your Logo Changes**

### **Visual Testing:**
- [ ] Logo displays correctly on desktop
- [ ] Logo displays correctly on mobile
- [ ] Logo maintains aspect ratio
- [ ] Logo is readable against background
- [ ] Logo links to correct page

### **Technical Testing:**
- [ ] Image files load quickly
- [ ] No broken image icons
- [ ] Alt text appears when image disabled
- [ ] Hover effects work smoothly

### **Cross-Browser Testing:**
- [ ] Chrome, Firefox, Safari, Edge
- [ ] iOS Safari, Android Chrome
- [ ] Various screen sizes and resolutions

---

## 🚨 **Troubleshooting Logo Issues**

### **Logo Not Displaying:**
```
✓ Check image uploaded to WordPress Media Library
✓ Verify correct file path/URL
✓ Ensure image file isn't corrupted
✓ Check file permissions
✓ Clear browser cache
```

### **Logo Too Large/Small:**
```
✓ Adjust sizing in DIVI Builder Design tab
✓ Check original image dimensions
✓ Use CSS max-width property
✓ Test on different screen sizes
```

### **Logo Not Linking:**
```
✓ Check Image Link URL setting
✓ Verify URL format (absolute vs relative)
✓ Test link in new browser tab
✓ Clear any caching plugins
```

### **Logo Pixelated/Blurry:**
```
✓ Upload higher resolution image
✓ Use vector format (SVG) if possible
✓ Check image optimization settings
✓ Avoid stretching beyond original size
```

---

## 🚀 **Advanced Logo Features**

Once basic logo setup is complete:

1. **Dark/Light Mode Logos** - Different logos for different themes
2. **Animated Logos** - Subtle CSS animations on hover
3. **Retina Logos** - High-DPI versions for sharp displays
4. **Logo Variants** - Different logos for different sections
5. **Interactive Logos** - Click animations or sound effects
6. **Logo Badges** - Additional graphics or certification marks

---

*This guide ensures your organization's branding is properly represented throughout the RACC template system.*