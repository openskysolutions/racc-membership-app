import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getVotingNominations, getVotingStatus, submitVote, VotingNomination, VotingData, VotingStatus } from '@/services/nominations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

const VotingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [votingData, setVotingData] = useState<VotingData | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null);
  const [selectedSuperstar, setSelectedSuperstar] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadVotingData();
  }, []);

  const loadVotingData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [nominations, status] = await Promise.all([
        getVotingNominations(),
        getVotingStatus()
      ]);
      
      setVotingData(nominations);
      setVotingStatus(status);
      
      if (!nominations.canVote && nominations.error) {
        setError(nominations.error);
      }
    } catch (err: any) {
      setError('Failed to load voting data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (nominationId: number) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await submitVote(nominationId);
      
      if (result.success) {
        setSuccess(result.message || 'Vote submitted successfully!');
        // Reload voting data to update status
        await loadVotingData();
      } else {
        setError(result.error || 'Failed to submit vote');
      }
    } catch (err: any) {
      setError('Failed to submit vote');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatMonth = (monthString?: string) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Check access
  const isBoardMember = user && (user.role === 'admin' || user.role === 'moderator' || user.role === 'board_member');

  if (!isBoardMember) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only board members can access the voting system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!votingData?.canVote) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Voting Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || votingData?.error || 'Voting is not currently available.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const NominationCard = ({ 
    nomination, 
    category,
    hasVoted,
    votedNominationId
  }: { 
    nomination: VotingNomination; 
    category: 'business_of_month' | 'customer_service_superstar';
    hasVoted: boolean;
    votedNominationId?: number;
  }) => {
    const isVotedFor = votedNominationId === nomination.id;
    const selected = category === 'business_of_month' ? selectedBusiness === nomination.id : selectedSuperstar === nomination.id;

    return (
      <Card className={`${isVotedFor ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
        <CardContent className="p-3 pt-3">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left side: Checkbox and basic info */}
            <div className="flex items-center gap-4 md:flex-1">
              <Checkbox
                id={`nomination-${nomination.id}`}
                checked={selected}
                onCheckedChange={(checked: boolean) => {
                  if (hasVoted) return;
                  if (category === 'business_of_month') {
                    setSelectedBusiness(checked ? nomination.id : null);
                  } else {
                    setSelectedSuperstar(checked ? nomination.id : null);
                  }
                }}
                disabled={hasVoted || submitting}
              />
              <div className="flex-1">
                <label 
                  htmlFor={`nomination-${nomination.id}`}
                  className="font-semibold text-lg cursor-pointer"
                >
                  {category === 'customer_service_superstar' && nomination.name 
                    ? nomination.name 
                    : nomination.businessName}
                </label>
                {category === 'customer_service_superstar' && nomination.name ? (
                  <p className="text-sm text-muted-foreground">
                    Company: {nomination.businessName}
                  </p>
                ) : nomination.name && (
                  <p className="text-sm text-muted-foreground">
                    Employee: {nomination.name}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Nominated: {formatDate(nomination.createdAt)}</span>
                </div>
                {isVotedFor && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>You voted for this nomination</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Reason */}
            <div className="md:w-1/2 sm:border-l sm:pl-4 pt-4 sm:pt-0">
              <p className="text-sm italic text-muted-foreground">"{nomination.reason}"</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CategorySection = ({
    title,
    category,
    nominations,
    hasVoted,
    votedInfo
  }: {
    title: string;
    category: 'business_of_month' | 'customer_service_superstar';
    nominations: VotingNomination[];
    hasVoted: boolean;
    votedInfo?: { nominationId: number; businessName: string; name?: string; votedAt: string } | null;
  }) => {
    const selectedId = category === 'business_of_month' ? selectedBusiness : selectedSuperstar;

    if (hasVoted && votedInfo) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <Alert className="bg-green-50 dark:bg-green-950 border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Thank you for the vote you've submitted for: {formatMonth(votingStatus?.targetMonth)} - {title}</strong>
              <div className="mt-2">
                You voted for: <strong>{votedInfo.businessName}</strong>
                {votedInfo.name && ` (${votedInfo.name})`}
                <br />
                <span className="text-sm">Voted on: {formatDate(votedInfo.votedAt)}</span>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-muted-foreground text-center sm:text-left">
            Select one nomination to vote for {formatMonth(votingStatus?.targetMonth)} winner
          </p>
          {!hasVoted && nominations.length > 0 && (
            <Button
              onClick={() => selectedId && handleVote(selectedId)}
              disabled={!selectedId || submitting}
              className="sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Vote'
              )}
            </Button>
          )}
        </div>

        {nominations.length === 0 ? (
          <Alert>
            <AlertDescription>
              No approved nominations available for this category.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {nominations.map(nomination => (
              <NominationCard
                key={nomination.id}
                nomination={nomination}
                category={category}
                hasVoted={hasVoted}
                votedNominationId={votedInfo?.nominationId}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Board Member Voting</h1>
        <p className="text-muted-foreground">
          Vote for {formatMonth(votingData.targetMonth)} winners
        </p>
        
        {votingData.deadline && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 p-3 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>
              <strong>Voting Deadline:</strong> {formatDate(votingData.deadline)} at 11:59 PM
            </span>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 dark:bg-green-950 border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="business">
            Business of the Month
            {votingStatus?.hasVoted.business_of_month && (
              <CheckCircle2 className="ml-2 h-4 w-4 text-green-600" />
            )}
          </TabsTrigger>
          <TabsTrigger value="superstar">
            Customer Service Superstar
            {votingStatus?.hasVoted.customer_service_superstar && (
              <CheckCircle2 className="ml-2 h-4 w-4 text-green-600" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <CategorySection
            title="Business of the Month"
            category="business_of_month"
            nominations={votingData.businessOfMonth}
            hasVoted={votingStatus?.hasVoted.business_of_month || false}
            votedInfo={votingStatus?.votes.business_of_month}
          />
        </TabsContent>

        <TabsContent value="superstar">
          <CategorySection
            title="Customer Service Superstar"
            category="customer_service_superstar"
            nominations={votingData.customerServiceSuperstar}
            hasVoted={votingStatus?.hasVoted.customer_service_superstar || false}
            votedInfo={votingStatus?.votes.customer_service_superstar}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VotingPage;
