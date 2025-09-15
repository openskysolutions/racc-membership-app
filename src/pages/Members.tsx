import React, { useState, useEffect } from 'react';
import { getMembersList } from '@/services/members';
import type { Member } from '@/types/member';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CiClock2, CiGlobe, CiMail, CiPhone } from 'react-icons/ci';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PhoneNumber } from '@/components/ui/phone-number';
import { Url } from '@/components/ui/url';

const MembersPage: React.FC = () => {
  const role = useAuthStore(state => state.role);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMembersList()
      .then((data) => setMembers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [role]);

  if (loading) return <section className="container py-20">Loading...</section>;
  if (error) return <section className="container py-20">Error: {error}</section>;

  return (
    <section className="container py-20 px-3 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Members</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member: Member, idx) => {
          const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();

          return (
            <Card key={idx} className="p-4">
              <CardHeader 
                className="flex flex-row items-center space-x-4 mb-0 p-1 cursor-pointer"
                onClick={() => navigate(`/members/${member.id}`)}
              >
                <Avatar>
                  {member.avatar ? (
                    <AvatarImage src={member.avatar} alt={fullName} />
                  ) : (
                    <AvatarFallback className='bg-neutral-250 text-muted-foreground'>
                      {
                        // Initials of member.businessName
                        member.businessName ? member.businessName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() :
                        (member.firstName?.charAt(0) || '' + member.lastName?.charAt(0) || '').toUpperCase()
                      }
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className='text-lg'>{member.businessName}</CardTitle>
                  {/* <span className="text-sm text-muted-foreground">{`@${member.slug}`}</span> */}
                </div>
              </CardHeader>
              <CardContent className="p-1">
                <CardDescription>
                  {fullName &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <CiClock2 />
                      {fullName || ''}
                    </div>
                  }
                  {member.phone &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <CiPhone />
                      <PhoneNumber phone={member.phone || ''} />
                    </div>
                  }
                  {member.email &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <CiMail />{member.email || ''}
                    </div>
                  }
                  {member.website &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <CiGlobe />
                      <Url url={member.website} />
                    </div>
                  }
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default MembersPage;