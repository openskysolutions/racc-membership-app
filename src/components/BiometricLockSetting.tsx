import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
  isBiometricLockEnabled,
  setBiometricLockEnabled,
} from '@/lib/biometricLock';

/** Profile toggle for the Face ID / fingerprint lock. Renders nothing where biometrics aren't available. */
export function BiometricLockSetting() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(() => isBiometricLockEnabled());

  useEffect(() => {
    isBiometricAvailable().then(setAvailable);
  }, []);

  if (!available) return null;

  const handleChange = async (checked: boolean) => {
    // Confirm it works before turning it on, so members can't lock themselves out.
    if (checked && !(await authenticateWithBiometrics('Turn on app lock'))) {
      toast.error('Could not verify. App lock was not turned on.');
      return;
    }
    setBiometricLockEnabled(checked);
    setEnabled(checked);
  };

  return (
    <div className="mt-3 flex items-center gap-3">
      <Checkbox id="biometric-lock" checked={enabled} onCheckedChange={(c) => handleChange(c === true)} />
      <Label htmlFor="biometric-lock">Require Face ID / fingerprint to open the app</Label>
    </div>
  );
}
