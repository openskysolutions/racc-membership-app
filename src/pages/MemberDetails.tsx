import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, Calendar, Shield, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import type { Member } from '@/types/member';

const MemberDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    if (!id) {
      setError('No member ID provided');
      setLoading(false);
      return;
    }

    const fetchMember = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/members/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Member not found');
          } else {
            throw new Error(`Failed to fetch member: ${response.statusText}`);
          }
          return;
        }
        
        const memberData: Member = await response.json();
        setMember(memberData);
      } catch (err) {
        console.error('Error fetching member:', err);
        setError(err instanceof Error ? err.message : 'Failed to load member details');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id, isAuthenticated, navigate]);

  const formatMemberName = (member: Member) => {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    return fullName || member.email;
  };

  const getInitials = (member: Member) => {
    if (member.businessName) {
      return member.businessName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    const firstName = member.firstName?.charAt(0) || '';
    const lastName = member.lastName?.charAt(0) || '';
    return (firstName + lastName).toUpperCase() || member.email.charAt(0).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderator': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'moderator': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const isOwnProfile = user?.id === member?.id;

  if (loading) {
    return (
      <div className="container flex flex-grow py-8 px-3 md:px-6 w-full h-full">
        <div className="flex w-full items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="container py-8 px-3 md:px-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Member not found'}</p>
              <Button onClick={() => navigate('/members')}>
                Back to Members
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 px-3 md:px-6">
      {/* Header */}
      <div className="mb-0">
        <Button
          variant="ghost"
          onClick={() => navigate('/members')}
          className="mb-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-20 w-20">
                  {member.avatar ? (
                    <AvatarImage src={member.avatar} alt={formatMemberName(member)} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                      {getInitials(member)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">
                    {member.businessName || formatMemberName(member)}
                  </CardTitle>
                  
                  {member.businessName && (
                    <p className="text-lg text-muted-foreground mb-2">
                      {formatMemberName(member)}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`${getRoleColor(member.role)} flex items-center gap-1`}>
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                    
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Badge>
                    
                    {isOwnProfile && (
                      <Badge variant="secondary">Your Profile</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Bio */}
              {member.bio && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    About
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{member.bio}</p>
                </div>
              )}
              
              {/* Specialties */}
                            {/* member.specialties && member.specialties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Specialties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {member.specialties.map(specialty => (
                      <Badge key={specialty} variant="secondary" className="mr-2 mb-2">
                        {specialty}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              ) */}
            </CardContent>
          </Card>
        </div>

        {/* Contact & Info Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${member.email}`}
                  className="text-primary hover:underline flex-1 truncate"
                >
                  {member.email}
                </a>
              </div>
              
              {member.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${member.phone}`}
                    className="text-primary hover:underline"
                  >
                    {member.phone}
                  </a>
                </div>
              )}
              
              {member.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={member.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex-1 truncate"
                  >
                    {member.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              
              {/* member.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{member.address.street}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.address.city}, {member.address.state} {member.address.zipCode}
                    </p>
                  </div>
                </div>
              ) */}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Membership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {/* formatMemberSince(member.memberSince) */}
                    {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsPage;