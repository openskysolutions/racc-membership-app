import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import cn from 'classnames';

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className={cn(
            `bg-[url(@/assets/meeting-image.jpg)] bg-cover bg-center bg-no-repeat bg-sky-800 bg-opacity-80 bg-blend-multiply`,
            'relative h-64 md:h-80'
      )}>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-5xl font-semibold mb-4 text-card">Basic Membership Package</h1>
            <p className="text-lg md:text-xl mb-6 max-w-2xl">
              Perfect for small businesses looking to connect with the local community
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
          </div>

          {/* Registration Form */}
          <div className="w-full md:w-2/3">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl text-center">Start Your Basic Membership Today</CardTitle>
                <p className="text-muted-foreground text-center text-lg">
                  Complete the form below to start your Basic Membership with the Richfield Area Chamber of Commerce.
                </p>
              </CardHeader>
              <CardContent>
                <div className="min-h-[600px]">
                  <iframe
                    src="https://api.leadconnectorhq.com/widget/form/17g0UVVkP99Qqajn86Jh"
                    style={{width: '100%', height: '1471px', border: 'none', borderRadius: '3px'}}
                    id="inline-17g0UVVkP99Qqajn86Jh" 
                    data-layout="{'id':'INLINE'}"
                    data-trigger-type="alwaysShow"
                    data-trigger-value=""
                    data-activation-type="alwaysActivated"
                    data-activation-value=""
                    data-deactivation-type="neverDeactivate"
                    data-deactivation-value=""
                    data-form-name="Basic Member Registration Form & Payment"
                    data-height="1619"
                    data-layout-iframe-id="inline-17g0UVVkP99Qqajn86Jh"
                    data-form-id="17g0UVVkP99Qqajn86Jh"
                    title="Basic Member Registration Form & Payment"
                        >
                </iframe>
                <script src="https://link.msgsndr.com/js/form_embed.js"></script>
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

export default BasicMembershipPage;