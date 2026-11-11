import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createReferral, getActiveMemberDirectory, getRecipients, memberContactSummary, DirectoryMember, ReferralRecipient, ReferralTemperature } from '@/services/referrals';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientBusinessId: string;
  recipientBusinessName: string;
}

export function ReferReferralDialog({ open, onOpenChange, recipientBusinessId, recipientBusinessName }: Props) {
  const { user } = useAuthStore();
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadBusinessName, setLeadBusinessName] = useState('');
  const [note, setNote] = useState('');
  const [temperature, setTemperature] = useState<ReferralTemperature | 'none'>('none');
  const [submitting, setSubmitting] = useState(false);
  const [recipients, setRecipients] = useState<ReferralRecipient[]>([]);
  const [recipientUserId, setRecipientUserId] = useState('any');
  const [mode, setMode] = useState<'lead' | 'member'>('lead');
  const [directory, setDirectory] = useState<DirectoryMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [chosenMember, setChosenMember] = useState<DirectoryMember | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRecipientUserId('any');
    getRecipients(recipientBusinessId).then(setRecipients).catch(() => setRecipients([]));
  }, [open, recipientBusinessId]);

  useEffect(() => {
    if (!open || mode !== 'member' || directory.length > 0) return;
    getActiveMemberDirectory().then(setDirectory).catch(() => setFormError('Could not load the member directory'));
  }, [open, mode, directory.length]);

  const reset = () => {
    setMode('lead');
    setChosenMember(null);
    setMemberSearch('');
    setLeadName('');
    setLeadPhone('');
    setLeadEmail('');
    setLeadBusinessName('');
    setNote('');
    setTemperature('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'member' && !chosenMember) {
      setFormError('Please choose the member you want to introduce');
      return;
    }
    if (mode === 'lead' && (!leadName.trim() || !leadPhone.trim())) {
      toast.error('Please enter the lead\'s name and phone number');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createReferral({
        recipientBusinessId,
        recipientUserId: recipientUserId === 'any' ? undefined : Number(recipientUserId),
        ...(mode === 'member'
          ? { leadBusinessId: chosenMember!.id }
          : {
              leadName: leadName.trim(),
              leadPhone: leadPhone.trim(),
              leadEmail: leadEmail.trim() || undefined,
              leadBusinessName: leadBusinessName.trim() || undefined,
            }),
        note: note.trim() || undefined,
        temperature: temperature === 'none' ? undefined : temperature,
      });
      toast.success(`Referral sent to ${recipientBusinessName}`);
      reset();
      onOpenChange(false);
    } catch (error: any) {
      setFormError(error.message || 'Failed to submit referral');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Refer a lead to {recipientBusinessName}</DialogTitle>
          <DialogDescription>
            The lead's name and contact info are only shared with {recipientBusinessName}. The community feed shows only that a referral was made between your businesses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {recipients.length > 0 && (
            <div className="space-y-1.5">
              <Label>Send to (optional)</Label>
              <Select value={recipientUserId} onValueChange={setRecipientUserId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Anyone at {recipientBusinessName}</SelectItem>
                  {recipients.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Who are you referring?</Label>
            <Select value={mode} onValueChange={v => { setMode(v as 'lead' | 'member'); setFormError(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">A lead</SelectItem>
                <SelectItem value="member">A fellow member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === 'lead' ? (
            <>
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">Lead name *</Label>
            <Input id="lead-name" value={leadName} onChange={e => setLeadName(e.target.value)} maxLength={200} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-phone">Lead phone *</Label>
            <Input id="lead-phone" type="tel" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} maxLength={50} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email">Lead email (optional)</Label>
            <Input id="lead-email" type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} maxLength={254} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-business">Lead business name (optional)</Label>
            <Input id="lead-business" value={leadBusinessName} onChange={e => setLeadBusinessName(e.target.value)} maxLength={200} />
          </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="member-search">Member to introduce</Label>
              {chosenMember ? (
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{chosenMember.businessName}</p>
                  <p className="text-muted-foreground break-all">{memberContactSummary(chosenMember)}</p>
                  <Button type="button" variant="link" className="h-auto p-0" onClick={() => setChosenMember(null)}>Change</Button>
                </div>
              ) : (
                <>
                  <Input id="member-search" placeholder="Search members..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                  <div className="max-h-48 overflow-y-auto rounded-md border">
                    {directory
                      .filter(m => m.id !== recipientBusinessId && m.id !== user?.ghlBusinessId)
                      .filter(m => m.businessName.toLowerCase().includes(memberSearch.trim().toLowerCase()))
                      .slice(0, 50)
                      .map(m => (
                        <button key={m.id} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => setChosenMember(m)}>
                          {m.businessName}
                        </button>
                      ))}
                  </div>
                </>
              )}
              <p className="text-xs text-muted-foreground">Introductions don't earn leaderboard points. The member's business contact info is shared with {recipientBusinessName}.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="lead-note">Note (optional)</Label>
            <Textarea id="lead-note" value={note} onChange={e => setNote(e.target.value)} maxLength={2000} rows={3} placeholder="What are they looking for?" />
          </div>
          <div className="space-y-1.5">
            <Label>How warm is this lead? (optional)</Label>
            <Select value={temperature} onValueChange={v => setTemperature(v as ReferralTemperature | 'none')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not sure</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
          )}
          <DialogFooter className="gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send Referral'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
