import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
            <CardTitle className="text-xl">Basic Membership</CardTitle>
            <CardDescription>Perfect for small businesses</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold mb-4">$150<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm">
              <li>• Directory listing</li>
              <li>• Monthly newsletter</li>
              <li>• Event invitations</li>
              <li>• Basic networking access</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-500">Most Popular</Badge>
          </div>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Professional Membership</CardTitle>
            <CardDescription>Great for growing businesses</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold mb-4">$300<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm">
              <li>• All Basic benefits</li>
              <li>• Featured business spotlight</li>
              <li>• Committee participation</li>
              <li>• Priority event registration</li>
              <li>• Ribbon cutting ceremonies</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Executive Membership</CardTitle>
            <CardDescription>For established enterprises</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold mb-4">$500<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm">
              <li>• All Professional benefits</li>
              <li>• Board nomination eligibility</li>
              <li>• Executive roundtable access</li>
              <li>• Premium marketing placement</li>
              <li>• Strategic planning input</li>
            </ul>
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