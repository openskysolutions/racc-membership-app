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
  // Flat address fields to match backend
  address1: string;
  city: string;
  state: string;
  postalCode: string;
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
    // Flat address fields
    address1: '',
    city: '',
    state: '',
    postalCode: ''
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

        console.log('Member data:', memberData);
        console.log('Member tags:', memberData.tags);
        console.log('Tags type:', typeof memberData.tags);
        console.log('Tags is array:', Array.isArray(memberData.tags));

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
          // Flat address fields
          address1: memberData.address1 || '',
          city: memberData.city || '',
          state: memberData.state || '',
          postalCode: memberData.postalCode || ''
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
      case 'board_member': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'member': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'moderator': return <User className="h-4 w-4" />;
      case 'board_member': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const canEdit = user && member && (user.ghlContactId === member.id || user.role === 'admin');

  // Check if member has Enhanced or Elite membership (case-insensitive and includes partial matches)
  const hasEnhancedOrElite = member && member.tags && (
    member.tags.some(tag => tag.toLowerCase().includes('enhanced')) || 
    member.tags.some(tag => tag.toLowerCase().includes('elite')) ||
    member.tags.some(tag => tag.toLowerCase() === 'admin')
  );

  console.log('hasEnhancedOrElite:', hasEnhancedOrElite);
  console.log('member?.tags:', member?.tags);

  // Check if member has Elite membership only (case-insensitive and includes partial matches)
  const hasElite = member && member.tags && (
    member.tags.some(tag => tag.toLowerCase().includes('elite')) ||
    member.tags.some(tag => tag.toLowerCase() === 'admin')
  );

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      // Send form data with flat address fields
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
        // Flat address fields
        address1: member.address1 || '',
        city: member.city || '',
        state: member.state || '',
        postalCode: member.postalCode || ''
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
    <>
      {/* Header */}
      <div className="flex h-10 items-center justify-between mb-6 z-35 shadow-md fixed top-20 md:top-30 w-screen bg-card/70 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/members')}
          className="mb-0 h-8 w-auto hover:bg-muted-foreground/20 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
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
        className="absolute h-80 w-screen md:h-[400px] bg-cover bg-center bg-no-repeat pt-10 pb-8 px-8 top-20 md:top-30 z-20"
        style={{
          backgroundImage: (member.tags?.includes('elite') || member.tags?.includes('admin')) && member.coverImage 
            ? `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${member.coverImage}')`
            : 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))',
        }}
      >
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-card dark:text-neutral-50">{member.businessName}</h1>
            <p className="text-lg md:text-xl mb-6 max-w-2xl">
              {(member as any).tagline || "Professional member of the Richfield Area Chamber of Commerce"}
            </p>
          </div>
        </div>
      </div>

      <div className="container pt-0 pb-8 px-3 md:px-6 relative">
        {/* Responsive Layout Grid */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto z-30 mt-68 md:mt-84">
          {/* Left Column - Address & Location (1/3 on large screens, stacks on smaller) */}
          <div className="lg:order-1 order-2 space-y-6">
            {/* Combined Address & Location Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Information */}
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-1">
                      {user && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${member.email}`}
                            className="text-primary hover:underline flex-1 truncate"
                          >
                            {member.email}
                          </a>
                        </div>
                      )}

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

                      {/* Website - Enhanced/Elite Only */}
                      {hasEnhancedOrElite && member.website && (
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
                  
                  {/* Address Information - Always show if available */}
                  {(member.address1 || member.city || member.state || member.postalCode) && (
                    <>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        Address & Location
                      </h3>
                      <div className="space-y-2">
                        {member.address1 && (
                          <p className="text-sm text-muted-foreground">{member.address1}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {[member.city, member.state, member.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>

                      {/* Embedded Map - Enhanced/Elite Only */}
                      {hasEnhancedOrElite && (
                        <>
                          <div className="w-full h-64 bg-muted rounded-lg overflow-hidden border">
                            <iframe
                              src={`https://maps.google.com/maps?q=${encodeURIComponent([
                                member.address1,
                                member.city,
                                member.state,
                                member.postalCode
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              const address = [
                                member.address1,
                                member.city,
                                member.state,
                                member.postalCode
                              ].filter(Boolean).join(', ');
                              window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on Maps
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
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

                  {/* Cover Image Upload - Elite Only */}
                  {canEdit && isEditing && hasElite && (
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

                    {/* Enhanced/Elite Only Fields */}
                    {hasEnhancedOrElite && (
                      <>
                        <div>
                          <label htmlFor="bio" className="block text-sm font-medium mb-1">
                            Bio / About
                            <span className="text-xs text-muted-foreground ml-2">(Enhanced/Elite only)</span>
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
                          <label htmlFor="website" className="block text-sm font-medium mb-1">
                            Website
                            <span className="text-xs text-muted-foreground ml-2">(Enhanced/Elite only)</span>
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

                        <h3 className="font-semibold mb-3">
                          Address Information
                          <span className="text-xs text-muted-foreground ml-2 font-normal">(Enhanced/Elite only)</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="address1" className="block text-sm font-medium mb-1">
                              Street Address
                            </label>
                            <Input
                              id="address1"
                              name="address1"
                              value={formData.address1}
                              onChange={handleFormChange}
                              placeholder="123 Main Street"
                            />
                          </div>
                          <div>
                            <label htmlFor="city" className="block text-sm font-medium mb-1">
                              City
                            </label>
                            <Input
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleFormChange}
                              placeholder="City"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="state" className="block text-sm font-medium mb-1">
                              State
                            </label>
                            <Input
                              id="state"
                              name="state"
                              value={formData.state}
                              onChange={handleFormChange}
                              placeholder="UT"
                              maxLength={2}
                            />
                          </div>
                          <div>
                            <label htmlFor="postalCode" className="block text-sm font-medium mb-1">
                              ZIP Code
                            </label>
                            <Input
                              id="postalCode"
                              name="postalCode"
                              value={formData.postalCode}
                              onChange={handleFormChange}
                              placeholder="12345"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Coupon Codes - Elite Only */}
                    {hasElite && (
                      <div>
                        <label htmlFor="couponCodes" className="block text-sm font-medium mb-1">
                          Coupon Codes
                          <span className="text-xs text-muted-foreground ml-2">(Elite only)</span>
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
                    )}

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
                  </div>
                ) : (
                  <div className="space-y-6 sm:ml-24">
                    {/* Bio - Enhanced/Elite Only */}
                    {hasEnhancedOrElite && member.bio && (
                      <div>
                        <p className="text-muted-foreground leading-relaxed">{member.bio}</p>
                      </div>
                    )}

                    {/* Coupon Codes - Elite Only */}
                    {hasElite && (member as any).coupon_codes && (() => {
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

                    {/* Membership Information */}
                    <h3 className="font-semibold mb-0 flex items-center gap-2">
                      Membership
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 !mt-2">
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
    </>
  );
};

export default MemberDetailsPage;