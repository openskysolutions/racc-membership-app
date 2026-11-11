import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, Globe, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublicCard, cardVCardUrl, type PublicCard } from '@/services/cards';
import { formatPhone } from '@/lib/utils';

function normalizeWebsite(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Public digital business card — what someone sees after scanning a member's QR code. */
export default function CardPage() {
  const { publicId = '' } = useParams();
  const [card, setCard] = useState<PublicCard | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    getPublicCard(publicId)
      .then((result) => {
        if (cancelled) return;
        setCard(result);
        setState(result ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  if (state === 'loading') {
    return (
      <div className="mx-auto max-w-md p-4 py-10">
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (state !== 'ready' || !card) {
    return (
      <div className="mx-auto max-w-md p-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>{state === 'error' ? 'Something went wrong' : 'Card not found'}</CardTitle>
            <CardDescription>
              {state === 'error'
                ? 'We could not load this card. Please check your connection and try again.'
                : 'This card does not exist or has been turned off.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const initials = `${card.firstName.charAt(0)}${card.lastName.charAt(0)}`.toUpperCase() || card.name.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-md p-4 py-10 space-y-4">
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24">
            {card.avatarUrl && <AvatarImage src={card.avatarUrl} alt={card.name} />}
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <CardTitle className="mt-2 text-2xl">{card.name}</CardTitle>
          {card.businessName && <CardDescription className="text-base">{card.businessName}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          {card.phone && (
            <Button asChild variant="outline" className="w-full justify-start">
              <a href={`tel:${card.phone}`}><Phone className="mr-2 h-4 w-4" />{formatPhone(card.phone)}</a>
            </Button>
          )}
          {card.email && (
            <Button asChild variant="outline" className="w-full justify-start">
              <a href={`mailto:${card.email}`}><Mail className="mr-2 h-4 w-4" />{card.email}</a>
            </Button>
          )}
          {card.website && (
            <Button asChild variant="outline" className="w-full justify-start">
              <a href={normalizeWebsite(card.website)} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />{card.website}
              </a>
            </Button>
          )}
          <Button asChild className="w-full">
            <a href={cardVCardUrl(publicId)} download>
              <UserPlus className="mr-2 h-4 w-4" /> Save contact
            </a>
          </Button>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Member of the Richfield Area Chamber of Commerce · <Link to="/" className="underline">richfieldareachamber.com</Link>
      </p>
    </div>
  );
}
