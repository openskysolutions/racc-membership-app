/**
 * Executive Board Member Elections — Admin/Board Management
 * Create positions, manage candidates, control the voting window, and publish results.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Users, Lock, Unlock, Megaphone, Clock, RotateCcw, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/components/admin/ImageUpload';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ElectionPosition,
  ElectionResults,
  getAllPositions,
  createPosition,
  updatePosition,
  deletePosition,
  addCandidate,
  removeCandidate,
  updateCandidate,
  closeVoting,
  reopenVoting,
  openVoting,
  revertToDraft,
  publishResults,
  resolveTie,
  getFullResults,
  uploadCandidatePhoto,
} from '@/services/elections';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  voting_open: 'Voting Open',
  voting_closed: 'Voting Closed',
  results_published: 'Results Published',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  voting_open: 'default',
  voting_closed: 'destructive',
  results_published: 'secondary',
};

/** Splits an ISO datetime into separate local date (yyyy-MM-dd) and time (HH:mm) strings for the date/time input pair */
function splitDateTime(value?: string | null): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Combines separate date + time input values back into an ISO string */
function combineDateTime(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = (time || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

export default function ElectionsManagement() {
  const [positions, setPositions] = useState<ElectionPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<ElectionPosition | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<ElectionPosition | null>(null);
  const [form, setForm] = useState({ title: '', description: '', seatsAvailable: '1', votingStartDate: '', votingStartTime: '', votingEndDate: '', votingEndTime: '' });
  const [candidateForms, setCandidateForms] = useState<Record<number, { name: string; businessName: string; statement: string; photoUrl: string }>>({});
  const [showCandidateForm, setShowCandidateForm] = useState<Record<number, boolean>>({});
  const [editingCandidate, setEditingCandidate] = useState<{ positionId: number; candidateId: number; name: string; businessName: string; statement: string; photoUrl: string } | null>(null);
  const [resultsByPosition, setResultsByPosition] = useState<Record<number, ElectionResults>>({});
  const [tieSelections, setTieSelections] = useState<Record<number, number[]>>({});

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    setLoading(true);
    try {
      const data = await getAllPositions();
      setPositions(data);
      // Load the live tally for any position where it's useful to see counts pre-publish
      data
        .filter(p => p.status === 'voting_open' || p.status === 'voting_closed' || p.status === 'results_published')
        .forEach(p => loadResults(p.id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (positionId: number) => {
    try {
      const results = await getFullResults(positionId);
      setResultsByPosition(prev => ({ ...prev, [positionId]: results }));
    } catch {
      // Tally is a nice-to-have; ignore failures (e.g. no votes yet)
    }
  };

  const resetForm = () => setForm({ title: '', description: '', seatsAvailable: '1', votingStartDate: '', votingStartTime: '', votingEndDate: '', votingEndTime: '' });

  const openCreateDialog = () => {
    setEditingPosition(null);
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (position: ElectionPosition) => {
    setEditingPosition(position);
    const start = splitDateTime(position.votingStartAt);
    const end = splitDateTime(position.votingEndAt);
    setForm({
      title: position.title,
      description: position.description || '',
      seatsAvailable: String(position.seatsAvailable),
      votingStartDate: start.date,
      votingStartTime: start.time,
      votingEndDate: end.date,
      votingEndTime: end.time,
    });
    setShowCreateDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const input = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        seatsAvailable: parseInt(form.seatsAvailable) || 1,
        votingStartAt: combineDateTime(form.votingStartDate, form.votingStartTime),
        votingEndAt: combineDateTime(form.votingEndDate, form.votingEndTime),
      };
      if (editingPosition) {
        await updatePosition(editingPosition.id, input);
        toast.success('Position updated');
      } else {
        await createPosition(input);
        toast.success('Position created');
      }
      setShowCreateDialog(false);
      resetForm();
      setEditingPosition(null);
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save position');
    }
  };

  const handleDelete = async () => {
    if (!positionToDelete) return;
    try {
      await deletePosition(positionToDelete.id);
      toast.success('Position deleted');
      setPositionToDelete(null);
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete position');
    }
  };

  const handleAddCandidate = async (positionId: number) => {
    const candidateForm = candidateForms[positionId];
    if (!candidateForm?.name?.trim()) {
      toast.error('Candidate name is required');
      return;
    }
    try {
      await addCandidate(positionId, {
        name: candidateForm.name.trim(),
        businessName: candidateForm.businessName?.trim() || undefined,
        statement: candidateForm.statement?.trim() || undefined,
        photoUrl: candidateForm.photoUrl || undefined,
      });
      setCandidateForms(prev => ({ ...prev, [positionId]: { name: '', businessName: '', statement: '', photoUrl: '' } }));
      setShowCandidateForm(prev => ({ ...prev, [positionId]: false }));
      toast.success('Candidate added');
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add candidate');
    }
  };

  const handleCancelAddCandidate = (positionId: number) => {
    setCandidateForms(prev => ({ ...prev, [positionId]: { name: '', businessName: '', statement: '', photoUrl: '' } }));
    setShowCandidateForm(prev => ({ ...prev, [positionId]: false }));
  };

  const handleRemoveCandidate = async (positionId: number, candidateId: number) => {
    try {
      await removeCandidate(positionId, candidateId);
      toast.success('Candidate removed');
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove candidate');
    }
  };

  const handleStartEditCandidate = (positionId: number, candidate: ElectionPosition['candidates'][number]) => {
    setEditingCandidate({
      positionId,
      candidateId: candidate.id,
      name: candidate.name,
      businessName: candidate.businessName || '',
      statement: candidate.statement || '',
      photoUrl: candidate.photoUrl || '',
    });
  };

  const handleCancelEditCandidate = () => setEditingCandidate(null);

  const handleSaveEditCandidate = async () => {
    if (!editingCandidate) return;
    if (!editingCandidate.name.trim()) {
      toast.error('Candidate name is required');
      return;
    }
    try {
      await updateCandidate(editingCandidate.positionId, editingCandidate.candidateId, {
        name: editingCandidate.name.trim(),
        businessName: editingCandidate.businessName.trim() || undefined,
        statement: editingCandidate.statement.trim() || undefined,
        photoUrl: editingCandidate.photoUrl || undefined,
      });
      toast.success('Candidate updated');
      setEditingCandidate(null);
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update candidate');
    }
  };

  const handleCloseVoting = async (positionId: number) => {
    try {
      await closeVoting(positionId);
      toast.success('Voting closed');
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to close voting');
    }
  };

  const handleReopenVoting = async (positionId: number) => {
    try {
      await reopenVoting(positionId);
      toast.success('Voting reopened');
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reopen voting');
    }
  };

  const handleOpenVoting = async (positionId: number) => {
    try {
      await openVoting(positionId);
      toast.success('Voting opened');
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to open voting');
    }
  };

  const handleRevertToDraft = async (positionId: number) => {
    try {
      await revertToDraft(positionId);
      toast.success('Position returned to draft. Set a new voting window or open voting again when ready.');
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to return position to draft');
    }
  };

  const handlePublishResults = async (positionId: number) => {
    try {
      await publishResults(positionId);
      toast.success('Results published');
      loadPositions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish results');
    }
  };

  const toggleTieCandidate = (positionId: number, candidateId: number, seatsNeeded: number) => {
    setTieSelections(prev => {
      const current = prev[positionId] || [];
      if (current.includes(candidateId)) {
        return { ...prev, [positionId]: current.filter(id => id !== candidateId) };
      }
      if (current.length >= seatsNeeded) return prev;
      return { ...prev, [positionId]: [...current, candidateId] };
    });
  };

  const handleResolveTie = async (positionId: number) => {
    const candidateIds = tieSelections[positionId] || [];
    try {
      await resolveTie(positionId, candidateIds);
      toast.success('Tie resolved');
      setTieSelections(prev => ({ ...prev, [positionId]: [] }));
      loadResults(positionId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resolve tie');
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return 'Not set';
    return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Executive Board Elections</h1>
          <p className="text-muted-foreground">Set up positions, manage candidates, and control voting</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Position
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPosition ? 'Edit Position' : 'New Election Position'}</DialogTitle>
              <DialogDescription>
                {editingPosition ? 'Only editable before voting opens.' : 'Candidates and a voting window can be added next.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Treasurer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Responsibilities of this position" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">Seats available</Label>
                <Input id="seats" type="number" min={1} value={form.seatsAvailable} onChange={e => setForm({ ...form, seatsAvailable: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Voting opens</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="date" aria-label="Voting opens date" value={form.votingStartDate} onChange={e => setForm({ ...form, votingStartDate: e.target.value })} />
                  <div className="relative">
                    <Clock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input type="time" aria-label="Voting opens time" value={form.votingStartTime} onChange={e => setForm({ ...form, votingStartTime: e.target.value })} className="pl-9" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Voting closes</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="date" aria-label="Voting closes date" value={form.votingEndDate} onChange={e => setForm({ ...form, votingEndDate: e.target.value })} />
                  <div className="relative">
                    <Clock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input type="time" aria-label="Voting closes time" value={form.votingEndTime} onChange={e => setForm({ ...form, votingEndTime: e.target.value })} className="pl-9" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingPosition ? 'Save Changes' : 'Create Position'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {positions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No election positions yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {positions.map(position => {
            const results = resultsByPosition[position.id];
            const candidateForm = candidateForms[position.id] || { name: '', businessName: '', statement: '', photoUrl: '' };
            const isEditable = position.status === 'draft';

            return (
              <Card key={position.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {position.title}
                        <Badge variant={STATUS_VARIANTS[position.status] || 'outline'}>
                          {STATUS_LABELS[position.status] || position.status}
                        </Badge>
                      </CardTitle>
                      {position.description && <CardDescription className="mt-1">{position.description}</CardDescription>}
                      <p className="text-sm text-muted-foreground mt-2">
                        {position.seatsAvailable} seat{position.seatsAvailable !== 1 ? 's' : ''} available
                        {' • '}Opens: {formatDate(position.votingStartAt)}
                        {' • '}Closes: {formatDate(position.votingEndAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {isEditable && (
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(position)}>Edit</Button>
                      )}
                      {isEditable && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setPositionToDelete(position)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{position.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>This permanently removes the position and all its candidates. This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setPositionToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Candidates */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" /> Candidates
                    </h4>
                    {position.candidates.length === 0 ? (
                      <p className="text-sm text-muted-foreground mb-2">No candidates added yet.</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {position.candidates.map(candidate => {
                          const tally = results?.candidates.find(c => c.id === candidate.id);
                          const isEditingThis = editingCandidate?.candidateId === candidate.id;

                          if (isEditingThis) {
                            return (
                              <div key={candidate.id} className="space-y-2 rounded-md border p-2">
                                <ImageUpload
                                  label="Photo (optional)"
                                  value={editingCandidate.photoUrl}
                                  onChange={url => setEditingCandidate({ ...editingCandidate, photoUrl: url })}
                                  onUpload={uploadCandidatePhoto}
                                />
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input
                                    placeholder="Candidate name"
                                    value={editingCandidate.name}
                                    onChange={e => setEditingCandidate({ ...editingCandidate, name: e.target.value })}
                                  />
                                  <Input
                                    placeholder="Business (optional)"
                                    value={editingCandidate.businessName}
                                    onChange={e => setEditingCandidate({ ...editingCandidate, businessName: e.target.value })}
                                  />
                                </div>
                                <Textarea
                                  placeholder="Short statement/bio (optional)"
                                  value={editingCandidate.statement}
                                  onChange={e => setEditingCandidate({ ...editingCandidate, statement: e.target.value })}
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveEditCandidate}>Save</Button>
                                  <Button variant="outline" size="sm" onClick={handleCancelEditCandidate}>Cancel</Button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={candidate.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                              <div className="flex items-start gap-3">
                                {candidate.photoUrl && (
                                  <img src={candidate.photoUrl} alt={candidate.name} className="h-12 w-12 rounded-sm object-cover shrink-0" />
                                )}
                                <div>
                                  <span className="font-medium">{candidate.name}</span>
                                  {candidate.businessName && <span className="text-muted-foreground text-sm ml-2">({candidate.businessName})</span>}
                                  {tally?.isWinner && position.status !== 'draft' && (
                                    <Badge variant="default" className="ml-2">
                                      {position.status === 'results_published' ? 'Winner' : 'Leading'}
                                    </Badge>
                                  )}
                                  {typeof tally?.voteCount === 'number' && (
                                    <span className="text-xs text-muted-foreground ml-2">{tally.voteCount} vote{tally.voteCount !== 1 ? 's' : ''}</span>
                                  )}
                                  {candidate.statement && <p className="text-sm italic text-muted-foreground mt-1">"{candidate.statement}"</p>}
                                </div>
                              </div>
                              {isEditable && (
                                <div className="flex shrink-0">
                                  <Button variant="ghost" size="sm" onClick={() => handleStartEditCandidate(position.id, candidate)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleRemoveCandidate(position.id, candidate.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {isEditable && (
                      showCandidateForm[position.id] ? (
                        <div className="space-y-2">
                          <ImageUpload
                            label="Photo (optional)"
                            value={candidateForm.photoUrl}
                            onChange={url => setCandidateForms(prev => ({ ...prev, [position.id]: { ...candidateForm, photoUrl: url } }))}
                            onUpload={uploadCandidatePhoto}
                          />
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              placeholder="Candidate name"
                              value={candidateForm.name}
                              onChange={e => setCandidateForms(prev => ({ ...prev, [position.id]: { ...candidateForm, name: e.target.value } }))}
                            />
                            <Input
                              placeholder="Business (optional)"
                              value={candidateForm.businessName}
                              onChange={e => setCandidateForms(prev => ({ ...prev, [position.id]: { ...candidateForm, businessName: e.target.value } }))}
                            />
                          </div>
                          <Textarea
                            placeholder="Short statement/bio (optional)"
                            value={candidateForm.statement}
                            onChange={e => setCandidateForms(prev => ({ ...prev, [position.id]: { ...candidateForm, statement: e.target.value } }))}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleAddCandidate(position.id)}>
                              <Plus className="h-4 w-4 mr-1" /> Add Candidate
                            </Button>
                            <Button variant="ghost" onClick={() => handleCancelAddCandidate(position.id)}>
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" onClick={() => setShowCandidateForm(prev => ({ ...prev, [position.id]: true }))}>
                          <Plus className="h-4 w-4 mr-1" /> Add Candidate
                        </Button>
                      )
                    )}
                  </div>

                  {/* Tie-break — only relevant once voting is closed and before results are published */}
                  {position.status === 'voting_closed' && results?.tie?.hasTie && (
                    results.tie.resolved ? (
                      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                        <AlertDescription className="text-green-700 dark:text-green-200">
                          Tie resolved by the Executive Director. The selected candidate(s) will be marked as the winner(s) when results are published.
                        </AlertDescription>
                      </Alert>
                    ) : results.tie.canResolve ? (
                      <Alert variant="destructive">
                        <AlertDescription className="space-y-3">
                          <p>
                            There's a tie for the last {results.tie.seatsNeeded} seat{results.tie.seatsNeeded !== 1 ? 's' : ''}. As Executive Director, select {results.tie.seatsNeeded} candidate{results.tie.seatsNeeded !== 1 ? 's' : ''} to break the tie.
                          </p>
                          <div className="space-y-2">
                            {results.tie.tiedCandidateIds.map(cid => {
                              const candidate = position.candidates.find(c => c.id === cid);
                              if (!candidate) return null;
                              const selected = (tieSelections[position.id] || []).includes(cid);
                              return (
                                <label key={cid} className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={selected}
                                    onCheckedChange={() => toggleTieCandidate(position.id, cid, results.tie!.seatsNeeded)}
                                  />
                                  <span>{candidate.name}{candidate.businessName && ` (${candidate.businessName})`}</span>
                                </label>
                              );
                            })}
                          </div>
                          <Button
                            size="sm"
                            disabled={(tieSelections[position.id] || []).length !== results.tie.seatsNeeded}
                            onClick={() => handleResolveTie(position.id)}
                          >
                            Resolve Tie
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          There's a tie for the last {results.tie.seatsNeeded} seat{results.tie.seatsNeeded !== 1 ? 's' : ''}. Awaiting the Executive Director to break the tie before results can be published.
                        </AlertDescription>
                      </Alert>
                    )
                  )}

                  {/* Voting controls */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {position.status === 'draft' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" disabled={position.candidates.length === 0}>
                            <Unlock className="h-4 w-4 mr-1" /> Open Voting Now
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Open voting for "{position.title}" now?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Members will immediately be able to vote and candidates/details can no longer be
                              edited. Make sure candidates are finalized first.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleOpenVoting(position.id)}>Open Voting</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {position.status === 'voting_open' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleCloseVoting(position.id)}>
                          <Lock className="h-4 w-4 mr-1" /> Close Voting
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <RotateCcw className="h-4 w-4 mr-1" /> Return to Draft
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Return "{position.title}" to draft?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This stops voting and clears the scheduled voting-opens date so it won't reopen on
                                its own. You'll be able to edit the position and add or remove candidates again,
                                then open voting (on a schedule or immediately) when ready. Any votes already cast remain recorded.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevertToDraft(position.id)}>Return to Draft</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {position.status === 'voting_closed' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleReopenVoting(position.id)}>
                          <Unlock className="h-4 w-4 mr-1" /> Reopen Voting
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" disabled={!!results?.tie?.hasTie && !results.tie.resolved} title={results?.tie?.hasTie && !results.tie.resolved ? 'Resolve the tie before publishing' : undefined}>
                              <Megaphone className="h-4 w-4 mr-1" /> Publish Results
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Publish results for "{position.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This reveals the winner(s) to all members and cannot be undone. Make sure votes have been reviewed first.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handlePublishResults(position.id)}>Publish</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {position.status === 'results_published' && (
                      <p className="text-sm text-muted-foreground">
                        Results published {formatDate(position.resultsPublishedAt)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
