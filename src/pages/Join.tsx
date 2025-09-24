import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const JoinPage: React.FC = () => {
  const [membershipType, setMembershipType] = useState<'basic' | 'enhanced' | 'elite'>('basic');
  const navitgate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: submit membership application
    setMembershipType(membershipType);
    navitgate('/auth/register', { state: { membershipType } });
    console.log('Joining with data:', membershipType);
  };

  return (
    <div className="py-10 px-4 mx-auto max-w-4xl">
      <Card className="w-full max-w-2xl gap-4 flex flex-col">
        <CardHeader className='gap-4 text-sm leading-6'>
          <CardTitle className='text-foreground'>Membership Application</CardTitle>
          <h3 className="text-lg font-medium py-2 text-highlight-foreground">Instructions</h3>
          <p className="pb-2 leading-inherit">
            Please note that our Membership Packages have changed. All memberships expire annually on October 31. 
          </p>
          <p className="pb-2 leading-inherit">
            We are now offering more advertising opportunities, especially with the higher level packages and you also have additional advertising opportunities and benefits you can add on to an existing package on the next page.
          </p>
          <p className="pb-2 leading-inherit">
            New to the Chamber, or been away for a few years? In addition to the benefits of your selected Membership Package, all organizations that have not been a Chamber member for 3 or more years will receive:
          </p>
          <ul className="list-disc list-inside leading-inherit">
            <li>$500 worth of advertising on Mid-Utah Radio</li>
            <li>Time to share about your business at your first Chamber luncheon</li>
            <li>Business announced as new member at your first Chamber luncheon</li>
            <li>Ribbon cutting, open house or groundbreaking support for new business</li>
            <li>Business announced as new member in Chamber newsletter and in newspaper</li>
          </ul>
        </CardHeader>
        <CardContent className="pt-0 text-md leading-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Package selection */}
            <div className="space-y-4 gap-4 flex flex-col">
              <div className="text-lg font-medium text-highlight-foreground">Select a Membership Package</div>
              <label className="flex items-start space-x-3">
                <Input
                  type="radio"
                  name="membershipType"
                  value="basic"
                  checked={membershipType === 'basic'}
                  onChange={() => setMembershipType('basic')}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <div className="font-semibold">Basic Membership Package - $300 Annually</div>
                  <ul className="list-disc list-inside">
                    <li>Business listed in Chamber directory on Chamber website</li>
                    <li>Subscription to the Chamber newsletter</li>
                    <li>Free booth at Spring Expo and Fall Festival</li>
                    <li>Discounted quarterly education courses</li>
                    <li>Networking opportunities at lunches</li>
                    <li>Sponsorship opportunities</li>
                  </ul>
                </div>
              </label>
              <label className="flex items-start space-x-3">
                <Input
                  type="radio"
                  name="membershipType"
                  value="enhanced"
                  checked={membershipType === 'enhanced'}
                  onChange={() => setMembershipType('enhanced')}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <div className="font-semibold">Enhanced Membership Package - $550 Annually</div>
                  <p className="">Includes all Basic benefits plus:</p>
                  <ul className="list-disc list-inside">
                    <li>Upgraded directory listing with website link</li>
                    <li>Business announced as new member on social media</li>
                    <li>One free ticket to monthly luncheons</li>
                    <li>Business featured once a year in newspaper</li>
                  </ul>
                </div>
              </label>
              <label className="flex items-start space-x-3">
                <Input
                  type="radio"
                  name="membershipType"
                  value="elite"
                  checked={membershipType === 'elite'}
                  onChange={() => setMembershipType('elite')}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <div className="font-semibold">Elite Membership Package - $900 Annually</div>
                  <p className="">Includes all Enhanced benefits plus:</p>
                  <ul className="list-disc list-inside">
                    <li>Business featured once a year on radio</li>
                    <li>Small ad on luncheon placemats (by Jan 1)</li>
                    <li>Free luncheon sponsorship once a year</li>
                  </ul>
                </div>
              </label>
            </div>
            <Button type="submit" className="w-full bg-highlight-foreground">NEXT</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinPage;

