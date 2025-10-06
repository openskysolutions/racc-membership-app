# RACC Child Theme - WordPress Admin Configuration Guide

## Overview
Your RACC Divi Child Theme is now fully configurable through the WordPress admin interface. This eliminates the need for hard-coded content and makes it easy for non-technical users to manage the site.

## WordPress Admin Configuration Options

### 1. Logo Management
**Location:** Appearance → Customize → RACC Logo Settings

- **Header Logo**: Upload your header logo image through WordPress Media Library
- **Footer Logo**: Upload your footer logo image (can be different from header)
- **Fallback**: If no logo is uploaded, uses `/images/racc-logo.png` and `/images/racc-logo-dark.png`

### 2. Navigation Menus
**Location:** Appearance → Menus

#### Main Navigation
- **Primary Menu**: Desktop navigation bar (horizontal)
- **Mobile Menu**: Mobile navigation drawer (optional - falls back to primary if not set)

#### Footer Menus
- **Footer Platforms Menu**: Links for the "Platforms" column
- **Footer About Menu**: Links for the "About" column  
- **Footer Community Menu**: Links for the "Community" column

**Fallbacks**: If menus aren't assigned, displays default placeholder links

### 3. Footer Content
**Location:** Appearance → Customize → RACC Footer Settings

- **Footer Description**: Text paragraph below the logo
- **Footer Copyright Text**: Copyright line at bottom
- **Platforms Column Title**: Header for first footer column
- **About Column Title**: Header for second footer column
- **Community Column Title**: Header for third footer column

## Technical Implementation

### WordPress Customizer Integration
```php
// Logo settings with media uploader
get_theme_mod('racc_header_logo')
get_theme_mod('racc_footer_logo')

// Footer content settings
get_theme_mod('racc_footer_description')
get_theme_mod('racc_footer_copyright')
get_theme_mod('racc_footer_platforms_title')
```

### Menu System
```php
// Registered menu locations
'primary' => 'Primary Menu'              // Desktop navigation
'mobile' => 'Mobile Menu'                // Mobile navigation
'footer_platforms' => 'Footer Platforms Menu'
'footer_about' => 'Footer About Menu'
'footer_community' => 'Footer Community Menu'
```

### Custom Walker Classes
- **Desktop/Mobile Menus**: Custom walker applies proper CSS classes
- **Footer Menus**: `RACC_Footer_Walker` applies footer-specific styling

## Setup Instructions

### 1. Upload Theme
1. Upload `racc-divi-child-theme/` folder to `/wp-content/themes/`
2. Activate "RACC Divi Child Theme" in WordPress Admin

### 2. Configure Logos
1. Go to **Appearance → Customize → RACC Logo Settings**
2. Upload your header logo (recommended: PNG with transparent background)
3. Upload your footer logo (can be same as header or different variant)

### 3. Set Up Menus
1. Go to **Appearance → Menus**
2. Create "Primary Navigation" menu and assign to "Primary Menu" location
3. (Optional) Create separate "Mobile Navigation" menu for mobile-specific links
4. Create footer menus for each column:
   - "Platforms Menu" → assign to "Footer Platforms Menu"
   - "About Menu" → assign to "Footer About Menu" 
   - "Community Menu" → assign to "Footer Community Menu"

### 4. Customize Footer
1. Go to **Appearance → Customize → RACC Footer Settings**
2. Update footer description text
3. Customize column titles
4. Update copyright text

## Benefits of This Approach

✅ **No Code Required**: All changes through WordPress admin  
✅ **User-Friendly**: Content creators can manage everything  
✅ **Fallback Protection**: Site works even if settings aren't configured  
✅ **Flexible**: Easy to add/remove menu items and change text  
✅ **Maintainable**: No hard-coded content to update  
✅ **Professional**: Proper WordPress standards and practices  

## File Structure
```
racc-divi-child-theme/
├── style.css           # All RACC styling + CSS variables
├── functions.php       # WordPress hooks + Customizer settings
├── header.php         # Header with logo/menu integration
├── footer.php         # Footer with customizer integration
├── js/racc-theme.js   # Mobile menu + interactions
└── images/            # Fallback logo images
```

This setup provides a professional WordPress theme that's fully configurable through the admin interface while maintaining all the styling and functionality of your React app.