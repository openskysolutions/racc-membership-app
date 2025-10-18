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

const NominationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("bofm");

  return (
    <section className="container flex flex-col items-center py-20 pt-8 px-3">
      <div className="mb-8 md:mb-16 flerx flex-col justify-start items-center">
        <h1 className="text-3xl font-bold mb-2 w-full text-center">Nominations</h1>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full md:max-w-[900px]"
      >
        <TabsList className="h-25 w-full md:h-10 flex flex-col sm:flex-row item-center md:justify-around mb-3 md:mb-6">
          <TabsTrigger value="bofm">
            <Button variant={activeTab === "bofm" ? "default" : "outline"}>
              Nominate a Business of the Month
            </Button>
          </TabsTrigger>
          <TabsTrigger value="superstar">
            <Button variant={activeTab === "superstar" ? "default" : "outline"}>
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
