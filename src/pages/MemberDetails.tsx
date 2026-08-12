import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, Calendar, 
  // Shield, 
  Edit, Save, X, ExternalLink, Briefcase, Plus, Facebook, Instagram, Twitter, Linkedin, Tag, Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import BusinessCategorySelector from '@/components/BusinessCategorySelector';
import { useBusinessCategories, getSubcategoryName, getCategoryForSubcategory } from '@/hooks/useBusinessCategories';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { CouponCodesInput } from '@/components/ui/coupon-codes-input';
import { toast } from 'sonner';
// import { capitalizeFirst } from '@/lib/utils';
import { api } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useMembersStore } from '@/stores/membersStore';
import type { Member } from '@/types/member';
import AvatarUpload from '@/components/AvatarUpload';
import CoverImageUpload from '@/components/CoverImageUpload';
import { getJobs, Job } from '@/services/jobs';
import { BioDisplay, BioEditor } from '@/components/BioField';
import { isNativeApp } from '@/lib/platform';

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
  // Social media links
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  hideMembershipTier: boolean;
}

const MemberDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { triggerMemberRefresh } = useMembersStore();
  const { categories } = useBusinessCategories();
  const fetchingRef = useRef(false);

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Auto-enter edit mode when ?edit=true is in the URL
  const editParam = searchParams.get('edit');
  React.useEffect(() => {
    if (editParam === 'true') setIsEditing(true);
  }, [editParam]);
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Team management state
  const [team, setTeam] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [addingTeamMember, setAddingTeamMember] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ firstName: '', lastName: '', email: '', phone: '', title: '', grantEditorAccess: false });
  const [togglingEditor, setTogglingEditor] = useState<string | null>(null);

  // Business categories state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
    postalCode: '',
    // Social media links
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    hideMembershipTier: false
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
        const response = await api.get(`/businesses/${id}`);

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

        // Categories are embedded in the business response
        if (memberData.categories) {
          setSelectedCategories(memberData.categories);
        }

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
          postalCode: memberData.postalCode || '',
          // Social media links
          facebookUrl: (memberData as any).facebookUrl || '',
          instagramUrl: (memberData as any).instagramUrl || '',
          twitterUrl: (memberData as any).twitterUrl || '',
          linkedinUrl: (memberData as any).linkedinUrl || '',
          hideMembershipTier: (memberData as any).hideMembershipTier ?? false
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

  // Load jobs for the member's company
  useEffect(() => {
    const loadCompanyJobs = async () => {
      if (!member) return;
      
      const companyName = member.businessName || member.companyName;
      if (!companyName) return;

      setLoadingJobs(true);
      try {
        const response = await getJobs({ company: companyName });
        setCompanyJobs(response.jobs);
      } catch (error) {
        console.error('Failed to load company jobs:', error);
        setCompanyJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    };

    loadCompanyJobs();
  }, [member]);

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

  const canEdit = user && member && (
    (user.isBusinessProfileEditor && user.ghlBusinessId === member.id) ||
    user.role === 'admin'
  );

  // Debug logging for authorization - helps troubleshoot edit button visibility
  if (user && member) {
    console.log('🔍 MemberDetails Authorization Debug:', {
      userExists: !!user,
      memberExists: !!member,
      'user.ghlContactId': user?.ghlContactId,
      'member.id': member?.id,
      'member.contactId': member?.contactId,
      'user.role': user?.role,
      'user.ghlContactId === member.id': user?.ghlContactId === member?.id,
      'user.ghlContactId === member.contactId': user?.ghlContactId === member?.contactId,
      'user.role === admin': user?.role === 'admin',
      canEdit,
      isEditing,
      'Button should render': canEdit && !isEditing
    });
  }

  // Check if member has Enhanced or Elite membership (case-insensitive and includes partial matches)
  // Derive from membershipTier on the BusinessMember (set during migration).
  // Per original intent: all paid tiers get 'enhanced/elite'-level UI access.
  const tier = (member as any)?.membershipTier?.toLowerCase() ?? null;
  const hasEnhancedOrElite = !!(tier && ['basic', 'standard', 'enhanced', 'elite'].includes(tier));
  const hasElite = hasEnhancedOrElite; // all paying members treated as elite for UI purposes

  // Load team members when canEdit is true
  useEffect(() => {
    if (!member || !canEdit) return;
    const loadTeam = async () => {
      setTeamLoading(true);
      try {
        const res = await api.get(`/businesses/${member.id}/team`);
        if (res.ok) {
          const data = await res.json();
          setTeam(data.team || []);
        }
      } catch { /* non-fatal */ }
      finally { setTeamLoading(false); }
    };
    loadTeam();
  }, [member?.id, canEdit]);

  const handleToggleEditor = async (contactId: string, currentlyEditor: boolean, isMainContact: boolean) => {
    if (!member || isMainContact) return;
    setTogglingEditor(contactId);
    try {
      const method = currentlyEditor ? 'delete' : 'post';
      const res = await api[method](`/businesses/${member.id}/team/${contactId}/editor`, {});
      if (res.ok) {
        setTeam(prev => prev.map(m => m.id === contactId ? { ...m, isEditor: !currentlyEditor } : m));
        toast.success(currentlyEditor ? 'Editor access revoked' : 'Editor access granted');
      }
    } catch { toast.error('Failed to update editor access'); }
    finally { setTogglingEditor(null); }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setAddingTeamMember(true);
    try {
      const res = await api.post(`/businesses/${member.id}/team`, newMemberForm);
      if (res.ok) {
        const data = await res.json();
        toast.success(`${newMemberForm.firstName} added${data.emailSent ? ' — invite email sent' : ' (email failed to send)'}`);
        setNewMemberForm({ firstName: '', lastName: '', email: '', phone: '', title: '', grantEditorAccess: false });
        setShowAddTeamMember(false);
        // Refresh team list
        const teamRes = await api.get(`/businesses/${member.id}/team`);
        if (teamRes.ok) { const d = await teamRes.json(); setTeam(d.team || []); }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add team member');
      }
    } catch { toast.error('Failed to add team member'); }
    finally { setAddingTeamMember(false); }
  };

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
      // Save profile fields to GHL Business + BusinessProfile
      const response = await api.patch(`/businesses/${member.id}`, {
        businessName: formData.businessName || formData.companyName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address1: formData.address1,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        bio: formData.bio,
        tagline: formData.tagline,
        coverImage: formData.coverImage,
        facebookUrl: formData.facebookUrl,
        instagramUrl: formData.instagramUrl,
        twitterUrl: formData.twitterUrl,
        linkedinUrl: formData.linkedinUrl,
        hideMembershipTier: formData.hideMembershipTier,
        couponCodes: (() => { try { return formData.coupon_codes ? JSON.parse(formData.coupon_codes) : []; } catch { return []; } })(),
        categories: selectedCategories,
      });

      if (!response.ok) {
        throw new Error(`Failed to update member: ${response.statusText}`);
      }

      const updatedMember: Member = await response.json();
      setMember({ ...updatedMember, categories: selectedCategories });
      setIsEditing(false);

      // Trigger refresh of members directory so changes appear immediately
      triggerMemberRefresh();
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
        postalCode: member.postalCode || '',
        // Social media links
        facebookUrl: (member as any).facebookUrl || '',
        instagramUrl: (member as any).instagramUrl || '',
        twitterUrl: (member as any).twitterUrl || '',
        linkedinUrl: (member as any).linkedinUrl || '',
        hideMembershipTier: (member as any).hideMembershipTier ?? false
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
      <div 
        className="flex h-10 items-center justify-between mb-6 z-40 shadow-md fixed left-0 right-0 bg-card/70 px-4"
        style={isNativeApp() ? { 
          top: 'calc(5rem + var(--safe-area-inset-top, 0px))' 
        } : { 
          top: '7.5rem' 
        }}
      >
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
            variant="default"
            onClick={() => setIsEditing(true)}
            className="px-3 h-8 mt-0.5"
          >
            Edit Business Profile
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {isEditing && (
          <div className="flex gap-2 items-center">
            <Button
              onClick={handleSave}
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

      {/* Hero Section */}
      <div
        className="absolute h-80 md:h-[400px] bg-cover bg-center bg-no-repeat pt-10 pb-8 px-8 left-0 right-0 z-20"
        style={{
          // Position below navbar (5rem) + header (2.5rem) + safe area
          top: isNativeApp() ? 'calc(7.5rem + var(--safe-area-inset-top, 0px))' : '7.5rem',
          // Show cover image for all members (previously restricted to elite/admin only)
          // Keep tag-checking logic for future reference/rollback
          backgroundImage: (
            true || 
            member?.tags?.includes('elite') || 
            member?.tags?.includes('admin')
          ) && member.coverImage 
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


        {/* Cover Image Upload - Elite Only */}
        {canEdit && isEditing && hasElite && (
          <CoverImageUpload
            contactId={member?.id || ''}
            businessId={member?.id || ''}
            fallbackText={''}
            currentCoverImage={member?.coverImage}
            onCoverImageUpdated={(newCoverImageUrl: string) => {
              if (member) {
                setMember({ ...member, coverImage: newCoverImageUrl });
                setFormData(prev => ({ ...prev, coverImage: newCoverImageUrl }));
                // Trigger refresh of members directory
                triggerMemberRefresh();
              }
            }}
          />
        )}
      </div>

      <div className="container pt-0 pb-8 px-3 md:px-6 relative">
        {/* Responsive Layout Grid */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto z-30 mt-80 md:mt-96">
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
                            href={member.website.startsWith('http') ? member.website : `https://${member.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex-1 truncate"
                          >
                            {member.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}

                      {/* Social Media Links */}
                      {hasEnhancedOrElite && (
                        <>
                          {(member as any).facebookUrl && (
                            <div className="flex items-center gap-3">
                              <Facebook className="h-4 w-4 text-muted-foreground" />
                              <a href={(member as any).facebookUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-1 truncate">
                                Facebook
                              </a>
                            </div>
                          )}
                          {(member as any).instagramUrl && (
                            <div className="flex items-center gap-3">
                              <Instagram className="h-4 w-4 text-muted-foreground" />
                              <a href={(member as any).instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-1 truncate">
                                Instagram
                              </a>
                            </div>
                          )}
                          {(member as any).twitterUrl && (
                            <div className="flex items-center gap-3">
                              <Twitter className="h-4 w-4 text-muted-foreground" />
                              <a href={(member as any).twitterUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-1 truncate">
                                X / Twitter
                              </a>
                            </div>
                          )}
                          {(member as any).linkedinUrl && (
                            <div className="flex items-center gap-3">
                              <Linkedin className="h-4 w-4 text-muted-foreground" />
                              <a href={(member as any).linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-1 truncate">
                                LinkedIn
                              </a>
                            </div>
                          )}
                        </>
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
                          // Trigger refresh of members directory
                          triggerMemberRefresh();
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
                      <Badge className={`bg-neutral-300/20 text-neutral-500 dark:text-neutral-100 border-neutral-500 dark:border-neutral-300`}>
                        {(member.role ?? 'member').charAt(0).toUpperCase() + (member.role ?? 'member').slice(1)}
                      </Badge>

                      <Badge variant="outline" className="text-teal-600 border-teal-600 bg-teal-600/20 dark:text-teal-300 dark:border-teal-300 dark:bg-teal-300/10">
                        {(member.status ?? 'active').charAt(0).toUpperCase() + (member.status ?? 'active').slice(1)}
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
                  <div className="space-y-4 flex flex-col">
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
                          {/* <span className="text-xs text-muted-foreground ml-2">(Enhanced/Elite only)</span> */}
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

                    <h3 className="font-semibold mb-3">
                      Address Information
                      {/* <span className="text-xs text-muted-foreground ml-2 font-normal">(Enhanced/Elite only)</span> */}
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
                            {/* <span className="text-xs text-muted-foreground ml-2">(Enhanced/Elite only)</span> */}
                          </label>
                          <BioEditor
                            value={formData.bio}
                            onChange={(val) => setFormData(prev => ({ ...prev, bio: val }))}
                          />
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
                              value={formData.facebookUrl}
                              onChange={handleFormChange}
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
                              value={formData.instagramUrl}
                              onChange={handleFormChange}
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
                              value={formData.twitterUrl}
                              onChange={handleFormChange}
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
                              value={formData.linkedinUrl}
                              onChange={handleFormChange}
                              placeholder="https://linkedin.com/in/yourprofile"
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
                          {/* <span className="text-xs text-muted-foreground ml-2">(Elite only)</span> */}
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
                    {/* Business Categories */}
                    {canEdit && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Business Categories
                        </h3>
                        <BusinessCategorySelector
                          selected={selectedCategories}
                          onChange={setSelectedCategories}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          Select up to 3 subcategories. Saved with your profile.
                        </p>
                      </div>
                    )}

                    {/* Privacy Settings */}
                    {/* <div>
                      <h3 className="font-semibold mb-2">Privacy</h3>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hideMembershipTier}
                          onChange={(e) => setFormData(prev => ({ ...prev, hideMembershipTier: e.target.checked }))}
                          className="h-4 w-4 rounded border-input"
                        />
                        <span className="text-sm">Hide membership tier from my public profile</span>
                      </label>
                    </div> */}

                    <Button
                      onClick={handleSave}
                      disabled={updating}
                      variant='default'
                      className='self-center w-1/2 sm:w-1/3'
                    >
                      Update BusinessProfile
                      {updating ? '...' : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 sm:ml-24">
                    {/* Bio - Enhanced/Elite Only */}
                    {hasEnhancedOrElite && member.bio && (
                      <div>
                        <BioDisplay text={member.bio} />
                      </div>
                    )}

                    {/* Coupon Codes - Elite Only */}
                    {/* {hasElite && (member as any).couponCodes && (member as any).couponCodes.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          Coupon Codes
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(member as any).couponCodes.map((code: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-sm">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )} */}

                    {/* Business Categories (read-only) */}
                    {selectedCategories.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Business Categories
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategories.map((subcatId) => (
                            <Badge key={subcatId} variant="secondary">
                              {getSubcategoryName(subcatId, categories)}
                              {getCategoryForSubcategory(subcatId, categories) && (
                                <span className="ml-1 text-muted-foreground opacity-70">
                                  · {getCategoryForSubcategory(subcatId, categories)!.name}
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

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

                      {/* {(canEdit || !(member as any).hideMembershipTier) && (
                        <div className="flex items-center gap-3">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Membership Tier</p>
                            <p className="text-sm text-muted-foreground">
                              {capitalizeFirst((member as any).membershipTier || 'Basic')}
                              {(member as any).hideMembershipTier && (
                                <span className="ml-2 text-xs text-muted-foreground/60">(hidden from others)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )} */}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Management — visible to editors of this business */}
            {canEdit && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members
                    </CardTitle>
                    <Button size="sm" onClick={() => setShowAddTeamMember(v => !v)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add team member form */}
                  {showAddTeamMember && (
                    <form onSubmit={handleAddTeamMember} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium">First Name *</label>
                          <Input value={newMemberForm.firstName} onChange={e => setNewMemberForm(p => ({...p, firstName: e.target.value}))} required />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Last Name *</label>
                          <Input value={newMemberForm.lastName} onChange={e => setNewMemberForm(p => ({...p, lastName: e.target.value}))} required />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Email *</label>
                        <Input type="email" value={newMemberForm.email} onChange={e => setNewMemberForm(p => ({...p, email: e.target.value.toLowerCase()}))} required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium">Phone</label>
                          <Input value={newMemberForm.phone} onChange={e => setNewMemberForm(p => ({...p, phone: e.target.value}))} />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Title</label>
                          <Input value={newMemberForm.title} onChange={e => setNewMemberForm(p => ({...p, title: e.target.value}))} />
                        </div>
                      </div>
                      {(user?.isMainContact || user?.role === 'admin') && (
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={newMemberForm.grantEditorAccess} onChange={e => setNewMemberForm(p => ({...p, grantEditorAccess: e.target.checked}))} className="rounded" />
                          Grant profile edit access
                        </label>
                      )}
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowAddTeamMember(false)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={addingTeamMember}>
                          {addingTeamMember ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add & Send Invite'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Team list */}
                  {teamLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : team.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No team members found.</p>
                  ) : (
                    <div className="space-y-2">
                      {team.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-muted-foreground">{member.title || member.email}</p>
                            </div>
                            {member.isMainContact && <Badge variant="secondary" className="text-xs">Main Contact</Badge>}
                            {member.isEditor && !member.isMainContact && <Badge variant="outline" className="text-xs">Editor</Badge>}
                          </div>
                          {(user?.isMainContact || user?.role === 'admin') && !member.isMainContact && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              disabled={togglingEditor === member.id}
                              onClick={() => handleToggleEditor(member.id, member.isEditor, member.isMainContact)}
                            >
                              {togglingEditor === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : member.isEditor ? <UserX className="h-3.5 w-3.5 text-destructive" /> : <UserCheck className="h-3.5 w-3.5 text-green-600" />}
                              <span className="ml-1 text-xs">{member.isEditor ? 'Revoke' : 'Grant'}</span>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

              {/* Company Job Listings */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Job Openings
                    </CardTitle>
                    {user && (user.role === 'admin' || user.status === 'active') && (
                      <Button asChild size="sm">
                        <Link to="/jobs/new">
                          <Plus className="h-4 w-4 mr-0" />
                          Add Job Listing
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingJobs ? (
                    <p className="text-sm text-muted-foreground">Loading jobs...</p>
                  ) : companyJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No current job openings.</p>
                  ) : (
                    <div className="space-y-3">
                      {companyJobs.map((job) => (
                        <Link
                          key={job.id}
                          to={`/jobs/${job.id}`}
                          className="block p-3 rounded-lg border hover:bg-slate-200 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1 truncate">{job.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                <span className="capitalize">{job.type}</span> • {job.location}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      ))}
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