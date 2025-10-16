import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, Calendar, Shield, User, Edit, Save, X, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CouponCodesInput } from '@/components/ui/coupon-codes-input';
import { toast } from 'sonner';
import { capitalizeFirst } from '@/lib/utils';
import { api } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import type { Member } from '@/types/member';
import AvatarUpload from '@/components/AvatarUpload';
import CoverImageUpload from '@/components/CoverImageUpload';

interface MemberFormData {
  firstName: string;
  lastName: string;
  businessName: string;
  companyName: string;
  phone: string;
  website: string;
  bio: string;
  tagline: string;
  coupon_codes: string;
  coverImage: string;
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
  const fetchingRef = useRef(false);

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
    tagline: '',
    coupon_codes: '',
    coverImage: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  useEffect(() => {
    if (!id) {
      setError('No member ID provided');
      setLoading(false);
      return;
    }

    // Prevent double fetching in StrictMode
    if (fetchingRef.current) {
      return;
    }

    const fetchMember = async () => {
      try {
        fetchingRef.current = true;
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

        // Initialize form data
        setFormData({
          firstName: memberData.firstName || '',
          lastName: memberData.lastName || '',
          businessName: memberData.businessName || '',
          companyName: memberData.companyName || '',
          phone: memberData.phone || '',
          website: memberData.website || '',
          bio: memberData.bio || '',
          tagline: (memberData as any).tagline || '',
          coupon_codes: JSON.stringify((memberData as any).couponCodes || []),
          coverImage: memberData.coverImage || '',
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

    // Cleanup function to reset the ref when component unmounts or id changes
    return () => {
      fetchingRef.current = false;
    };
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

  const handleCouponCodesChange = (tags: string[]) => {
    setFormData(prev => ({
      ...prev,
      coupon_codes: JSON.stringify(tags)
    }));
  };

  const getCouponCodesArray = (): string[] => {
    try {
      return formData.coupon_codes ? JSON.parse(formData.coupon_codes) : [];
    } catch {
      return [];
    }
  };

  const handleSave = async () => {
    if (!member) return;

    setUpdating(true);

    try {
      console.log('🔍 Form data being submitted:', formData);
      const response = await api.put(`/members/${member.id}`, formData);

      if (!response.ok) {
        throw new Error(`Failed to update member: ${response.statusText}`);
      }

      const updatedMember: Member = await response.json();
      setMember(updatedMember);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating member:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
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
        tagline: (member as any).tagline || '',
        coupon_codes: JSON.stringify((member as any).couponCodes || []),
        coverImage: member.coverImage || '',
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
    <div className="container pt-0 pb-8 px-3 md:px-6 relative">
      {/* Header */}
      <div className="flex h-10 items-center justify-between mb-6 z-35 shadow-md fixed left-0 right-0 w-full bg-card/70 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/members')}
          className="mb-0 h-8 w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>

        {canEdit && !isEditing && (
          <Button 
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="px-3 h-8 w-8 text-highlight-foreground hover:text-highlight-foreground hover:bg-highlight-foreground/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {isEditing && (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={updating}
              variant='ghost'
              className="text-green-600 hover:text-green-600 hover:bg-green-700/10 px-3"
            >
              {updating ? '...' : <Save className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={updating}
              className='text-muted-foreground hover:text-muted-foreground hover:bg-muted-foreground/10 px-3'
            >
              <X className="h-7 w-7 " />
            </Button>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div 
        className="absolute h-80 md:h-[400px] bg-cover bg-center bg-no-repeat pt-10 pb-8 px-8 -mx-8 left-0 right-0 top-0 z-20"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${member.coverImage}')`,
        }}
      >
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-card">{member.businessName}</h1>
            <p className="text-lg md:text-xl mb-6 max-w-2xl">
              {(member as any).tagline || "Professional member of the Richfield Area Chamber of Commerce"}
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Layout Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto z-30 mt-84">
        {/* Left Column - Address & Location (1/3 on large screens, stacks on smaller) */}
        <div className="lg:order-1 order-2 space-y-6">
          {/* Combined Address & Location Card */}
          {(member.address?.street || member.address?.city || member.address?.state || member.address?.zipCode) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Address & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address Information */}
                <div className="space-y-2">
                  {member.address?.street && (
                    <p className="text-sm text-muted-foreground">{member.address.street}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {[member.address?.city, member.address?.state, member.address?.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>

                {/* Embedded Map */}
                {(member.address?.street || member.address?.city) && (
                  <div className="w-full h-64 bg-muted rounded-lg overflow-hidden border">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent([
                        member.address?.street,
                        member.address?.city,
                        member.address?.state,
                        member.address?.zipCode
                      ].filter(Boolean).join(', '))}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Member Location"
                    />
                  </div>
                )}
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
                
                {/* Cover Image Upload - Only show when editing */}
                {canEdit && isEditing && (
                  <div className="flex-shrink-0">
                    <CoverImageUpload
                      contactId={member?.id || ''}
                      fallbackText={''}
                      currentCoverImage={member?.coverImage}
                      onCoverImageUpdated={(newCoverImageUrl: string) => {
                        if (member) {
                          setMember({ ...member, coverImage: newCoverImageUrl });
                          setFormData(prev => ({ ...prev, coverImage: newCoverImageUrl }));
                        }
                      }}                     
                    />
                  </div>
                )}
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

                  <div>
                    <label htmlFor="tagline" className="block text-sm font-medium mb-1">
                      Tagline
                    </label>
                    <Input
                      id="tagline"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleFormChange}
                      placeholder="A short description that appears on your profile..."
                    />
                  </div>

                  <div>
                    <label htmlFor="couponCodes" className="block text-sm font-medium mb-1">
                      Coupon Codes
                    </label>
                    <CouponCodesInput
                      id="couponCodes"
                      name="couponCodes"
                      value={getCouponCodesArray()}
                      onChange={handleCouponCodesChange}
                      placeholder="Add a coupon code..."
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Press Enter or comma to add a coupon code. Click X to remove.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <h3 className="font-semibold mb-3">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Coupon Codes */}
                  {(member as any).coupon_codes && (() => {
                    try {
                      const codes = JSON.parse((member as any).coupon_codes);
                      return codes.length > 0 ? (
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            Special Offers
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {codes.map((code: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-sm">
                                {code}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    } catch {
                      return null;
                    }
                  })()}

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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsPage;