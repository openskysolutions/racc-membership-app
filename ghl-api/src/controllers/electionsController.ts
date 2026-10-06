/**
 * Executive Board Member Elections Controller
 *
 * Status lifecycle (ElectionPosition.status):
 *   draft -> voting_open -> voting_closed -> results_published
 *
 * Board members/admins set up positions and candidates, manage the voting
 * window, close voting, and manually publish results. Active members vote
 * once per position while it is voting_open.
 */

import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { sendToUsers } from '@/services/notificationService';

const BOARD_ROLES = ['admin', 'moderator', 'board_member'];

interface CandidateInput {
  name: string;
  businessName?: string;
  statement?: string;
  photoUrl?: string;
}

export class ElectionsController {
  private getUserId(user: any): number {
    return typeof user.id === 'string' ? parseInt(user.id) : user.id;
  }

  private isBoardMember(user: any): boolean {
    return !!user && BOARD_ROLES.includes(user.role);
  }

  private isExecutiveDirector(user: any): boolean {
    return !!user && user.isExecutiveDirector === true;
  }

  private async getActiveMemberIds(): Promise<number[]> {
    const users = await prisma.user.findMany({ where: { status: 'active' }, select: { id: true } });
    return users.map(u => u.id);
  }

  private async getBoardMemberIds(): Promise<number[]> {
    const users = await prisma.user.findMany({ where: { role: { in: BOARD_ROLES } }, select: { id: true } });
    return users.map(u => u.id);
  }

  /**
   * Determine tie info for the current tally: whether there's a tie affecting
   * who gets the last seat(s), which candidates are tied, and how many of them
   * the Executive Director needs to choose to fill the remaining seat(s).
   */
  private getTieInfo(
    tally: { candidateId: number; voteCount: number }[],
    seatsAvailable: number
  ): { hasTie: boolean; clearWinnerIds: number[]; tiedCandidateIds: number[]; seatsNeeded: number } {
    if (tally.every(t => t.voteCount === 0) || tally.length <= seatsAvailable) {
      return { hasTie: false, clearWinnerIds: tally.map(t => t.candidateId), tiedCandidateIds: [], seatsNeeded: 0 };
    }
    const sorted = [...tally].sort((a, b) => b.voteCount - a.voteCount);
    const cutoffCount = sorted[seatsAvailable - 1].voteCount;
    const aboveCutoff = sorted.filter(t => t.voteCount > cutoffCount);
    const atCutoff = sorted.filter(t => t.voteCount === cutoffCount);
    const seatsNeeded = seatsAvailable - aboveCutoff.length;
    return {
      hasTie: atCutoff.length > seatsNeeded,
      clearWinnerIds: aboveCutoff.map(t => t.candidateId),
      tiedCandidateIds: atCutoff.map(t => t.candidateId),
      seatsNeeded,
    };
  }

  /**
   * Compute the final winner ids for a position: clear winners plus, when there's
   * a tie for the last seat(s), either the Executive Director's recorded tie-break
   * picks (once resolved) or every tied candidate (while still unresolved, so the
   * UI can show them all as "Leading" rather than picking one arbitrarily).
   */
  private getEffectiveWinnerIds(
    tally: { candidateId: number; voteCount: number }[],
    seatsAvailable: number,
    tieBreakWinnerIds: number[] = []
  ): Set<number> {
    const tieInfo = this.getTieInfo(tally, seatsAvailable);
    if (!tieInfo.hasTie) {
      return new Set(tieInfo.clearWinnerIds);
    }
    const isResolved =
      tieBreakWinnerIds.length === tieInfo.seatsNeeded &&
      tieBreakWinnerIds.every(id => tieInfo.tiedCandidateIds.includes(id));
    if (isResolved) {
      return new Set([...tieInfo.clearWinnerIds, ...tieBreakWinnerIds]);
    }
    return new Set([...tieInfo.clearWinnerIds, ...tieInfo.tiedCandidateIds]);
  }

  /**
   * Create a new election position
   * POST /elections
   */
  async createPosition(req: Request, res: Response): Promise<Response> {
    try {
      const { title, description, seatsAvailable, votingStartAt, votingEndAt } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const position = await prisma.electionPosition.create({
        data: {
          title,
          description: description || null,
          seatsAvailable: seatsAvailable ? parseInt(seatsAvailable) : 1,
          status: 'draft',
          votingStartAt: votingStartAt ? new Date(votingStartAt) : null,
          votingEndAt: votingEndAt ? new Date(votingEndAt) : null,
        },
      });

      return res.status(201).json({ success: true, position });
    } catch (error: any) {
      console.error('❌ Error creating election position:', error);
      return res.status(500).json({ error: 'Failed to create election position', details: error.message });
    }
  }

  /**
   * List election positions.
   * Members (default): only voting_open / results_published positions.
   * Board/admin (?all=true): every position, regardless of status.
   * GET /elections
   */
  async listPositions(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const wantsAll = req.query.all === 'true';

      if (wantsAll && !this.isBoardMember(user)) {
        return res.status(403).json({ error: 'Board member access required' });
      }

      const where = wantsAll ? {} : { status: { in: ['voting_open', 'voting_closed', 'results_published'] } };

      const positions = await prisma.electionPosition.findMany({
        where,
        include: {
          candidates: true,
          votes: wantsAll ? true : false,
        },
        orderBy: { createdAt: 'desc' },
      });

      let userId: number | undefined;
      if (user) userId = this.getUserId(user);

      const positionsWithMeta = await Promise.all(
        positions.map(async pos => {
          const { votes, ...rest } = pos as any;
          let hasVoted = false;
          if (userId) {
            const existing = await prisma.electionVote.findFirst({ where: { positionId: pos.id, voterId: userId } });
            hasVoted = !!existing;
          }

          const result: any = { ...rest, hasVoted };
          if (wantsAll && votes) {
            result.voteCount = votes.length;
          }
          return result;
        })
      );

      return res.json({ positions: positionsWithMeta });
    } catch (error: any) {
      console.error('❌ Error listing election positions:', error);
      return res.status(500).json({ error: 'Failed to list election positions', details: error.message });
    }
  }

  /**
   * Get a single election position with candidates
   * GET /elections/:id
   */
  async getPosition(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const position = await prisma.electionPosition.findUnique({
        where: { id: parseInt(id) },
        include: { candidates: true },
      });

      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }

      if (!this.isBoardMember(user) && !['voting_open', 'results_published'].includes(position.status)) {
        return res.status(404).json({ error: 'Election position not found' });
      }

      let hasVoted = false;
      if (user) {
        const existing = await prisma.electionVote.findFirst({
          where: { positionId: position.id, voterId: this.getUserId(user) },
        });
        hasVoted = !!existing;
      }

      return res.json({ position, hasVoted });
    } catch (error: any) {
      console.error('❌ Error getting election position:', error);
      return res.status(500).json({ error: 'Failed to get election position', details: error.message });
    }
  }

  /**
   * Update a position (only editable before voting opens)
   * PATCH /elections/:id
   */
  async updatePosition(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);

      const existing = await prisma.electionPosition.findUnique({ where: { id: positionId } });
      if (!existing) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (existing.status !== 'draft') {
        return res.status(400).json({ error: 'Position can only be edited before voting opens' });
      }

      const { title, description, seatsAvailable, votingStartAt, votingEndAt, status } = req.body;

      const data: any = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (seatsAvailable !== undefined) data.seatsAvailable = parseInt(seatsAvailable);
      if (votingStartAt !== undefined) data.votingStartAt = votingStartAt ? new Date(votingStartAt) : null;
      if (votingEndAt !== undefined) data.votingEndAt = votingEndAt ? new Date(votingEndAt) : null;
      if (status !== undefined && status === 'draft') data.status = status;

      const position = await prisma.electionPosition.update({ where: { id: positionId }, data });

      return res.json({ success: true, position });
    } catch (error: any) {
      console.error('❌ Error updating election position:', error);
      return res.status(500).json({ error: 'Failed to update election position', details: error.message });
    }
  }

  /**
   * Delete a position
   * DELETE /elections/:id
   */
  async deletePosition(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);
      if (isNaN(positionId)) {
        return res.status(400).json({ error: 'Invalid position ID' });
      }

      await prisma.electionPosition.delete({ where: { id: positionId } });

      return res.json({ success: true, message: 'Election position deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Election position not found' });
      }
      console.error('❌ Error deleting election position:', error);
      return res.status(500).json({ error: 'Failed to delete election position', details: error.message });
    }
  }

  /**
   * Add a candidate to a position
   * POST /elections/:id/candidates
   */
  async addCandidate(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);
      const { name, businessName, statement, photoUrl }: CandidateInput = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Candidate name is required' });
      }

      const position = await prisma.electionPosition.findUnique({ where: { id: positionId } });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'draft') {
        return res.status(400).json({ error: 'Candidates can only be added before voting opens' });
      }

      const candidate = await prisma.electionCandidate.create({
        data: { positionId, name, businessName: businessName || null, statement: statement || null, photoUrl: photoUrl || null },
      });

      return res.status(201).json({ success: true, candidate });
    } catch (error: any) {
      console.error('❌ Error adding election candidate:', error);
      return res.status(500).json({ error: 'Failed to add candidate', details: error.message });
    }
  }

  /**
   * Update a candidate's name/business/statement (only before voting opens)
   * PATCH /elections/:id/candidates/:candidateId
   */
  async updateCandidate(req: Request, res: Response): Promise<Response> {
    try {
      const { id, candidateId } = req.params;
      const positionId = parseInt(id);
      const { name, businessName, statement, photoUrl }: Partial<CandidateInput> = req.body;

      const position = await prisma.electionPosition.findUnique({ where: { id: positionId } });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'draft') {
        return res.status(400).json({ error: 'Candidates can only be edited before voting opens' });
      }

      const existing = await prisma.electionCandidate.findUnique({ where: { id: parseInt(candidateId) } });
      if (!existing || existing.positionId !== positionId) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      if (name !== undefined && !name.trim()) {
        return res.status(400).json({ error: 'Candidate name is required' });
      }

      const data: any = {};
      if (name !== undefined) data.name = name;
      if (businessName !== undefined) data.businessName = businessName || null;
      if (statement !== undefined) data.statement = statement || null;
      if (photoUrl !== undefined) data.photoUrl = photoUrl || null;

      const candidate = await prisma.electionCandidate.update({ where: { id: parseInt(candidateId) }, data });

      return res.json({ success: true, candidate });
    } catch (error: any) {
      console.error('❌ Error updating election candidate:', error);
      return res.status(500).json({ error: 'Failed to update candidate', details: error.message });
    }
  }

  /**
   * Remove a candidate from a position
   * DELETE /elections/:id/candidates/:candidateId
   */
  async removeCandidate(req: Request, res: Response): Promise<Response> {
    try {
      const { id, candidateId } = req.params;
      const positionId = parseInt(id);

      const position = await prisma.electionPosition.findUnique({ where: { id: positionId } });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'draft') {
        return res.status(400).json({ error: 'Candidates can only be removed before voting opens' });
      }

      await prisma.electionCandidate.delete({ where: { id: parseInt(candidateId) } });

      return res.json({ success: true, message: 'Candidate removed successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      console.error('❌ Error removing election candidate:', error);
      return res.status(500).json({ error: 'Failed to remove candidate', details: error.message });
    }
  }

  /**
   * Cast a ballot for a position (active members only, one ballot per member per position)
   * POST /elections/:id/vote
   * Body: { candidateIds: number[] }
   */
  async castVote(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);
      const user = (req as any).user;
      const { candidateIds } = req.body;

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Active membership is required to vote' });
      }
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ error: 'Select at least one candidate' });
      }

      const position = await prisma.electionPosition.findUnique({
        where: { id: positionId },
        include: { candidates: true },
      });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'voting_open') {
        return res.status(403).json({ error: 'Voting is not currently open for this position' });
      }
      if (candidateIds.length > position.seatsAvailable) {
        return res.status(400).json({ error: `You may select up to ${position.seatsAvailable} candidate(s)` });
      }

      const validCandidateIds = new Set(position.candidates.map(c => c.id));
      if (!candidateIds.every((cid: number) => validCandidateIds.has(cid))) {
        return res.status(400).json({ error: 'One or more selected candidates are invalid for this position' });
      }

      const userId = this.getUserId(user);
      const existingVote = await prisma.electionVote.findFirst({ where: { positionId, voterId: userId } });
      if (existingVote) {
        return res.status(409).json({ error: 'You have already voted for this position' });
      }

      await prisma.electionVote.createMany({
        data: candidateIds.map((candidateId: number) => ({ positionId, candidateId, voterId: userId })),
      });

      console.log(`✅ Vote recorded: user ${userId} voted on position ${positionId} (${candidateIds.length} selection(s))`);

      return res.status(201).json({ success: true, message: 'Vote submitted successfully' });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'You have already voted for this position' });
      }
      console.error('❌ Error casting election vote:', error);
      return res.status(500).json({ error: 'Failed to submit vote', details: error.message });
    }
  }

  /**
   * Manually open voting on a draft position right now, regardless of votingStartAt
   * PATCH /elections/:id/open
   */
  async openVoting(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);

      const position = await prisma.electionPosition.findUnique({ where: { id: positionId }, include: { candidates: true } });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'draft') {
        return res.status(400).json({ error: 'Only a draft position can be opened for voting' });
      }
      if (position.candidates.length === 0) {
        return res.status(400).json({ error: 'Add at least one candidate before opening voting' });
      }

      const updated = await prisma.electionPosition.update({
        where: { id: positionId },
        data: { status: 'voting_open', votingStartAt: new Date() },
      });

      try {
        const activeMemberIds = await this.getActiveMemberIds();
        if (activeMemberIds.length > 0 && process.env.DISABLE_ELECTION_NOTIFICATIONS !== 'true') {
          await sendToUsers(activeMemberIds, {
            title: 'Board election voting is open',
            body: `Voting is now open for ${position.title}`,
            link: '/board-elections',
          });
        }
      } catch (notifyError) {
        console.error('⚠️ Failed to send election voting-open notification:', notifyError);
      }

      return res.json({ success: true, position: updated });
    } catch (error: any) {
      console.error('❌ Error opening election voting:', error);
      return res.status(500).json({ error: 'Failed to open voting', details: error.message });
    }
  }

  /**
   * Manually close voting on a position
   * PATCH /elections/:id/close
   */
  async closeVoting(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);

      const position = await prisma.electionPosition.findUnique({ where: { id: positionId } });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'voting_open') {
        return res.status(400).json({ error: 'Only an open voting position can be closed' });
      }

      const updated = await prisma.electionPosition.update({
        where: { id: positionId },
        data: { status: 'voting_closed', votingClosedManually: true },
      });

      return res.json({ success: true, position: updated });
    } catch (error: any) {
      console.error('❌ Error closing election voting:', error);
      return res.status(500).json({ error: 'Failed to close voting', details: error.message });
    }
  }

  /**
   * Reopen voting on a position closed in error (only before results are published)
   * PATCH /elections/:id/reopen
   */
  async reopenVoting(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);

      const position = await prisma.electionPosition.findUnique({ where: { id: positionId } });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'voting_closed') {
        return res.status(400).json({ error: 'Only a closed voting position can be reopened' });
      }

      const updated = await prisma.electionPosition.update({
        where: { id: positionId },
        // Clear any tie-break pick — reopening lets more votes come in, which could change the tally
        data: { status: 'voting_open', votingClosedManually: false, tieBreakWinnerIds: [] },
      });

      return res.json({ success: true, position: updated });
    } catch (error: any) {
      console.error('❌ Error reopening election voting:', error);
      return res.status(500).json({ error: 'Failed to reopen voting', details: error.message });
    }
  }

  /**
   * Send an open position back to draft (e.g. it opened for voting before candidates
   * were finalized). Clears votingStartAt so the scheduler doesn't immediately reopen
   * it again; the board must set a new voting window (or open it manually) to resume.
   * PATCH /elections/:id/revert-to-draft
   */
  async revertToDraft(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);

      const position = await prisma.electionPosition.findUnique({ where: { id: positionId } });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'voting_open') {
        return res.status(400).json({ error: 'Only an open voting position can be sent back to draft' });
      }

      const updated = await prisma.electionPosition.update({
        where: { id: positionId },
        data: { status: 'draft', votingStartAt: null, votingClosedManually: false },
      });

      return res.json({ success: true, position: updated });
    } catch (error: any) {
      console.error('❌ Error reverting election position to draft:', error);
      return res.status(500).json({ error: 'Failed to return position to draft', details: error.message });
    }
  }

  /**
   * Publish results for a position (only allowed once voting is closed)
   * PATCH /elections/:id/publish
   */
  async publishResults(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);

      const position = await prisma.electionPosition.findUnique({
        where: { id: positionId },
        include: { candidates: true, votes: true },
      });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'voting_closed') {
        return res.status(400).json({ error: 'Results can only be published once voting is closed' });
      }

      const tally = position.candidates.map(c => ({
        candidateId: c.id,
        voteCount: position.votes.filter(v => v.candidateId === c.id).length,
      }));
      const tieInfo = this.getTieInfo(tally, position.seatsAvailable);
      const tieResolved = (position as any).tieBreakWinnerIds.length === tieInfo.seatsNeeded;
      if (tieInfo.hasTie && !tieResolved) {
        return res.status(400).json({ error: 'There is an unresolved tie for the last seat(s). The Executive Director must break the tie before results can be published.' });
      }

      const updated = await prisma.electionPosition.update({
        where: { id: positionId },
        data: { status: 'results_published', resultsPublishedAt: new Date() },
      });

      // Notify all active members that results are available (best-effort, don't fail the request)
      try {
        const activeMemberIds = await this.getActiveMemberIds();
        if (activeMemberIds.length > 0 && process.env.DISABLE_ELECTION_NOTIFICATIONS !== 'true') {
          await sendToUsers(activeMemberIds, {
            title: 'Election results published',
            body: `Results are now available for ${position.title}`,
            link: '/board-elections',
          });
        }
      } catch (notifyError) {
        console.error('⚠️ Failed to send election results notification:', notifyError);
      }

      return res.json({ success: true, position: updated });
    } catch (error: any) {
      console.error('❌ Error publishing election results:', error);
      return res.status(500).json({ error: 'Failed to publish results', details: error.message });
    }
  }

  /**
   * Record the Executive Director's tie-break picks for the last seat(s) of a
   * position (only once voting is closed, before results are published).
   * Access is restricted to the Executive Director via the requireExecutiveDirector
   * middleware on the route — not satisfied by admin/board-member role alone.
   * PATCH /elections/:id/tie-break
   * Body: { candidateIds: number[] }
   */
  async resolveTie(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);
      const { candidateIds } = req.body;

      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ error: 'Select at least one candidate to break the tie' });
      }

      const position = await prisma.electionPosition.findUnique({
        where: { id: positionId },
        include: { candidates: true, votes: true },
      });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (position.status !== 'voting_closed') {
        return res.status(400).json({ error: 'Ties can only be broken after voting is closed and before results are published' });
      }

      const tally = position.candidates.map(c => ({
        candidateId: c.id,
        voteCount: position.votes.filter(v => v.candidateId === c.id).length,
      }));
      const tieInfo = this.getTieInfo(tally, position.seatsAvailable);
      if (!tieInfo.hasTie) {
        return res.status(400).json({ error: 'There is no unresolved tie for this position' });
      }

      const uniqueIds = [...new Set(candidateIds)];
      if (uniqueIds.length !== tieInfo.seatsNeeded) {
        return res.status(400).json({ error: `Select exactly ${tieInfo.seatsNeeded} candidate(s) to fill the remaining seat(s)` });
      }
      if (!uniqueIds.every((cid: number) => tieInfo.tiedCandidateIds.includes(cid))) {
        return res.status(400).json({ error: 'One or more selected candidates are not part of the tie' });
      }

      const updated = await prisma.electionPosition.update({
        where: { id: positionId },
        data: { tieBreakWinnerIds: uniqueIds },
      });

      return res.json({ success: true, position: updated });
    } catch (error: any) {
      console.error('❌ Error resolving election tie:', error);
      return res.status(500).json({ error: 'Failed to resolve tie', details: error.message });
    }
  }

  /**
   * Get results for a position.
   * Members: winners only, once published.
   * Board/admin (?all=true): full per-candidate tally at any time.
   * GET /elections/:id/results
   */
  async getResults(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const positionId = parseInt(id);
      const user = (req as any).user;
      const wantsFullTally = req.query.all === 'true';

      if (wantsFullTally && !this.isBoardMember(user)) {
        return res.status(403).json({ error: 'Board member access required' });
      }

      const position = await prisma.electionPosition.findUnique({
        where: { id: positionId },
        include: { candidates: true, votes: true },
      });
      if (!position) {
        return res.status(404).json({ error: 'Election position not found' });
      }
      if (!wantsFullTally && position.status !== 'results_published') {
        return res.status(403).json({ error: 'Results have not been published for this position' });
      }

      const tally = position.candidates.map(c => ({
        candidateId: c.id,
        voteCount: position.votes.filter(v => v.candidateId === c.id).length,
      }));
      const tieBreakWinnerIds = (position as any).tieBreakWinnerIds ?? [];
      const winnerIds = this.getEffectiveWinnerIds(tally, position.seatsAvailable, tieBreakWinnerIds);
      const tieInfo = wantsFullTally ? this.getTieInfo(tally, position.seatsAvailable) : null;

      const candidates = position.candidates.map(c => {
        const base: any = {
          id: c.id,
          name: c.name,
          businessName: c.businessName,
          statement: c.statement,
          photoUrl: c.photoUrl,
          isWinner: winnerIds.has(c.id),
        };
        if (wantsFullTally) {
          base.voteCount = tally.find(t => t.candidateId === c.id)?.voteCount ?? 0;
        }
        return base;
      });

      return res.json({
        position: {
          id: position.id,
          title: position.title,
          seatsAvailable: position.seatsAvailable,
          status: position.status,
          resultsPublishedAt: position.resultsPublishedAt,
        },
        ...(tieInfo ? {
          tie: {
            hasTie: tieInfo.hasTie,
            resolved: tieInfo.hasTie && tieBreakWinnerIds.length > 0,
            tiedCandidateIds: tieInfo.tiedCandidateIds,
            seatsNeeded: tieInfo.seatsNeeded,
            tieBreakWinnerIds,
            canResolve: this.isExecutiveDirector(user),
          },
        } : {}),
        candidates,
      });
    } catch (error: any) {
      console.error('❌ Error getting election results:', error);
      return res.status(500).json({ error: 'Failed to get results', details: error.message });
    }
  }
}

export const electionsController = new ElectionsController();
