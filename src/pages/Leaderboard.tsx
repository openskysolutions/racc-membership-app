import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildMemberSlug } from '@/lib/utils';
import { getLeaderboard, LeaderboardEntry, ReferralTier } from '@/services/referrals';
import { Button } from '@/components/ui/button';

const TIER_LABELS: Record<ReferralTier, string> = {
  none: '',
  bronze: 'Bronze Connector',
  silver: 'Silver Connector',
  gold: 'Gold Connector',
  platinum: 'Platinum Connector',
};

const TIER_CLASSES: Record<ReferralTier, string> = {
  none: '',
  bronze: 'bg-amber-700 text-white hover:bg-amber-700',
  silver: 'bg-slate-400 text-white hover:bg-slate-400',
  gold: 'bg-yellow-500 text-white hover:bg-yellow-500',
  platinum: 'bg-cyan-600 text-white hover:bg-cyan-600',
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getLeaderboard(period)
      .then(setEntries)
      .catch(e => setError(e.message || 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Button asChild variant="outline" size="sm"><Link to="/referral-feed">Community</Link></Button>
      </div>
      <p className="text-muted-foreground mb-4">Members who help other members grow.</p>
      <Tabs value={period} onValueChange={v => setPeriod(v as 'month' | 'all')} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <p className="text-center text-muted-foreground py-10">Loading...</p>
      ) : error ? (
        <p className="text-center text-destructive py-10">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No points yet for this period.</p>
      ) : (
        <div className="space-y-2">
          {entries.map(e => (
            <Card key={e.businessId}>
              <CardContent className="py-3 flex items-center gap-3">
                <span className="w-8 text-lg font-bold text-muted-foreground text-center">{e.rank}</span>
                <div className="flex-1 min-w-0">
                  <Link to={`/members/${buildMemberSlug(e.businessName, e.businessId)}`} className="font-medium hover:underline block truncate">
                    {e.businessName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {e.referralsGiven} given, {e.closedWon} closed, {e.testimonials} thank-yous
                  </p>
                  {e.tier !== 'none' && <Badge className={`mt-1 ${TIER_CLASSES[e.tier]}`}>{TIER_LABELS[e.tier]}</Badge>}
                </div>
                <span className="text-xl font-bold">{e.points}<span className="text-xs font-normal text-muted-foreground"> pts</span></span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
