import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarRange, Landmark, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { getOpenPositions } from '@/services/elections';

interface VoteOption {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

/** Hub that sends members to monthly voting, yearly voting, or the executive board elections. */
export default function VotePage() {
  const user = useAuthStore(state => state.user);
  const [hasActiveElection, setHasActiveElection] = useState(false);
  const [checked, setChecked] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isStaff = isAdmin || user?.role === 'moderator' || user?.role === 'board_member';
  const isActiveMember = user?.status === 'active';

  useEffect(() => {
    getOpenPositions()
      .then(positions => setHasActiveElection(positions.some(p => p.status === 'voting_open')))
      .catch(() => setHasActiveElection(false))
      .finally(() => setChecked(true));
  }, []);

  const options: VoteOption[] = [];

  if (isStaff) {
    options.push({
      to: '/voting',
      title: 'Monthly Voting',
      description: 'Review nominations and vote for Business of the Month and Customer Service Superstar.',
      icon: CalendarCheck,
    });
  }
  if (isActiveMember) {
    options.push({
      to: '/yearly-voting',
      title: 'Yearly Voting',
      description: 'Vote for the chamber’s yearly award winners.',
      icon: CalendarRange,
    });
  }
  // Members only see the elections link while an election is open; admins always see it to preview.
  if (isActiveMember || isAdmin) {
    if (hasActiveElection || isAdmin) {
      options.push({
        to: '/board-elections',
        title: 'Executive Board Elections',
        description: 'Vote for chamber board member candidates.',
        icon: Landmark,
        badge: !hasActiveElection && isAdmin ? 'Admin preview — no election is open' : undefined,
      });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Voting</h1>
        <p className="text-muted-foreground mt-1">Choose what you'd like to vote on.</p>
      </div>

      {!checked ? null : options.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>There's nothing open for you to vote on right now.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {options.map(({ to, title, description, icon: Icon, badge }) => (
            <Link key={to} to={to} className="block">
              <Card className="transition-colors hover:bg-accent">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <Icon className="h-8 w-8 shrink-0 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                    {badge && <Badge variant="secondary">{badge}</Badge>}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
