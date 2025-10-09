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
            <CardTitle className="text-xl">Basic Membership Package</CardTitle>
            {/* <CardDescription>Perfect for small businesses</CardDescription> */}
          </CardHeader>
          <CardContent className="text-center flex flex-col flex-grow">
            <div className="text-3xl font-bold mb-4">$300<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm mb-6 flex-grow">
              <li>• Business listed in Chamber directory on Chamber website</li>
              <li>• Subscription to the Chamber newsletter</li>
              <li>• Free booth at Spring Expo and Fall Festival</li>
              <li>• Discounted quarterly education courses</li>
              <li>• Networking opportunities at lunches</li>
              <li>• Sponsorship opportunities</li>
            </ul>
            <Button
              size="sm"
              onClick={() => navigate('/basic-membership')}
              className={cn(
                "bg-highlight-foreground hover:bg-highlight-foreground/90 text-card w-full mt-auto"
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
            <CardTitle className="text-xl">Enhanced Membership Package</CardTitle>
            {/* <CardDescription>Great for growing businesses</CardDescription> */}
          </CardHeader>
          <CardContent className="text-center flex flex-col flex-grow">
            <div className="text-3xl font-bold mb-4">$400<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm mb-6 flex-grow">
              <li>• All Basic benefits</li>
              <li>• Business featured once a year on radio</li>
              <li>• Small ad on luncheon placemats</li>
              <li>• Upgraded directory listing to include links to your website and your social media pages</li>
              <li>• Free luncheon sponsorship once a year</li>
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
            <CardTitle className="text-xl">Elite Membership Package</CardTitle>
            {/* <CardDescription>For established enterprises</CardDescription> */}
          </CardHeader>
          <CardContent className="text-center flex flex-col flex-grow">
            <div className="text-3xl font-bold mb-4">$500<span className="text-sm font-normal">/year</span></div>
            <ul className="text-left space-y-2 text-sm mb-6 flex-grow">
              <li>• All Enhanced benefits</li>
              <li>• Board nomination eligibility</li>
              <li>• Executive roundtable access</li>
              <li>• Premium marketing placement</li>
              <li>• Strategic planning input</li>
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