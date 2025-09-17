import React, { useEffect, useState } from 'react';
import { Award, Users, Building, Heart, Crown, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getNominations, 
  getMyNominations, 
  hasNominationModerationAccess,
  Nomination,
  formatNominationCategory 
} from '@/services/nominations';

const NominationsPage: React.FC = () => {
  const [allNominations, setAllNominations] = useState<Nomination[]>([]);
  const [myNominations, setMyNominations] = useState<Nomination[]>([]);
  const [hasModerationAccess, setHasModerationAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('submit');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check moderation access
        const moderationAccess = await hasNominationModerationAccess();
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
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load nominations');
        console.error('Error loading nominations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submit">Submit Nomination</TabsTrigger>
          <TabsTrigger value="my">My Nominations</TabsTrigger>
          {hasModerationAccess && <TabsTrigger value="manage">Manage All</TabsTrigger>}
        </TabsList>

        <TabsContent value="submit" className="space-y-6">
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
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
                  <div className="space-y-4">
                    {allNominations.map((nomination) => (
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
                              <Button size="sm" variant="outline">
                                Approve
                              </Button>
                              <Button size="sm" variant="outline">
                                Under Review
                              </Button>
                              <Button size="sm" variant="outline">
                                Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
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
