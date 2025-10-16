import { FC, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import cn from 'classnames';

const EliteMembershipPage: FC = () => {
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
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className={cn(
          `bg-[url(/20250213_084901-scaled-1.jpg)] bg-cover bg-center bg-no-repeat bg-foreground bg-opacity-80 bg-blend-multiply`,
          'relative h-64 md:h-80'
        )}>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-5xl font-semibold mb-4">Elite Membership Package</h1>
            <p className="text-lg md:text-xl mb-6 max-w-2xl">
              For established enterprises seeking leadership opportunities and premium benefits
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-20 relative z-10">
        <div className="max-w-7xl mx-auto">

        {/* Two Column Flex Layout */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Benefits Section */}
          <div className="w-full md:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">All Basic & Enhanced Benefits</h3>
                      <p className="text-muted-foreground">Complete access to all benefits from Basic and Enhanced membership tiers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Board Nomination Eligibility</h3>
                      <p className="text-muted-foreground">Eligible to be nominated and serve on the Chamber Board of Directors</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Executive Roundtable Access</h3>
                      <p className="text-muted-foreground">Exclusive access to executive roundtable discussions and strategic sessions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Premium Marketing Placement</h3>
                      <p className="text-muted-foreground">Priority placement in Chamber marketing materials and communications</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Strategic Planning Input</h3>
                      <p className="text-muted-foreground">Direct input into Chamber strategic planning and community development initiatives</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <div className="w-full md:w-2/3">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Start Your Elite Membership Today</CardTitle>
                <p className="text-muted-foreground">
                  Complete the form below to start your Elite Membership with the Richfield Area Chamber of Commerce.
                </p>
              </CardHeader>
              <CardContent>
                <div className="min-h-[600px]">
                  <iframe
                    src="https://api.leadconnectorhq.com/widget/form/Vmi1G0IM243CQGix7P2A"
                    style={{width: '100%', height: '1471px', border: 'none', borderRadius: '3px'}}
                    id="inline-Vmi1G0IM243CQGix7P2A" 
                    data-layout="{'id':'INLINE'}"
                    data-trigger-type="alwaysShow"
                    data-trigger-value=""
                    data-activation-type="alwaysActivated"
                    data-activation-value=""
                    data-deactivation-type="neverDeactivate"
                    data-deactivation-value=""
                    data-form-name="Elite Member Registration Form & Payment"
                    data-height="1471"
                    data-layout-iframe-id="inline-Vmi1G0IM243CQGix7P2A"
                    data-form-id="Vmi1G0IM243CQGix7P2A"
                    title="Elite Member Registration Form & Payment"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
    </div>
  );
};

export default EliteMembershipPage;