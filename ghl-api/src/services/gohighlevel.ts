/**
 * GoHighLevel Integration Service
 * Manages contact creation, tagging, and payment processing
 */

import axios, { AxiosInstance } from 'axios';

interface ContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  website?: string;
  businessName?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

interface PaymentLinkData {
  contactId: string;
  amount: number;
  currency: string;
  description: string;
  membershipTier: string;
  successUrl?: string;
  cancelUrl?: string;
}

class GoHighLevelService {
  private client: AxiosInstance | null;
  private locationId: string;
  private developmentMode: boolean;

  constructor() {
    // Debug: Log environment variables
    console.log('🔍 GoHighLevel Debug:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PRIVATE_INTEGRATION_TOKEN:', process.env.PRIVATE_INTEGRATION_TOKEN ? 'SET' : 'NOT SET');
    console.log('LOCATION_ID:', process.env.LOCATION_ID ? 'SET' : 'NOT SET');
    
    this.developmentMode = process.env.NODE_ENV === 'development' || !process.env.PRIVATE_INTEGRATION_TOKEN || !process.env.LOCATION_ID;
    console.log('Development Mode:', this.developmentMode);
    
    if (this.developmentMode) {
      console.log('🚧 GoHighLevel service running in DEVELOPMENT MODE (mock responses)');
      this.locationId = 'dev-location-id';
      this.client = null;
    } else {
      if (!process.env.PRIVATE_INTEGRATION_TOKEN) {
        throw new Error('PRIVATE_INTEGRATION_TOKEN is required');
      }
      
      if (!process.env.LOCATION_ID) {
        throw new Error('LOCATION_ID is required');
      }

      this.client = axios.create({
        baseURL: process.env.GHL_API_BASE_URL || 'https://services.leadconnectorhq.com',
        headers: {
          'Authorization': `Bearer ${process.env.PRIVATE_INTEGRATION_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': '2021-04-15',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      
      this.locationId = process.env.LOCATION_ID;
    }
  }

  /**
   * Create a new contact in GoHighLevel
   */
  async createContact(contactData: ContactData): Promise<string> {
    if (this.developmentMode) {
      // Mock response for development
      const mockContactId = `dev_contact_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      console.log('🚧 DEV MODE: Mock contact created with ID:', mockContactId);
      console.log('📋 Mock contact data:', JSON.stringify(contactData, null, 2));
      return mockContactId;
    }

    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      // Use the exact format that works from your successful curl command
      const payload = {
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        locationId: this.locationId,
        source: contactData.source || 'RACC Membership Portal',
        country: 'US',
        ...(contactData.phone && { phone: contactData.phone.replace(/\D/g, '') }), // Remove non-digits
        ...(contactData.businessName && { companyName: contactData.businessName }),
        ...(contactData.website && { website: contactData.website }),
      };

      console.log('📤 Creating GHL contact with payload:', JSON.stringify(payload, null, 2));

      const response = await this.client.post('/contacts/', payload);
      
      if (response.data && response.data.contact && response.data.contact.id) {
        console.log('✅ Successfully created GHL contact:', response.data.contact.id);
        
        // Add tags if provided
        if (contactData.tags && contactData.tags.length > 0) {
          try {
            await this.updateContactTags(response.data.contact.id, contactData.tags, 'add');
          } catch (tagError) {
            console.error('⚠️ Failed to add tags, but contact was created:', tagError);
          }
        }
        
        return response.data.contact.id;
      } else {
        console.error('Unexpected GHL contact creation response:', response.data);
        throw new Error('Failed to create contact - invalid response');
      }
    } catch (error: any) {
      console.error('❌ Failed to create GHL contact:', error.message);
      
      if (error.response) {
        console.error('API Response Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Handle duplicate email case
        if (error.response.status === 409 || 
            (error.response.data && error.response.data.message && error.response.data.message.includes('already exists'))) {
          // Try to find existing contact by email
          const existingContact = await this.findContactByEmail(contactData.email);
          if (existingContact) {
            console.log('✅ Using existing GHL contact:', existingContact.id);
            return existingContact.id;
          }
        }
      }
      
      throw new Error(`Failed to create contact in GoHighLevel: ${error.message}`);
    }
  }

  /**
   * Check if a user is active (has "active" tag) in GoHighLevel
   */
  async isUserActive(email: string): Promise<{ isActive: boolean; contact?: any }> {
    console.log(`🔍 Checking if user ${email} has 'active' tag in GoHighLevel...`);
    
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Mock active check for email: ${email}`);
      return { 
        isActive: true, // Allow all users in dev mode
        contact: {
          id: `dev_contact_${Date.now()}`,
          email: email,
          firstName: 'Dev',
          lastName: 'User',
          tags: ['active']
        }
      };
    }

    try {
      const contact = await this.findContactByEmail(email);
      
      if (!contact) {
        console.log(`❌ No contact found for email: ${email}`);
        return { isActive: false };
      }

      console.log(`✅ Found contact:`, {
        id: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        tags: contact.tags
      });

      // Check if contact has "active" tag
      const hasActiveTag = contact.tags && contact.tags.includes('active');
      
      console.log(`🏷️ Contact tags:`, contact.tags);
      console.log(`✓ Has 'active' tag:`, hasActiveTag);

      return {
        isActive: hasActiveTag,
        contact: contact
      };

    } catch (error: any) {
      console.error('❌ Failed to check user active status:', error);
      return { isActive: false };
    }
  }

  /**
   * Find contact by email using the proper search contacts API
   */
  async findContactByEmail(email: string): Promise<any> {
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Mock search for contact with email: ${email}`);
      return null; // No existing contact in dev mode
    }

    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      console.log(`🔍 Searching for contact with email: ${email} using search API`);
      
      // Use the proper search contacts endpoint
      const searchBody = {
        filters: [
          {
            field: "email",
            operator: "eq",
            value: email
          }
        ],
        locationId: this.locationId,
        pageLimit: 1
      };
      
      console.log(`� Search request body:`, JSON.stringify(searchBody, null, 2));
      
      const response = await this.client.post('/contacts/search', searchBody);
      
      console.log(`📡 GoHighLevel search response:`, {
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        contactsCount: response.data?.contacts?.length || 0,
        total: response.data?.total || 0
      });

      if (response.data && response.data.contacts && response.data.contacts.length > 0) {
        const contact = response.data.contacts[0];
        console.log(`✅ Found contact in GoHighLevel:`, {
          id: contact.id,
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          tags: contact.tags,
          allContactData: contact
        });
        return contact;
      }
      
      console.log(`❌ No contact found in GoHighLevel for email: ${email}`);
      return null;
    } catch (error: any) {
      console.error('Failed to search for contact by email:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Update contact tags
   */
  async updateContactTags(contactId: string, tags: string[], action: 'add' | 'remove' = 'add'): Promise<void> {
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: ${action}ing tags for contact ${contactId}:`, tags);
      return;
    }

    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      if (action === 'add') {
        await this.client.post(`/contacts/${contactId}/tags`, { tags });
      } else {
        await this.client.delete(`/contacts/${contactId}/tags`, { data: { tags } });
      }
      
      console.log(`Successfully ${action}ed tags for contact ${contactId}:`, tags);
    } catch (error: any) {
      console.error(`Failed to ${action} tags for contact:`, error);
      throw new Error(`Failed to ${action} contact tags: ${error.message}`);
    }
  }

  /**
   * Activate member (set active tag and remove pending tags)
   */
  async activateMember(contactId: string, membershipTier: string = 'standard'): Promise<void> {
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Activating member ${contactId} with tier ${membershipTier}`);
      return;
    }

    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      // Remove pending/prospect tags
      await this.updateContactTags(contactId, ['prospect', 'pending', 'new-member'], 'remove');
      
      // Add active member tags
      await this.updateContactTags(contactId, ['active', 'member', `tier-${membershipTier}`], 'add');
      
      // Update contact with custom fields (this might need to be adjusted based on GHL API)
      await this.client.put(`/contacts/${contactId}`, {
        customFields: [
          { key: 'Member Status', field_value: 'active' },
          { key: 'Membership Tier', field_value: membershipTier },
          { key: 'Activation Date', field_value: new Date().toISOString() }
        ]
      });

      console.log(`Successfully activated member ${contactId} with tier ${membershipTier}`);
    } catch (error: any) {
      console.error('Failed to activate member:', error);
      throw new Error(`Failed to activate member: ${error.message}`);
    }
  }

  /**
   * Create a subscription order for membership registration
   * This uses GoHighLevel's order/product system for recurring subscriptions
   */
  async createPaymentLink(paymentData: PaymentLinkData): Promise<string> {
    if (this.developmentMode) {
      const mockPaymentLink = `https://dev-payments.racc.com/pay/${paymentData.contactId}?amount=${paymentData.amount}&tier=${paymentData.membershipTier}`;
      console.log(`🚧 DEV MODE: Mock payment link created:`, mockPaymentLink);
      return mockPaymentLink;
    }

    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      // First, try to find existing products/subscriptions for this tier
      console.log('🔍 Checking for existing GHL products...');
      const products = await this.getProducts();
      const membershipProduct = products.find((p: any) => 
        p.name?.toLowerCase().includes(paymentData.membershipTier.toLowerCase()) ||
        p.title?.toLowerCase().includes(paymentData.membershipTier.toLowerCase()) ||
        p.description?.toLowerCase().includes(paymentData.membershipTier.toLowerCase())
      );

      if (membershipProduct) {
        console.log('✅ Found existing product:', membershipProduct.name || membershipProduct.title);
        
        // Create an order for an existing product using GHL's order system
        const orderPayload = {
          locationId: this.locationId,
          contactId: paymentData.contactId,
          productId: membershipProduct.id,
          quantity: 1,
          paymentMode: 'subscription', // For recurring membership
          successUrl: paymentData.successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/membership/success`,
          cancelUrl: paymentData.cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/membership/cancel`,
          metadata: {
            membershipTier: paymentData.membershipTier,
            registrationDate: new Date().toISOString(),
            source: 'RACC Membership Portal'
          }
        };

        console.log('📦 Creating GHL order with existing product:', JSON.stringify(orderPayload, null, 2));

        const result = await this.client.post('/orders', orderPayload, {
          headers: {
            'Version': '2021-07-28'
          }
        });

        return result.data?.checkoutUrl || result.data?.paymentUrl || result.data?.url;
      } else {
        console.log('❌ No matching product found, creating custom order...');
        
        // Create a custom order/invoice if no product exists
        const customOrderPayload = {
          locationId: this.locationId,
          contactId: paymentData.contactId,
          name: `RACC ${paymentData.membershipTier.charAt(0).toUpperCase() + paymentData.membershipTier.slice(1)} Membership`,
          amount: Math.round(paymentData.amount * 100), // Convert to cents
          currency: paymentData.currency || 'USD',
          description: paymentData.description || `Monthly ${paymentData.membershipTier} membership subscription`,
          paymentMode: 'subscription',
          intervalUnit: 'month',
          intervalCount: 1,
          successUrl: paymentData.successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/membership/success`,
          cancelUrl: paymentData.cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/membership/cancel`,
          metadata: {
            membershipTier: paymentData.membershipTier,
            source: 'RACC Membership Portal',
            registrationDate: new Date().toISOString()
          }
        };

        console.log('💳 Creating GHL custom subscription order:', JSON.stringify(customOrderPayload, null, 2));

        // Try multiple potential endpoints for order creation
        const endpoints = ['/payments/orders', '/orders', '/subscriptions', '/payments/subscriptions'];
        
        for (const endpoint of endpoints) {
          try {
            const result = await this.client.post(endpoint, customOrderPayload, {
              headers: {
                'Version': '2021-07-28'
              }
            });
            
            const paymentUrl = result.data?.checkoutUrl || result.data?.paymentUrl || result.data?.paymentLink || result.data?.url;
            if (paymentUrl) {
              console.log(`✅ Successfully created order via ${endpoint}:`, paymentUrl);
              return paymentUrl;
            }
          } catch (endpointError: any) {
            console.log(`❌ Endpoint ${endpoint} failed:`, endpointError.response?.status, endpointError.response?.data?.message || endpointError.message);
            continue;
          }
        }

        // If all endpoints fail, create a fallback payment URL
        throw new Error('All payment endpoints failed');
      }
    } catch (error: any) {
      console.error('Failed to create GHL subscription order:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Fallback to a GHL payment form URL with parameters
      const fallbackUrl = `https://link.gohighlevel.com/widget/form/${this.locationId}?contact=${paymentData.contactId}&amount=${paymentData.amount}&description=${encodeURIComponent(paymentData.description)}&tier=${paymentData.membershipTier}`;
      console.log('🔄 Using fallback payment URL:', fallbackUrl);
      return fallbackUrl;
    }
  }

  /**
   * Get available products/subscriptions from GoHighLevel
   */
  private async getProducts(): Promise<any[]> {
    if (!this.client) {
      return [];
    }

    try {
      console.log('📋 Fetching GHL products for location:', this.locationId);
      
      const result = await this.client.get(`/membership/locations/${this.locationId}/user-purchase/get-all-products`, {
        headers: {
          'Version': '2021-04-15', // Using the version from the API collection
          'Channel': 'APP'
        }
      });
      
      const products = result.data?.products || result.data || [];
      console.log(`📦 Found ${products.length} products:`, products.map((p: any) => p.name || p.title).join(', '));
      return products;
    } catch (error: any) {
      console.warn('⚠️ Could not fetch GHL products:', error.response?.status, error.response?.data?.message || error.message);
      return [];
    }
  }

  /**
   * Handle payment webhook (when payment is completed)
   */
  async handlePaymentSuccess(contactId: string, paymentData: any): Promise<void> {
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Processing payment success for contact ${contactId}`, paymentData);
      return;
    }

    try {
      const membershipTier = paymentData.membershipTier || 'standard';
      
      // Activate the member
      await this.activateMember(contactId, membershipTier);
      
      // Update payment custom fields
      await this.client.put(`/contacts/${contactId}`, {
        customFields: [
          { key: 'Payment Status', field_value: 'completed' },
          { key: 'Payment Date', field_value: new Date().toISOString() },
          { key: 'Payment Amount', field_value: (paymentData.amount || 0).toString() },
          { key: 'Payment ID', field_value: paymentData.paymentId || '' },
          { key: 'Member Status', field_value: 'active' }
        ]
      }, {
        headers: {
          'Version': '2021-07-28'
        }
      });

      console.log(`Payment processed successfully for contact ${contactId}`);
    } catch (error: any) {
      console.error('Failed to handle payment success:', error);
      throw new Error(`Failed to process payment success: ${error.message}`);
    }
  }

  /**
   * Get contact details
   */
  async getContact(contactId: string): Promise<any> {
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Mock get contact ${contactId}`);
      return {
        id: contactId,
        firstName: 'Mock',
        lastName: 'Contact',
        email: 'mock@example.com',
        phone: '555-0123',
        tags: ['active', 'member']
      };
    }

    try {
      const result = await this.client.get(`/contacts/${contactId}`, {
        headers: {
          'Version': '2021-07-28'
        }
      });
      return result.data.contact || result.data;
    } catch (error: any) {
      console.error('Failed to get contact:', error);
      throw new Error(`Failed to get contact: ${error.message}`);
    }
  }

  /**
   * Update contact information
   */
  async updateContact(contactId: string, updateData: Partial<ContactData>): Promise<void> {
    console.log(`🔧 updateContact called with developmentMode: ${this.developmentMode}`);
    console.log(`🔧 Update data:`, updateData);
    
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Mock update contact ${contactId}`, updateData);
      return;
    }

    try {
      const payload = {
        ...updateData,
        customFields: updateData.customFields ? Object.entries(updateData.customFields).map(([key, value]) => ({
          key,
          field_value: value
        })) : []
      };

      console.log(`🔧 Sending PUT request to /contacts/${contactId} with payload:`, payload);
      
      await this.client.put(`/contacts/${contactId}`, payload, {
        headers: {
          'Version': '2021-07-28'
        }
      });
      console.log(`✅ Successfully updated contact ${contactId}`);
    } catch (error: any) {
      console.error('❌ Failed to update contact:', error);
      throw new Error(`Failed to update contact: ${error.message}`);
    }
  }

  /**
   * Get all contacts from GoHighLevel (no filtering)
   * @returns Promise<any[]> Array of all contacts
   */
  async getAllContacts(): Promise<any[]> {
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Mock fetching all contacts`);
      // Return mock data for development
      return [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '(435) 555-0101',
          tags: ['member'],
          dateAdded: '2023-01-15T00:00:00.000Z',
          customFields: [
            { id: 'memberSince', value: '2023-01-15' },
            { id: 'specialties', value: 'Business Development, Marketing' }
          ]
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '(435) 555-0102',
          tags: ['active', 'board'],
          dateAdded: '2022-11-20T00:00:00.000Z',
          customFields: [
            { id: 'memberSince', value: '2022-11-20' },
            { id: 'specialties', value: 'Real Estate, Investment' }
          ]
        }
      ];
    }

    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      console.log(`🔍 Fetching all contacts from GoHighLevel...`);
      // Fetch all contacts for the location
      const response = await this.client.get(`/contacts/?locationId=${this.locationId}`);

      if (response.data && response.data.contacts) {
        console.log(`📊 Retrieved ${response.data.contacts.length} total contacts from GoHighLevel`);
        return response.data.contacts;
      }
      
      return [];
    } catch (error: any) {
      console.error('Failed to fetch all contacts:', error);
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }
  }

  /**
   * Get contacts with specific tags (with pagination support)
   */
  async getContactsWithTags(tags: string[] = ['active'], limit: number = 20): Promise<any[]> {
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Mock fetching contacts with tags:`, tags);
      // Return mock active members for development
      return [
        {
          id: 'mock_contact_1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'admin@racc.com',
          phone: '(435) 555-0101',
          website: 'https://johnsonrealestate.com',
          businessName: 'Johnson Real Estate Group',
          tags: ['active', 'admin', 'founding-member'],
          dateAdded: '2020-01-15T00:00:00.000Z',
          customFields: [
            { id: 'memberSince', value: '2020-01-15' },
            { id: 'specialties', value: 'Commercial Real Estate, Property Management' },
            { id: 'bio', value: 'Leading commercial real estate expert in Richfield with over 15 years of experience.' }
          ]
        },
        {
          id: 'mock_contact_2',
          firstName: 'Michael',
          lastName: 'Davis',
          email: 'demo@racc.com',
          phone: '(435) 555-0102',
          website: 'https://davisconstruction.com',
          businessName: 'Davis Construction LLC',
          tags: ['active', 'member'],
          dateAdded: '2021-03-22T00:00:00.000Z',
          customFields: [
            { id: 'memberSince', value: '2021-03-22' },
            { id: 'specialties', value: 'Residential Construction, Home Renovation' },
            { id: 'bio', value: 'Quality construction services for Central Utah families and businesses.' }
          ]
        },
        {
          id: 'mock_contact_3',
          firstName: 'Jennifer',
          lastName: 'Smith',
          email: 'moderator@racc.com',
          phone: '(435) 555-0103',
          website: 'https://smithfinancial.com',
          businessName: 'Smith Financial Services',
          tags: ['active', 'moderator'],
          dateAdded: '2019-08-10T00:00:00.000Z',
          customFields: [
            { id: 'memberSince', value: '2019-08-10' },
            { id: 'specialties', value: 'Financial Planning, Insurance, Investment Management' },
            { id: 'bio', value: 'Helping Central Utah families and businesses achieve their financial goals.' }
          ]
        }
      ];
    }

    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      let allContacts: any[] = [];
      let page = 1;
      const pageSize = 20; // GHL API hard limit
      let hasMore = true;

      while (hasMore && allContacts.length < limit) {
        console.log(`Fetching contacts page ${page} (pageSize: ${pageSize}), total so far: ${allContacts.length}`);
        
        const response = await this.client.get(
          `/contacts/?locationId=${this.locationId}&limit=${pageSize}&page=${page}`
        );

        if (response.data && response.data.contacts) {
          const contacts = response.data.contacts;
          console.log(`Received ${contacts.length} contacts from API on page ${page}`);
          
          // Filter contacts by tags
          const filteredContacts = contacts.filter((contact: any) => {
            if (!contact.tags || !Array.isArray(contact.tags)) return false;
            // All requested tags must be present
            return tags.every(tag => contact.tags.includes(tag));
          });

          console.log(`After filtering by tags [${tags.join(', ')}]: ${filteredContacts.length} contacts`);
          allContacts.push(...filteredContacts);
          
          // Check if we have enough contacts or if there are more pages
          hasMore = contacts.length === pageSize && allContacts.length < limit;
          console.log(`hasMore: ${hasMore} (received ${contacts.length}, pageSize: ${pageSize}, total found: ${allContacts.length})`);
          page++;

          // Stop early if we've reached our limit
          if (allContacts.length >= limit) {
            console.log(`✅ Reached target limit of ${limit} contacts, stopping early`);
            break;
          }

          // Add small delay to avoid rate limiting
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Fetched ${allContacts.length} contacts with tags [${tags.join(', ')}]`);
      
      // Return up to the requested limit
      return allContacts.slice(0, limit);
    } catch (error: any) {
      console.error('Failed to fetch contacts with tags:', error);
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }
  }

  /**
   * Get contacts with 'active' tag and at least one membership package tag
   * Using GoHighLevel's search API for server-side filtering
   */
  async getContactsWithMembershipTags(limit: number = 10000): Promise<any[]> {
    const membershipPackageTags = [
      'basic membership package',
      'enhanced membership package', 
      'elite membership package'
    ];

    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Mock fetching contacts with active + membership package tags`);
      // Return mock members with membership package tags for development
      return [
        {
          id: 'mock_contact_1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'admin@racc.com',
          phone: '(435) 555-0101',
          website: 'https://johnsonrealestate.com',
          businessName: 'Johnson Real Estate Group',
          tags: ['active', 'admin', 'basic membership package'],
          dateAdded: '2020-01-15T00:00:00.000Z',
          customFields: [
            { id: 'memberSince', value: '2020-01-15' },
            { id: 'specialties', value: 'Commercial Real Estate, Property Management' },
            { id: 'bio', value: 'Leading commercial real estate expert in Richfield with over 15 years of experience.' }
          ]
        },
        {
          id: 'mock_contact_2',
          firstName: 'Michael',
          lastName: 'Davis',
          email: 'demo@racc.com',
          phone: '(435) 555-0102',
          website: 'https://davisconstruction.com',
          businessName: 'Davis Construction LLC',
          tags: ['active', 'member', 'enhanced membership package'],
          dateAdded: '2021-03-22T00:00:00.000Z',
          customFields: [
            { id: 'memberSince', value: '2021-03-22' },
            { id: 'specialties', value: 'Residential Construction, Home Renovation' },
            { id: 'bio', value: 'Quality construction services for Central Utah families and businesses.' }
          ]
        },
        {
          id: 'mock_contact_3',
          firstName: 'Jennifer',
          lastName: 'Smith',
          email: 'moderator@racc.com',
          phone: '(435) 555-0103',
          website: 'https://smithfinancial.com',
          businessName: 'Smith Financial Services',
          tags: ['active', 'moderator', 'elite membership package'],
          dateAdded: '2019-08-10T00:00:00.000Z',
          customFields: [
            { id: 'memberSince', value: '2019-08-10' },
            { id: 'specialties', value: 'Financial Planning, Insurance, Investment Management' },
            { id: 'bio', value: 'Helping Central Utah families and businesses achieve their financial goals.' }
          ]
        }
      ];
    }

    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    // Use GoHighLevel's search API with tag filters for server-side filtering
    console.log(`🎯 Using GHL search API to filter contacts with active + membership package tags...`);
    
    try {
      let allContacts: any[] = [];
      let page = 1;
      const pageLimit = 100; // Use larger page size for search API
      let hasMore = true;

      while (hasMore && allContacts.length < limit) {
        console.log(`Searching contacts page ${page} with server-side tag filtering...`);
        
        // Build search filters for GoHighLevel API
        const searchBody = {
          locationId: this.locationId,
          page: page,
          pageLimit: pageLimit,
          filters: [
            {
              group: "AND",
              filters: [
                // Must have 'active' tag
                {
                  field: "tags",
                  operator: "contains",
                  value: "active"
                },
                // Must have at least one membership package tag (OR condition)
                {
                  group: "OR",
                  filters: membershipPackageTags.map(tag => ({
                    field: "tags",
                    operator: "contains", 
                    value: tag
                  }))
                }
              ]
            }
          ]
        };

        console.log(`🔍 Search request:`, JSON.stringify(searchBody, null, 2));

        const response = await this.client.post('/contacts/search', searchBody);

        if (response.data && response.data.contacts) {
          const contacts = response.data.contacts;
          console.log(`✅ Received ${contacts.length} filtered contacts from GHL search API on page ${page}`);
          console.log(`📊 Total matching contacts in GHL: ${response.data.total || 'unknown'}`);
          
          allContacts.push(...contacts);
          
          // Check if we have more pages
          hasMore = contacts.length === pageLimit && allContacts.length < limit;
          console.log(`hasMore: ${hasMore} (received ${contacts.length}, pageLimit: ${pageLimit}, total collected: ${allContacts.length})`);
          page++;

          // Stop early if we've reached our limit
          if (allContacts.length >= limit) {
            console.log(`✅ Reached target limit of ${limit} contacts, stopping early`);
            break;
          }

          // Add small delay to avoid rate limiting
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          console.log(`❌ No contacts found or invalid response structure`);
          hasMore = false;
        }
      }

      console.log(`🎉 Server-side filtered: Found ${allContacts.length} contacts with 'active' + membership package tags`);
      return allContacts.slice(0, limit);
      
    } catch (error: any) {
      console.error('❌ Failed to search contacts with membership tags:', error);
      console.error('Error response:', error.response?.data);
      
      // Fallback to the old method if search API fails
      console.log('🔄 Falling back to client-side filtering...');
      const activeContacts = await this.getContactsWithTags(['active'], limit);
      
      const filteredContacts = activeContacts.filter((contact: any) => {
        if (!contact.tags || !Array.isArray(contact.tags)) return false;
        return membershipPackageTags.some(tag => contact.tags.includes(tag));
      });

      console.log(`⚠️ Fallback: Filtered ${activeContacts.length} active contacts to ${filteredContacts.length} with membership packages`);
      return filteredContacts.slice(0, limit);
    }
  }

  /**
   * Get calendar events from GoHighLevel using the exact format that works in Stoplight
   */
  async getCalendarEvents(calendarId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    console.log(`🔍 Production mode: Fetching real calendar events for calendar: ${calendarId}`);
    console.log(`Development mode status: ${this.developmentMode}`);
    
    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      console.log(`Fetching calendar events for calendar: ${calendarId}`);
      console.log(`Date range: ${startDate?.toISOString()} - ${endDate?.toISOString()}`);
      
      const now = new Date();
      const defaultStartDate = startDate || new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
      const defaultEndDate = endDate || new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days ahead
      
      // Convert dates to timestamps (milliseconds) like the working Stoplight request
      const startTimestamp = defaultStartDate.getTime();
      const endTimestamp = defaultEndDate.getTime();
      
      console.log(`Using timestamps - Start: ${startTimestamp}, End: ${endTimestamp}`);
      
      // Use the exact format that worked in Stoplight
      const params = {
        locationId: this.locationId,
        calendarId: calendarId,
        startTime: startTimestamp,
        endTime: endTimestamp
      };

      console.log(`🔄 Making request to /calendars/events with params:`, params);
      
      const response = await this.client.get('/calendars/events', {
        params: params
      });
      
      console.log(`✅ Success - Status: ${response.status}`);
      console.log(`Response data keys:`, Object.keys(response.data || {}));
      console.log(`Full response data:`, JSON.stringify(response.data, null, 2));
      
      // Handle the events array from response
      const events = response.data?.events || [];
      console.log(`Retrieved ${events.length} events from GoHighLevel`);
      
      // Log first few events for debugging
      if (events.length > 0) {
        console.log(`Sample event data:`, JSON.stringify(events[0], null, 2));
      }
      
      // Return events in the format expected by the frontend
      return events.map((event: any) => ({
        id: event.id,
        title: event.title || 'Untitled Event',
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description || '',
        location: event.address || '',
        calendarId: event.calendarId || calendarId,
        appointmentStatus: event.appointmentStatus,
        contactId: event.contactId,
        locationId: event.locationId,
        isRecurring: event.isRecurring,
        rrule: event.rrule,
        ...event
      }));
      
    } catch (error: any) {
      console.error('Failed to fetch calendar events:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  }
}

// Export singleton instance
export const ghlService = new GoHighLevelService();
export type { ContactData, PaymentLinkData };