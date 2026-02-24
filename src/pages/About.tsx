import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Benefits from '@/components/Benefits';
import MembershipLevels from '@/components/MembershipLevels';
import { useNavigate } from 'react-router-dom';
import cn from 'classnames';
import { Separator } from '@radix-ui/react-dropdown-menu';

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

    {/* Board of Directors Section */}
    <Card className="mb-8 bg-slate-200 dark:bg-slate-600/50 border-slate-100 dark:border-slate-600/50">
      <CardHeader className='sm:p-24 sm:pb-0'>
        <CardTitle className="text-2xl">Leadership</CardTitle>
      </CardHeader>
      <CardContent className='sm:p-24 sm:pt-6'>
        {/* President's Message */}
        <div className="max-w-3xl mb-6 text-left text-muted-foreground">
          <p className="mb-3">
          <span className="font-semibold">Dear Richfield Area Chamber,</span>
        </p>
        <p className="mb-3">
          Hello my name is Katie Lindsay and I am excited to be serving as Richfield Area Chamber President for 2026.
        </p>
        <p className="mb-3">
          A quick note about myself, my husband Rick and I own a small business in town- Richfield Monuments. We make headstones and memorials, and this year we are celebrating 20 years of owning our business. We are proud as a business to be a part of Richfield Area Chamber.
        </p>
        <p className="mb-3">
          As we welcome the start of this New Year, I want to take a moment to reflect on how far we have come. The Richfield Area Chamber has seen exponential growth adding 25+ new businesses in 2024/2025, and I am excited for what lies ahead.
        </p>
        <p className="mb-3">
          My personal goal is to offer even more chances to serve and sponsor our community, network for our businesses, and progress in our knowledge of enterprise.
        </p>
        <p className="mb-3">
          A successful Area Chamber not only strengthens our local economy but also enhances the quality of life for everyone who lives and works here in our little Sevier Valley.
        </p>
        <p className="mb-3">
          None of what our Chamber accomplishes is possible without the commitment and passion of You, our members. Your involvement, ideas, and support are what drives us forward, and I am grateful for each of you. Together, I am confident that we can make this year one of growth, collaboration, and successful business.
        </p>
        <p className="mb-3">
          Thank you for being part of this journey. I look forward to working alongside you in the coming year and to all that we will achieve together.
        </p>
        <p className="font-semibold mt-4">
          Katie Lindsay,<br />
          President RAC
        </p>
      </div>
      <Separator className="w-4/5 mt-2 mb-10 border-t border-foreground/50" />
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Our Chamber is guided by a dedicated Board of Directors comprised of local business leaders 
        committed to the prosperity of our community.
      </p>
      <div>
        <Button
          onClick={() => navigate('/board')}
          className="bg-primary hover:bg-primary/90"
        >
          Meet Our Board Members
        </Button>
      </div>
      </CardContent>
    </Card>

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