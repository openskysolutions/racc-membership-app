import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const BasicMembershipPage: React.FC = () => {
  useEffect(() => {
    // Load the form embed script
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Basic Membership Package</h1>
          <p className="text-lg text-muted-foreground">
            Perfect for small businesses looking to connect with the local community
          </p>
          <div className="text-3xl font-bold mt-4">
            $300<span className="text-lg font-normal text-muted-foreground">/year</span>
          </div>
        </div>

        {/* Benefits Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">What's Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Chamber Directory Listing</h3>
                  <p className="text-muted-foreground">Your business listed in our Chamber directory on the Chamber website</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Chamber Newsletter</h3>
                  <p className="text-muted-foreground">Subscription to our regular Chamber newsletter with updates and opportunities</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Free Event Booths</h3>
                  <p className="text-muted-foreground">Free booth at Spring Expo and Fall Festival events</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Educational Courses</h3>
                  <p className="text-muted-foreground">Discounted quarterly education courses to help grow your business</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Networking Opportunities</h3>
                  <p className="text-muted-foreground">Access to networking opportunities at Chamber lunches</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Sponsorship Opportunities</h3>
                  <p className="text-muted-foreground">Opportunities to sponsor Chamber events and initiatives</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Join Today</CardTitle>
            <p className="text-muted-foreground">
              Complete the form below to start your Basic Membership with the Richfield Area Chamber of Commerce.
            </p>
          </CardHeader>
          <CardContent>
            <div className="min-h-[600px]">
              <iframe
                src="https://api.leadconnectorhq.com/widget/form/NnuQQpmtGM0qTCCA2ww0"
                style={{width: '100%', height: '2826px', border: 'none', borderRadius: '3px'}}
                id="inline-NnuQQpmtGM0qTCCA2ww0" 
                data-layout="{'id':'INLINE'}"
                data-trigger-type="alwaysShow"
                data-trigger-value=""
                data-activation-type="alwaysActivated"
                data-activation-value=""
                data-deactivation-type="neverDeactivate"
                data-deactivation-value=""
                data-form-name="Member Registration Form & Payment"
                data-height="2826"
                data-layout-iframe-id="inline-NnuQQpmtGM0qTCCA2ww0"
                data-form-id="NnuQQpmtGM0qTCCA2ww0"
                title="Member Registration Form & Payment"
              />
            </div>
          </CardContent>
        </Card>

        {/* Back to About */}
        <div className="text-center mt-8">
          <a 
            href="/about" 
            className="text-primary hover:text-primary/80 font-medium"
          >
            ← Back to About Page
          </a>
        </div>
      </div>
    </div>
  );
};

export default BasicMembershipPage;