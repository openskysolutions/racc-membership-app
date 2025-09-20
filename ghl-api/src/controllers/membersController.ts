/**
 * Members Controller for RACC Membership Portal
 * Handles member directory, profiles, and search functionality
 */

import { Request, Response } from 'express';

interface Member {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  role: string;
  status: string;
  memberSince: string;
  specialties?: string[];
  bio?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

class MembersController {
  private members: Member[];

  constructor() {
    // Demo members data - in production this would connect to a database
    this.members = [
      {
        id: 'member_001',
        email: 'admin@racc.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        businessName: 'Johnson Real Estate Group',
        phone: '(435) 555-0101',
        website: 'https://johnsonrealestate.com',
        avatar: '/profile-placeholder.png',
        role: 'admin',
        status: 'active',
        memberSince: '2020-01-15',
        specialties: ['Commercial Real Estate', 'Property Management'],
        bio: 'Leading commercial real estate expert in Richfield with over 15 years of experience.',
        address: {
          street: '123 Main Street',
          city: 'Richfield',
          state: 'UT',
          zipCode: '84701'
        }
      },
      {
        id: 'member_002',
        email: 'demo@racc.com',
        firstName: 'Michael',
        lastName: 'Davis',
        businessName: 'Davis Construction LLC',
        phone: '(435) 555-0102',
        website: 'https://davisconstruction.com',
        avatar: '/profile-placeholder.png',
        role: 'member',
        status: 'active',
        memberSince: '2021-03-22',
        specialties: ['Residential Construction', 'Home Renovation'],
        bio: 'Quality construction services for Central Utah families and businesses.',
        address: {
          street: '456 Oak Avenue',
          city: 'Richfield',
          state: 'UT',
          zipCode: '84701'
        }
      },
      {
        id: 'member_003',
        email: 'moderator@racc.com',
        firstName: 'Jennifer',
        lastName: 'Smith',
        businessName: 'Smith Financial Services',
        phone: '(435) 555-0103',
        website: 'https://smithfinancial.com',
        avatar: '/profile-placeholder.png',
        role: 'moderator',
        status: 'active',
        memberSince: '2019-08-10',
        specialties: ['Financial Planning', 'Insurance', 'Investment Management'],
        bio: 'Helping Central Utah families and businesses achieve their financial goals.',
        address: {
          street: '789 Pine Street',
          city: 'Richfield',
          state: 'UT',
          zipCode: '84701'
        }
      },
      {
        id: 'member_004',
        email: 'member@racc.com',
        firstName: 'Robert',
        lastName: 'Wilson',
        businessName: 'Wilson Auto Repair',
        phone: '(435) 555-0104',
        website: 'https://wilsonauto.com',
        avatar: '/profile-placeholder.png',
        role: 'member',
        status: 'active',
        memberSince: '2022-01-05',
        specialties: ['Auto Repair', 'Diagnostics', 'Fleet Maintenance'],
        bio: 'Trusted automotive service for the Richfield community since 2022.',
        address: {
          street: '321 Elm Drive',
          city: 'Richfield',
          state: 'UT',
          zipCode: '84701'
        }
      },
      {
        id: 'member_005',
        email: 'lisa.anderson@example.com',
        firstName: 'Lisa',
        lastName: 'Anderson',
        businessName: 'Anderson Marketing Solutions',
        phone: '(435) 555-0105',
        website: 'https://andersonmarketing.com',
        avatar: '/profile-placeholder.png',
        role: 'member',
        status: 'active',
        memberSince: '2021-11-18',
        specialties: ['Digital Marketing', 'Social Media', 'Brand Development'],
        bio: 'Creative marketing solutions for local businesses throughout Central Utah.',
        address: {
          street: '654 Maple Lane',
          city: 'Richfield',
          state: 'UT',
          zipCode: '84701'
        }
      },
      {
        id: 'member_006',
        email: 'david.brown@example.com',
        firstName: 'David',
        lastName: 'Brown',
        businessName: 'Brown\'s Hardware Store',
        phone: '(435) 555-0106',
        website: 'https://brownshardware.com',
        avatar: '/profile-placeholder.png',
        role: 'member',
        status: 'active',
        memberSince: '2018-05-30',
        specialties: ['Hardware', 'Tools', 'Home Improvement'],
        bio: 'Your local hardware store serving Richfield for over 40 years.',
        address: {
          street: '987 Cedar Road',
          city: 'Richfield',
          state: 'UT',
          zipCode: '84701'
        }
      },
      // Test member for contract tests
      {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Member',
        businessName: 'Test Business',
        phone: '(435) 555-0123',
        website: 'https://testbusiness.com',
        avatar: '/profile-placeholder.png',
        role: 'member',
        status: 'active',
        memberSince: '2024-01-01',
        specialties: ['Testing', 'Quality Assurance'],
        bio: 'Test member for contract testing.',
        address: {
          street: '123 Test Street',
          city: 'Richfield',
          state: 'UT',
          zipCode: '84701'
        }
      }
    ];
  }

  /**
   * Get paginated list of active members
   */
  async getMembers(req: Request, res: Response) {
    try {
      const { limit = 20, offset = 0, search = '', role = '' } = req.query;
      
      let filteredMembers = this.members.filter(member => member.status === 'active');
      
      // Filter by search term (name, business, email)
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredMembers = filteredMembers.filter(member => 
          member.firstName?.toLowerCase().includes(searchLower) ||
          member.lastName?.toLowerCase().includes(searchLower) ||
          member.businessName?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower) ||
          member.specialties?.some(s => s.toLowerCase().includes(searchLower))
        );
      }
      
      // Filter by role
      if (role && typeof role === 'string') {
        filteredMembers = filteredMembers.filter(member => member.role === role);
      }
      
      // Apply pagination
      const startIndex = parseInt(offset as string || '0');
      const pageSize = parseInt(limit as string || '20');
      const paginatedMembers = filteredMembers.slice(startIndex, startIndex + pageSize);
      
      res.json({
        members: paginatedMembers,
        total: filteredMembers.length,
        limit: pageSize,
        offset: startIndex
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get member by ID
   */
  async getMemberById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const member = this.members.find(m => m.id === id && m.status === 'active');
      
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      // Add computed fields for API compatibility
      const memberWithComputedFields = {
        ...member,
        name: `${member.firstName} ${member.lastName}`.trim(),
        membershipTier: this.getMembershipTier(member)
      };
      
      res.json(memberWithComputedFields);
    } catch (error) {
      console.error('Error fetching member by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Determine membership tier based on member data
   */
  private getMembershipTier(member: Member): string {
    // Simple logic to determine tier - can be made more sophisticated
    if (member.role === 'admin') return 'Premium';
    if (member.memberSince && new Date(member.memberSince) < new Date('2020-01-01')) {
      return 'Gold';
    }
    return 'Standard';
  }

  /**
   * Search members by email
   */
  async getMemberByEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;
      const member = this.members.find(m => 
        m.email.toLowerCase() === email.toLowerCase() && m.status === 'active'
      );
      
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      res.json(member);
    } catch (error) {
      console.error('Error fetching member by email:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get member statistics (admin only)
   */
  async getMemberStats(req: Request, res: Response) {
    try {
      const activeMembers = this.members.filter(m => m.status === 'active');
      const roleStats = activeMembers.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
      }, {});
      
      const currentYear = new Date().getFullYear();
      const newThisYear = activeMembers.filter(m => 
        new Date(m.memberSince).getFullYear() === currentYear
      ).length;
      
      res.json({
        totalActiveMembers: activeMembers.length,
        roleDistribution: roleStats,
        newMembersThisYear: newThisYear,
        membersBySpecialty: this.getMembersBySpecialty(activeMembers)
      });
    } catch (error) {
      console.error('Error fetching member statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Helper method to group members by specialty
   */
  getMembersBySpecialty(members) {
    const specialtyCount = {};
    
    members.forEach(member => {
      if (member.specialties && Array.isArray(member.specialties)) {
        member.specialties.forEach(specialty => {
          specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
        });
      }
    });
    
    return Object.entries(specialtyCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10); // Top 10 specialties
  }
}

export default new MembersController();
