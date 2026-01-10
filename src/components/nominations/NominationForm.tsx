import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/services/apiClient';
import BusinessSearchCombobox from './BusinessSearchCombobox';

interface NominationFormProps {
  type: 'business' | 'individual';
  category: 'business_of_month' | 'customer_service_superstar';
  title: string;
  description: string;
  badgeImage: string;
}

interface NomineeData {
  id: string;
  name: string;
  businessName?: string;
  email?: string;
  phone?: string;
}

const NominationForm: React.FC<NominationFormProps> = ({
  type,
  category,
  title,
  description,
  badgeImage
}) => {
  const [nominee, setNominee] = useState<NomineeData | null>(null);
  const [business, setBusiness] = useState<NomineeData | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate current and last year dynamically
  const currentYear = new Date().getFullYear();
  // const lastYear = currentYear - 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nominee) {
      toast.error('Please select a nominee');
      return;
    }

    // For Customer Service Superstar, also require business selection
    if (category === 'customer_service_superstar' && !business) {
      toast.error('Please select the business where this person works');
      return;
    }

    setIsSubmitting(true);

    try {
      const nominationData = {
        type,
        category,
        name: type === 'individual' ? nominee.name : undefined,
        businessName: category === 'customer_service_superstar' && business 
          ? business.name 
          : nominee.businessName || nominee.name,
        reason
      };

      const response = await api.post('/nominations', nominationData);

      if (!response.ok) {
        throw new Error('Failed to submit nomination');
      }

      toast.success('Nomination submitted successfully!');
      
      // Reset form
      setNominee(null);
      setBusiness(null);
      setReason('');
    } catch (error: any) {
      console.error('Failed to submit nomination:', error);
      toast.error(error.message || 'Failed to submit nomination');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="flex flex-col md:flex-row w-full overflow-hidden">
      <CardHeader className="w-full md:w-1/2 bg-slate-200 dark:bg-slate-800 flex flex-col justify-center items-center p-8 text-center">
        <CardTitle className="text-2xl font-bold mb-4 border-0">
          <img src={badgeImage} alt={title} className="w-48 md:w-64 h-auto border-0" />
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="w-full md:w-1/2 p-6">
        <div className="mb-4 items-center text-center">
          <h2 className="text-3xl font-bold text-muted-foreground leading-tight">{currentYear}</h2>
          <h3 className="text-xl font-semibold text-muted-foreground">
            {category === 'business_of_month' 
              ? 'Business of the Month' 
              : (
                <>
                  <span className='whitespace-nowrap'>Customer Service Superstar</span>
                  {' '}
                  <span className='whitespace-nowrap'>of the Month</span>
                </>
              )
            }
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nominee Selection */}
          <div className="space-y-2">
            <Label htmlFor="nominee">
              {type === 'business' ? 'Select Business' : 'Select Individual'} *
            </Label>
            <BusinessSearchCombobox
              type={type}
              value={nominee}
              onChange={(selectedNominee) => {
                setNominee(selectedNominee);
                // Auto-populate business field for Customer Service Superstar
                if (category === 'customer_service_superstar' && selectedNominee?.businessName) {
                  setBusiness({
                    id: selectedNominee.id,
                    name: selectedNominee.businessName,
                    businessName: selectedNominee.businessName,
                  });
                }
              }}
            />
            {nominee && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-2">
                <p><strong>Selected:</strong> {nominee.name}</p>
                {nominee.businessName && type === 'individual' && category === 'business_of_month' && (
                  <p><strong>Business:</strong> {nominee.businessName}</p>
                )}
                {nominee.email && <p><strong>Email:</strong> {nominee.email}</p>}
                {nominee.phone && <p><strong>Phone:</strong> {nominee.phone}</p>}
              </div>
            )}
          </div>

          {/* Business Selection (only for Customer Service Superstar) */}
          {category === 'customer_service_superstar' && (
            <div className="space-y-2">
              <Label htmlFor="business">
                Select Business Where They Work *
              </Label>
              <BusinessSearchCombobox
                type="business"
                value={business}
                onChange={setBusiness}
              />
              {business && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-2">
                  <p><strong>Business:</strong> {business.name}</p>
                  {business.email && <p><strong>Email:</strong> {business.email}</p>}
                  {business.phone && <p><strong>Phone:</strong> {business.phone}</p>}
                </div>
              )}
            </div>
          )}

          {/* Nomination Reason */}
          <div className="border-t pt-4 mt-4">
            <div>
              <Label htmlFor="reason">
                Why are you nominating {type === 'business' ? 'this business' : 'this person'}? *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Tell us what makes this nominee exceptional..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting || 
              !nominee || 
              (category === 'customer_service_superstar' && !business)
            }
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Nomination'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NominationForm;
