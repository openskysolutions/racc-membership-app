/**
 * Members Controller for RACC Membership Portal
 * Handles member directory, profiles, and search functionality
 */

import { Request, Response } from 'express';
import { ghlService } from '@/services/gohighlevel';

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
  constructor() {
    // Members are now fetched from GoHighLevel instead of mock data
  }

  /**
   * Get list of active members from GoHighLevel
   */
  async getMembers(req: Request, res: Response) {
    try {
      const { search = '', role = '' } = req.query;
      
      // Fetch all active contacts from GoHighLevel once
      const contacts = await ghlService.getContactsWithTags(['active'], 10000);
      
      // Transform GoHighLevel contacts to our Member format
      let transformedMembers = contacts.map(contact => this.transformContactToMember(contact));
      
      // Filter by search term (name, business, email) - only if search is provided
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        transformedMembers = transformedMembers.filter(member => 
          member.firstName?.toLowerCase().includes(searchLower) ||
          member.lastName?.toLowerCase().includes(searchLower) ||
          member.businessName?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower) ||
          member.specialties?.some(s => s.toLowerCase().includes(searchLower))
        );
      }
      
      // Filter by role (based on tags) - only if role is provided
      if (role && typeof role === 'string') {
        transformedMembers = transformedMembers.filter(member => member.role === role);
      }
      
      // Return all members - let frontend handle pagination
      res.json({
        members: transformedMembers,
        total: transformedMembers.length
      });
    } catch (error) {
      console.error('Error fetching members from GoHighLevel:', error);
      res.status(500).json({ error: 'Failed to fetch members', details: error.message });
    }
  }

  /**
   * Transform GoHighLevel contact to Member format
   */
  private transformContactToMember(contact: any): Member {
    // Extract custom field values
    const getCustomField = (fieldId: string) => {
      const field = contact.customFields?.find(f => f.id === fieldId);
      return field?.value || '';
    };

    // Determine role from tags
    const tags = contact.tags || [];
    let role = 'member'; // default
    if (tags.includes('admin')) role = 'admin';
    else if (tags.includes('moderator')) role = 'moderator';

    // Parse specialties from custom field
    const specialtiesStr = getCustomField('specialties');
    const specialties = specialtiesStr ? specialtiesStr.split(',').map(s => s.trim()).filter(s => s) : [];

    return {
      id: contact.id,
      email: contact.email || '',
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      businessName: contact.businessName || contact.companyName || '',
      phone: contact.phone || '',
      website: contact.website || '',
      avatar: '/profile-placeholder.png', // Default avatar
      role,
      status: 'active', // All fetched contacts have 'active' tag
      memberSince: getCustomField('memberSince') || contact.dateAdded?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      specialties,
      bio: getCustomField('bio') || '',
      address: {
        street: contact.address1 || '',
        city: contact.city || '',
        state: contact.state || '',
        zipCode: contact.postalCode || ''
      }
    };
  }

  /**
   * Get member by ID from GoHighLevel
   */
  async getMemberById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Fetch all active contacts and find the specific one
      const contacts = await ghlService.getContactsWithTags(['active'], 100);
      const contact = contacts.find(c => c.id === id);
      
      if (!contact) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      // Transform to member format
      const member = this.transformContactToMember(contact);
      
      // Add computed fields for API compatibility
      const memberWithComputedFields = {
        ...member,
        name: `${member.firstName} ${member.lastName}`.trim(),
        membershipTier: this.getMembershipTier(member)
      };
      
      res.json(memberWithComputedFields);
    } catch (error) {
      console.error('Error fetching member by ID:', error);
      res.status(500).json({ error: 'Failed to fetch member', details: error.message });
    }
  }

  /**
   * Get member by email from GoHighLevel
   */
  async getMemberByEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;
      
      // Use GoHighLevel's direct email search
      const contact = await ghlService.findContactByEmail(email);
      
      if (!contact || !contact.tags?.includes('active')) {
        return res.status(404).json({ error: 'Active member not found' });
      }
      
      // Transform to member format
      const member = this.transformContactToMember(contact);
      
      res.json(member);
    } catch (error) {
      console.error('Error fetching member by email:', error);
      res.status(500).json({ error: 'Failed to fetch member', details: error.message });
    }
  }

  /**
   * Get member statistics (admin only)
   */
  async getMemberStats(req: Request, res: Response) {
    try {
      // Fetch all active members for statistics
      const contacts = await ghlService.getContactsWithTags(['active'], 100);
      const activeMembers = contacts.map(contact => this.transformContactToMember(contact));
      
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
      res.status(500).json({ error: 'Failed to fetch member statistics', details: error.message });
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
   * Helper method to group members by specialty
   */
  private getMembersBySpecialty(members: Member[]) {
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
