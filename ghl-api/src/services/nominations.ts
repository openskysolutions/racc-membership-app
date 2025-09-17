// Nominations service - handles business nomination creation and management

/**
 * Service for managing business nominations
 */
export class NominationsService {
  private nominations: Map<string, any>;
  private nextId: number;

  constructor() {
    this.nominations = new Map(); // In-memory storage for now
    this.nextId = 1;
  }

  /**
   * Create a new business nomination
   * @param nominationData - Nomination details
   * @returns Created nomination
   */
  async createNomination(nominationData) {
    // Validate required fields
    if (!nominationData.nomineeName || !nominationData.nomineeContact) {
      throw new Error('Nominee name and contact are required');
    }

    // Validate email format
    if (!this.isValidEmail(nominationData.nomineeContact)) {
      throw new Error('Invalid email format for nominee contact');
    }

    const id = `nom_${this.nextId++}`;
    const nomination = {
      id,
      nomineeName: nominationData.nomineeName.trim(),
      nomineeContact: nominationData.nomineeContact.trim().toLowerCase(),
      submitterId: nominationData.submitterId || null,
      notes: nominationData.notes?.trim() || null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.nominations.set(id, nomination);
    return nomination;
  }

  /**
   * Get nomination by ID
   * @param id - Nomination ID
   * @returns Nomination or null if not found
   */
  async getNomination(id) {
    return this.nominations.get(id) || null;
  }

  /**
   * List nominations with optional filtering
   * @param filters - Optional status filter
   * @returns Array of nominations
   */
  async listNominations(filters) {
    let nominations = Array.from(this.nominations.values());

    if (filters && filters.status) {
      nominations = nominations.filter(nom => nom.status === filters.status);
    }

    // Sort by creation date, newest first
    return nominations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Update nomination status (for moderation)
   * @param id - Nomination ID
   * @param status - New status
   * @param reason - Optional reason for status change
   * @returns Updated nomination
   */
  async updateNominationStatus(
    id, 
    status, 
    reason
  ) {
    const nomination = this.nominations.get(id);
    if (!nomination) {
      throw new Error('Nomination not found');
    }

    if (nomination.status !== 'pending') {
      throw new Error('Can only update pending nominations');
    }

    nomination.status = status;
    // In a real implementation, we might store the reason in a separate field
    
    this.nominations.set(id, nomination);
    return nomination;
  }

  /**
   * Check for duplicate nomination by email
   * @param nomineeContact - Email to check
   * @returns True if duplicate exists
   */
  async isDuplicateNomination(nomineeContact) {
    const normalizedEmail = nomineeContact.trim().toLowerCase();
    const nominations = Array.from(this.nominations.values());
    
    return nominations.some(nom => 
      nom.nomineeContact === normalizedEmail && 
      nom.status === 'pending'
    );
  }

  /**
   * Get nominations submitted by a specific member
   * @param submitterId - Member ID
   * @returns Array of nominations
   */
  async getNominationsBySubmitter(submitterId) {
    const nominations = Array.from(this.nominations.values());
    return nominations.filter(nom => nom.submitterId === submitterId);
  }

  // Private helper methods

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Singleton instance
const nominationsService = new NominationsService();
module.exports = { nominationsService };
