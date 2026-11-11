import { Badge } from '@/components/ui/badge';
import { REFERRAL_STATUS_LABELS, ReferralStatus } from '@/services/referrals';

const VARIANTS: Record<ReferralStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  submitted: 'outline',
  contacted: 'secondary',
  in_discussion: 'secondary',
  closed_won: 'default',
  closed_lost: 'destructive',
  not_a_fit: 'outline',
};

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  return <Badge variant={VARIANTS[status]}>{REFERRAL_STATUS_LABELS[status] ?? status}</Badge>;
}
