/**
 * Board Member Elections Service
 * API client for executive board member elections (positions, candidates, voting, results)
 */

import { api } from '@/services/apiClient';
import { compressImage } from '@/lib/imageCompression';

export type ElectionStatus = 'draft' | 'voting_open' | 'voting_closed' | 'results_published';

export interface ElectionCandidate {
  id: number;
  positionId: number;
  name: string;
  businessName?: string | null;
  statement?: string | null;
  photoUrl?: string | null;
  createdAt: string;
}

export interface ElectionPosition {
  id: number;
  title: string;
  description?: string | null;
  seatsAvailable: number;
  status: ElectionStatus;
  votingStartAt?: string | null;
  votingEndAt?: string | null;
  votingClosedManually: boolean;
  resultsPublishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  candidates: ElectionCandidate[];
  hasVoted?: boolean;
  voteCount?: number;
}

export interface ElectionResultCandidate {
  id: number;
  name: string;
  businessName?: string | null;
  statement?: string | null;
  photoUrl?: string | null;
  isWinner: boolean;
  voteCount?: number;
}

export interface ElectionTieInfo {
  hasTie: boolean;
  resolved: boolean;
  tiedCandidateIds: number[];
  seatsNeeded: number;
  tieBreakWinnerIds: number[];
  canResolve: boolean;
}

export interface ElectionResults {
  position: {
    id: number;
    title: string;
    seatsAvailable: number;
    status: ElectionStatus;
    resultsPublishedAt?: string | null;
  };
  tie?: ElectionTieInfo;
  candidates: ElectionResultCandidate[];
}

async function parseOrThrow(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    let message = fallbackMessage;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // ignore parse failure, use fallback
    }
    throw new Error(message);
  }
  return response.json();
}

/** Positions open for voting or with published results (member ballot view) */
export async function getOpenPositions(): Promise<ElectionPosition[]> {
  const response = await api.get('/elections');
  const data = await parseOrThrow(response, 'Failed to load elections');
  return data.positions || [];
}

/** All positions regardless of status (board/admin management view) */
export async function getAllPositions(): Promise<ElectionPosition[]> {
  const response = await api.get('/elections?all=true');
  const data = await parseOrThrow(response, 'Failed to load elections');
  return data.positions || [];
}

export async function getPosition(id: number): Promise<{ position: ElectionPosition; hasVoted: boolean }> {
  const response = await api.get(`/elections/${id}`);
  return parseOrThrow(response, 'Failed to load election position');
}

export interface CreatePositionInput {
  title: string;
  description?: string;
  seatsAvailable?: number;
  votingStartAt?: string;
  votingEndAt?: string;
}

export async function createPosition(input: CreatePositionInput): Promise<ElectionPosition> {
  const response = await api.post('/elections', input);
  const data = await parseOrThrow(response, 'Failed to create election position');
  return data.position;
}

export async function updatePosition(id: number, input: Partial<CreatePositionInput> & { status?: string }): Promise<ElectionPosition> {
  const response = await api.patch(`/elections/${id}`, input);
  const data = await parseOrThrow(response, 'Failed to update election position');
  return data.position;
}

export async function deletePosition(id: number): Promise<void> {
  const response = await api.delete(`/elections/${id}`);
  await parseOrThrow(response, 'Failed to delete election position');
}

export async function addCandidate(positionId: number, input: { name: string; businessName?: string; statement?: string; photoUrl?: string }): Promise<ElectionCandidate> {
  const response = await api.post(`/elections/${positionId}/candidates`, input);
  const data = await parseOrThrow(response, 'Failed to add candidate');
  return data.candidate;
}

export async function removeCandidate(positionId: number, candidateId: number): Promise<void> {
  const response = await api.delete(`/elections/${positionId}/candidates/${candidateId}`);
  await parseOrThrow(response, 'Failed to remove candidate');
}

export async function updateCandidate(positionId: number, candidateId: number, input: { name?: string; businessName?: string; statement?: string; photoUrl?: string }): Promise<ElectionCandidate> {
  const response = await api.patch(`/elections/${positionId}/candidates/${candidateId}`, input);
  const data = await parseOrThrow(response, 'Failed to update candidate');
  return data.candidate;
}

/** Uploads a candidate photo to media storage and returns its URL */
export async function uploadCandidatePhoto(file: File): Promise<string> {
  const compressedFile = await compressImage(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const response = await api.post('/medias/upload-election-candidate-photo', {
          fileData: base64Data,
          fileName: compressedFile.name,
          mimeType: compressedFile.type,
        });
        const data = await parseOrThrow(response, 'Failed to upload candidate photo');
        resolve(data.mediaUrl);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(compressedFile);
  });
}

export async function castVote(positionId: number, candidateIds: number[]): Promise<void> {
  const response = await api.post(`/elections/${positionId}/vote`, { candidateIds });
  await parseOrThrow(response, 'Failed to submit vote');
}

export async function closeVoting(positionId: number): Promise<ElectionPosition> {
  const response = await api.patch(`/elections/${positionId}/close`, {});
  const data = await parseOrThrow(response, 'Failed to close voting');
  return data.position;
}

export async function reopenVoting(positionId: number): Promise<ElectionPosition> {
  const response = await api.patch(`/elections/${positionId}/reopen`, {});
  const data = await parseOrThrow(response, 'Failed to reopen voting');
  return data.position;
}

/** Manually opens voting on a draft position right now, regardless of votingStartAt */
export async function openVoting(positionId: number): Promise<ElectionPosition> {
  const response = await api.patch(`/elections/${positionId}/open`, {});
  const data = await parseOrThrow(response, 'Failed to open voting');
  return data.position;
}

/** Sends an open position back to draft (e.g. opened before candidates were finalized) */
export async function revertToDraft(positionId: number): Promise<ElectionPosition> {
  const response = await api.patch(`/elections/${positionId}/revert-to-draft`, {});
  const data = await parseOrThrow(response, 'Failed to return position to draft');
  return data.position;
}

export async function publishResults(positionId: number): Promise<ElectionPosition> {
  const response = await api.patch(`/elections/${positionId}/publish`, {});
  const data = await parseOrThrow(response, 'Failed to publish results');
  return data.position;
}

/** Executive Director only: picks the winner(s) among tied candidates for the last seat(s) */
export async function resolveTie(positionId: number, candidateIds: number[]): Promise<ElectionPosition> {
  const response = await api.patch(`/elections/${positionId}/tie-break`, { candidateIds });
  const data = await parseOrThrow(response, 'Failed to resolve tie');
  return data.position;
}

/** Member view: winners only (requires status === results_published) */
export async function getResults(positionId: number): Promise<ElectionResults> {
  const response = await api.get(`/elections/${positionId}/results`);
  return parseOrThrow(response, 'Failed to load results');
}

/** Board/admin view: full per-candidate tally regardless of publish state */
export async function getFullResults(positionId: number): Promise<ElectionResults> {
  const response = await api.get(`/elections/${positionId}/results?all=true`);
  return parseOrThrow(response, 'Failed to load results');
}
