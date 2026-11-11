/**
 * Optional Face ID / fingerprint lock for the native app. The member stays signed in
 * (session token kept on the device); the lock only gates showing the app on open/resume.
 */
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { isNativeApp } from '@/lib/platform';

const STORAGE_KEY = 'racc_biometric_lock';

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const info = await BiometricAuth.checkBiometry();
    return info.isAvailable;
  } catch {
    return false;
  }
}

export function isBiometricLockEnabled(): boolean {
  try {
    return isNativeApp() && localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setBiometricLockEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, 'true');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Resolves true when the member passes Face ID / fingerprint (or the device passcode fallback). */
export async function authenticateWithBiometrics(reason = 'Unlock the Richfield Chamber app'): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({ reason, allowDeviceCredential: true });
    return true;
  } catch {
    return false;
  }
}
