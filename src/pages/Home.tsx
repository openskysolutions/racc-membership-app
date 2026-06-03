//Add Home page component
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroCarousel } from '@/components/HeroCarousel';
import Benefits from '@/components/Benefits';
import MembershipLevels from '@/components/MembershipLevels';
import CategoryBar from '@/components/CategoryBar';
import { useMembersStore } from '@/stores/membersStore';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setCategoryFilter } = useMembersStore();

  const handleCategoryClick = (categoryId: string) => {
    setCategoryFilter(categoryId);
    navigate('/members');
  };

  return (
    <div>
      <HeroCarousel />

      {/* Browse member directory by category */}
      <div className="px-4 sm:px-6 pt-8 pb-0 max-w-full mx-auto">
        <h1 className="text-xl md:text-3xl font-semibold mb-4">
          Discover Service in the Richfield Area
        </h1>
        <CategoryBar selected="" onChange={handleCategoryClick} />
      </div>

    {/* Hero Section */}
    <div className="text-center my-8 sm:my-16 px-6">
      <h1 className="text-xl md:text-3xl font-semibold mb-4">Start Your Richfield Area Chamber of Commerce Membership Today</h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Join a thriving community of local businesses and unlock opportunities for growth, networking, and community impact. Your membership helps strengthen our local economy while providing valuable benefits for your business.
      </p>
    </div>
    <section className="my-8 sm:my-16 px-3">
      {/* Member Benefits */}
      <Benefits />

      {/* Membership Levels */}
      <MembershipLevels />
    </section>
    </div>
  );
}
export default HomePage;