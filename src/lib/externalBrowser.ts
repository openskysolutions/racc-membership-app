/**
 * External Browser Utility
 * Opens URLs in the device's default browser (outside the app)
 */

import { Browser } from '@capacitor/browser';
import { isNativeApp } from '@/lib/platform';

const BASE_URL = 'https://members.richfieldareachamber.com';

/**
 * Open a URL in an external browser (mobile) or handle navigation (web)
 * On mobile: Opens in device's default browser
 * On web: Returns false to let React Router handle navigation
 */
export async function openExternalUrl(path: string): Promise<boolean> {
  if (isNativeApp()) {
    // On mobile, open in external browser
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    await Browser.open({ url });
    return true; // Handled externally
  } else {
    // On web, return false to let caller handle with React Router
    return false;
  }
}

/**
 * Membership page URLs
 */
export const membershipUrls = {
  basic: '/basic-membership',
  enhanced: '/enhanced-membership',
  elite: '/elite-membership',
} as const;
