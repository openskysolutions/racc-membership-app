import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Benefits from '@/components/Benefits';

const AboutPage: React.FC = () => (
  <section className="container py-20 max-w-6xl mx-auto px-3 md:px-6">
    {/* Hero Section */}
    <div className="text-center mb-16 px-6">
      <h1 className="text-2xl md:text-4xl font-bold mb-4">About the Richfield Area Chamber of Commerce</h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Strengthening our community through business collaboration, economic development, and member advocacy since our founding.
      </p>
    </div>

    {/* Mission & Vision */}
    <div className="grid md:grid-cols-2 gap-8 mb-16">
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
    <div className="mb-16">
      <Benefits />
    </div>

    {/* Membership Levels */}
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-center mb-12">Membership Levels</h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Basic Membership Package</CardTitle>
            {/* <CardDescription>Perfect for small businesses</CardDescription> */}
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold mb-4">$300<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm mb-6">
              <li>• Business listed in Chamber directory on Chamber website</li>
              <li>• Subscription to the Chamber newsletter</li>
              <li>• Free booth at Spring Expo and Fall Festival</li>
              <li>• Discounted quarterly education courses</li>
              <li>• Networking opportunities at lunches</li>
              <li>• Sponsorship opportunities</li>
            </ul>
            <a 
              href="/membership/basic" 
              className="bg-primary dark:bg-highlight-foreground text-primary-foreground px-6 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors inline-block w-full"
            >
              Choose Basic
            </a>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-500">Most Popular</Badge>
          </div>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Enhanced Membership Package</CardTitle>
            {/* <CardDescription>Great for growing businesses</CardDescription> */}
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold mb-4">$400<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm mb-6">
              <li>• All Basic benefits</li>
              <li>• Business featured once a year on radio</li>
              <li>• Small ad on luncheon placemats</li>
              <li>• Upgraded directory listing to include links to your website and your social media pages</li>
              <li>• Free luncheon sponsorship once a year</li>
            </ul>
            <a 
              href="/membership/enhanced" 
              className="bg-blue-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors inline-block w-full"
            >
              Choose Enhanced
            </a>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Elite Membership Package</CardTitle>
            {/* <CardDescription>For established enterprises</CardDescription> */}
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold mb-4">$500<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm mb-6">
              <li>• All Enhanced benefits</li>
              <li>• Board nomination eligibility</li>
              <li>• Executive roundtable access</li>
              <li>• Premium marketing placement</li>
              <li>• Strategic planning input</li>
            </ul>
            <a 
              href="/membership/elite" 
              className="bg-primary dark:bg-highlight-foreground text-primary-foreground px-6 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors inline-block w-full"
            >
              Choose Elite
            </a>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Contact Information */}
    <div className="text-center bg-muted/50 rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-4">Ready to Join?</h2>
      <p className="text-muted-foreground mb-6">
        Become part of a thriving business community that supports your growth and success.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
          href="/join" 
          className="bg-primary dark:bg-highlight-foreground text-primary-foreground px-6 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors"
        >
          Join Today
        </a>
        <a 
          href="/contact" 
          className="border border-input bg-background px-6 py-3 rounded-md font-medium hover:bg-accent hover:text-background transition-colors"
        >
          Contact Us
        </a>
      </div>
    </div>
  </section>
);

export default AboutPage;