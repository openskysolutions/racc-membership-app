import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import cn from 'classnames';

const MembershipLevels: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-center mb-12">Membership Levels</h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="border-2 flex flex-col h-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Basic Membership</CardTitle>
            {/* <CardDescription>Perfect for small businesses</CardDescription> */}
          </CardHeader>
          <CardContent className="text-center flex flex-col flex-grow">
            <div className="text-3xl font-bold mb-4">$300<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm mb-6 flex-grow">
              <li>• Business listed in Chamber directory on Chamber website</li>
              <li>• Subscription to the Chamber newsletter</li>
              <li>• $30 booth at the Fall Festival (must register by July 1st)</li>
              <li>• Discounted quarterly education courses</li>
              <li>• Networking opportunities at lunches</li>
              <li>• Sponsorship opportunities</li>
            </ul>
            <Button
              size="sm"
              onClick={() => navigate('/basic-membership')}
              className={cn(
                "bg-card-foreground hover:bg-card-foreground/80 dark:bg-card-foreground text-card w-full mt-auto"
              )}
            >
              Choose Basic
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500 relative flex flex-col h-full">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-500">Most Popular</Badge>
          </div>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Enhanced Membership</CardTitle>
            {/* <CardDescription>Great for growing businesses</CardDescription> */}
          </CardHeader>
          <CardContent className="text-center flex flex-col flex-grow">
            <div className="text-3xl font-bold mb-4">$550<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm mb-6 flex-grow">
              <li>• All Basic benefits</li>
              <li>• Upgraded listing in Chamber Directory to include link to your business website</li>
              <li>• One free ticket to luncheons every month (excludes Annual Dinner)</li>
              <li>• Business featured once a year in Richfield Reaper</li>
              <li>• Member listing website link</li>
              <li>• Member listing address map</li>
              <li>• Member listing business bio</li>
            </ul>
            <Button
              size="sm"
              onClick={() => navigate('/enhanced-membership')}
              className={cn(
                "bg-blue-500 hover:bg-blue-600 text-white w-full mt-auto"
              )}
            >
              Choose Enhanced
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 flex flex-col h-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Elite Membership</CardTitle>
            {/* <CardDescription>For established enterprises</CardDescription> */}
          </CardHeader>
          <CardContent className="text-center flex flex-col flex-grow">
            <div className="text-3xl font-bold mb-4">$900<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm mb-6 flex-grow">
              <li>• All Enhanced benefits</li>
              <li>• Upgraded directory listing to include links to your social media pages</li>
              <li>• Business Spotlight once a year on Radio</li>
              <li>• Free luncheon sponsorship once a year</li>
              <li>• Ad on placemats for luncheons</li>
              <li>• Member listing Cover image & social links</li>
              <li>• Member listing coupon uploads</li>
              <li>• Member listing business image gallery</li>
            </ul>
            <Button
              size="sm"
              onClick={() => navigate('/elite-membership')}
              className={cn(
                "bg-highlight-foreground hover:bg-highlight-foreground/90 text-card w-full mt-auto"
              )}
            >
              Choose Elite
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembershipLevels;