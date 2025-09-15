import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getContactById } from '@/services/members';
import type { Member } from '@/types/member';
import { FiUser, FiGlobe, FiMail, FiPhone, FiCheckCircle } from 'react-icons/fi';
import { GrDocumentUser } from 'react-icons/gr';
import { PhoneNumber } from '@/components/ui/phone-number';
import { Url } from '@/components/ui/url';

const MemberDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fullName = `${member?.firstName || ''} ${member?.lastName || ''}`.trim();

  useEffect(() => {
    if (!slug) {
      setError('Member id is missing.');
      setLoading(false);
      return;
    }
    console.log('Fetching details for member slug:', slug);

    const fetchData = async () => {
      try {
        const [m] = await Promise.all([
          getContactById(slug || ''),
          // getMemberBySlug(slug),
          // getMemberPosts(slug),
          // getMemberEvents(slug)
        ]);
        setMember(m as Member);
        // setPosts(p);
        // setEvents(e);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) return <section className="container py-20">Loading member...</section>;
  if (error) return <section className="container py-20">Error: {error}</section>;
  if (!member) return <section className="container py-20">Member not found.</section>;

  return (
    <div className="py-10 px-4 mx-auto max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left column: Member details and Upcoming Events */}
        <div className="space-y-8 md:col-span-2">
          {/* Member Info */}
          <Card>
            <CardHeader className="flex flex-row space-x-4 gap-4">
              <Avatar className='size-16'>
                {member.avatar ? (
                  <AvatarImage src={member.profilePhoto} alt={fullName} />
                ) : (
                  <AvatarFallback className='bg-neutral-250 text-muted-foreground'>
                    {
                      // Initials of member.businessName
                      member.companyName ? member.companyName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() :
                      (member.firstName?.charAt(0) || '' + member.lastName?.charAt(0) || '').toUpperCase()
                    }
                  </AvatarFallback>
                )}
              </Avatar>
              <CardTitle className='flex flex-col !ml-0'>
                {member.companyName}
                {/* {fullName &&
                  <span className="flex flex-row items-center text-sm text-muted-foreground">Contact: {fullName}</span>
                } */}
              </CardTitle>
            </CardHeader>
            <CardContent>
                  {fullName &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <FiUser /><span className='block font-semibold min-w-20'> Contact: </span>
                      {fullName || ''}
                    </div>
                  }
                  {member.tags[0] &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <FiCheckCircle /><span className='font-semibold min-w-20'> Status: </span>
                      {member.tags[0]}
                    </div>
                  }
                  {member.phone &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <FiPhone /><span className='font-semibold min-w-20'> Phone:  </span>
                      <PhoneNumber phone={member.phone || ''} />
                    </div>
                  }
                  {member.email &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <FiMail /><span className='font-semibold min-w-20'> Email: </span>
                      {member.email || ''}
                    </div>
                  }
                  {member.website &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <FiGlobe /><span className='font-semibold min-w-20'> Website: </span>
                      <Url url={member.website} />
                    </div>
                  }
                  {member.website &&
                    <div className='flex flex-row items-center space-x-2 gap-2'>
                      <GrDocumentUser /><span className='font-semibold min-w-20'> Bio: </span>
                      <Url url={member.bio} />
                    </div>
                  }
            </CardContent>
          </Card>
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length ? (
                <ul className="list-disc list-inside">
                  {events.map((evt, i) => (
                    <li key={i}>{evt.name || JSON.stringify(evt)}</li>
                  ))}
                </ul>
              ) : (
                <p>No events scheduled.</p>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Right column: Recent Posts */}
        <div className="space-y-8 md:col-span-3">
          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {posts.length ? (
                <ul className="list-disc list-inside">
                  {posts.map((post, i) => (
                    <li key={i}>{post.title || JSON.stringify(post)}</li>
                  ))}
                </ul>
              ) : (
                <p>No posts found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsPage;