import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReferralStatusBadge } from '@/components/referrals/ReferralStatusBadge';
import {
  adminModerateReferral,
  adminModerateNonMember,
  AdminNonMemberReferral,
  NonMemberStatus,
  NON_MEMBER_STATUS_LABELS,
  getAdminReferrals,
  AdminReferral,
  AdminReferralStats,
  ReferralStatus,
  REFERRAL_STATUS_LABELS,
} from '@/services/referrals';
import { formatPhone } from '@/lib/utils';

export function AdminReferrals() {
  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [nonMembers, setNonMembers] = useState<AdminNonMemberReferral[]>([]);
  const [view, setView] = useState<'members' | 'non-members'>('members');
  const [stats, setStats] = useState<AdminReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminReferrals({
        status: statusFilter === 'all' ? undefined : statusFilter,
        hidden: visibilityFilter === 'all' ? undefined : (visibilityFilter as 'true' | 'false'),
      });
      setReferrals(data.referrals);
      setStats(data.stats);
      setNonMembers(data.nonMemberReferrals ?? []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, visibilityFilter]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (id: number, changes: { hiddenByAdmin?: boolean; status?: ReferralStatus }) => {
    try {
      const updated = await adminModerateReferral(id, changes);
      setReferrals(prev => prev.map(r => (r.id === id ? updated : r)));
      toast.success('Referral updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update referral');
    }
  };

  const moderateNonMember = async (id: number, changes: { status?: NonMemberStatus; hiddenByAdmin?: boolean }) => {
    try {
      const updated = await adminModerateNonMember(id, changes);
      setNonMembers(prev => prev.map(r => (r.id === id ? updated : r)));
      toast.success('Referral updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update referral');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Non-member referrals</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.nonMemberTotal ?? '-'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Total referrals</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.total ?? '-'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Closed - won</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.closedWon ?? '-'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Top connector</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-bold truncate">{stats?.topConnector?.name ?? '-'}</p>
            {stats?.topConnector && <p className="text-xs text-muted-foreground">{stats.topConnector.count} referrals given</p>}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={view === 'members' ? 'default' : 'outline'} onClick={() => setView('members')}>Member referrals</Button>
        <Button size="sm" variant={view === 'non-members' ? 'default' : 'outline'} onClick={() => setView('non-members')}>Non-members (lead gen)</Button>
      </div>

      {view === 'non-members' ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Referred by</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Emailed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nonMembers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No non-member referrals</TableCell></TableRow>
              ) : nonMembers.map(r => (
                <TableRow key={r.id} className={r.hiddenByAdmin ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{r.businessName}</TableCell>
                  <TableCell className="text-sm">
                    {r.contactName && <div>{r.contactName}</div>}
                    <div className="break-all">{r.email}</div>
                    {r.phone && <div>{formatPhone(r.phone)}</div>}
                  </TableCell>
                  <TableCell>{r.referrerBusinessName}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{r.emailSentAt ? new Date(r.emailSentAt).toLocaleDateString() : <Badge variant="destructive">Not sent</Badge>}</TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={v => moderateNonMember(r.id, { status: v as NonMemberStatus })}>
                      <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(NON_MEMBER_STATUS_LABELS) as NonMemberStatus[]).map(st => (
                          <SelectItem key={st} value={st}>{NON_MEMBER_STATUS_LABELS[st]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => moderateNonMember(r.id, { hiddenByAdmin: !r.hiddenByAdmin })}>
                      {r.hiddenByAdmin ? 'Unhide' : 'Hide'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
      <>
      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(REFERRAL_STATUS_LABELS) as ReferralStatus[]).map(s => (
              <SelectItem key={s} value={s}>{REFERRAL_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="false">Visible</SelectItem>
            <SelectItem value="true">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : referrals.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No referrals found</TableCell></TableRow>
            ) : referrals.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.referrerBusinessName}</TableCell>
                <TableCell>{r.recipientBusinessName}</TableCell>
                <TableCell>
                  <Select value={r.status} onValueChange={v => moderate(r.id, { status: v as ReferralStatus })}>
                    <SelectTrigger className="h-8 w-40 border-0 p-0 shadow-none"><ReferralStatusBadge status={r.status} /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(REFERRAL_STATUS_LABELS) as ReferralStatus[]).map(s => (
                        <SelectItem key={s} value={s}>{REFERRAL_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={r.hiddenByAdmin ? 'destructive' : 'secondary'}>{r.hiddenByAdmin ? 'Hidden' : 'Visible'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => moderate(r.id, { hiddenByAdmin: !r.hiddenByAdmin })}>
                    {r.hiddenByAdmin ? 'Unhide' : 'Hide'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </>
      )}
    </div>
  );
}
