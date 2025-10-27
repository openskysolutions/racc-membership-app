//Add Home page component
import React from 'react';
import { HeroCarousel } from '@/components/HeroCarousel';
import Benefits from '@/components/Benefits';
import MembershipLevels from '@/components/MembershipLevels';

const HomePage: React.FC = () => {
  return (
    <div>
      <HeroCarousel />
    {/* Hero Section */}
    <div className="text-center my-16 px-6">
      <h1 className="text-xl md:text-3xl font-semibold mb-4">Start Your Richfield Area Chamber of Commerce Membership Today</h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Join a thriving community of local businesses and unlock opportunities for growth, networking, and community impact. Your membership helps strengthen our local economy while providing valuable benefits for your business.
      </p>
    </div>

    {/* Member Benefits */}
    <Benefits />

    {/* Membership Levels */}
    <MembershipLevels />

    </div>
  );
}
export default HomePage;