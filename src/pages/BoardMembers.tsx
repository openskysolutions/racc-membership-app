import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users } from 'lucide-react';

interface BoardMember {
  name: string;
  title: string;
  business: string;
  photo?: string;
}

const BoardMembers: React.FC = () => {
  const executiveBoard: BoardMember[] = [
    { name: "Katie Lindsay", title: "President", business: "Richfield Monuments", photo: "/images/board/Katie Lindsay Picture.jpg" },
    { name: "Jaquel Christensen", title: "President Elect", business: "Home Depot", photo: "/images/board/Jaquel Christensen photo.jpg" },
    { name: "Megan Bird", title: "Vice President", business: "Stonepath Acct", photo: "/images/board/Megan Bird Photo.jpg" },
    { name: "Stacey Busk", title: "Past President", business: "First American Title Company", photo: "/images/board/Stacey Busk Photo.jpg" },
  ];

  const termBoardMembers: BoardMember[] = [
    { name: "Ashlin Shaver", title: "Term Board Member", business: "Leona's Bistro" },
    { name: "Justin Jepson", title: "Term Board Member", business: "All In 1 Print & Sign" },
    { name: "Devin Johnson", title: "Term Board Member", business: "Black Lotus" },
    { name: "Liz Geer", title: "Term Board Member", business: "Trip Taxi" },
    { name: "Katie Torgerson", title: "Term Board Member", business: "Steve's Steakhouse" },
    { name: "Heather Madsen", title: "Term Board Member", business: "Elwood Staffing" },
    { name: "Nathan Heyborn", title: "Term Board Member", business: "CTR Eyecare" },
    { name: "Michael Taylor", title: "Term Board Member", business: "Springer Turner" },
    { name: "Lisa Jensen", title: "Term Board Member", business: "Edward Jones" },
  ];

  const exOfficioMembers: BoardMember[] = [
    { name: "Kevin Arrington", title: "Ex Officio Board Member", business: "SVC Snow College" },
    { name: "Michele Jolley", title: "Ex Officio Board Member", business: "Richfield City" },
    { name: "Amy Myers", title: "Ex Officio Board Member", business: "Sevier County Tourism" },
    { name: "Malcolm Nash", title: "Ex Officio Board Member", business: "Sevier County" },
    { name: "Cade Douglas", title: "Ex Officio Board Member", business: "Sevier School District" },
    { name: "Robert Lovell", title: "Ex Officio Board Member", business: "Mid Utah Radio" },
  ];

  const executiveDirector: BoardMember = {
    name: "Kenzie Draper",
    title: "Executive Director",
    business: "Richfield Area Chamber of Commerce",
    photo: "/images/board/Kenzie Draper photo.jpg"
  };

  return (
    <section className="container py-8 max-w-6xl mx-auto px-3 md:px-6">
      {/* Hero Section */}
      <div className="text-center mb-8 px-6">
        <h1 className="text-2xl md:text-4xl font-bold mb-4">2026 Chamber Board of Directors</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Meet the dedicated leaders guiding the Richfield Area Chamber of Commerce
        </p>
      </div>

      {/* Executive Director */}
      <div className="flex flex-col items-center mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Executive Director</h2>
        </div>
        <Card className="hover:shadow-lg transition-shadow max-w-2xl">
          <div className="flex flex-col sm:flex-row">
            {executiveDirector.photo && (
              <div className="w-full sm:w-48 h-64 overflow-hidden sm:rounded-l-lg rounded-t-lg sm:rounded-tr-none flex-shrink-0">
                <img 
                  src={executiveDirector.photo} 
                  alt={executiveDirector.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-col flex-1">
              <CardHeader className='p-12 pb-4'>
                <CardTitle className="text-lg">{executiveDirector.name}</CardTitle>
                <p className="text-sm font-semibold text-primary">{executiveDirector.title}</p>
              </CardHeader>
              <CardContent className='p-12 pt-0'>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{executiveDirector.business}</p>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>

      {/* Executive Board */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Executive Board</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {executiveBoard.map((member, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              {member.photo && (
                <div className="w-full h-48 sm:64 overflow-hidden rounded-t-lg">
                  <img 
                    src={member.photo} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className='p-3 sm:p-4 !pb-1'>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <p className="text-sm font-semibold text-primary">{member.title}</p>
              </CardHeader>
              <CardContent className='p-3 sm:p-4 !pt-0'>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{member.business}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Term Board Members */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Term Board Members</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {termBoardMembers.map((member, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              {member.photo && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                  <img 
                    src={member.photo} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className='p-3 sm:p-4 !pb-1'>
                <CardTitle className="text-lg">{member.name}</CardTitle>
              </CardHeader>
              <CardContent className='p-3 sm:p-4 !pt-0'>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{member.business}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Ex Officio Board Members */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Ex Officio Board Members</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exOfficioMembers.map((member, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              {member.photo && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                  <img 
                    src={member.photo} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className='p-3 sm:p-4 !pb-1'>
                <CardTitle className="text-lg">{member.name}</CardTitle>
              </CardHeader>
              <CardContent className='p-3 sm:p-4 !pt-0'>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{member.business}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center bg-muted/50 rounded-lg p-8">
        <h2 className="text-xl font-bold mb-3">Interested in Getting Involved?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          The Chamber Board meets regularly to discuss community initiatives, business development, 
          and ways to better serve our members. If you're interested in learning more about board 
          opportunities or attending a meeting, please reach out to us.
        </p>
      </div>
    </section>
  );
};

export default BoardMembers;
