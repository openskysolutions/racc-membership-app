import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { UpdateProfileRequest } from '@/services/profile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { capitalizeFirst } from '@/lib/utils';
import { Mail, Phone, Globe, Calendar, Shield, User, Edit, Save, X } from 'lucide-react';
import { api } from '@/services/apiClient';
import type { Member } from '@/types/member';
import AvatarUpload from '@/components/AvatarUpload';
import { CouponCodesInput } from '@/components/ui/coupon-codes-input';
import { toast } from 'sonner';

interface ExtendedUpdateProfileRequest extends UpdateProfileRequest {
  bio?: string;
  tagline?: string;
  companyName?: string;
  email?: string;
  coverImage?: string;
  couponCodes?: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [profile, setProfile] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ExtendedUpdateProfileRequest>({
    firstName: '',
    lastName: '',
    businessName: '',
    companyName: '',
    phone: '',
    website: '',
    bio: '',
    tagline: '',
    email: '',
    coverImage: '',
    couponCodes: [],
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Use the members API to get full profile data using GoHighLevel contact ID
        const response = await api.get(`/members/${user.ghlContactId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        
        const profileData = await response.json();
        setProfile(profileData);
        setFormData({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          businessName: profileData.businessName || '',
          companyName: profileData.companyName || '',
          phone: profileData.phone || '',
          website: profileData.website || '',
          bio: profileData.bio || '',
          tagline: profileData.tagline || '',
          email: profileData.email || '',
          coverImage: profileData.coverImage || '',
          couponCodes: profileData.couponCodes || [],
          address: {
            street: profileData.address?.street || '',
            city: profileData.address?.city || '',
            state: profileData.address?.state || '',
            zipCode: profileData.address?.zipCode || ''
          }
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address!,
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

  const handleCouponCodesChange = (codes: string[]) => {
    setFormData(prev => ({
      ...prev,
      couponCodes: codes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.ghlContactId) return;

    setUpdating(true);

    try {
      console.log('Submitting profile update with data:', formData);
      const response = await api.put(`/members/${user.ghlContactId}`, formData);
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        businessName: profile.businessName || '',
        companyName: profile.companyName || '',
        phone: profile.phone || '',
        website: profile.website || '',
        bio: (profile as any).bio || '',
        tagline: (profile as any).tagline || '',
        email: profile.email || '',
        coverImage: (profile as any).coverImage || '',
        couponCodes: (profile as any).couponCodes || [],
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          zipCode: profile.address?.zipCode || ''
        }
      });
    }
    setIsEditing(false);
  };

  const formatMemberName = (profile: Member) => {
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    return fullName || profile.email;
  };

  const getInitials = (profile: Member) => {
    if (profile.businessName) {
      return profile.businessName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
    }
    const firstName = profile.firstName?.charAt(0) || '';
    const lastName = profile.lastName?.charAt(0) || '';
    return (firstName + lastName).toUpperCase() || profile.email.charAt(0).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-neutral-200 text-neutral-800 border-neutral-400';
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

  if (loading) {
    return (
      <div className="container flex flex-grow py-8 px-3 md:px-6 w-full h-full">
        <div className="flex w-full items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-3 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-start mb-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        
      </div>

      {/* Single Card with All Information */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader className='flex items-start flex-wrap flex-row justify-between md:items-start gap-4'>
          <div className="flex flex-row sm:flex-row items-start sm:items-center gap-6 pl-2">
            {isEditing 
              ? <AvatarUpload
                  contactId={profile?.id || ''}
                  currentAvatar={profile?.avatar}
                  fallbackText={getInitials(profile || {} as Member)}
                  onAvatarUpdated={(newAvatarUrl: string) => {
                    if (profile) {
                      setProfile({ ...profile, avatar: newAvatarUrl });
                    }
                  }}
                />
              : <Avatar className="h-20 w-20">
                  {profile?.avatar ? (
                    <AvatarImage src={profile.avatar} alt={formatMemberName(profile)} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                      {getInitials(profile || {} as Member)}
                    </AvatarFallback>
                  )}
                </Avatar>
            }
            
            <div className="flex-1">
              <CardTitle className="text-2xl mb-0 sm:text-nowrap">
                {profile?.businessName || (profile ? formatMemberName(profile) : 'Your Profile')}
              </CardTitle>
              
              {profile?.businessName && (
                <p className="text-lg text-muted-foreground mb-2">
                  {formatMemberName(profile)}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {(profile?.status || 'active').charAt(0).toUpperCase() + (profile?.status || 'active').slice(1)}
                </Badge>
                <Badge className={`${getRoleColor(profile?.role || 'member')} flex items-center gap-1`}>
                  {getRoleIcon(profile?.role || 'member')}
                  {(profile?.role || 'member').charAt(0).toUpperCase() + (profile?.role || 'member').slice(1)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-end gap-1 !mt-0 ml-auto">
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updating}
                  className='text-muted-foreground hover:text-muted-foreground hover:bg-muted-foreground/10 h-8 p-2 border-muted-foreground/30'
                >
                  <X className="h-7 w-7" />
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={updating}
                  variant='outline'
                  className="text-green-600 hover:text-green-600 hover:bg-green-700/10 h-8 p-2 border-muted-foreground/30"
                >
                  {updating ? '...' : <Save className="h-4 w-4" />}
                </Button>
              </>
            )}
            {!isEditing && (
              <Button 
              variant='outline'
              className="text-highlight-foreground hover:text-highlight hover:bg-highlight-foreground/10 h-8 p-2 border-highlight-foreground/30"
              onClick={() => setIsEditing(true)} 
              >
                <Edit className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    First Name *
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    required
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
                  onChange={handleChange}
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
                  value={formData.tagline || ''}
                  onChange={handleChange}
                  placeholder="A short catchphrase or slogan..."
                />
              </div>

              <div>
                <label htmlFor="coupon_codes" className="block text-sm font-medium mb-1">
                  Coupon Codes
                </label>
                <CouponCodesInput
                  id="coupon_codes"
                  name="coupon_codes"
                  value={formData.couponCodes || []}
                  onChange={handleCouponCodesChange}
                  placeholder="Add coupon codes..."
                />
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    value={formData.address?.street || ''}
                    onChange={handleChange}
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
                    value={formData.address?.city || ''}
                    onChange={handleChange}
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
                    value={formData.address?.state || ''}
                    onChange={handleChange}
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
                    value={formData.address?.zipCode || ''}
                    onChange={handleChange}
                    placeholder="12345"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Bio */}
              {(profile as any)?.bio && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    About
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{(profile as any).bio}</p>
                </div>
              )}

              {/* Tagline */}
              {(profile as any)?.tagline && (
                <div>
                  <h3 className="font-semibold mb-2">Tagline</h3>
                  <p className="text-muted-foreground italic">"{(profile as any).tagline}"</p>
                </div>
              )}

              {/* Coupon Codes */}
              {(profile as any)?.couponCodes && (profile as any).couponCodes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Coupon Codes</h3>
                  <div className="flex flex-wrap gap-2">
                    {(profile as any).couponCodes.map((code: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {code}
                      </Badge>
                    ))}
                  </div>
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
                      href={`mailto:${profile?.email}`}
                      className="text-primary hover:underline flex-1 truncate"
                    >
                      {profile?.email}
                    </a>
                  </div>
                  
                  {profile?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${profile.phone}`}
                        className="text-primary hover:underline"
                      >
                        {profile.phone}
                      </a>
                    </div>
                  )}
                  
                  {profile?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex-1 truncate"
                      >
                        {profile.website.replace(/^https?:\/\//, '')}
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
                        {profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Membership Tier</p>
                      <p className="text-sm text-muted-foreground">
                        {capitalizeFirst((profile as any)?.membershipTier || 'Standard')}
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
  );
};

export default ProfilePage;