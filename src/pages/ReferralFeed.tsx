import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Handshake } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buildMemberSlug } from '@/lib/utils';
import { getPublicFeed, FeedItem } from '@/services/referrals';
import { Button } from '@/components/ui/button';

export default function ReferralFeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicFeed()
      .then(setItems)
      .catch(e => setError(e.message || 'Failed to load referral feed'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Member Connect</h1>
        <Button asChild variant="outline" size="sm"><Link to="/leaderboard">Leaderboard</Link></Button>
      </div>
      <p className="text-muted-foreground mb-6">Members helping members: recent referrals across the chamber.</p>
      {loading ? (
        <p className="text-center text-muted-foreground py-10">Loading...</p>
      ) : error ? (
        <p className="text-center text-destructive py-10">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No referrals yet. Be the first to refer a fellow member.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <Handshake className="h-4 w-4 text-primary shrink-0" />
                  <Link to={`/members/${buildMemberSlug(item.referrerBusinessName, item.referrerBusinessId)}`} className="hover:underline">{item.referrerBusinessName}</Link>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Link to={`/members/${buildMemberSlug(item.recipientBusinessName, item.recipientBusinessId)}`} className="hover:underline">{item.recipientBusinessName}</Link>
                  {item.closedWon && <Badge>Closed - Won</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                {item.testimonials.map(t => (
                  <blockquote key={t.id} className="border-l-2 pl-3 italic text-sm text-muted-foreground">{t.body}</blockquote>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
