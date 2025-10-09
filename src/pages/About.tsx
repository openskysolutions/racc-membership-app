import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Benefits from '@/components/Benefits';
import MembershipLevels from '@/components/MembershipLevels';
import { useNavigate } from 'react-router-dom';
import cn from 'classnames';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
  <section className="container py-8 max-w-6xl mx-auto px-3 md:px-6">
    {/* Hero Section */}
    <div className="text-center mb-8 px-6">
      <h1 className="text-2xl md:text-4xl font-bold mb-4">About the Richfield Area Chamber of Commerce</h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Strengthening our community through business collaboration, economic development, and member advocacy since our founding.
      </p>
    </div>

    {/* Mission & Vision */}
    <div className="grid md:grid-cols-2 gap-8 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            To promote and support the growth and prosperity of businesses in the Richfield area through 
            networking opportunities, advocacy, education, and community engagement.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Our Vision</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            To be the leading voice for business in our community, fostering an environment where 
            businesses thrive and contribute to the economic vitality of the Richfield area.
          </p>
        </CardContent>
      </Card>
    </div>

    {/* Member Benefits */}
    <Benefits />

    {/* Membership Levels */}
    <MembershipLevels />

    {/* Contact Information */}
    <div className="text-center bg-muted/50 rounded-lg p-8 pb-0">
      <h2 className="text-2xl font-bold mb-4">Ready to Join?</h2>
      <p className="text-muted-foreground mb-6">
        If you'd like to talk to us about these membership benefits:
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/contact')}
          className={cn(
            "border-input hover:bg-accent hover:text-accent-foreground"
          )}
        >
          Contact Us
        </Button>
      </div>
    </div>
  </section>
  );
};

export default AboutPage;