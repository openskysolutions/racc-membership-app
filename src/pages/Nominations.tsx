import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getVotingStatus } from '@/services/nominations';
import { getYearlyVotingStatus } from '@/services/yearlyVoting';
import BusinessOfMonthBadge from '@/assets/business-of-month.png';
import CustomerServiceSuperstarBadge from '@/assets/customer-service-superstar.png';
import BusinessOfYear2024 from '@/assets/business-of-year-2024.jpg';
import CustomerServiceSuperstar2024 from '@/assets/customer-service-superstar-2024.jpg';
import NominationForm from '@/components/nominations/NominationForm';

const NominationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("bofm");
  const [monthlyVotingOpen, setMonthlyVotingOpen] = useState(false);
  const [yearlyVotingOpen, setYearlyVotingOpen] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Check if user is board member
  const isBoardMember = user && (user.role === 'admin' || user.role === 'moderator' || user.role === 'board_member');

  useEffect(() => {
    // Only check voting status if user is a board member
    if (!isBoardMember) return;

    const checkVotingStatus = async () => {
      try {
        const [monthlyStatus, yearlyStatus] = await Promise.all([
          getVotingStatus().catch(() => ({ canVote: false })),
          getYearlyVotingStatus().catch(() => ({ canVote: false }))
        ]);
        
        setMonthlyVotingOpen(monthlyStatus.canVote || false);
        setYearlyVotingOpen(yearlyStatus.canVote || false);
      } catch (error) {
        console.error('Error checking voting status:', error);
      }
    };

    checkVotingStatus();
  }, [isBoardMember]);

  const showVotingButtons = isBoardMember && (monthlyVotingOpen || yearlyVotingOpen);

  return (
    <section className="container flex flex-col items-center py-20 pt-0 px-3">
      {/* Hero Banner - 2024 Winners */}
      <div className="w-screen pt-8 mb-8 bg-gradient-to-b from-slate-300 to-slate-200">

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6 mx-8`}>

          <h2 className="text-2xl font-bold text-gray-800 text-center">
            Congratulations to Our 2024 Award Winners!
          </h2>      {/* Voting Navigation - Only show if voting is open */}
          {showVotingButtons && (
            <div className="flex gap-2">
              {monthlyVotingOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/voting')}
                >
                  Monthly Voting
                </Button>
              )}
              {yearlyVotingOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/yearly-voting')}
                >
                  Yearly Voting
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-6 px-2 max-w-[1200px] mx-auto">
          {/* Business of the Year 2024 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-slate-400">
            <div 
              className="relative h-64 bg-cover bg-[29%_30%] md:-[0%_30%] bg-no-repeat filter saturate-150 brightness-110"
              style={{ backgroundImage: `url(${BusinessOfYear2024})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">Business of the Year 2024</h3>
                <p className="text-sm opacity-90">Excellence in Business Leadership</p>
              </div>
            </div>
          </div>

          {/* Customer Service Superstar of the Year 2024 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-slate-400">
            <div 
              className="relative h-64 bg-cover bg-[0%_0%] bg-no-repeat filter saturate-150 brightness-110"
              style={{ backgroundImage: `url(${CustomerServiceSuperstar2024})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">Customer Service Superstar 2024</h3>
                <p className="text-sm opacity-90">Excellence in Customer Care</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center my-4">
          <p className="text-gray-600 font-medium">
            Nominate deserving candidates for this year's awards below
          </p>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full md:max-w-[900px]"
      >
        <TabsList className="h-25 w-full md:h-10 flex flex-col sm:flex-row item-center md:justify-around mb-3 md:mb-6 bg-transparent">
          <TabsTrigger value="bofm">
            <Button 
              variant={activeTab === "bofm" ? "default" : "outline"}
              className='w-[320px]'
            >
              Nominate a Business of the Month
            </Button>
          </TabsTrigger>
          <TabsTrigger value="superstar">
            <Button 
              variant={activeTab === "superstar" ? "default" : "outline"}
              className='w-[320px]'
            >
              Nominate a Customer Service Superstar
            </Button>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bofm" className="flex flex-row justify-center items-center w-full pt-0 mt-0">
          <NominationForm
            type="business"
            category="business_of_month"
            title="Business of the Month"
            description="Nominate an outstanding local business that deserves recognition for their exceptional service and contribution to our community."
            badgeImage={BusinessOfMonthBadge}
          />
        </TabsContent>
        <TabsContent value="superstar" className="flex flex-row justify-center items-center w-full pt-0 mt-0">
          <NominationForm
            type="individual"
            category="customer_service_superstar"
            title="Customer Service Superstar of the Month"
            description="Recognize an individual who has provided exceptional customer service and made a positive impact on your experience."
            badgeImage={CustomerServiceSuperstarBadge}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default NominationsPage;
