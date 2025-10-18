import { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BusinessOfMonthBadge from '@/assets/business-of-month.png';
import CustomerServiceSuperstarBadge from '@/assets/customer-service-superstar.png';
import BusinessOfYear2024 from '@/assets/business-of-year-2024.jpg';
import CustomerServiceSuperstar2024 from '@/assets/customer-service-superstar-2024.jpg';

const NominationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("bofm");

  return (
    <section className="container flex flex-col items-center py-20 pt-0 px-3">
      {/* <div className="mb-8 md:mb-16 flerx flex-col justify-start items-center">
        <h1 className="text-3xl font-bold mb-2 w-full text-center">Nominations</h1>
      </div> */}

      {/* Hero Banner - 2024 Winners */}
      <div className="w-screen pt-8 mb-8 bg-gradient-to-b from-slate-300 to-slate-200">
        <h2 className="text-2xl w-full font-bold text-center text-gray-800 mb-8">
          Congratulations to Our 2024 Award Winners!
        </h2>
        
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
        <TabsList className="h-25 w-full md:h-10 flex flex-col sm:flex-row item-center md:justify-around mb-3 md:mb-6">
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
          <Card className='flex flex-col md:flex-row min-h-[459px] w-full overflow-hidden'>
            <CardHeader className='w-full md:w-1/2 bg-slate-200 flex flex-col justify-center items-center p-8 text-center'>
              <CardTitle className="text-2xl font-bold mb-4">
                  <img src={BusinessOfMonthBadge} alt="Business of the Month" className="w-48 md:w-64 h-auto" />
                </CardTitle>
              <CardDescription className="text-lg">
                Nominate an outstanding local business that deserves recognition for their exceptional service and contribution to our community.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col min-h-[485px] w-full md:w-1/2 p-0 justify-center items-center overflow-hidden">

              <iframe 
                src="https://api.leadconnectorhq.com/widget/survey/hRAdxyEouhBTqz9NE3pM" 
                id="hRAdxyEouhBTqz9NE3pM" 
                title="survey"
                className='flex flex-grow w-full h-full'
              ></iframe>
              <script src="https://link.msgsndr.com/js/form_embed.js"></script>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="superstar" className="flex flex-row justify-center items-center w-full pt-0 mt-0">
          <Card className='flex flex-col md:flex-row min-h-[459px] md:max-w-[900px] w-full overflow-hidden'>
            <CardHeader className='w-full md:w-1/2 bg-slate-200 flex flex-col justify-center items-center p-8 text-center'>
              <CardTitle className="text-2xl font-bold mb-4">
                  <img src={CustomerServiceSuperstarBadge} alt="Customer Service Superstar of the Month" className="w-48 md:w-64 h-auto" />
                </CardTitle>
              <CardDescription className="text-lg">
                Recognize an individual who has provided exceptional customer service and made a positive impact on your experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col min-h-[485px] w-full md:w-1/2 p-0 justify-center items-center overflow-hidden">
              <iframe 
                src="https://api.leadconnectorhq.com/widget/survey/8AgiIVHlQR1lDXrjZrkG" 
                height='600px' 
                width='100%'               
                id="8AgiIVHlQR1lDXrjZrkG" 
                title="survey"
                className='flex flex-grow w-full h-full'
              ></iframe>
              <script src="https://link.msgsndr.com/js/form_embed.js"></script>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default NominationsPage;
