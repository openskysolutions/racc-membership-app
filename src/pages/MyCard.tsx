import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Link as LinkIcon, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import {
  getMyCard,
  updateMyCard,
  cardShareUrl,
  type CardSettings,
  type CardSettingsUpdate,
} from '@/services/cards';
import { readCachedCard, writeCachedCard, clearCachedCard, type CachedCard } from '@/lib/cardCache';

const FIELD_OPTIONS: { key: 'showPhone' | 'showEmail' | 'showWebsite'; label: string }[] = [
  { key: 'showPhone', label: 'Phone number' },
  { key: 'showEmail', label: 'Email address' },
  { key: 'showWebsite', label: 'Website' },
];

/** Large, high-contrast QR on a white tile so it scans reliably in any lighting. */
function QrTile({ url }: { url: string }) {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-xl bg-white p-4 shadow-sm">
      <QRCodeSVG value={url} size={512} level="M" className="h-auto w-full" bgColor="#ffffff" fgColor="#000000" />
    </div>
  );
}

/** Business logo shown above the name. Hides itself if the image can't load (e.g. offline). */
function BusinessLogo({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="mx-auto mb-2 h-20 w-20 rounded-lg bg-white object-contain p-1"
    />
  );
}

async function shareLink(url: string, name: string) {
  try {
    if (navigator.share) {
      await navigator.share({ title: `${name}'s business card`, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  } catch (err: any) {
    if (err?.name !== 'AbortError') toast.error('Could not share the link');
  }
}

export default function MyCardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [cached, setCached] = useState<CachedCard | null>(() => readCachedCard());
  const [settings, setSettings] = useState<CardSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    getMyCard()
      .then((card) => {
        if (cancelled) return;
        setSettings(card);
        setOffline(false);
        if (card.preview) {
          const next = {
            publicId: card.publicId,
            name: card.preview.name,
            businessName: card.preview.businessName,
            logoUrl: card.preview.logoUrl,
          };
          writeCachedCard(next);
          setCached(next);
        }
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleUpdate = async (update: CardSettingsUpdate) => {
    if (!settings) return;
    const previous = settings;
    setSettings({ ...settings, ...update });
    try {
      setSettings(await updateMyCard(update));
    } catch {
      setSettings(previous);
      toast.error('Could not save that change');
    }
  };

  // Signed out (or session still restoring) — show the saved card if this device has one.
  if (!isAuthenticated) {
    if (authLoading && !cached) {
      return (
        <div className="mx-auto max-w-md p-4 py-10">
          <Skeleton className="h-96 w-full" />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-md p-4 py-10 space-y-4">
        {cached ? (
          <Card>
            <CardHeader className="text-center">
              <BusinessLogo src={cached.logoUrl} alt={cached.businessName ?? cached.name} />
              <CardTitle className="text-2xl">{cached.name}</CardTitle>
              {cached.businessName && <CardDescription>{cached.businessName}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              <QrTile url={cardShareUrl(cached.publicId)} />
              <p className="text-center text-sm text-muted-foreground">
                Have someone scan this with their phone camera to see your card and save your contact.
              </p>
              <Button variant="outline" className="w-full" onClick={() => shareLink(cardShareUrl(cached.publicId), cached.name)}>
                <Share2 className="mr-2 h-4 w-4" /> Share link
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
                <Button asChild variant="link" className="h-auto px-0">
                  <Link to="/login" state={{ from: { pathname: '/my-card' } }}>Sign in to edit your card</Link>
                </Button>
                <Button
                  variant="link"
                  className="h-auto px-0 text-muted-foreground"
                  onClick={() => {
                    clearCachedCard();
                    setCached(null);
                  }}
                >
                  Remove from this device
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>My Card</CardTitle>
              <CardDescription>Sign in once to create your digital business card. After that you can show it any time, even when signed out.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/login', { state: { from: { pathname: '/my-card' } } })}>
                Sign in
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const publicId = settings?.publicId ?? cached?.publicId;
  const name = settings?.preview?.name ?? cached?.name ?? '';
  const businessName = settings?.preview?.businessName ?? cached?.businessName;
  const logoUrl = settings?.preview?.logoUrl ?? cached?.logoUrl;

  return (
    <div className="mx-auto max-w-md p-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">My Card</h1>

      {offline && (
        <div className="flex items-start gap-2 rounded-md border bg-muted p-3 text-sm">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Couldn't reach the server. Showing the card saved on this device; changes can't be saved until you're back online.</span>
        </div>
      )}

      {loading && !publicId ? (
        <Skeleton className="h-96 w-full" />
      ) : publicId ? (
        <Card>
          <CardHeader className="text-center">
            <BusinessLogo src={logoUrl} alt={businessName ?? name} />
            <CardTitle className="text-2xl">{name}</CardTitle>
            {businessName && <CardDescription>{businessName}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {settings && !settings.enabled ? (
              <p className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                Your card is turned off. Anyone who scans an old QR code will see "card not found".
              </p>
            ) : (
              <>
                <QrTile url={cardShareUrl(publicId)} />
                <p className="text-center text-sm text-muted-foreground">
                  Have someone scan this with their phone camera to see your card and save your contact.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => shareLink(cardShareUrl(publicId), name)}>
                    <Share2 className="mr-2 h-4 w-4" /> Share link
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/card/${publicId}`}>
                      <LinkIcon className="mr-2 h-4 w-4" /> Preview
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What your card shows</CardTitle>
            <CardDescription>Your name and business always appear. Choose what else to share.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {FIELD_OPTIONS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={`card-${key}`}
                  checked={settings[key]}
                  disabled={!settings.enabled}
                  onCheckedChange={(checked) => handleUpdate({ [key]: checked === true })}
                />
                <Label htmlFor={`card-${key}`}>{label}</Label>
              </div>
            ))}
            <div className="flex items-center gap-3 border-t pt-3">
              <Checkbox
                id="card-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => handleUpdate({ enabled: checked === true })}
              />
              <Label htmlFor="card-enabled">Card is on and can be viewed</Label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
