/**
 * Board Election Voting — member ballot page
 * Lists currently open positions to vote on and published results.
 */
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import {
  ElectionPosition,
  ElectionResults,
  getOpenPositions,
  castVote,
  getResults,
} from '@/services/elections';

export default function BoardElectionVoting() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<ElectionPosition[]>([]);
  const [resultsByPosition, setResultsByPosition] = useState<Record<number, ElectionResults>>({});
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOpenPositions();
      setPositions(data);

      const published = data.filter(p => p.status === 'results_published');
      await Promise.all(
        published.map(async p => {
          try {
            const results = await getResults(p.id);
            setResultsByPosition(prev => ({ ...prev, [p.id]: results }));
          } catch {
            // ignore - results may not be fetchable if something changed concurrently
          }
        })
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const toggleCandidate = (position: ElectionPosition, candidateId: number) => {
    setSelections(prev => {
      const current = prev[position.id] || [];
      const isSelected = current.includes(candidateId);
      if (isSelected) {
        return { ...prev, [position.id]: current.filter(id => id !== candidateId) };
      }
      if (current.length >= position.seatsAvailable) {
        return prev; // already at the seat limit
      }
      return { ...prev, [position.id]: [...current, candidateId] };
    });
  };

  const handleSubmit = async (position: ElectionPosition) => {
    const candidateIds = selections[position.id] || [];
    if (candidateIds.length === 0) {
      setError('Select at least one candidate before submitting');
      return;
    }
    setSubmitting(position.id);
    setError(null);
    try {
      await castVote(position.id, candidateIds);
      await loadPositions();
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote');
    } finally {
      setSubmitting(null);
    }
  };

  const isActiveMember = user && user.status === 'active';

  if (!isActiveMember) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Active membership is required to access board elections.</AlertDescription>
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Executive Board Elections</h1>
        <p className="text-muted-foreground mt-1">Vote for chamber board member candidates</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {positions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            There are no executive board elections open right now. Check back later.
          </CardContent>
        </Card>
      ) : (
        positions.map(position => {
          if (position.status === 'voting_closed') {
            return (
              <Card key={position.id}>
                <CardHeader>
                  <CardTitle>{position.title}</CardTitle>
                  <CardDescription>Voting closed</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-6">
                  Voting is now closed. Stay tuned for published results.
                </CardContent>
              </Card>
            );
          }

          if (position.status === 'results_published') {
            const results = resultsByPosition[position.id];
            return (
              <Card key={position.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {position.title}
                  </CardTitle>
                  <CardDescription>Results published</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {results ? (
                    results.candidates.map(candidate => (
                      <div
                        key={candidate.id}
                        className={`flex items-center justify-between rounded-md border p-3 ${candidate.isWinner ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {candidate.photoUrl && (
                            <img src={candidate.photoUrl} alt={candidate.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                          )}
                          <div>
                            <span className="font-medium">{candidate.name}</span>
                            {candidate.businessName && <span className="text-muted-foreground text-sm ml-2">({candidate.businessName})</span>}
                          </div>
                        </div>
                        {candidate.isWinner && <Badge className="bg-green-600">Winner</Badge>}
                      </div>
                    ))
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </CardContent>
              </Card>
            );
          }

          // voting_open
          const hasVoted = position.hasVoted;
          const selected = selections[position.id] || [];

          return (
            <Card key={position.id}>
              <CardHeader>
                <CardTitle>{position.title}</CardTitle>
                {position.description && <CardDescription>{position.description}</CardDescription>}
                <p className="text-sm text-muted-foreground">
                  Select up to {position.seatsAvailable} candidate{position.seatsAvailable !== 1 ? 's' : ''}
                  {position.votingEndAt && ` • Voting closes ${new Date(position.votingEndAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasVoted ? (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-500">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-200">
                      You've already voted for this position. Results will be available once published.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {position.candidates.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No candidates have been added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {position.candidates.map(candidate => (
                          <div key={candidate.id} className="flex items-start gap-3 rounded-md border p-3">
                            <Checkbox
                              id={`candidate-${candidate.id}`}
                              checked={selected.includes(candidate.id)}
                              onCheckedChange={() => toggleCandidate(position, candidate.id)}
                              disabled={submitting === position.id}
                            />
                            {candidate.photoUrl && (
                              <img src={candidate.photoUrl} alt={candidate.name} className="h-12 w-12 rounded-sm object-cover shrink-0" />
                            )}
                            <label htmlFor={`candidate-${candidate.id}`} className="flex-1 cursor-pointer">
                              <div className="font-medium">{candidate.name}</div>
                              {candidate.businessName && <div className="text-sm text-muted-foreground">{candidate.businessName}</div>}
                              {candidate.statement && <p className="text-sm italic text-muted-foreground mt-1">"{candidate.statement}"</p>}
                            </label>
                          </div>
                        ))}
                        <Button
                          onClick={() => handleSubmit(position)}
                          disabled={submitting === position.id || selected.length === 0}
                          className="w-full sm:w-auto"
                        >
                          {submitting === position.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Submit Vote
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
