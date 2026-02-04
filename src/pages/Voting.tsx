import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  getVotingNominations, 
  getVotingStatus, 
  submitVote, 
  VotingNomination, 
  VotingData, 
  VotingStatus 
} from '@/services/nominations';
import { formatDate, formatMonth, formatShortDateWithOrdinal } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

const VotingPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
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
    votedNominationId,
    votedNominationDate,
  }: { 
    nomination: VotingNomination; 
    category: 'business_of_month' | 'customer_service_superstar';
    hasVoted: boolean;
    votedNominationId?: number;
    votedNominationDate?: string;
  }) => {
    const isVotedFor = votedNominationId === nomination.id;
    const selected = category === 'business_of_month' ? selectedBusiness === nomination.id : selectedSuperstar === nomination.id;

    return (
      <Card className={`${isVotedFor 
          ? 'bg-green-50 dark:bg-green-900/20 border-1 border-emerald-300 dark:border-green-700' 
          : ''
        }`}>
        <CardContent className="p-3 pt-3">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left side: Checkbox and basic info */}
            <div className="flex items-center gap-4 md:flex-1">
              <Checkbox
                id={`nomination-${nomination.id}`}
                checked={isVotedFor || selected}
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
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-300 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>You voted for this nomination on: <span className='font-semibold'>{formatShortDateWithOrdinal(votedNominationDate)}</span></span>
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
    votedInfo?: { nominationId: number; businessName: string; name?: string; votedAt: string; targetMonth?: string } | null;
  }) => {
    const selectedId = category === 'business_of_month' ? selectedBusiness : selectedSuperstar;

    return (
      <div className="space-y-4">
        {hasVoted && votedInfo && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-1 border-emerald-300 dark:border-green-700 p-2">
            <div className="flex flex-row gap-3 items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
              <div className="text-green-700 dark:text-green-200 leading-tight">
                <strong>Thank you for the vote you've submitted for: {formatMonth(votedInfo.targetMonth || votingStatus?.targetMonth)} - {title}</strong>
              </div>
            </div>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-muted-foreground text-center sm:text-left">
            {hasVoted ? 'Your vote has been recorded for' : 'Vote for'} {category === 'business_of_month' ? 'Business of the Month' : 'Customer Service Superstar of the Month'} {formatMonth(votingStatus?.targetMonth)} winner
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
                votedNominationDate={votedInfo?.votedAt}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <h1 className="text-4xl font-bold">Board Member Voting</h1>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-primary"
            >
              Monthly Voting
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/yearly-voting')}
            >
              Yearly Voting
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Vote for {formatMonth(votingData.targetMonth)} winners
        </p>
        
        {votingData.deadline && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 p-3 rounded-lg">
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
        <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6 h-20 sm:h-10 bg-card dark:bg-card">
          <TabsTrigger value="business" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-500 rounded-md">
            Business of the Month
            {votingStatus?.hasVoted.business_of_month && (
              <CheckCircle2 className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />
            )}
          </TabsTrigger>
          <TabsTrigger value="superstar" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-500 rounded-md">
            Customer Service Superstar
            {votingStatus?.hasVoted.customer_service_superstar && (
              <CheckCircle2 className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />
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
