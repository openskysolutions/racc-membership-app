import React, { useEffect } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from "@/providers/theme-provider";
import LogoLight from "@/assets/racc-logo.png";
import LogoDark from "@/assets/racc-logo-dark.png";

const ContactPage: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // Load the form embed script
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            Have questions? We're here to help. Get in touch with the Richfield Area Chamber of Commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Office Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-semibold">Sevier County Administration Building</p>
                    <p>250 N Main St</p>
                    <p>Richfield, UT 84701</p>
                  </div>
                  
                  {/* Embedded Map */}
                  <div className="w-full h-64 rounded-lg overflow-hidden border">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12195.382467930936!2d-112.08668!3d38.77225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8749c8b0e1f1f1f1%3A0x1234567890abcdef!2s250%20N%20Main%20St%2C%20Richfield%2C%20UT%2084701!5e0!3m2!1sen!2sus!4v1633024800000!5m2!1sen!2sus&z=11"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Richfield Area Chamber of Commerce Office Location"
                    />
                  </div>
                  
                  <div className="text-center">
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=250+N+Main+St%2C+Richfield%2C+UT+84701"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href="tel:+14358964241" 
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  (435) 896-4241
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:info@richfieldareachamber.com" 
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  info@richfieldareachamber.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <img 
                        src={theme === "dark" ? LogoDark : LogoLight} 
                        alt="RACC Logo" 
                        className="h-12 w-auto"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        The Chamber of Commerce is an organization of businesses who have
                        joined together for business promotion and information. The Chamber is your business partner and resource.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle><span className='flex mb-3'>Have Questions?</span>Please fill out the form below.</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ minHeight: '1353px' }}>
                  <iframe
                    src="https://api.leadconnectorhq.com/widget/form/i0fNlApCDusMLRXDP7XR"
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '3px' }}
                    id="inline-i0fNlApCDusMLRXDP7XR"
                    data-layout="{'id':'INLINE'}"
                    data-trigger-type="alwaysShow"
                    data-trigger-value=""
                    data-activation-type="alwaysActivated"
                    data-activation-value=""
                    data-deactivation-type="neverDeactivate"
                    data-deactivation-value=""
                    data-form-name="Contact Us General Form"
                    data-height="1353"
                    data-layout-iframe-id="inline-i0fNlApCDusMLRXDP7XR"
                    data-form-id="i0fNlApCDusMLRXDP7XR"
                    title="Contact Us General Form"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                You can also reach us on{' '}
                <a 
                  href="https://www.facebook.com/profile.php?id=100063232268373" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Facebook
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;