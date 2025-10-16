
import { FC } from 'react';
import { Button } from '@/components/ui/button';
import Benefits from '@/components/Benefits';
import MembershipLevels from '@/components/MembershipLevels';
import { useNavigate } from 'react-router-dom';
import cn from 'classnames';

const JoinPage: FC = () => {
  const navigate = useNavigate();

  return (
  <section className="container py-8 max-w-6xl mx-auto px-3 md:px-6">
    {/* Hero Section */}
    <div className="text-center mb-8 px-6">
      <h1 className="text-2xl md:text-4xl font-bold mb-4">Start Your Richfield Area Chamber of Commerce Membership Today</h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Join a thriving community of local businesses and unlock opportunities for growth, networking, and community impact. Your membership helps strengthen our local economy while providing valuable benefits for your business.
      </p>
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

export default JoinPage;