# Platform Detection Standardization

## Summary

We've standardized platform detection across the app to avoid confusion between three different methods that were being used inconsistently.

## Previous Inconsistencies

The codebase had three different ways to check for mobile:

1. `Capacitor.isNativePlatform()` - Checks if running as native iOS/Android app
2. `window.innerWidth < 640` - Checks screen width for responsive UI
3. `import.meta.env.VITE_PLATFORM === 'mobile'` - Build-time configuration

## Solution: Centralized Utility (`src/lib/platform.ts`)

Created a comprehensive platform detection utility with clear use cases for each method:

### Available Functions

| Function | Purpose | Use Case |
|----------|---------|----------|
| `isNativeApp()` | Running as native app | Native API access (StatusBar, etc.) |
| `isMobileBrowser()` | Mobile browser (not native) | Differentiate mobile web from native |
| `isSmallScreen()` | Screen < 640px | Responsive UI decisions |
| `isMobileBuild()` | Built with mobile mode | Build-time configuration |
| `isMobile()` | Any mobile scenario | General mobile handling |
| `getPlatform()` | Get platform type | Returns 'ios', 'android', or 'web' |
| `isIOS()` | iOS device | iOS-specific features |
| `isAndroid()` | Android device | Android-specific features |

### Examples

```typescript
import { isNativeApp, isSmallScreen, isMobileBuild } from '@/lib/platform';

// For native API access
if (isNativeApp()) {
  await StatusBar.show();
}

// For responsive layout
if (isSmallScreen()) {
  showMobileLayout();
}

// For default theme selection
const defaultTheme = isMobileBuild() ? 'dark' : 'light';
```

## Updated Files

### 1. Theme Provider (`src/providers/theme-provider.tsx`)
- **Changed:** Uses `isMobileBuild()` for default theme
- **Reason:** Theme defaults should be based on build target, not runtime platform
- **Behavior:** Mobile builds → dark theme, Web builds → light theme

### 2. Calendar (`src/pages/Calendar.tsx`)
- **Status:** Already correct
- **Uses:** `window.innerWidth < 640` for responsive behavior
- **Note:** Could optionally import `isSmallScreen()` for consistency

### 3. Sheet Component (`src/components/ui/sheet.tsx`)
- **Status:** Kept as-is with comment
- **Uses:** `Capacitor.isNativePlatform()`
- **Note:** Added comment suggesting review - might need `isSmallScreen()` instead

### 4. Navbar (`src/components/Navbar.tsx`)
- **Status:** Kept as-is with comment
- **Uses:** `Capacitor.isNativePlatform()`
- **Reason:** Correctly using for native-specific features

### 5. App.tsx (`src/App.tsx`)
- **Status:** Already correct
- **Uses:** `Capacitor.isNativePlatform()`
- **Reason:** Correctly using for StatusBar API (native-only)

## Recommendations

### When to Use Each Method

#### Use `isNativeApp()` (or `Capacitor.isNativePlatform()`) for:
- ✅ StatusBar API calls
- ✅ Native plugin access
- ✅ Platform-specific navigation (external links)
- ✅ Native-only features

#### Use `isSmallScreen()` (or `window.innerWidth < 640`) for:
- ✅ Responsive layouts
- ✅ Showing/hiding components based on screen size
- ✅ Mobile vs desktop UI variants
- ✅ Breakpoint-based logic

#### Use `isMobileBuild()` (or `import.meta.env.VITE_PLATFORM === 'mobile'`) for:
- ✅ Default configuration (theme, API endpoints)
- ✅ Feature flags set at build time
- ✅ Build-specific optimizations
- ✅ Conditional compilation

#### Use `isMobile()` for:
- ✅ General "is this a mobile experience?" checks
- ✅ When you want to handle all mobile scenarios
- ✅ Combined mobile detection

## Migration Path (Optional)

If you want to fully standardize, you can gradually replace:

```typescript
// Old
if (Capacitor.isNativePlatform()) { /* native feature */ }
if (window.innerWidth < 640) { /* responsive */ }
if (import.meta.env.VITE_PLATFORM === 'mobile') { /* build config */ }

// New (optional)
import { isNativeApp, isSmallScreen, isMobileBuild } from '@/lib/platform';

if (isNativeApp()) { /* native feature */ }
if (isSmallScreen()) { /* responsive */ }
if (isMobileBuild()) { /* build config */ }
```

## Benefits

1. **Clarity** - Each function has a clear, specific purpose
2. **Maintainability** - Central location for platform detection logic
3. **Documentation** - Inline comments explain when to use each method
4. **Consistency** - Reduces confusion about which method to use
5. **Type Safety** - TypeScript types for all functions

## No Breaking Changes

The existing code continues to work. The utility provides optional, standardized alternatives you can adopt gradually.
