import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, Calendar, Shield, User, Edit, Save, X, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { capitalizeFirst } from '@/lib/utils';
import { api } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import type { Member } from '@/types/member';
import AvatarUpload from '@/components/AvatarUpload';

interface MemberFormData {
  firstName: string;
  lastName: string;
  businessName: string;
  companyName: string;
  phone: string;
  website: string;
  bio: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

const MemberDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState<MemberFormData>({
    firstName: '',
    lastName: '',
    businessName: '',
    companyName: '',
    phone: '',
    website: '',
    bio: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debug user data
  console.log('🔍 User data in MemberDetails:', {
    userExists: !!user,
    userId: user?.id,
    userGhlContactId: user?.ghlContactId,
    userRole: user?.role,
    userEmail: user?.email
  });

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
        console.log('🔍 Fetched member data:', {
          id: memberData.id,
          contactId: memberData.contactId,
          email: memberData.email,
          fullName: memberData.fullName
        });
        setMember(memberData);
        
        // Initialize form data
        setFormData({
          firstName: memberData.firstName || '',
          lastName: memberData.lastName || '',
          businessName: memberData.businessName || '',
          companyName: memberData.companyName || '',
          phone: memberData.phone || '',
          website: memberData.website || '',
          bio: memberData.bio || '',
          email: memberData.email || '',
          address: {
            street: memberData.address?.street || '',
            city: memberData.address?.city || '',
            state: memberData.address?.state || '',
            zipCode: memberData.address?.zipCode || ''
          }
        });
      } catch (err) {
        console.error('Error fetching member:', err);
        setError(err instanceof Error ? err.message : 'Failed to load member details');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

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

  const canEdit = user && member && (user.ghlContactId === member.id || user.role === 'admin');

  // Debug logging for authorization
  console.log('🔍 MemberDetails Authorization Debug:', {
    userExists: !!user,
    memberExists: !!member,
    userGhlContactId: user?.ghlContactId,
    memberContactId: member?.contactId,
    userRole: user?.role,
    idsMatch: user?.ghlContactId === member?.contactId,
    isAdmin: user?.role === 'admin',
    canEdit
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!member) return;

    setUpdating(true);
    setMessage(null);

    try {
      const response = await api.put(`/members/${member.id}`, formData);
      
      if (!response.ok) {
        throw new Error(`Failed to update member: ${response.statusText}`);
      }
      
      const updatedMember: Member = await response.json();
      setMember(updatedMember);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error('Error updating member:', err);
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to update profile' 
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        businessName: member.businessName || '',
        companyName: member.companyName || '',
        phone: member.phone || '',
        website: member.website || '',
        bio: member.bio || '',
        email: member.email || '',
        address: {
          street: member.address?.street || '',
          city: member.address?.city || '',
          state: member.address?.state || '',
          zipCode: member.address?.zipCode || ''
        }
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

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
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/members')}
          className="mb-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
        
        {canEdit && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
        
        {isEditing && (
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={updating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {updating ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={updating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Responsive Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Left Column - Map & Address (1/3 on large screens, stacks on smaller) */}
        <div className="lg:order-1 order-2 space-y-6">
          {/* Address Card */}
          {(member.address?.street || member.address?.city || member.address?.state || member.address?.zipCode) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {member.address?.street && (
                  <p className="text-sm text-muted-foreground">{member.address.street}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {[member.address?.city, member.address?.state, member.address?.zipCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {(member.address?.street || member.address?.city) && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const address = [
                          member.address?.street,
                          member.address?.city,
                          member.address?.state,
                          member.address?.zipCode
                        ].filter(Boolean).join(', ');
                        window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Maps
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Embedded Map */}
          {(member.address?.street || member.address?.city) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full h-64 bg-muted rounded-b-lg overflow-hidden">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent([
                      member.address?.street,
                      member.address?.city,
                      member.address?.state,
                      member.address?.zipCode
                    ].filter(Boolean).join(', '))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Member Location"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Main Member Information (2/3 on large screens, stacks on smaller) */}
        <div className="lg:col-span-2 lg:order-2 order-1">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {canEdit && isEditing 
              ? <AvatarUpload
                  contactId={member?.id || ''}
                  currentAvatar={member?.avatar}
                  fallbackText={getInitials(member || {} as Member)}
                  onAvatarUpdated={(newAvatarUrl: string) => {
                    if (member) {
                      setMember({ ...member, avatar: newAvatarUrl });
                    }
                  }}
                />
              : <Avatar className="h-20 w-20">
                  {member.avatar ? (
                    <AvatarImage src={member.avatar} alt={formatMemberName(member)} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                      {getInitials(member)}
                    </AvatarFallback>
                  )}
                </Avatar>
            }
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
                
                {user?.id === member.id && (
                  <Badge variant="secondary">Your Profile</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    First Name *
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                    Last Name *
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium mb-1">
                  Business Name
                </label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium mb-1">
                  Bio / About
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleFormChange}
                  placeholder="Tell us about yourself or your business..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium mb-1">
                    Company Name
                  </label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium mb-1">
                    Website
                  </label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleFormChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Address Information</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address.street" className="block text-sm font-medium mb-1">
                      Street Address
                    </label>
                    <Input
                      id="address.street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleFormChange}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="address.city" className="block text-sm font-medium mb-1">
                        City
                      </label>
                      <Input
                        id="address.city"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleFormChange}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label htmlFor="address.state" className="block text-sm font-medium mb-1">
                        State
                      </label>
                      <Input
                        id="address.state"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleFormChange}
                        placeholder="UT"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label htmlFor="address.zipCode" className="block text-sm font-medium mb-1">
                        ZIP Code
                      </label>
                      <Input
                        id="address.zipCode"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleFormChange}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:ml-24">
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

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Membership Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Membership
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-muted-foreground">
                        {member.memberSince ? new Date(member.memberSince).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Membership Tier</p>
                      <p className="text-sm text-muted-foreground">
                        {capitalizeFirst((member as any).membershipTier || 'Standard')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsPage;