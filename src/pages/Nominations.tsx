import React, { useEffect, useState } from 'react';
import { Award, Users, Building, Heart, Crown, Plus, CheckCircle, Clock, XCircle, ArrowLeft, BarChart3, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  getNominations, 
  getMyNominations, 
  hasNominationModerationAccess,
  submitNomination,
  Nomination,
  NominationSubmission,
  formatNominationCategory 
} from '@/services/nominations';
import { 
  approveNomination, 
  rejectNomination, 
  bulkApproveNominations, 
  bulkRejectNominations, 
  getNominationStats 
} from '@/services/moderation';
import { getMembersList } from '@/services/members';
import type { Member } from '@/types/member';

const NominationsPage: React.FC = () => {
  const [allNominations, setAllNominations] = useState<Nomination[]>([]);
  const [myNominations, setMyNominations] = useState<Nomination[]>([]);
  const [hasModerationAccess, setHasModerationAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('submit');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'member' | 'business' | 'volunteer' | 'leadership' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    nomineeInfo: {
      name: '',
      email: '',
      organization: '',
      phone: ''
    },
    nominatorInfo: {
      name: '',
      email: '',
      organization: ''
    }
  });

  // Bulk processing states
  const [selectedNominations, setSelectedNominations] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showBulkReasonDialog, setShowBulkReasonDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkReason, setBulkReason] = useState('');

  // Status tracking states
  const [nominationStats, setNominationStats] = useState<any>(null);
  const [showStatusTracking, setShowStatusTracking] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Check moderation access
        let moderationAccess = false;
        try {
          moderationAccess = await hasNominationModerationAccess();
        } catch (err) {
          console.error('Failed to check moderation access:', err);
        }
        setHasModerationAccess(moderationAccess);
        
        // If user has moderation access, load all nominations
        if (moderationAccess) {
          try {
            const nominations = await getNominations();
            setAllNominations(nominations);
          } catch (err) {
            console.error('Failed to load all nominations:', err);
          }
        }
        
        // Try to load user's own nominations
        try {
          const myNoms = await getMyNominations();
          setMyNominations(myNoms);
        } catch (err) {
          console.error('Failed to load my nominations:', err);
        }

        // Load nomination statistics
        try {
          const stats = await getNominationStats();
          setNominationStats(stats);
        } catch (err) {
          console.error('Failed to load nomination stats:', err);
        }
        
      } catch (err) {
        console.error('Error in loadData:', err);
        setError(err instanceof Error ? err.message : 'Failed to load nominations');
      }
      
      // Always set loading to false, regardless of what happens
      setLoading(false);
    };

    loadData();
  }, []);

  const loadMembers = async () => {
    try {
      setMembersLoading(true);
      const membersList = await getMembersList(1, 100); // Load first 100 members
      setMembers(membersList);
    } catch (err) {
      console.error('Failed to load members:', err);
      // Continue without members data - form will still work with manual input
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCategorySelect = (category: 'member' | 'business' | 'volunteer' | 'leadership') => {
    setSelectedCategory(category);
    setShowForm(true);
    // Load members when form is shown
    if (members.length === 0 && !membersLoading) {
      loadMembers();
    }
    // Set default title based on category
    const titles = {
      member: 'Member of the Year',
      business: 'Business of the Year',
      volunteer: 'Volunteer of the Year',
      leadership: 'Leadership Award'
    };
    setFormData(prev => ({ ...prev, title: titles[category] }));
  };

  const handleMemberSelect = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setFormData(prev => ({
        ...prev,
        nomineeInfo: {
          ...prev.nomineeInfo,
          name: member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
          email: member.email || '',
          organization: member.businessName || member.companyName || '',
          phone: member.phone || ''
        }
      }));
    }
  };

  const handleNominatorSelect = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setFormData(prev => ({
        ...prev,
        nominatorInfo: {
          ...prev.nominatorInfo,
          name: member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
          email: member.email || '',
          organization: member.businessName || member.companyName || ''
        }
      }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      setSubmitting(true);
      setError(null);

      const submission: NominationSubmission = {
        ...formData,
        category: selectedCategory
      };

      const newNomination = await submitNomination(submission);
      
      // Add to my nominations list
      setMyNominations(prev => [newNomination, ...prev]);
      
      // Reset form
      setShowForm(false);
      setSelectedCategory(null);
      setFormData({
        title: '',
        description: '',
        nomineeInfo: {
          name: '',
          email: '',
          organization: '',
          phone: ''
        },
        nominatorInfo: {
          name: '',
          email: '',
          organization: ''
        }
      });

      // Switch to "My Nominations" tab to show the submitted nomination
      setActiveTab('my');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit nomination');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as 'nomineeInfo' | 'nominatorInfo'] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleModerationAction = async (nominationId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      if (action === 'approve') {
        await approveNomination(nominationId, 'Approved by moderator');
      } else if (action === 'reject' && reason) {
        await rejectNomination(nominationId, reason);
      }
      
      // Reload nominations to show updated status
      const updatedNominations = await getNominations();
      setAllNominations(updatedNominations);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process moderation action');
    }
  };

  // Bulk processing functions
  const handleBulkActionStart = (action: 'approve' | 'reject') => {
    if (selectedNominations.length === 0) {
      alert('Please select nominations to process');
      return;
    }
    setBulkAction(action);
    setShowBulkReasonDialog(true);
  };

  const handleBulkActionSubmit = async () => {
    if (!bulkAction || selectedNominations.length === 0) return;

    try {
      setBulkProcessing(true);
      
      if (bulkAction === 'approve') {
        await bulkApproveNominations(selectedNominations, bulkReason);
      } else {
        await bulkRejectNominations(selectedNominations, bulkReason);
      }

      // Reload nominations and stats
      const updatedNominations = await getNominations();
      setAllNominations(updatedNominations);
      
      const stats = await getNominationStats();
      setNominationStats(stats);

      // Reset state
      setSelectedNominations([]);
      setShowBulkReasonDialog(false);
      setBulkAction(null);
      setBulkReason('');

      alert(`Successfully ${bulkAction}ed ${selectedNominations.length} nominations`);

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to bulk ${bulkAction} nominations`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleNominationSelect = (nominationId: string, selected: boolean) => {
    if (selected) {
      setSelectedNominations(prev => [...prev, nominationId]);
    } else {
      setSelectedNominations(prev => prev.filter(id => id !== nominationId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const pendingIds = allNominations
        .filter(n => n.status === 'pending')
        .map(n => n.id);
      setSelectedNominations(pendingIds);
    } else {
      setSelectedNominations([]);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'member':
        return <Users className="h-5 w-5" />;
      case 'business':
        return <Building className="h-5 w-5" />;
      case 'volunteer':
        return <Heart className="h-5 w-5" />;
      case 'leadership':
        return <Crown className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
      case 'under-review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'under-review':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <section className="container py-20">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Award className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading nominations...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nominations</h1>
        <p className="text-muted-foreground">
          Nominate outstanding members, businesses, and volunteers for recognition
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${hasModerationAccess ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="submit">Submit Nomination</TabsTrigger>
          <TabsTrigger value="my">My Nominations</TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Status Tracking
          </TabsTrigger>
          {hasModerationAccess && <TabsTrigger value="manage">Manage All</TabsTrigger>}
        </TabsList>

        <TabsContent value="submit" className="space-y-6">
          {!showForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Submit a Nomination
                </CardTitle>
                <CardDescription>
                  Recognize exceptional contributions to the Richfield Area Chamber of Commerce
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCategorySelect('member')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        <h3 className="text-lg font-semibold">Member of the Year</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Recognize a member who has made outstanding contributions to the chamber and community.
                      </p>
                      <Button className="w-full">Nominate Member</Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCategorySelect('business')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Building className="h-8 w-8 text-green-600" />
                        <h3 className="text-lg font-semibold">Business of the Year</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Honor a business that has demonstrated excellence and community involvement.
                      </p>
                      <Button className="w-full">Nominate Business</Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCategorySelect('volunteer')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Heart className="h-8 w-8 text-red-600" />
                        <h3 className="text-lg font-semibold">Volunteer of the Year</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Celebrate a volunteer who has given exceptional service to chamber activities.
                      </p>
                      <Button className="w-full">Nominate Volunteer</Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCategorySelect('leadership')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Crown className="h-8 w-8 text-purple-600" />
                        <h3 className="text-lg font-semibold">Leadership Award</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Recognize outstanding leadership in advancing chamber goals and community development.
                      </p>
                      <Button className="w-full">Nominate Leader</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setShowForm(false); setSelectedCategory(null); }}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {getCategoryIcon(selectedCategory || '')}
                  {selectedCategory && formatNominationCategory(selectedCategory)} Nomination
                </CardTitle>
                <CardDescription>
                  Complete the form below to submit your nomination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Nominee Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Select from Chamber Members *</Label>
                        <Select onValueChange={handleMemberSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder={membersLoading ? "Loading members..." : "Choose a member"} />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim()}
                                  </span>
                                  {(member.businessName || member.companyName) && (
                                    <span className="text-sm text-muted-foreground">
                                      {member.businessName || member.companyName}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nominee-name">Or Enter Name Manually *</Label>
                        <Input
                          id="nominee-name"
                          value={formData.nomineeInfo.name}
                          onChange={(e) => handleInputChange('nomineeInfo.name', e.target.value)}
                          placeholder="Enter nominee name"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nominee-email">Nominee Email</Label>
                        <Input
                          id="nominee-email"
                          type="email"
                          value={formData.nomineeInfo.email}
                          onChange={(e) => handleInputChange('nomineeInfo.email', e.target.value)}
                          placeholder="Filled automatically when selecting from dropdown"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nominee-organization">Nominee Organization</Label>
                        <Input
                          id="nominee-organization"
                          value={formData.nomineeInfo.organization}
                          onChange={(e) => handleInputChange('nomineeInfo.organization', e.target.value)}
                          placeholder="Filled automatically when selecting from dropdown"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nominee-phone">Nominee Phone</Label>
                      <Input
                        id="nominee-phone"
                        type="tel"
                        value={formData.nomineeInfo.phone}
                        onChange={(e) => handleInputChange('nomineeInfo.phone', e.target.value)}
                        placeholder="Filled automatically when selecting from dropdown"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Your Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Select Your Profile</Label>
                        <Select onValueChange={handleNominatorSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder={membersLoading ? "Loading members..." : "Choose your profile"} />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim()}
                                  </span>
                                  {(member.businessName || member.companyName) && (
                                    <span className="text-sm text-muted-foreground">
                                      {member.businessName || member.companyName}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nominator-name">Or Enter Your Name *</Label>
                        <Input
                          id="nominator-name"
                          value={formData.nominatorInfo.name}
                          onChange={(e) => handleInputChange('nominatorInfo.name', e.target.value)}
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nominator-email">Your Email *</Label>
                        <Input
                          id="nominator-email"
                          type="email"
                          value={formData.nominatorInfo.email}
                          onChange={(e) => handleInputChange('nominatorInfo.email', e.target.value)}
                          placeholder="Filled automatically when selecting from dropdown"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nominator-organization">Your Organization</Label>
                        <Input
                          id="nominator-organization"
                          value={formData.nominatorInfo.organization}
                          onChange={(e) => handleInputChange('nominatorInfo.organization', e.target.value)}
                          placeholder="Filled automatically when selecting from dropdown"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nomination-description">Why do you nominate this {selectedCategory}? *</Label>
                    <Textarea
                      id="nomination-description"
                      placeholder="Describe the nominee's contributions, achievements, and why they deserve this recognition..."
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Nomination'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => { setShowForm(false); setSelectedCategory(null); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Nominations</CardTitle>
              <CardDescription>
                Track the status of nominations you've submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myNominations.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No nominations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any nominations. Start by submitting your first nomination!
                  </p>
                  <Button onClick={() => setActiveTab('submit')}>
                    Submit Nomination
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myNominations.map((nomination) => (
                    <Card key={nomination.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(nomination.category)}
                            <div>
                              <h3 className="font-semibold">{nomination.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {formatNominationCategory(nomination.category)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(nomination.status)}
                            <Badge className={getStatusColor(nomination.status)}>
                              {nomination.status.replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm mb-4">{nomination.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Nominee: {nomination.nomineeInfo.name}</span>
                          <span>Submitted: {formatDate(nomination.submittedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Nomination Statistics
              </CardTitle>
              <CardDescription>
                Track nomination status and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nominationStats ? (
                <div className="grid gap-6">
                  {/* Overall Statistics */}
                  {nominationStats.total !== undefined && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{nominationStats.total}</div>
                          <div className="text-sm text-blue-600">Total</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{nominationStats.pending}</div>
                          <div className="text-sm text-yellow-600">Pending</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{nominationStats.underReview}</div>
                          <div className="text-sm text-orange-600">Under Review</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{nominationStats.approved}</div>
                          <div className="text-sm text-green-600">Approved</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{nominationStats.rejected}</div>
                          <div className="text-sm text-red-600">Rejected</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category Breakdown */}
                  {nominationStats.byCategory && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">By Category</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <div className="text-xl font-bold">{nominationStats.byCategory.member}</div>
                          <div className="text-sm text-muted-foreground">Member</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <Building className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <div className="text-xl font-bold">{nominationStats.byCategory.business}</div>
                          <div className="text-sm text-muted-foreground">Business</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                          <div className="text-xl font-bold">{nominationStats.byCategory.volunteer}</div>
                          <div className="text-sm text-muted-foreground">Volunteer</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <Crown className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                          <div className="text-xl font-bold">{nominationStats.byCategory.leadership}</div>
                          <div className="text-sm text-muted-foreground">Leadership</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* My Nominations (for non-moderators) */}
                  {nominationStats.myNominations && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">My Nominations</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <div className="text-2xl font-bold text-slate-600">{nominationStats.myNominations.total}</div>
                          <div className="text-sm text-slate-600">Total</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{nominationStats.myNominations.pending}</div>
                          <div className="text-sm text-yellow-600">Pending</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{nominationStats.myNominations.underReview}</div>
                          <div className="text-sm text-orange-600">Under Review</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{nominationStats.myNominations.approved}</div>
                          <div className="text-sm text-green-600">Approved</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{nominationStats.myNominations.rejected}</div>
                          <div className="text-sm text-red-600">Rejected</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Loading Statistics...</h3>
                  <p className="text-muted-foreground">Please wait while we gather nomination data.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {hasModerationAccess && (
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage All Nominations</CardTitle>
                <CardDescription>
                  Review and manage nominations as a moderator
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allNominations.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No nominations to review</h3>
                    <p className="text-muted-foreground">
                      There are currently no nominations requiring review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Bulk Actions */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedNominations.length === allNominations.filter(n => n.status === 'pending').length && allNominations.filter(n => n.status === 'pending').length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded"
                          />
                          Select All Pending
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {selectedNominations.length} selected
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleBulkActionStart('approve')}
                          disabled={selectedNominations.length === 0 || bulkProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Bulk Approve ({selectedNominations.length})
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBulkActionStart('reject')}
                          disabled={selectedNominations.length === 0 || bulkProcessing}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Bulk Reject ({selectedNominations.length})
                        </Button>
                      </div>
                    </div>

                    {/* Nominations List */}
                    <div className="space-y-4">
                    {allNominations.map((nomination) => (
                      <Card key={nomination.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {nomination.status === 'pending' && (
                                <input
                                  type="checkbox"
                                  checked={selectedNominations.includes(nomination.id)}
                                  onChange={(e) => handleNominationSelect(nomination.id, e.target.checked)}
                                  className="rounded mt-1"
                                />
                              )}
                              {getCategoryIcon(nomination.category)}
                              <div>
                                <h3 className="font-semibold">{nomination.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatNominationCategory(nomination.category)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(nomination.status)}
                              <Badge className={getStatusColor(nomination.status)}>
                                {nomination.status.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm mb-4">{nomination.description}</p>
                          <div className="grid gap-2 text-xs text-muted-foreground mb-4">
                            <div className="flex gap-4">
                              <span>Nominee: {nomination.nomineeInfo.name}</span>
                              <span>Nominator: {nomination.nominatorInfo.name}</span>
                            </div>
                            <div className="flex gap-4">
                              <span>Submitted: {formatDate(nomination.submittedAt)}</span>
                              {nomination.reviewedAt && (
                                <span>Reviewed: {formatDate(nomination.reviewedAt)}</span>
                              )}
                            </div>
                          </div>
                          {nomination.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleModerationAction(nomination.id, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleModerationAction(nomination.id, 'reject', 'Needs more information')}
                              >
                                Under Review
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleModerationAction(nomination.id, 'reject', 'Does not meet criteria')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {error && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default NominationsPage;
