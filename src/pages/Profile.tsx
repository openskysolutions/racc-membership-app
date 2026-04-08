import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { UpdateProfileRequest } from '@/services/profile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { capitalizeFirst } from '@/lib/utils';
import { Mail, Phone, Globe, Calendar, Shield, User, Edit, Save, X, AlertTriangle, Lock, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { api } from '@/services/apiClient';
import type { Member } from '@/types/member';
import AvatarUpload from '@/components/AvatarUpload';
import { CouponCodesInput } from '@/components/ui/coupon-codes-input';
import { PasswordInput } from '@/components/ui/password-input';
import { toast } from 'sonner';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';

interface ExtendedUpdateProfileRequest extends UpdateProfileRequest {
  bio?: string;
  tagline?: string;
  companyName?: string;
  email?: string;
  coverImage?: string;
  couponCodes?: string[];
  // Flat address fields to match backend
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  // Social media links
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
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
    // Flat address fields
    address1: '',
    city: '',
    state: '',
    postalCode: '',
    // Social media links
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [membershipExpired, setMembershipExpired] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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
          // Check if it's a membership expired error
          if (response.status === 403) {
            const errorData = await response.json();
            if (errorData.error === 'membership_expired') {
              setMembershipExpired(true);
              setLoading(false);
              return;
            }
          }
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
          // Flat address fields
          address1: profileData.address1 || '',
          city: profileData.city || '',
          state: profileData.state || '',
          postalCode: profileData.postalCode || '',
          // Social media links
          facebookUrl: profileData.facebookUrl || '',
          instagramUrl: profileData.instagramUrl || '',
          twitterUrl: profileData.twitterUrl || '',
          linkedinUrl: profileData.linkedinUrl || ''
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
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
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
        // Flat address fields
        address1: profile.address1 || '',
        city: profile.city || '',
        state: profile.state || '',
        postalCode: profile.postalCode || '',
        // Social media links
        facebookUrl: (profile as any).facebookUrl || '',
        instagramUrl: (profile as any).instagramUrl || '',
        twitterUrl: (profile as any).twitterUrl || '',
        linkedinUrl: (profile as any).linkedinUrl || ''
      });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
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

  // Show membership expired message
  if (membershipExpired) {
    return (
      <div className="container py-8 px-3 md:px-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Profile Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-highlight-foreground/30 dark:border-highlight-foreground/30 rounded-md">
                <p className="text-sm text-highlight-foreground dark:text-highlight-foreground mb-3 font-medium">
                  Your Richfield Area Chamber of Commerce membership is past its expiration.
                </p>
                <div className="flex flex-col justify-between gap-2">
                  <Button 
                    onClick={() => window.location.href = '/join'}
                    className="bg-highlight-foreground hover:bg-highlight-foreground/90"
                  >
                    Renew Now
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/contact'}
                    variant="ghost"
                    className="text-highlight-foreground hover:text-highlight-foreground dark:text-highlight-foreground hover:bg-highlight-foreground/10 dark:hover:bg-highlight-foreground/10"
                  >
                    or Contact us here to renew your membership
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If no profile data after loading, show error
  if (!profile) {
    return (
      <div className="container py-8 px-3 md:px-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Profile Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Unable to load profile information. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
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
            {!isEditing && (
              <Button
                variant="default"
                onClick={() => setIsEditing(true)}
                className="px-3 h-8"
              >
                Edit Profile
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {isEditing && (
              <div className="flex gap-2 items-center">
                <Button
                  onClick={handleSubmit}
                  disabled={updating}
                  variant='default'
                  className="h-7 p-1 px-2"
                >
                  Save
                  {updating ? '...' : <Save className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updating}
                  className='text-muted-foreground hover:text-muted-foreground bg-transparent hover:bg-muted-foreground/10 h-7 p-1 px-2'
                >
                  Cancel
                  <X className="h-7 w-7" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-10">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
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

              <h3 className="font-semibold mb-1">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="facebookUrl" className="flex items-center gap-1 text-sm font-medium mb-1">
                    <Facebook className="h-3.5 w-3.5" /> Facebook
                  </label>
                  <Input
                    id="facebookUrl"
                    name="facebookUrl"
                    type="url"
                    value={formData.facebookUrl || ''}
                    onChange={handleChange}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label htmlFor="instagramUrl" className="flex items-center gap-1 text-sm font-medium mb-1">
                    <Instagram className="h-3.5 w-3.5" /> Instagram
                  </label>
                  <Input
                    id="instagramUrl"
                    name="instagramUrl"
                    type="url"
                    value={formData.instagramUrl || ''}
                    onChange={handleChange}
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                <div>
                  <label htmlFor="twitterUrl" className="flex items-center gap-1 text-sm font-medium mb-1">
                    <Twitter className="h-3.5 w-3.5" /> X / Twitter
                  </label>
                  <Input
                    id="twitterUrl"
                    name="twitterUrl"
                    type="url"
                    value={formData.twitterUrl || ''}
                    onChange={handleChange}
                    placeholder="https://x.com/yourhandle"
                  />
                </div>
                <div>
                  <label htmlFor="linkedinUrl" className="flex items-center gap-1 text-sm font-medium mb-1">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    value={formData.linkedinUrl || ''}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              <h3 className="font-semibold mb-3">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address1" className="block text-sm font-medium mb-1">
                    Street Address
                  </label>
                  <Input
                    id="address1"
                    name="address1"
                    value={formData.address1 || ''}
                    onChange={handleChange}
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
                    value={formData.city || ''}
                    onChange={handleChange}
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
                    value={formData.state || ''}
                    onChange={handleChange}
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
                    value={formData.postalCode || ''}
                    onChange={handleChange}
                    placeholder="12345"
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={updating}
                variant='default'
                className='self-center w-1/2 sm:w-1/3'
              >
                Update Profile
                {updating ? '...' : <Save className="h-4 w-4" />}
              </Button>
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

                  {/* Social Media Links */}
                  {(profile as any)?.facebookUrl && (
                    <div className="flex items-center gap-3">
                      <Facebook className="h-4 w-4 text-muted-foreground" />
                      <a href={(profile as any).facebookUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-1 truncate">
                        Facebook
                      </a>
                    </div>
                  )}
                  {(profile as any)?.instagramUrl && (
                    <div className="flex items-center gap-3">
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                      <a href={(profile as any).instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-1 truncate">
                        Instagram
                      </a>
                    </div>
                  )}
                  {(profile as any)?.twitterUrl && (
                    <div className="flex items-center gap-3">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                      <a href={(profile as any).twitterUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-1 truncate">
                        X / Twitter
                      </a>
                    </div>
                  )}
                  {(profile as any)?.linkedinUrl && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <a href={(profile as any).linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-1 truncate">
                        LinkedIn
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

      {/* Security Settings - Change Password */}
      {isEditing && (
        <Card className="max-w-4xl mx-auto mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                      Current Password
                    </label>
                    <PasswordInput
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      required
                      disabled={changingPassword}
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                      New Password
                    </label>
                    <PasswordInput
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      required
                      disabled={changingPassword}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                      Confirm New Password
                    </label>
                    <PasswordInput
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      required
                      disabled={changingPassword}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="bg-highlight-foreground hover:bg-highlight-foreground/90"
                  >
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone - Delete Account */}
      {isEditing && (
        <div className="max-w-4xl mx-auto mt-4">
          <Accordion type="single" collapsible className="border border-destructive/20 rounded-lg bg-card">
            <AccordionItem value="danger-zone" className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-destructive/5">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Danger Zone</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-semibold mb-2 text-foreground">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and membership data from the membership portal. This will remove your login credentials and session data. 
                      {/* Note: Your profile information in our CRM system will remain unchanged. */}
                    </p>
                    <DeleteAccountDialog />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;