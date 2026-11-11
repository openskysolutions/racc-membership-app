import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createNonMemberReferral, ReferralTemperature } from '@/services/referrals';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const EMPTY = { businessName: '', contactName: '', email: '', phone: '', leadName: '', leadPhone: '', leadEmail: '', leadBusinessName: '', note: '' };

export function ReferNonMemberDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [temperature, setTemperature] = useState<ReferralTemperature | 'none'>('none');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const { emailSent } = await createNonMemberReferral({
        businessName: form.businessName.trim(),
        email: form.email.trim(),
        contactName: form.contactName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        leadName: form.leadName.trim(),
        leadPhone: form.leadPhone.trim(),
        leadEmail: form.leadEmail.trim() || undefined,
        leadBusinessName: form.leadBusinessName.trim() || undefined,
        note: form.note.trim() || undefined,
        temperature: temperature === 'none' ? undefined : temperature,
      });
      if (emailSent) toast.success(`Referral saved and an invitation was emailed to ${form.businessName.trim()}`);
      else toast.warning("Referral saved, but the invitation email couldn't be sent");
      setForm(EMPTY);
      setTemperature('none');
      onOpenChange(false);
      onCreated?.();
    } catch (error: any) {
      setFormError(error.message || 'Failed to submit referral');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refer a business that isn't a member</DialogTitle>
          <DialogDescription>
            The business will be emailed an invitation to learn about the chamber, but it will NOT see your lead's name, contact info or note.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nm-business">Business name *</Label>
            <Input id="nm-business" value={form.businessName} onChange={set('businessName')} maxLength={200} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nm-email">Business email *</Label>
            <Input id="nm-email" type="email" value={form.email} onChange={set('email')} maxLength={254} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nm-contact">Contact name</Label>
              <Input id="nm-contact" value={form.contactName} onChange={set('contactName')} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nm-phone">Phone</Label>
              <Input id="nm-phone" value={form.phone} onChange={set('phone')} maxLength={50} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nm-lead">Lead name *</Label>
            <Input id="nm-lead" value={form.leadName} onChange={set('leadName')} maxLength={200} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nm-lead-phone">Lead phone *</Label>
            <Input id="nm-lead-phone" type="tel" value={form.leadPhone} onChange={set('leadPhone')} maxLength={50} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nm-lead-email">Lead email (optional)</Label>
            <Input id="nm-lead-email" type="email" value={form.leadEmail} onChange={set('leadEmail')} maxLength={254} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nm-lead-business">Lead business name (optional)</Label>
            <Input id="nm-lead-business" value={form.leadBusinessName} onChange={set('leadBusinessName')} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nm-note">Note (optional, kept private)</Label>
            <Textarea id="nm-note" value={form.note} onChange={set('note')} maxLength={2000} rows={3} />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send Referral'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
