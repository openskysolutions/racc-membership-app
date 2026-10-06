/**
 * Election Scheduler
 * Runs every 5 minutes and automatically transitions ElectionPosition status
 * based on votingStartAt/votingEndAt:
 *   - draft -> voting_open once votingStartAt has passed
 *   - voting_open -> voting_closed once votingEndAt has passed (if not already
 *     closed manually)
 * Does NOT auto-publish results — that remains a deliberate board/admin action.
 */

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { sendToUsers } from '@/services/notificationService';

const BOARD_ROLES = ['admin', 'moderator', 'board_member'];

async function getActiveMemberIds(): Promise<number[]> {
  const users = await prisma.user.findMany({ where: { status: 'active' }, select: { id: true } });
  return users.map(u => u.id);
}

async function getBoardMemberIds(): Promise<number[]> {
  const users = await prisma.user.findMany({ where: { role: { in: BOARD_ROLES } }, select: { id: true } });
  return users.map(u => u.id);
}

async function openScheduledVoting(): Promise<void> {
  const now = new Date();
  const toOpen = await prisma.electionPosition.findMany({
    where: {
      status: 'draft',
      votingStartAt: { lte: now },
    },
  });

  for (const position of toOpen) {
    await prisma.electionPosition.update({ where: { id: position.id }, data: { status: 'voting_open' } });
    console.log(`[ElectionScheduler] Opened voting for position ${position.id} (${position.title})`);

    try {
      const activeMemberIds = await getActiveMemberIds();
      if (activeMemberIds.length > 0 && process.env.DISABLE_ELECTION_NOTIFICATIONS !== 'true') {
        await sendToUsers(activeMemberIds, {
          title: 'Board election voting is open',
          body: `Voting is now open for ${position.title}`,
          link: '/board-elections',
        });
      }
    } catch (err) {
      console.error('[ElectionScheduler] Failed to send voting-open notification:', err);
    }
  }
}

async function closeScheduledVoting(): Promise<void> {
  const now = new Date();
  const toClose = await prisma.electionPosition.findMany({
    where: {
      status: 'voting_open',
      votingEndAt: { lte: now },
    },
  });

  for (const position of toClose) {
    await prisma.electionPosition.update({ where: { id: position.id }, data: { status: 'voting_closed' } });
    console.log(`[ElectionScheduler] Closed voting for position ${position.id} (${position.title})`);

    try {
      const boardMemberIds = await getBoardMemberIds();
      if (boardMemberIds.length > 0 && process.env.DISABLE_ELECTION_NOTIFICATIONS !== 'true') {
        await sendToUsers(boardMemberIds, {
          title: 'Election voting closed',
          body: `Voting has closed for ${position.title}. Review votes and publish results when ready.`,
          link: '/admin/elections',
        });
      }
    } catch (err) {
      console.error('[ElectionScheduler] Failed to send voting-closed notification:', err);
    }
  }
}

async function checkElectionTransitions(): Promise<void> {
  await openScheduledVoting();
  await closeScheduledVoting();
}

/**
 * Start the election status scheduler.
 * Call once from server startup.
 */
export function startElectionScheduler(): void {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    checkElectionTransitions().catch((err) =>
      console.error('[ElectionScheduler] Unexpected error:', err)
    );
  });

  console.log('[ElectionScheduler] Scheduler started — runs every 5 minutes');
}
