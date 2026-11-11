import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReferNonMemberDialog } from '@/components/referrals/ReferNonMemberDialog';
import { ReferralStatusBadge } from '@/components/referrals/ReferralStatusBadge';
import { TestimonialForm } from '@/components/referrals/TestimonialForm';
import {
  getMyReferrals,
  getMyNonMemberReferrals,
  NonMemberReferral,
  NON_MEMBER_STATUS_LABELS,
  updateReferralStatus,
  Referral,
  ReferralStatus,
  REFERRAL_NEXT_STATUSES,
  REFERRAL_STATUS_LABELS,
} from '@/services/referrals';
import { formatPhone } from '@/lib/utils';

function ReferralCard({ referral, onChange }: { referral: Referral; onChange: (r: Referral) => void }) {
  const received = referral.direction === 'received';
  const nextStatuses = received ? REFERRAL_NEXT_STATUSES[referral.status] : [];

  const handleStatus = async (status: string) => {
    try {
      const updated = await updateReferralStatus(referral.id, status as ReferralStatus);
      onChange(updated);
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {received
              ? `From ${referral.referrerBusinessName}`
              : `To ${referral.recipientBusinessName}`}
          </CardTitle>
          <ReferralStatusBadge status={referral.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(referral.createdAt).toLocaleDateString()}
          {!received && ` - To: ${referral.recipientUserName ?? 'Anyone at the business'}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium">{referral.leadName}</p>
          {referral.leadBusinessName && <p className="text-muted-foreground">{referral.leadBusinessName}</p>}
          <p className="text-muted-foreground break-all">{[formatPhone(referral.leadPhone), referral.leadEmail].filter(Boolean).join(' - ')}</p>
        </div>
        {referral.note && <p className="whitespace-pre-wrap">{referral.note}</p>}
        {referral.leadIsMember && <Badge variant="secondary">Introduction: {referral.leadName}</Badge>}
        {referral.temperature && <Badge variant="outline" className="capitalize">{referral.temperature}</Badge>}

        {nextStatuses.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Only you and {referral.referrerBusinessName} can see the details of this lead. Please update the status as the lead progresses.
          </p>
        )}
        {nextStatuses.length > 0 && (
          <Select value="" onValueChange={handleStatus}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Update status..." /></SelectTrigger>
            <SelectContent>
              {nextStatuses.map(s => (
                <SelectItem key={s} value={s}>{REFERRAL_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {referral.testimonials.map(t => (
          <blockquote key={t.id} className="border-l-2 pl-3 italic text-muted-foreground">{t.body}</blockquote>
        ))}

        {received && referral.status === 'closed_won' && referral.testimonials.length === 0 && (
          <TestimonialForm
            referralId={referral.id}
            referrerBusinessName={referral.referrerBusinessName}
            onPosted={t => onChange({ ...referral, testimonials: [...referral.testimonials, t] })}
          />
        )}
      </CardContent>
    </Card>
  );
}

function NonMemberCard({ referral }: { referral: NonMemberReferral }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">To {referral.businessName}</CardTitle>
          <div className="flex gap-1.5 shrink-0">
            <Badge variant="secondary">Not a member yet</Badge>
            <Badge variant="outline">{NON_MEMBER_STATUS_LABELS[referral.status] ?? referral.status}</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(referral.createdAt).toLocaleDateString()}
          {referral.emailSentAt ? ' - Invitation emailed' : ' - Invitation email not sent'}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground break-all">
          {[referral.contactName, referral.email, formatPhone(referral.phone)].filter(Boolean).join(' - ')}
        </p>
        <div>
          <p className="font-medium">{referral.leadName}</p>
          {referral.leadBusinessName && <p className="text-muted-foreground">{referral.leadBusinessName}</p>}
          <p className="text-muted-foreground break-all">{[formatPhone(referral.leadPhone), referral.leadEmail].filter(Boolean).join(' - ')}</p>
        </div>
        {referral.note && <p className="whitespace-pre-wrap">{referral.note}</p>}
      </CardContent>
    </Card>
  );
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonMembers, setNonMembers] = useState<NonMemberReferral[]>([]);
  const [showNonMember, setShowNonMember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNonMembers = () => { getMyNonMemberReferrals().then(setNonMembers).catch(() => {}); };

  useEffect(() => {
    loadNonMembers();
    getMyReferrals()
      .then(setReferrals)
      .catch(e => setError(e.message || 'Failed to load referrals'))
      .finally(() => setLoading(false));
  }, []);

  const replace = (r: Referral) => setReferrals(prev => prev.map(p => (p.id === r.id ? { ...p, ...r, direction: p.direction } : p)));

  const renderList = (direction: 'given' | 'received') => {
    const items = referrals.filter(r => r.direction === direction);
    const extra = direction === 'given' ? nonMembers : [];
    if (items.length === 0 && extra.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-10">
          {direction === 'given'
            ? 'You have not referred anyone yet. Visit a member page and tap "Refer this member".'
            : 'No referrals received yet.'}
        </p>
      );
    }
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {extra.map(r => <NonMemberCard key={`nm-${r.id}`} referral={r} />)}
        {items.map(r => <ReferralCard key={r.id} referral={r} onChange={replace} />)}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Referrals</h1>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button size="sm" onClick={() => setShowNonMember(true)}>Refer a business that isn't a member</Button>
          <Button asChild variant="outline" size="sm"><Link to="/leaderboard">Leaderboard</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/referral-feed">Community</Link></Button>
        </div>
      </div>
      {loading ? (
        <p className="text-center text-muted-foreground py-10">Loading...</p>
      ) : error ? (
        <p className="text-center text-destructive py-10">{error}</p>
      ) : (
        <Tabs defaultValue="received">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="given">Given</TabsTrigger>
          </TabsList>
          <TabsContent value="received" className="mt-4">{renderList('received')}</TabsContent>
          <TabsContent value="given" className="mt-4">{renderList('given')}</TabsContent>
        </Tabs>
      )}
      <ReferNonMemberDialog open={showNonMember} onOpenChange={setShowNonMember} onCreated={loadNonMembers} />
    </div>
  );
}
