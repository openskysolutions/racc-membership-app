import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const EnhancedMembershipPage: React.FC = () => {
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
          <div className="flex justify-center mb-4">
            <Badge className="bg-blue-500 text-white">Most Popular</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Enhanced Membership Package</h1>
          <p className="text-lg text-muted-foreground">
            Great for growing businesses seeking enhanced visibility and networking
          </p>
          <div className="text-3xl font-bold mt-4">
            $400<span className="text-lg font-normal text-muted-foreground">/year</span>
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
                  <h3 className="font-semibold">All Basic Benefits</h3>
                  <p className="text-muted-foreground">Everything included in the Basic Membership Package</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Annual Radio Feature</h3>
                  <p className="text-muted-foreground">Your business featured once a year on our radio program</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Luncheon Placemat Advertising</h3>
                  <p className="text-muted-foreground">Small advertisement on luncheon placemats throughout the year</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Upgraded Directory Listing</h3>
                  <p className="text-muted-foreground">Enhanced directory listing with links to your website and social media pages</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Free Annual Luncheon Sponsorship</h3>
                  <p className="text-muted-foreground">Complimentary luncheon sponsorship opportunity once per year</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">All Basic Benefits</h3>
                  <p className="text-muted-foreground">Chamber directory listing, newsletter, event booths, education discounts, networking, and sponsorship opportunities</p>
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
              Complete the form below to start your Enhanced Membership with the Richfield Area Chamber of Commerce.
            </p>
          </CardHeader>
          <CardContent>
            <div className="min-h-[600px]">
              <iframe
                src="https://api.leadconnectorhq.com/widget/form/NnuQQpmtGM0qTCCA2ww0"
                style={{width: '100%', height: '1456px', border: 'none', borderRadius: '3px'}}
                id="inline-NnuQQpmtGM0qTCCA2ww0" 
                data-layout="{'id':'INLINE'}"
                data-trigger-type="alwaysShow"
                data-trigger-value=""
                data-activation-type="alwaysActivated"
                data-activation-value=""
                data-deactivation-type="neverDeactivate"
                data-deactivation-value=""
                data-form-name="Enhanced Member Registration Form & Payment"
                data-height="1456"
                data-layout-iframe-id="inline-NnuQQpmtGM0qTCCA2ww0"
                data-form-id="NnuQQpmtGM0qTCCA2ww0"
                title="Enhanced Member Registration Form & Payment"
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

export default EnhancedMembershipPage;