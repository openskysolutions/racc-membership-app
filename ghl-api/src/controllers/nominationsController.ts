/**
 * Nominations Controller
 * Handles nominations for Business of the Month and Customer Service Superstar awards
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ghlService } from '@/services/gohighlevel';

const prisma = new PrismaClient();

interface NominationRequest {
  type: 'business' | 'individual';
  category: 'business_of_month' | 'customer_service_superstar';
  name?: string;  // Individual's name (for customer service superstar)
  businessName: string;  // Business name
  reason: string;
}

interface VoteRequest {
  nominationId: number;
  voteValue: number;
  comment?: string;
}

export class NominationsController {
  /**
   * Helper: Convert user.id to number for Prisma queries
   */
  private getUserId(user: any): number {
    return typeof user.id === 'string' ? parseInt(user.id) : user.id;
  }

  /**
   * Create a new nomination
   * POST /nominations
   */
  async createNomination(req: Request, res: Response): Promise<Response> {
    try {
      const data: NominationRequest = req.body;

      // Validate required fields
      if (!data.type || !data.category || !data.businessName || !data.reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create nomination - automatically approved for now
      const nomination = await prisma.nomination.create({
        data: {
          type: data.type,
          category: data.category,
          name: data.name,
          businessName: data.businessName,
          reason: data.reason,
          status: 'approved' // Auto-approve all nominations for now
        }
      });

      console.log(`✅ Nomination created: ${nomination.id} for ${nomination.businessName}`);

      return res.status(201).json({
        success: true,
        nomination
      });
    } catch (error: any) {
      console.error('❌ Error creating nomination:', error);
      return res.status(500).json({
        error: 'Failed to create nomination',
        details: error.message
      });
    }
  }

  /**
   * List all nominations (with optional filters)
   * GET /nominations
   */
  async listNominations(req: Request, res: Response): Promise<Response> {
    try {
      const { type, category, status, year, month, limit, offset } = req.query;

      const where: any = {};
      if (type) where.type = type;
      if (category) where.category = category;
      if (status) where.status = status;
      
      // Filter by year/month using createdAt date
      if (year || month) {
        const yearNum = year ? parseInt(year as string) : new Date().getFullYear();
        const monthNum = month ? parseInt(month as string) - 1 : 0; // JS months are 0-indexed
        
        if (month) {
          // Filter for specific month
          const startDate = new Date(yearNum, monthNum, 1);
          const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999);
          where.createdAt = { gte: startDate, lte: endDate };
        } else {
          // Filter for entire year
          const startDate = new Date(yearNum, 0, 1);
          const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
          where.createdAt = { gte: startDate, lte: endDate };
        }
      }

      const parsedLimit = limit ? parseInt(limit as string) : 50;
      const parsedOffset = offset ? parseInt(offset as string) : 0;

      const [nominations, total] = await Promise.all([
        prisma.nomination.findMany({
          where,
          include: {
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    role: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: parsedLimit,
          skip: parsedOffset
        }),
        prisma.nomination.count({ where })
      ]);

      // Calculate vote statistics for each nomination
      const nominationsWithStats = nominations.map(nom => ({
        ...nom,
        voteCount: nom.votes.filter(v => v.voteValue).length // Count only true votes
      }));

      return res.json({
        nominations: nominationsWithStats,
        total,
        limit: parsedLimit,
        offset: parsedOffset
      });
    } catch (error: any) {
      console.error('❌ Error listing nominations:', error);
      return res.status(500).json({
        error: 'Failed to list nominations',
        details: error.message
      });
    }
  }

  /**
   * Get a single nomination by ID
   * GET /nominations/:id
   */
  async getNomination(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const nomination = await prisma.nomination.findUnique({
        where: { id: parseInt(id) },
        include: {
          votes: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });

      if (!nomination) {
        return res.status(404).json({ error: 'Nomination not found' });
      }

      // Calculate vote statistics (count only true votes)
      const voteCount = nomination.votes.filter(v => v.voteValue).length;

      return res.json({
        ...nomination,
        voteCount
      });
    } catch (error: any) {
      console.error('❌ Error getting nomination:', error);
      return res.status(500).json({
        error: 'Failed to get nomination',
        details: error.message
      });
    }
  }

  /**
   * Helper: Get voting period details for current month
   */
  private getVotingPeriodDetails(now: Date = new Date()) {
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    
    // November (month 10) - no voting allowed
    if (currentMonth === 10) {
      return {
        canVote: false,
        votingMonth: null,
        targetMonth: null,
        deadline: null,
        error: 'Voting is not available in November'
      };
    }
    
    // Check if past voting deadline (20th)
    if (currentDay > 20) {
      return {
        canVote: false,
        votingMonth: null,
        targetMonth: null,
        deadline: new Date(currentYear, currentMonth, 20),
        error: 'Voting deadline (20th) has passed for this month'
      };
    }
    
    // Calculate voting month (current) and target month (next)
    const votingMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const targetMonthDate = new Date(currentYear, currentMonth + 1, 1);
    const targetMonth = `${targetMonthDate.getFullYear()}-${String(targetMonthDate.getMonth() + 1).padStart(2, '0')}`;
    
    return {
      canVote: true,
      votingMonth,
      targetMonth,
      deadline: new Date(currentYear, currentMonth, 20),
      currentMonth: currentMonth + 1 // 1-12
    };
  }

  /**
   * Helper: Get date range for viewing nominations
   */
  private getNominationDateRange(now: Date = new Date()) {
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    let startDate: Date;
    
    // December (11), January (0), February (1) - special period
    if (currentMonth === 11 || currentMonth === 0 || currentMonth === 1) {
      // Start from December 1st of appropriate year
      const decemberYear = currentMonth === 11 ? currentYear : currentYear - 1;
      startDate = new Date(decemberYear, 11, 1); // December 1st
    } else {
      // Regular period: 3 months back including current month
      startDate = new Date(currentYear, currentMonth - 2, 1);
    }
    
    // End date is end of current month
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    return { startDate, endDate };
  }

  /**
   * Cast a vote on a nomination (board members only)
   * POST /nominations/:id/vote
   */
  async voteOnNomination(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const user = (req as any).user;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is a board member, moderator, or admin
      if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'board_member') {
        return res.status(403).json({ error: 'Only board members can vote on nominations' });
      }

      // Check voting period
      const votingPeriod = this.getVotingPeriodDetails();
      if (!votingPeriod.canVote) {
        return res.status(403).json({ error: votingPeriod.error });
      }

      // Check if nomination exists and get its category
      const nomination = await prisma.nomination.findUnique({
        where: { id: parseInt(id) }
      });

      if (!nomination) {
        return res.status(404).json({ error: 'Nomination not found' });
      }

      if (nomination.status !== 'approved') {
        return res.status(400).json({ error: 'Can only vote on approved nominations' });
      }

      // Check if user already voted for this category in this voting month
      const existingVote = await prisma.vote.findFirst({
        where: {
          userId: user.id,
          votingCategory: nomination.category,
          votingMonth: votingPeriod.votingMonth!
        }
      });

      if (existingVote) {
        return res.status(400).json({ 
          error: 'You have already voted for this category this month',
          votedNominationId: existingVote.nominationId
        });
      }

      // Create vote
      const vote = await prisma.vote.create({
        data: {
          nominationId: parseInt(id),
          userId: user.id,
          votingMonth: votingPeriod.votingMonth!,
          votingCategory: nomination.category,
          voteValue: true,
          comment
        }
      });

      console.log(`✅ Vote recorded: User ${user.id} voted for nomination ${id} (${nomination.category}) in ${votingPeriod.votingMonth}`);

      return res.json({
        success: true,
        vote,
        message: `Vote recorded for ${nomination.category} in ${votingPeriod.targetMonth}`
      });
    } catch (error: any) {
      console.error('❌ Error voting on nomination:', error);
      return res.status(500).json({
        error: 'Failed to record vote',
        details: error.message
      });
    }
  }

  /**
   * Get voting summary for a nomination
   * GET /nominations/:id/votes
   */
  async getVotes(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const votes = await prisma.vote.findMany({
        where: { nominationId: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Count only true votes (checkbox system)
      const voteCount = votes.filter(v => v.voteValue).length;

      return res.json({
        votes,
        voteCount
      });
    } catch (error: any) {
      console.error('❌ Error getting votes:', error);
      return res.status(500).json({
        error: 'Failed to get votes',
        details: error.message
      });
    }
  }

  /**
   * Search for businesses/contacts to nominate
   * GET /nominations/search
   */
  async searchNominees(req: Request, res: Response): Promise<Response> {
    try {
      const { query, type } = req.query;

      if (type === undefined) {
        return res.status(400).json({ error: 'Type is required' });
      }

      // Fetch members from the members service
      const { membersController } = require('@/controllers/membersController');
      
      // Get all members (this uses the cached members list)
      const mockReq = { query: { search: query || '' } } as any;
      const mockRes = {
        json: (data: any) => data,
        status: (code: number) => ({
          json: (data: any) => ({ status: code, ...data })
        })
      } as any;

      // Use the existing members controller to get members
      const membersData: any = await membersController.listMembers(mockReq, mockRes);
      const members = membersData.members || [];

      const queryStr = (query as string || '').toLowerCase();
      
      const results = members
        .filter((member: any) => {
          if (type === 'business') {
            // For businesses, only include members with a business name
            if (!member.businessName) return false;
            // If no query, return all businesses; otherwise filter
            return !queryStr || member.businessName.toLowerCase().includes(queryStr);
          } else {
            // For individuals, include all members
            const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim().toLowerCase();
            // If no query, return all individuals; otherwise filter
            return !queryStr || fullName.includes(queryStr);
          }
        })
        .map((member: any) => ({
          id: member.id,
          name: type === 'business'
            ? member.businessName
            : `${member.firstName} ${member.lastName}`,
          businessName: member.businessName,
          email: member.email,
          phone: member.phone
        }));

      return res.json({ results });
    } catch (error: any) {
      console.error('❌ Error searching nominees:', error);
      return res.status(500).json({
        error: 'Failed to search nominees',
        details: error.message
      });
    }
  }

  /**
   * Update nomination status (admin only)
   * PATCH /nominations/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = (req as any).user;

      // Check if user is admin
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Validate status
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const nomination = await prisma.nomination.update({
        where: { id: parseInt(id) },
        data: { status }
      });

      return res.json({ success: true, nomination });
    } catch (error: any) {
      console.error('❌ Error updating nomination status:', error);
      return res.status(500).json({
        error: 'Failed to update nomination status',
        details: error.message
      });
    }
  }

  /**
   * Get nominations available for voting in the current period
   * GET /nominations/voting
   */
  async getVotingNominations(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is a board member, moderator, or admin
      if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'board_member') {
        return res.status(403).json({ error: 'Only board members can access voting' });
      }

      // Check voting period
      const votingPeriod = this.getVotingPeriodDetails();
      if (!votingPeriod.canVote) {
        return res.status(403).json({ 
          error: votingPeriod.error,
          canVote: false
        });
      }

      // Get date range for nominations
      const { startDate, endDate } = this.getNominationDateRange();

      // Get approved nominations in the date range
      const nominations = await prisma.nomination.findMany({
        where: {
          status: 'approved',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          votes: {
            where: {
              votingMonth: votingPeriod.votingMonth!
            },
            select: {
              id: true,
              userId: true,
              voteValue: true
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      // Separate by category
      const businessNominations = nominations.filter(n => n.category === 'business_of_month');
      const superstarNominations = nominations.filter(n => n.category === 'customer_service_superstar');

      return res.json({
        canVote: true,
        votingMonth: votingPeriod.votingMonth,
        targetMonth: votingPeriod.targetMonth,
        deadline: votingPeriod.deadline,
        businessOfMonth: businessNominations.map(n => ({
          ...n,
          voteCount: n.votes.filter(v => v.voteValue).length
        })),
        customerServiceSuperstar: superstarNominations.map(n => ({
          ...n,
          voteCount: n.votes.filter(v => v.voteValue).length
        }))
      });
    } catch (error: any) {
      console.error('❌ Error getting voting nominations:', error);
      return res.status(500).json({
        error: 'Failed to get voting nominations',
        details: error.message
      });
    }
  }

  /**
   * Get user's voting status for the current period
   * GET /nominations/voting/status
   */
  async getVotingStatus(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is a board member, moderator, or admin
      if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'board_member') {
        return res.status(403).json({ error: 'Only board members can access voting' });
      }

      // Check voting period
      const votingPeriod = this.getVotingPeriodDetails();
      if (!votingPeriod.canVote) {
        return res.json({ 
          canVote: false,
          error: votingPeriod.error,
          hasVoted: {
            business_of_month: false,
            customer_service_superstar: false
          }
        });
      }

      // Check if user has voted for each category
      const votes = await prisma.vote.findMany({
        where: {
          userId: user.id,
          votingMonth: votingPeriod.votingMonth!
        },
        include: {
          nomination: {
            select: {
              id: true,
              businessName: true,
              name: true,
              category: true
            }
          }
        }
      });

      const businessVote = votes.find(v => v.votingCategory === 'business_of_month');
      const superstarVote = votes.find(v => v.votingCategory === 'customer_service_superstar');

      return res.json({
        canVote: true,
        votingMonth: votingPeriod.votingMonth,
        targetMonth: votingPeriod.targetMonth,
        deadline: votingPeriod.deadline,
        hasVoted: {
          business_of_month: !!businessVote,
          customer_service_superstar: !!superstarVote
        },
        votes: {
          business_of_month: businessVote ? {
            nominationId: businessVote.nominationId,
            businessName: businessVote.nomination.businessName,
            votedAt: businessVote.createdAt
          } : null,
          customer_service_superstar: superstarVote ? {
            nominationId: superstarVote.nominationId,
            name: superstarVote.nomination.name,
            businessName: superstarVote.nomination.businessName,
            votedAt: superstarVote.createdAt
          } : null
        }
      });
    } catch (error: any) {
      console.error('❌ Error getting voting status:', error);
      return res.status(500).json({
        error: 'Failed to get voting status',
        details: error.message
      });
    }
  }

  /**
   * Helper: Get yearly voting period details
   * Yearly voting is only available October 1-20
   */
  private getYearlyVotingPeriodDetails(now: Date = new Date()) {
    const currentMonth = now.getMonth(); // 0-11 (October = 9)
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    
    // Only allow voting in October (month 9)
    if (currentMonth !== 9) {
      return {
        canVote: false,
        votingYear: null,
        error: 'Yearly voting is only available in October'
      };
    }
    
    // Check if within voting window (1st-20th)
    if (currentDay < 1 || currentDay > 20) {
      return {
        canVote: false,
        votingYear: null,
        error: 'Yearly voting is only available October 1-20'
      };
    }
    
    return {
      canVote: true,
      votingYear: currentYear,
      deadline: new Date(currentYear, 9, 20) // October 20th
    };
  }

  /**
   * Get monthly winners (nominees with highest votes) from Jan-Oct for yearly voting
   */
  async getYearlyVotingNominations(req: Request, res: Response) {
    try {
      const user = req.user;
      
      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is a board member, moderator, or admin
      if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'board_member') {
        return res.status(403).json({ error: 'Only board members can access yearly voting' });
      }

      // Check yearly voting period
      const votingPeriod = this.getYearlyVotingPeriodDetails();
      if (!votingPeriod.canVote) {
        return res.json({ 
          canVote: false,
          error: votingPeriod.error
        });
      }

      const currentYear = votingPeriod.votingYear!;
      
      // Get monthly winners from Jan-Oct
      // Remember: January winners were voted in December of previous year
      // February winners voted in January, ..., October winners voted in September
      const monthlyWinners: any = {
        business_of_month: [],
        customer_service_superstar: []
      };

      // For each month Jan-Oct (voting months Dec-Sep of current year)
      for (let targetMonth = 1; targetMonth <= 10; targetMonth++) {
        // Calculate the voting month (previous month)
        let votingMonth: number;
        let votingYear: number;
        
        if (targetMonth === 1) {
          // January winners were voted in December of previous year
          votingMonth = 12;
          votingYear = currentYear - 1;
        } else {
          votingMonth = targetMonth - 1;
          votingYear = currentYear;
        }
        
        const votingMonthStr = `${votingYear}-${String(votingMonth).padStart(2, '0')}`;
        
        // Get winner for each category this month
        for (const category of ['business_of_month', 'customer_service_superstar']) {
          // Find nomination with most votes for this month/category
          const winner = await prisma.nomination.findFirst({
            where: {
              category: category,
              status: 'approved'
            },
            include: {
              votes: {
                where: {
                  votingMonth: votingMonthStr,
                  votingCategory: category,
                  voteType: 'monthly',
                  voteValue: true
                }
              }
            },
            orderBy: {
              votes: {
                _count: 'desc'
              }
            }
          });

          if (winner && winner.votes.length > 0) {
            monthlyWinners[category].push({
              id: winner.id,
              name: winner.name,
              businessName: winner.businessName,
              reason: winner.reason,
              category: winner.category,
              monthlyVoteCount: winner.votes.length,
              winningMonth: targetMonth,
              votingMonth: votingMonthStr,
              createdAt: winner.createdAt
            });
          }
        }
      }

      return res.json({
        canVote: true,
        votingYear: currentYear,
        deadline: votingPeriod.deadline,
        nominations: monthlyWinners
      });
    } catch (error: any) {
      console.error('❌ Error getting yearly voting nominations:', error);
      return res.status(500).json({
        error: 'Failed to get yearly voting nominations',
        details: error.message
      });
    }
  }

  /**
   * Get yearly voting status for current user
   */
  async getYearlyVotingStatus(req: Request, res: Response) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is a board member, moderator, or admin
      if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'board_member') {
        return res.status(403).json({ error: 'Only board members can access yearly voting' });
      }

      // Check yearly voting period
      const votingPeriod = this.getYearlyVotingPeriodDetails();
      if (!votingPeriod.canVote) {
        return res.json({ 
          canVote: false,
          error: votingPeriod.error
        });
      }

      const votingYear = String(votingPeriod.votingYear);
      const userId = this.getUserId(user);

      // Get user's yearly votes
      const votes = await prisma.vote.findMany({
        where: {
          userId: userId,
          votingMonth: votingYear, // For yearly votes, store year in votingMonth field
          voteType: 'yearly'
        },
        include: {
          nomination: true
        }
      });

      const businessVote = votes.find(v => v.votingCategory === 'business_of_month');
      const superstarVote = votes.find(v => v.votingCategory === 'customer_service_superstar');

      return res.json({
        canVote: true,
        votingYear: votingPeriod.votingYear,
        deadline: votingPeriod.deadline,
        hasVoted: {
          business_of_month: !!businessVote,
          customer_service_superstar: !!superstarVote
        },
        votes: {
          business_of_month: businessVote ? {
            nominationId: businessVote.nominationId,
            businessName: businessVote.nomination.businessName,
            votedAt: businessVote.createdAt
          } : null,
          customer_service_superstar: superstarVote ? {
            nominationId: superstarVote.nominationId,
            name: superstarVote.nomination.name,
            businessName: superstarVote.nomination.businessName,
            votedAt: superstarVote.createdAt
          } : null
        }
      });
    } catch (error: any) {
      console.error('❌ Error getting yearly voting status:', error);
      return res.status(500).json({
        error: 'Failed to get yearly voting status',
        details: error.message
      });
    }
  }

  /**
   * Submit a yearly vote on a nomination
   */
  async voteOnYearlyNomination(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const nominationId = parseInt(id);
      const user = req.user;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is a board member, moderator, or admin
      if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'board_member') {
        return res.status(403).json({ error: 'Only board members can vote on yearly winners' });
      }

      // Check yearly voting period
      const votingPeriod = this.getYearlyVotingPeriodDetails();
      if (!votingPeriod.canVote) {
        return res.status(403).json({ error: votingPeriod.error });
      }

      // Get the nomination
      const nomination = await prisma.nomination.findUnique({
        where: { id: nominationId }
      });

      if (!nomination) {
        return res.status(404).json({ error: 'Nomination not found' });
      }

      const votingYear = String(votingPeriod.votingYear);
      const votingCategory = nomination.category;
      const userId = this.getUserId(user);

      // Check if user has already voted for this category this year
      const existingVote = await prisma.vote.findFirst({
        where: {
          userId: userId,
          votingMonth: votingYear, // Store year in votingMonth for yearly votes
          votingCategory: votingCategory,
          voteType: 'yearly'
        }
      });

      if (existingVote) {
        return res.status(400).json({
          error: 'You have already voted for this category this year',
          votedFor: {
            nominationId: existingVote.nominationId
          }
        });
      }

      // Create the vote
      const vote = await prisma.vote.create({
        data: {
          nominationId,
          userId: userId,
          votingMonth: votingYear,
          votingCategory,
          voteType: 'yearly',
          voteValue: true
        },
        include: {
          nomination: true
        }
      });

      return res.status(201).json({
        message: 'Yearly vote submitted successfully',
        vote: {
          id: vote.id,
          nominationId: vote.nominationId,
          businessName: vote.nomination.businessName,
          name: vote.nomination.name,
          votingYear: votingYear,
          category: votingCategory
        }
      });
    } catch (error: any) {
      console.error('❌ Error submitting yearly vote:', error);
      return res.status(500).json({
        error: 'Failed to submit yearly vote',
        details: error.message
      });
    }
  }

  /**
   * Get previous yearly winners (for display outside voting period)
   */
  async getYearlyWinners(req: Request, res: Response) {
    try {
      const { year } = req.query;
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear() - 1;

      const yearStr = String(targetYear);

      // Get winners for each category
      const winners: any = {
        business_of_month: null,
        customer_service_superstar: null,
        year: targetYear
      };

      for (const category of ['business_of_month', 'customer_service_superstar']) {
        const winner = await prisma.nomination.findFirst({
          where: {
            category: category,
            status: 'approved'
          },
          include: {
            votes: {
              where: {
                votingMonth: yearStr,
                votingCategory: category,
                voteType: 'yearly',
                voteValue: true
              }
            }
          },
          orderBy: {
            votes: {
              _count: 'desc'
            }
          }
        });

        if (winner && winner.votes.length > 0) {
          winners[category] = {
            id: winner.id,
            name: winner.name,
            businessName: winner.businessName,
            reason: winner.reason,
            voteCount: winner.votes.length,
            createdAt: winner.createdAt
          };
        }
      }

      return res.json(winners);
    } catch (error: any) {
      console.error('❌ Error getting yearly winners:', error);
      return res.status(500).json({
        error: 'Failed to get yearly winners',
        details: error.message
      });
    }
  }
}

export const nominationsController = new NominationsController();
