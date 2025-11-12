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

      // Create nomination
      const nomination = await prisma.nomination.create({
        data: {
          type: data.type,
          category: data.category,
          name: data.name,
          businessName: data.businessName,
          reason: data.reason,
          status: 'pending'
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
        voteCount: nom.votes.length,
        averageScore: nom.votes.length > 0
          ? nom.votes.reduce((sum, v) => sum + v.voteValue, 0) / nom.votes.length
          : 0
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

      // Calculate vote statistics
      const voteCount = nomination.votes.length;
      const averageScore = voteCount > 0
        ? nomination.votes.reduce((sum, v) => sum + v.voteValue, 0) / voteCount
        : 0;

      return res.json({
        ...nomination,
        voteCount,
        averageScore
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
   * Cast a vote on a nomination (board members only)
   * POST /nominations/:id/vote
   */
  async voteOnNomination(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { voteValue, comment } = req.body;
      const user = (req as any).user;

      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is a board member or admin
      if (user.role !== 'admin' && user.role !== 'moderator') {
        return res.status(403).json({ error: 'Only board members can vote on nominations' });
      }

      // Validate vote value (1-5)
      if (!voteValue || voteValue < 1 || voteValue > 5) {
        return res.status(400).json({ error: 'Vote value must be between 1 and 5' });
      }

      // Check if nomination exists
      const nomination = await prisma.nomination.findUnique({
        where: { id: parseInt(id) }
      });

      if (!nomination) {
        return res.status(404).json({ error: 'Nomination not found' });
      }

      // Upsert vote (create or update if already exists)
      const vote = await prisma.vote.upsert({
        where: {
          nominationId_userId: {
            nominationId: parseInt(id),
            userId: user.id
          }
        },
        update: {
          voteValue,
          comment,
          updatedAt: new Date()
        },
        create: {
          nominationId: parseInt(id),
          userId: user.id,
          voteValue,
          comment
        }
      });

      console.log(`✅ Vote recorded: User ${user.id} voted ${voteValue} on nomination ${id}`);

      return res.json({
        success: true,
        vote
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

      const voteCount = votes.length;
      const averageScore = voteCount > 0
        ? votes.reduce((sum, v) => sum + v.voteValue, 0) / voteCount
        : 0;

      const voteDistribution = [1, 2, 3, 4, 5].map(score => ({
        score,
        count: votes.filter(v => v.voteValue === score).length
      }));

      return res.json({
        votes,
        voteCount,
        averageScore,
        distribution: voteDistribution
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
}

export const nominationsController = new NominationsController();
