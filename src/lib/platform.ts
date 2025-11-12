/**
 * Platform Detection Utilities
 * 
 * Provides consistent methods for detecting platform and device characteristics
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if running as a native mobile app (iOS/Android via Capacitor)
 * Use this for platform-specific features (status bar, native APIs, etc.)
 * 
 * @returns true if running as native iOS or Android app
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running in a mobile browser (not native app)
 * Use this to differentiate mobile web from native app
 * 
 * @returns true if mobile browser, false if desktop or native app
 */
export const isMobileBrowser = (): boolean => {
  return !Capacitor.isNativePlatform() && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

/**
 * Check if device has a small screen (< 640px width)
 * Use this for responsive UI decisions (layout changes, component variations)
 * 
 * @returns true if screen width is less than 640px (Tailwind's 'sm' breakpoint)
 */
export const isSmallScreen = (): boolean => {
  return window.innerWidth < 640;
};

/**
 * Check if app was built for mobile deployment
 * Use this for build-time configuration (API endpoints, feature flags, etc.)
 * 
 * @returns true if built with mobile mode (VITE_PLATFORM=mobile)
 */
export const isMobileBuild = (): boolean => {
  return import.meta.env.VITE_PLATFORM === 'mobile';
};

/**
 * Comprehensive mobile check: native app OR mobile browser OR small screen
 * Use this when you need to handle any mobile scenario
 * 
 * @returns true if any mobile condition is met
 */
export const isMobile = (): boolean => {
  return isNativeApp() || isMobileBrowser() || isSmallScreen();
};

/**
 * Get the current platform type
 * 
 * @returns 'ios' | 'android' | 'web'
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Check if running on iOS (native app or browser)
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios' || /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * Check if running on Android (native app or browser)
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android' || /Android/i.test(navigator.userAgent);
};

/**
 * Platform-specific recommendations:
 * 
 * USE CASE                          | RECOMMENDED METHOD
 * ----------------------------------|---------------------------
 * Native API access (StatusBar)    | isNativeApp()
 * Responsive layout                | isSmallScreen()
 * Default theme selection          | isMobileBuild()
 * External link handling           | isNativeApp()
 * Mobile-specific UI               | isMobile()
 * Platform-specific styling        | getPlatform()
 * iOS-specific features            | isIOS()
 * Android-specific features        | isAndroid()
 */
