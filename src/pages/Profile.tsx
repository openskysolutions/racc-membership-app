import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { UpdateProfileRequest } from '@/services/profile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, Globe, Calendar, Shield, User, Edit, Save, X } from 'lucide-react';
import { api } from '@/services/apiClient';
import type { Member } from '@/types/member';
import AvatarUpload from '@/components/AvatarUpload';

interface ExtendedUpdateProfileRequest extends UpdateProfileRequest {
  bio?: string;
}

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [profile, setProfile] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ExtendedUpdateProfileRequest>({
    firstName: '',
    lastName: '',
    businessName: '',
    phone: '',
    website: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
          phone: profileData.phone || '',
          website: profileData.website || '',
          bio: profileData.bio || ''
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        setMessage({ type: 'error', text: 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.ghlContactId) return;

    setUpdating(true);
    setMessage(null);

    try {
      const response = await api.put(`/members/${user.ghlContactId}`, formData);
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
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
        phone: profile.phone || '',
        website: profile.website || '',
        bio: (profile as any).bio || ''
      });
    }
    setIsEditing(false);
    setMessage(null);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
        
        {isEditing && (
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
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

      {/* Single Card with All Information */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20">
              {profile?.avatar ? (
                <AvatarImage src={profile.avatar} alt={formatMemberName(profile)} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                  {profile ? getInitials(profile) : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {profile?.businessName || (profile ? formatMemberName(profile) : 'Your Profile')}
              </CardTitle>
              
              {profile?.businessName && (
                <p className="text-lg text-muted-foreground mb-2">
                  {formatMemberName(profile)}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Badge className={`${getRoleColor(profile?.role || 'member')} flex items-center gap-1`}>
                  {getRoleIcon(profile?.role || 'member')}
                  {(profile?.role || 'member').charAt(0).toUpperCase() + (profile?.role || 'member').slice(1)}
                </Badge>
                
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {(profile?.status || 'active').charAt(0).toUpperCase() + (profile?.status || 'active').slice(1)}
                </Badge>
                
                <Badge variant="secondary">Your Profile</Badge>
              </div>
            </div>
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
                <label className="block text-sm font-medium mb-1">
                  Profile Picture
                </label>
                <AvatarUpload
                  contactId={user?.ghlContactId || ''}
                  currentAvatar={profile?.avatar}
                  fallbackText={getInitials(profile || {} as Member)}
                  onAvatarUpdated={(newAvatarUrl: string) => {
                    if (profile) {
                      setProfile({ ...profile, avatar: newAvatarUrl });
                    }
                  }}
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

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
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
                  <Calendar className="h-4 w-4" />
                  Membership
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-muted-foreground">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Membership Tier</p>
                      <p className="text-sm text-muted-foreground">
                        {(profile as any)?.membershipTier || 'Standard'}
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