import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addTestimonial, ReferralTestimonial } from '@/services/referrals';

interface Props {
  referralId: number;
  referrerBusinessName: string;
  onPosted: (t: ReferralTestimonial) => void;
}

export function TestimonialForm({ referralId, referrerBusinessName, onPosted }: Props) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const t = await addTestimonial(referralId, body.trim());
      toast.success('Thank-you posted to the community feed');
      setBody('');
      onPosted(t);
    } catch (error: any) {
      toast.error(error.message || 'Failed to post thank-you');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder={`Say thanks to ${referrerBusinessName} (shown publicly - don't include the lead's details)`}
      />
      <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
        {submitting ? 'Posting...' : 'Post a thank-you'}
      </Button>
    </form>
  );
}
