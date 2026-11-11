import { useCallback, useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { authenticateWithBiometrics, isBiometricLockEnabled } from '@/lib/biometricLock';

// Re-lock only after the app has been in the background this long, so quick app switches don't nag.
const RELOCK_AFTER_MS = 30 * 1000;

/** Full-screen Face ID / fingerprint gate shown on app open and after a stretch in the background. */
export function BiometricLock() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const handleLogout = useAuthStore(state => state.handleLogout);
  const [locked, setLocked] = useState(() => isBiometricLockEnabled());
  const [failed, setFailed] = useState(false);
  const hiddenAt = useRef<number | null>(null);
  const prompting = useRef(false);

  const unlock = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    setFailed(false);
    const ok = await authenticateWithBiometrics();
    prompting.current = false;
    if (ok) setLocked(false);
    else setFailed(true);
  }, []);

  useEffect(() => {
    if (!isBiometricLockEnabled()) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_AFTER_MS) {
        hiddenAt.current = null;
        setLocked(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const showing = locked && isAuthenticated && isBiometricLockEnabled();

  useEffect(() => {
    if (showing) unlock();
  }, [showing, unlock]);

  if (!showing) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <Lock className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">App locked</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        {failed ? "That didn't work. Try again, or sign out." : 'Unlock with Face ID or your fingerprint to continue.'}
      </p>
      <Button onClick={unlock}>Unlock</Button>
      <Button
        variant="link"
        className="text-muted-foreground"
        onClick={async () => {
          await handleLogout();
          setLocked(false);
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
