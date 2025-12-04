/**
 * GoHighLevel Integration Service
 * Manages contact creation, tagging, and payment processing
 */

import axios, { AxiosInstance } from 'axios';
import { randomBytes } from 'crypto';

interface ContactData {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  website?: string;
  businessName?: string;
  companyName?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  // Direct contact fields from GoHighLevel API
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  // Bio, tagline, coupon codes and cover image will be handled as custom fields
  bio?: string;
  tagline?: string;
  couponCodes?: string;
  coverImage?: string;
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
  
  // Custom Object ID for appointment custom fields
  // Created in GoHighLevel UI, ID: 68f7fab7f044392c0343afd3
  private readonly APPOINTMENT_CUSTOM_OBJECT_ID = '68f7fab7f044392c0343afd3';
  
  // Association key linking custom object to appointments
  // Created by setup-custom-objects.js script
  private readonly APPOINTMENT_ASSOCIATION_KEY = 'appointment_custom_fields_to_appointment';
  
  // Cache for custom fields to avoid repeated slow API calls (25-30s per request!)
  private customFieldsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 600000; // 10 minutes cache TTL (GoHighLevel API is very slow, cache longer)

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
        timeout: 60000, // 60 second timeout (GoHighLevel custom objects API is very slow - 25-30s typical)
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
      
      // DISABLED: Pre-warm takes 25-30 seconds and often times out
      // Custom fields will be fetched on first request and cached
      console.log('⚠️  Custom fields prewarm disabled due to slow GoHighLevel API (25-30s response time)');
      console.log('   Custom fields will be fetched lazily on first request and cached for 10 minutes');
      
      // Schedule first prewarm attempt after 30 seconds (after server is fully up)
      setTimeout(() => {
        console.log('🔄 Attempting background cache prewarm...');
        this.prewarmCustomFieldsCache();
      }, 30000);
    }
  }

  /**
   * Pre-warm the custom fields cache in the background
   * This runs on startup and periodically to keep the cache fresh
   */
  private async prewarmCustomFieldsCache(retryCount = 0): Promise<void> {
    if (!this.client) return;
    
    const maxRetries = 5;
    const retryDelays = [5000, 10000, 30000, 60000, 120000]; // 5s, 10s, 30s, 1m, 2m
    
    try {
      console.log(`🔥 Pre-warming custom fields cache... ${retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : ''}`);
      const startTime = Date.now();
      console.log(`⏱️  [PREWARM] Starting GoHighLevel API call at ${new Date().toISOString()}`);
      
      const response = await this.client.post(
        `/objects/${this.APPOINTMENT_CUSTOM_OBJECT_ID}/records/search`,
        {
          locationId: this.locationId,
          page: 1,
          pageLimit: 100
        }
      );
      
      const apiDuration = Date.now() - startTime;
      console.log(`⏱️  [PREWARM] GoHighLevel API responded after ${apiDuration}ms`);
      
      const records = response.data?.records || response.data?.data || [];
      const now = Date.now();
      this.customFieldsCache.set('all_custom_fields', { data: records, timestamp: now });
      
      const totalDuration = Date.now() - startTime;
      console.log(`✅ Pre-warmed cache with ${records.length} custom field records`);
      console.log(`⏱️  [PREWARM] Total time: ${totalDuration}ms (API: ${apiDuration}ms)`);
      
      // Schedule next refresh in 9 minutes (before 10 minute TTL expires)
      setTimeout(() => this.prewarmCustomFieldsCache(), 540000);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message;
      
      console.error(`❌ Failed to pre-warm custom fields cache (attempt ${retryCount + 1}/${maxRetries + 1}):`, errorMessage);
      console.error(`   Status: ${statusCode}, Custom Object ID: ${this.APPOINTMENT_CUSTOM_OBJECT_ID}`);
      
      if (statusCode === 503) {
        console.error('   ⚠️  GoHighLevel API returned 503 (Service Unavailable) - API may be overloaded or rate limited');
      } else if (statusCode === 404) {
        console.error('   ⚠️  404 Error - Custom Object ID may be incorrect or not accessible');
      } else if (statusCode === 401 || statusCode === 403) {
        console.error('   ⚠️  Authentication error - check PRIVATE_INTEGRATION_TOKEN and LOCATION_ID');
      }
      
      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        const delay = retryDelays[retryCount];
        console.log(`   🔄 Retrying in ${delay / 1000} seconds...`);
        setTimeout(() => this.prewarmCustomFieldsCache(retryCount + 1), delay);
      } else {
        console.error('   ❌ Max retries reached. Custom fields will be fetched on-demand (slower).');
        // Even after max retries, schedule a retry in 5 minutes to try again
        setTimeout(() => this.prewarmCustomFieldsCache(0), 300000);
      }
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
        firstName: contactData.firstName || '',
        lastName: contactData.lastName || '',
        email: contactData.email,
        locationId: this.locationId,
        source: contactData.source || 'RACC Membership Portal',
        country: 'US',
        ...(contactData.phone && { phone: contactData.phone.replace(/\D/g, '') }), // Remove non-digits
        ...(contactData.businessName && { companyName: contactData.businessName }),
        ...(contactData.website && { website: contactData.website }),
      };

      const response = await this.client.post('/contacts/', payload);
      
      if (response.data && response.data.contact && response.data.contact.id) {
        
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
  async isUserActive(email: string): Promise<{ isActive: boolean; contact?: any; reason?: string }> {
    console.log(`🔍 Checking if user ${email} has 'active' tag and valid renewal date in GoHighLevel...`);
    
    if (this.developmentMode) {
      console.log(`🚧 DEV MODE: Mock active check for email: ${email}`);
      return { 
        isActive: true, // Allow all users in dev mode
        contact: {
          id: `dev_contact_${Date.now()}`,
          email: email,
          firstName: 'Dev',
          lastName: 'User',
          tags: ['active', 'admin'] // In dev mode, give admin rights for testing
        }
      };
    }

    try {
      const contact = await this.findContactByEmail(email);
      
      if (!contact) {
        console.log(`❌ No contact found for email: ${email}`);
        return { isActive: false, reason: 'Contact not found' };
      }
      
      // Check if contact has "active" tag
      const hasActiveTag = contact.tags && contact.tags.includes('active');
      
      if (!hasActiveTag) {
        console.log(`❌ Contact ${email} does not have 'active' tag`);
        return { 
          isActive: false, 
          contact: contact,
          reason: 'Missing active tag'
        };
      }

      // Check renewal date - look in multiple possible locations
      console.log(`🔍 [RENEWAL CHECK] Starting renewal date validation for ${email}`);
      let renewDate: Date | null = null;
      let renewDateSource: string = '';
      
      // 1. Check in customFields/customField array by specific ID
      // GoHighLevel returns customFields (plural) from search API, customField from get API
      const customFieldsArray = contact.customFields || contact.customField;
      
      if (customFieldsArray && Array.isArray(customFieldsArray)) {
        const fieldName = contact.customFields ? 'customFields' : 'customField';
        console.log(`🔍 Searching ${fieldName} array for renewal date (ID: J3yL94KqDhUnjurcIG8G)`);
        console.log(`📋 ${fieldName} array contents:`, JSON.stringify(customFieldsArray, null, 2));
        
        const renewDateField = customFieldsArray.find((field: any) => 
          field.id === 'J3yL94KqDhUnjurcIG8G'
        );
        
        if (renewDateField && renewDateField.value) {
          renewDate = new Date(renewDateField.value);
          renewDateSource = `${fieldName} array by ID`;
          console.log(`✅ Found renewal date in ${fieldName} array by ID: ${renewDateField.value}`);
          console.log(`📋 Field structure:`, JSON.stringify(renewDateField, null, 2));
        } else if (renewDateField) {
          console.log(`⚠️ Found field with ID J3yL94KqDhUnjurcIG8G but no value:`, JSON.stringify(renewDateField, null, 2));
        } else {
          console.log(`❌ No field found with ID J3yL94KqDhUnjurcIG8G in ${fieldName} array`);
        }
      }
      
      // 2. Check if renewal_date is a direct property on contact (fallback)
      if (!renewDate && (contact.renewal_date || contact.renewalDate)) {
        const dateValue = contact.renewal_date || contact.renewalDate;
        renewDate = new Date(dateValue);
        renewDateSource = 'direct property';
        console.log(`📅 Found renewal date as direct property: ${dateValue}`);
      }
      
      // 3. Check in customFields object if it's not an array (fallback, format: {field_name: 'field_value'})
      if (!renewDate && contact.customFields && !Array.isArray(contact.customFields)) {
        const dateValue = contact.customFields['renewal_date'] || 
                         contact.customFields['contact.renewal_date'] ||
                         contact.customFields['J3yL94KqDhUnjurcIG8G'];
        
        if (dateValue) {
          renewDate = new Date(dateValue);
          renewDateSource = 'customFields object';
          console.log(`📅 Found renewal date in customFields object: ${dateValue}`);
        }
      }
      
      // Check if renewal date is within 13 months (393 days) from now
      const now = new Date();
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
      
      // If no renewal date found or date is invalid/expired, return membership_expired
      if (!renewDate || isNaN(renewDate.getTime())) {
        console.log(`❌ No valid renewal date found for ${email}`);
        console.log(`🔍 Checked locations: customField array (ID: J3yL94KqDhUnjurcIG8G), direct properties, customFields object`);
        console.log(`📋 Contact data structure:`, {
          hasCustomField: !!contact.customField,
          customFieldIsArray: Array.isArray(contact.customField),
          customFieldLength: contact.customField?.length,
          customFieldArraySample: contact.customField?.slice(0, 3),
          hasCustomFields: !!contact.customFields,
          customFieldsKeys: contact.customFields ? Object.keys(contact.customFields) : [],
          directProperties: Object.keys(contact).filter(k => k.toLowerCase().includes('renew'))
        });
        return { 
          isActive: false, 
          contact: contact,
          reason: 'membership_expired'
        };
      }
      
      const isRenewalValid = renewDate >= thirteenMonthsAgo;
      
      console.log(`📊 Renewal check for ${email}:`, {
        renewDate: renewDate.toISOString(),
        renewDateSource: renewDateSource,
        thirteenMonthsAgo: thirteenMonthsAgo.toISOString(),
        now: now.toISOString(),
        isValid: isRenewalValid,
        monthsSinceRenewal: Math.round((now.getTime() - renewDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      });

      if (!isRenewalValid) {
        console.log(`❌ Renewal date for ${email} is more than 13 months old`);
        return { 
          isActive: false, 
          contact: contact,
          reason: 'membership_expired'
        };
      }

      console.log(`✅ User ${email} is active with valid renewal date`);
      return {
        isActive: true,
        contact: contact
      };

    } catch (error: any) {
      console.error('❌ Failed to check user active status:', error);
      return { isActive: false, reason: 'Error checking status' };
    }
  }

  /**
   * Determine user role based on HighLevel tags
   */
  async getUserRole(email: string): Promise<string> {
    try {
      const { contact } = await this.isUserActive(email);
      
      if (!contact || !contact.tags) {
        return 'member';
      }

      // Check tags in order of priority
      if (contact.tags.includes('admin')) {
        return 'admin';
      }
      
      if (contact.tags.includes('board member')) {
        return 'board_member';
      }
      
      if (contact.tags.includes('moderator')) {
        return 'moderator';
      }
      
      return 'member';
      
    } catch (error: any) {
      console.error(`❌ Failed to determine role for ${email}:`, error);
      return 'member'; // Default to member on error
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
      
      console.log('🔍 getContact - Raw response from GoHighLevel:', JSON.stringify(result.data, null, 2));
      console.log('🔍 getContact - result.data.contact exists:', !!result.data.contact);
      console.log('🔍 getContact - result.data exists:', !!result.data);
      
      const contactData = result.data.contact || result.data;
      console.log('🔍 getContact - Final contact data address1:', contactData?.address1);
      console.log('🔍 getContact - Final contact data city:', contactData?.city);
      
      return contactData;
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
      // Prepare payload according to GoHighLevel API documentation
      const payload: any = {
        // Direct contact fields
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        phone: updateData.phone,
        website: updateData.website,
        companyName: updateData.companyName,
        address1: updateData.address1,
        city: updateData.city,
        state: updateData.state,
        postalCode: updateData.postalCode,
        country: updateData.country || 'US', // Default to US
        source: updateData.source || 'portal'
      };

      // Remove undefined fields to keep payload clean
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      // Handle tags if provided
      if (updateData.tags) {
        payload.tags = updateData.tags;
      }

      // Handle custom fields if provided (convert to API format)
      const customFields: any[] = [];
      
      // Add bio as a custom field if provided
      if (updateData.bio !== undefined) {
        customFields.push({
          id: 'b3Yfp0NjO23zFXzwjswu',
          field_value: updateData.bio
        });
      }
      
      // Add tagline as a custom field if provided
      if (updateData.tagline !== undefined) {
        customFields.push({
          id: '3PZ7J4UcjLwnzWudAZHi',
          field_value: updateData.tagline
        });
      }
      
      // Add coupon codes as a custom field if provided
      if (updateData.couponCodes !== undefined) {
        console.log('🔧 GoHighLevel service - coupon codes:', {
          value: updateData.couponCodes,
          type: typeof updateData.couponCodes,
          isArray: Array.isArray(updateData.couponCodes)
        });
        customFields.push({
          id: '9rtkCBAUmFZdHs9ALwQl',
          field_value: updateData.couponCodes
        });
      }
      
      // Add cover image as a custom field if provided
      if (updateData.coverImage !== undefined) {
        customFields.push({
          id: '3tSDY90RIMPP4W7uQxF9',
          field_value: updateData.coverImage
        });
      }
      
      // Add other custom fields if provided
      if (updateData.customFields) {
        Object.entries(updateData.customFields).forEach(([key, value]) => {
          customFields.push({
            key,
            field_value: value
          });
        });
      }
      
      // Only add customFields to payload if we have any
      if (customFields.length > 0) {
        payload.customFields = customFields;
      }

      console.log(`🔧 Sending PUT request to /contacts/${contactId} with payload:`, JSON.stringify(payload, null, 2));
      console.log(`🏠 Address fields specifically being sent:`, {
        address1: payload.address1,
        city: payload.city,
        state: payload.state,
        postalCode: payload.postalCode,
        country: payload.country
      });
      
      const response = await this.client.put(`/contacts/${contactId}`, payload, {
        headers: {
          'Version': '2021-07-28'
        }
      });
      console.log(`✅ Successfully updated contact ${contactId}`);
      console.log(`✅ GoHighLevel response:`, JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.error('❌ Failed to update contact:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
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
          email: 'boardmember@racc.com',
          phone: '(435) 555-0103',
          website: 'https://smithfinancial.com',
          businessName: 'Smith Financial Services',
          tags: ['active', 'board member'],
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
          email: 'boardmember@racc.com',
          phone: '(435) 555-0103',
          website: 'https://smithfinancial.com',
          businessName: 'Smith Financial Services',
          tags: ['active', 'board member', 'elite membership package'],
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
      // console.log(`Full response data:`, JSON.stringify(response.data, null, 2));
      
      // Handle the events array from response
      const events = response.data?.events || [];
      console.log(`Retrieved ${events.length} events from GoHighLevel`);
      
      // Log first few events for debugging
      if (events.length > 0) {
        console.log(`Sample event data:`, JSON.stringify(events[0], null, 2));
      }
      
      // Log a sample event to see what fields GoHighLevel actually returns
      if (events.length > 0) {
        console.log(`Sample event fields:`, Object.keys(events[0]));
      }
      
      // Format events
      const formattedEvents = events.map((event: any) => ({
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
        originalRecurringEventId: event.originalRecurringEventId,
        masterEventId: event.masterEventId,
        calendarNotes: event.calendarNotes || event.notes || '',
        ...event
      }));
      
      // Batch-load custom fields for all events in a single API call
      // DISABLED: This is too slow (10+ seconds) when fetching 500 records from GHL
      // Custom fields are now loaded lazily on-demand via /appointments/:id/custom-fields
      // console.log(`🔄 Batch-loading custom fields for ${formattedEvents.length} events...`);
      // await this.batchLoadCustomFields(formattedEvents);
      
      return formattedEvents;
      
    } catch (error: any) {
      console.error('Failed to fetch calendar events:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  }

  /**
   * Get a single appointment by ID using direct HTTP call
   * @param appointmentId - The appointment ID to fetch
   */
  async getAppointment(appointmentId: string): Promise<any> {
    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      console.log(`🔍 Fetching appointment: ${appointmentId}`);
      
      // Use the correct GoHighLevel API endpoint for fetching a single appointment
      const response = await this.client.get(`/calendars/events/appointments/${appointmentId}`);
      
      console.log(`✅ Successfully fetched appointment: ${appointmentId}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch appointment:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(`Failed to fetch appointment: ${error.message}`);
    }
  }

  /**
   * Create a new appointment using direct HTTP call
   * @param payload - The appointment data
   */
  async createAppointment(payload: any): Promise<any> {
    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      console.log('📅 Creating appointment via direct HTTP call');
      console.log('📝 Payload:', JSON.stringify(payload, null, 2));
      
      // Use Version 2021-07-28 for appointments API (different from custom objects API)
      const response = await this.client.post('/calendars/events/appointments', payload, {
        headers: {
          'Version': '2021-07-28'
        }
      });
      
      console.log('✅ Appointment created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create appointment:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(`Failed to create appointment: ${error.message}`);
    }
  }

  /**
   * Update/edit an appointment using direct HTTP call
   * @param appointmentId - The appointment ID to update
   * @param payload - The appointment data to update
   */
  async updateAppointment(appointmentId: string, payload: any): Promise<any> {
    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      const updateStart = Date.now();
      console.log(`⏱️  [UPDATE] Starting appointment update for ${appointmentId}`);
      
      // Extract custom fields and internal note from payload
      const { 
        internalNote, 
        pageUrl, 
        coverImageUrl, 
        downloadFileUrl, 
        basicEmbedCode, 
        enhancedEmbedCode, 
        eliteEmbedCode, 
        customFieldsRecordId, 
        description, 
        location, 
        ...rest 
      } = payload;
      
      // For recurring events, GoHighLevel expects the base event ID (without timestamp)
      // Event IDs come in format: baseId_timestamp_duration
      const baseAppointmentId = appointmentId.includes('_') ? appointmentId.split('_')[0] : appointmentId;
      
      console.log(`📝 Updating appointment - Original ID: ${appointmentId}, Base ID: ${baseAppointmentId}`);
      console.log(`📝 Custom fields recordId from payload: ${customFieldsRecordId || 'none provided'}`);
      
      // Build the update payload with only fields that GHL accepts
      // Note: GoHighLevel uses 'address' not 'location', and 'calendarNotes' not 'description'
      const appointmentPayload: any = {
        ...rest,
        // Convert description to calendarNotes if description is provided
        ...(description && { calendarNotes: description }),
        // Convert location to address if location is provided
        ...(location && { address: location }),
        // Add flags to bypass slot validation when updating
        ignoreDateRange: true,
        ignoreFreeSlotValidation: true,
      };
      
      console.log('📝 Updating appointment with payload:', JSON.stringify(appointmentPayload, null, 2));
      
      const ghlStart = Date.now();
      // Update the appointment via GoHighLevel API using the base ID
      const response = await this.client.put(`/calendars/events/appointments/${baseAppointmentId}`, appointmentPayload);
      const ghlDuration = Date.now() - ghlStart;
      console.log(`⏱️  [UPDATE] GoHighLevel appointment API responded in ${ghlDuration}ms`);
      
      console.log('✅ Appointment updated successfully');
      
      // Save custom fields to custom object (if any custom fields provided)
      // Use the base appointment ID for custom objects (same as we use for the appointment update)
      if (internalNote || pageUrl || coverImageUrl || downloadFileUrl || basicEmbedCode || enhancedEmbedCode || eliteEmbedCode) {
        const customFieldsStart = Date.now();
        const upsertResult = await this.upsertAppointmentCustomObject(
          baseAppointmentId,
          { pageUrl, coverImageUrl, downloadFileUrl, internalNote, basicEmbedCode, enhancedEmbedCode, eliteEmbedCode },
          customFieldsRecordId // Pass existing record ID if available
        );
        const customFieldsDuration = Date.now() - customFieldsStart;
        console.log(`⏱️  [UPDATE] Custom fields upsert completed in ${customFieldsDuration}ms`);
        console.log(`📋 [UPDATE] Upserted custom fields:`, { pageUrl, coverImageUrl, downloadFileUrl, internalNote, basicEmbedCode, enhancedEmbedCode, eliteEmbedCode });
        console.log(`📋 [UPDATE] Record ID: ${upsertResult.recordId}`);
        
        // Wait a moment for GoHighLevel to propagate the changes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Invalidate caches for this appointment to force refresh on next fetch
        const appointmentCacheKey = `appointment_${baseAppointmentId}`;
        this.customFieldsCache.delete(appointmentCacheKey);
        this.customFieldsCache.delete('all_custom_fields'); // Also invalidate the all records cache
        console.log(`🗑️  Invalidated custom fields cache for appointment ${baseAppointmentId} (after 500ms propagation delay)`);
      }
      
      // GoHighLevel's update response is minimal, so combine it with our request data
      // to create a complete appointment object for the frontend
      const completeAppointment = {
        ...response.data,
        // Include the fields we sent in the request that aren't in the response
        title: payload.title || response.data.title,
        description: payload.description || payload.calendarNotes || '',
        startTime: payload.startTime,
        endTime: payload.endTime,
        location: payload.address || payload.location || '',
        address: payload.address || payload.location || '',
        calendarNotes: payload.calendarNotes || payload.description || '',
        internalNote: internalNote || '',
        appointmentStatus: payload.appointmentStatus || response.data.appoinmentStatus || 'confirmed',
        // Include custom fields in response
        pageUrl: pageUrl || '',
        coverImageUrl: coverImageUrl || '',
        downloadFileUrl: downloadFileUrl || ''
      };
      
      const totalDuration = Date.now() - updateStart;
      console.log(`⏱️  [UPDATE] Total update completed in ${totalDuration}ms`);
      
      return completeAppointment;
      
    } catch (error: any) {
      console.error('❌ Failed to update appointment:', error.message);
      console.error('Error response:', error.response?.data);
      throw new Error(`Failed to update appointment: ${error.message}`);
    }
  }

  /**
   * Search for notes related to an appointment
   * @param appointmentId - The appointment ID to search notes for
   */
  async searchAppointmentNotes(appointmentId: string): Promise<any[]> {
    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      console.log(`🔍 Searching notes for appointment: ${appointmentId}`);
      const response = await this.client.post('/notes/search', {
        limit: 100,
        skip: 0,
        locationId: this.locationId,
        relations: [
          {
            objectKey: 'appointment',
            recordId: appointmentId
          }
        ],
        includeRelationRecords: false,
        sortBy: 'dateAdded',
        sortOrder: 'desc'
      });

      const notes = response.data?.notes || [];
      console.log(`📝 Found ${notes.length} notes for appointment ${appointmentId}`);
      return notes;
    } catch (error: any) {
      console.error(`❌ Failed to search appointment notes for ${appointmentId}:`, error.message);
      console.error('Error response:', error.response?.data);
      return []; // Return empty array on error rather than throwing
    }
  }

  /**
   * Create a note for an appointment
   * @param appointmentId - The appointment ID to attach the note to
   * @param noteBody - The note content
   */
  async createAppointmentNote(appointmentId: string, noteBody: string): Promise<any> {
    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      const response = await this.client.post('/notes', {
        body: noteBody,
        locationId: this.locationId,
        relations: [
          {
            objectKey: 'appointment',
            recordId: appointmentId
          }
        ]
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to create appointment note:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(`Failed to create appointment note: ${error.message}`);
    }
  }

  /**
   * Update or create appointment note (internal notes)
   * @param appointmentId - The appointment ID
   * @param noteBody - The note content
   */
  async upsertAppointmentNote(appointmentId: string, noteBody: string): Promise<void> {
    try {
      // Search for existing notes
      const existingNotes = await this.searchAppointmentNotes(appointmentId);
      
      if (existingNotes.length > 0) {
        // Update the first note (most recent)
        const noteId = existingNotes[0].id;
        await this.client!.put(`/notes/${noteId}`, {
          body: noteBody
        });
      } else {
        // Create new note
        await this.createAppointmentNote(appointmentId, noteBody);
      }
    } catch (error: any) {
      console.error('Failed to upsert appointment note:', error);
      throw new Error(`Failed to save appointment note: ${error.message}`);
    }
  }

  /**
   * Create or update a custom object record for appointment custom fields
   * NOTE: Requires custom object schema "appointment_custom_fields" to exist
   * Run setup-custom-objects.js once before using this
   * @param appointmentId - The appointment ID to link to
   * @param customFields - The custom field data
   * @param existingRecordId - Optional existing record ID for updates
   */
  async upsertAppointmentCustomObject(
    appointmentId: string,
    customFields: {
      pageUrl?: string;
      coverImageUrl?: string;
      downloadFileUrl?: string;
      internalNote?: string;
      basicEmbedCode?: string;
      enhancedEmbedCode?: string;
      eliteEmbedCode?: string;
    },
    existingRecordId?: string
  ): Promise<{ recordId: string; associationId?: string }> {
    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      // Extract base ID from composite appointment ID (format: baseId_timestamp_duration)
      // Only split if it looks like a composite ID (has underscores with numeric parts)
      const baseAppointmentId = appointmentId.includes('_') && /\d{13}_\d+$/.test(appointmentId)
        ? appointmentId.split('_')[0]
        : appointmentId;
        
      if (baseAppointmentId !== appointmentId) {
        console.log(`📝 Using base appointment ID: ${baseAppointmentId} (from recurring instance ${appointmentId})`);
      } else {
        console.log(`📝 Using appointment ID: ${appointmentId}`);
      }
      
      // If no existing record ID provided, check if one exists by searching
      let recordIdToUse = existingRecordId;
      if (!recordIdToUse) {
        console.log(`🔍 No customFieldsRecordId provided, searching for existing custom object for appointment ${baseAppointmentId}`);
        const startSearch = Date.now();
        try {
          const existingFields = await this.getAppointmentCustomFields(appointmentId);
          const searchDuration = Date.now() - startSearch;
          if (existingFields && existingFields.recordId) {
            console.log(`✅ Found existing record: ${existingFields.recordId} (${searchDuration}ms)`);
            recordIdToUse = existingFields.recordId;
          } else {
            console.log(`📝 No existing record found (${searchDuration}ms), will create new one`);
          }
        } catch (searchError: any) {
          console.warn(`⚠️  Error searching for existing custom fields (will create new):`, searchError.message);
          // Continue to create new record if search fails
        }
      } else {
        console.log(`✅ Using provided customFieldsRecordId: ${recordIdToUse} (skipping search)`);
      }
      
      // Generate a unique ID for the custom object record if creating new
      const uniqueId = recordIdToUse ? undefined : `${Date.now()}-${randomBytes(8).toString('hex')}`;
      
      // Prepare the record data - only send properties object (GoHighLevel requirement)
      // NOTE: Use lowercase property keys to match GoHighLevel's fieldKey format
      // Even though display names are camelCase, stored properties are lowercase
      const recordData = {
        properties: {
          appointmentid: baseAppointmentId,  // Use base ID for recurring, full ID for non-recurring
          pageurl: customFields.pageUrl || '',  // lowercase to match fieldKey
          coverimageurl: customFields.coverImageUrl || '',  // lowercase to match fieldKey
          downloadfileurl: customFields.downloadFileUrl || '',  // lowercase to match fieldKey
          internalnote: customFields.internalNote || '',  // lowercase to match fieldKey
          // Embed codes use underscores to match GHL field keys
          ...(customFields.basicEmbedCode && { basic_embed_code: customFields.basicEmbedCode }),
          ...(customFields.enhancedEmbedCode && { enhanced_embed_code: customFields.enhancedEmbedCode }),
          ...(customFields.eliteEmbedCode && { elite_embed_code: customFields.eliteEmbedCode }),
          ...(uniqueId && { id: uniqueId })  // Only include id when creating new record
        }
      };

      let recordId: string;

      if (recordIdToUse) {
        // Update existing record
        console.log(`📝 Updating custom object record ${recordIdToUse} for appointment ${appointmentId}`);
        try {
          // For PUT requests, locationId might need to be a query parameter instead of body
          const requestBody = recordData; // Only send properties
          const response = await this.client.put(
            `/objects/${this.APPOINTMENT_CUSTOM_OBJECT_ID}/records/${recordIdToUse}?locationId=${this.locationId}`,
            requestBody
          );
          recordId = recordIdToUse;
          console.log(`✅ Successfully updated custom object record`);
        } catch (updateError: any) {
          console.error('Failed to update custom object record:', updateError.response?.data);
          throw updateError;
        }
      } else {
        // Create new record
        console.log(`📝 Creating custom object record for appointment ${appointmentId}`);
        try {
          const response = await this.client.post(
            `/objects/${this.APPOINTMENT_CUSTOM_OBJECT_ID}/records`,
            {
              locationId: this.locationId,
              ...recordData
            }
          );
          recordId = response.data.record?.id || response.data.id || response.data.recordId;
          console.log(`✅ Successfully created custom object record: ${recordId}`);
        } catch (createError: any) {
          console.error('❌ Failed to create custom object record');
          console.error('Error status:', createError.response?.status);
          console.error('Error data:', JSON.stringify(createError.response?.data, null, 2));
          
          // Check if it's a field validation error
          if (createError.response?.status === 422) {
            console.error('⚠️  422 Error: This usually means the custom object fields have not been added in GoHighLevel UI');
            console.error('⚠️  Please add the following fields via Settings → Custom Objects → Appointment Custom Fields:');
            console.error('   - appointmentId (TEXT, required)');
            console.error('   - pageUrl (TEXT)');
            console.error('   - coverImageUrl (TEXT)');
            console.error('   - downloadFileUrl (TEXT)');
            console.error('   - internalNote (LARGE_TEXT)');
          }
          
          throw createError;
        }
        
        // For recurring events, skip association creation as it may fail with base IDs
        // The custom object lookup works via the appointmentid property search, not associations
        if (baseAppointmentId !== appointmentId) {
          console.log(`⚠️  Skipping association creation for recurring event (associations don't work with base IDs)`);
          console.log(`   Custom object will be found via appointmentid property: ${baseAppointmentId}`);
          return { recordId };
        }
        
        // Create association between appointment and custom object record (non-recurring only)
        // Uses the association schema key created in setup-custom-objects.js
        console.log(`🔗 Creating record association between appointment ${baseAppointmentId} and custom object record ${recordId}`);
        try {
          const associationResponse = await this.client.post(
            `/associations/${this.APPOINTMENT_ASSOCIATION_KEY}/records`,
            {
              locationId: this.locationId,
              firstRecordId: recordId, // custom object record
              secondRecordId: baseAppointmentId // appointment ID
            }
          );
          
          console.log(`✅ Successfully created association`);
          
          return {
            recordId,
            associationId: associationResponse.data.id || associationResponse.data.associationId
          };
        } catch (assocError: any) {
          console.warn('⚠️  Failed to create association, but record was created:', assocError.message);
          console.warn('Association error details:', assocError.response?.data);
          // Return the record ID even if association fails
          return { recordId };
        }
      }

      return { recordId };
    } catch (error: any) {
      console.error('❌ Failed to upsert appointment custom object:', error.message);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        appointmentId,
        baseAppointmentId: appointmentId.includes('_') && /\d{13}_\d+$/.test(appointmentId)
          ? appointmentId.split('_')[0]
          : appointmentId
      });
      
      // Provide more helpful error message
      if (error.response?.status === 422) {
        throw new Error(`Custom object fields not configured. Please add the required fields in GoHighLevel UI first.`);
      }
      
      if (error.response?.status === 404) {
        throw new Error(`404 Error: GoHighLevel custom object or appointment not found. AppointmentId: ${appointmentId}`);
      }
      
      throw new Error(`Failed to save appointment custom fields: ${error.message}`);
    }
  }

  /**
   * Get custom fields for an appointment by fetching associated custom object
   * @param appointmentId - The appointment ID
   */
  async getAppointmentCustomFields(appointmentId: string): Promise<{
    pageUrl: string;
    coverImageUrl: string;
    downloadFileUrl: string;
    internalNote: string;
    basicEmbedCode: string;
    enhancedEmbedCode: string;
    eliteEmbedCode: string;
    recordId?: string;
  } | null> {
    if (!this.client) {
      throw new Error('GoHighLevel client not initialized');
    }

    try {
      // Extract base ID from composite appointment ID (format: baseId_timestamp_duration)
      // Only split if it looks like a composite ID (has underscores with numeric parts)
      const baseAppointmentId = appointmentId.includes('_') && /\d{13}_\d+$/.test(appointmentId)
        ? appointmentId.split('_')[0]
        : appointmentId;
      
      if (baseAppointmentId !== appointmentId) {
        console.log(`🔍 Fetching custom fields for appointment ${baseAppointmentId} (from recurring instance ${appointmentId})`);
      } else {
        console.log(`🔍 Fetching custom fields for appointment ${appointmentId}`);
      }
      
      // Check per-appointment cache first (most granular)
      const appointmentCacheKey = `appointment_${baseAppointmentId}`;
      const appointmentCached = this.customFieldsCache.get(appointmentCacheKey);
      const now = Date.now();
      
      console.log(`🔍 [CACHE DEBUG] Cache size: ${this.customFieldsCache.size} entries`);
      console.log(`🔍 [CACHE DEBUG] Looking for appointment cache key: ${appointmentCacheKey}`);
      console.log(`🔍 [CACHE DEBUG] Appointment cached: ${!!appointmentCached}, Valid: ${appointmentCached && (now - appointmentCached.timestamp) < this.CACHE_TTL}`);
      
      if (appointmentCached && (now - appointmentCached.timestamp) < this.CACHE_TTL) {
        console.log(`✅ Using cached custom fields for appointment ${baseAppointmentId} (age: ${Math.round((now - appointmentCached.timestamp) / 1000)}s)`);
        return appointmentCached.data;
      }
      
      // Check if we have all records cached
      const allRecordsCacheKey = 'all_custom_fields';
      const allCached = this.customFieldsCache.get(allRecordsCacheKey);
      
      console.log(`🔍 [CACHE DEBUG] All records cached: ${!!allCached}, Valid: ${allCached && (now - allCached.timestamp) < this.CACHE_TTL}`);
      if (allCached) {
        console.log(`🔍 [CACHE DEBUG] All records cache age: ${Math.round((now - allCached.timestamp) / 1000)}s, TTL: ${this.CACHE_TTL}ms`);
      }
      
      let records;
      if (allCached && (now - allCached.timestamp) < this.CACHE_TTL) {
        console.log(`✅ Using cached all custom fields (${allCached.data?.length || 0} records, age: ${Math.round((now - allCached.timestamp) / 1000)}s)`);
        records = allCached.data;
      } else {
        console.log(`🔄 Fetching ALL custom fields from GoHighLevel API (cache miss or expired)...`);
        const startTime = Date.now();
        
        console.log(`⏱️  [TIMING] Starting GoHighLevel API call at ${new Date().toISOString()}`);
        
        // Fetch ALL records since GoHighLevel doesn't support filtering by appointmentid
        const response = await this.client.post(
          `/objects/${this.APPOINTMENT_CUSTOM_OBJECT_ID}/records/search`,
          {
            locationId: this.locationId,
            page: 1,
            pageLimit: 100  // Fetch all records
          }
        );
        
        const apiDuration = Date.now() - startTime;
        console.log(`⏱️  [TIMING] GoHighLevel API responded after ${apiDuration}ms`);
        
        records = response.data?.records || response.data?.data || [];
        const totalDuration = Date.now() - startTime;
        
        // Cache ALL records for reuse
        this.customFieldsCache.set(allRecordsCacheKey, { data: records, timestamp: now });
        console.log(`💾 Cached ${records.length} custom field records`);
        console.log(`⏱️  [TIMING] Total processing time: ${totalDuration}ms (API: ${apiDuration}ms)`);
      }

      console.log(`📊 Searching ${records.length} total custom object records`);
      console.log(`🔍 Looking for appointmentid: ${baseAppointmentId}`);
      
      // Log matching appointmentid values to debug
      const matchingAppointmentIds = records
        .map((r: any) => (r.properties || {}).appointmentid)
        .filter((id: string) => id && id.includes(baseAppointmentId));
      
      if (matchingAppointmentIds.length > 0) {
        console.log(`📋 Found ${matchingAppointmentIds.length} matching appointmentid(s):`, matchingAppointmentIds);
      } else {
        console.log(`⚠️  No matching appointmentids found for: ${baseAppointmentId}`);
      }
      
      // Filter client-side by base appointmentId since server-side filter doesn't work as expected
      // NOTE: Use lowercase property keys as that's how they're stored in GoHighLevel
      // If multiple records exist for same appointmentId, take the most recently updated one
      const matchingRecords = records.filter((r: any) => {
        const props = r.properties || {};
        return props.appointmentid === baseAppointmentId;  // lowercase to match stored property
      });
      
      if (matchingRecords.length === 0) {
        console.log(`❌ No custom fields found for appointment ${appointmentId} (looking for ${baseAppointmentId})`);
        return null;
      }
      
      // Sort by dateUpdated/updatedAt descending and take the most recent
      const record = matchingRecords.sort((a: any, b: any) => {
        const aDate = a.dateUpdated || a.updatedAt || a.dateAdded || a.createdAt || 0;
        const bDate = b.dateUpdated || b.updatedAt || b.dateAdded || b.createdAt || 0;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })[0];
      
      // GoHighLevel stores custom fields in the "properties" object with lowercase keys
      // even though the display names in the UI are camelCase
      const props = record.properties || {};
      const result = {
        pageUrl: props.pageurl || '',
        coverImageUrl: props.coverimageurl || '',
        downloadFileUrl: props.downloadfileurl || '',
        internalNote: props.internalnote || '',
        basicEmbedCode: props.basic_embed_code || '',
        enhancedEmbedCode: props.enhanced_embed_code || '',
        eliteEmbedCode: props.elite_embed_code || '',
        recordId: record.id || record._id
      };
      
      // Cache this individual appointment's custom fields
      this.customFieldsCache.set(appointmentCacheKey, { data: result, timestamp: now });
      console.log(`💾 Cached custom fields for appointment ${baseAppointmentId}`);
      
      return result;
    } catch (error: any) {
      console.error(`Failed to fetch custom fields for appointment ${appointmentId}:`, error.message);
      console.error('Error response:', error.response?.data);
      return null; // Return null instead of throwing to handle gracefully
    }
  }

  /**
   * Batch-load custom fields for multiple events efficiently
   * Fetches all custom object records in a single API call and maps them to events
   * @param events - Array of event objects to attach custom fields to
   */
  async batchLoadCustomFields(events: any[]): Promise<void> {
    if (!this.client || events.length === 0) {
      return;
    }

    try {
      console.log(`🔄 Batch-loading custom fields for ${events.length} events`);
      
      // Fetch ALL custom object records in a single call (max 500 per API limit)
      const response = await this.client.post(
        `/objects/${this.APPOINTMENT_CUSTOM_OBJECT_ID}/records/search`,
        {
          locationId: this.locationId,
          page: 1,
          pageLimit: 500  // API maximum is 500
        }
      );

      const records = response.data?.records || response.data?.data || [];
      console.log(`📦 Retrieved ${records.length} custom object records`);
      
      // Create a lookup map: appointmentId -> custom fields
      // If duplicates exist, keep the most recently updated record
      const customFieldsMap = new Map();
      const duplicateTracker = new Map(); // Track duplicate counts
      
      records.forEach((record: any) => {
        const props = record.properties || {};
        const appointmentId = props.appointmentid;
        if (appointmentId) {
          const existing = customFieldsMap.get(appointmentId);
          
          // If no existing record, or this record is newer, use it
          if (!existing) {
            customFieldsMap.set(appointmentId, {
              pageUrl: props.pageurl || '',
              coverImageUrl: props.coverimageurl || '',
              downloadFileUrl: props.downloadfileurl || '',
              internalNote: props.internalnote || '',
              basicEmbedCode: props.basic_embed_code || '',
              enhancedEmbedCode: props.enhanced_embed_code || '',
              eliteEmbedCode: props.elite_embed_code || '',
              recordId: record.id || record._id,
              dateUpdated: record.dateUpdated || record.updatedAt || record.dateAdded || record.createdAt
            });
          } else {
            // Compare dates - keep the newer one
            const existingDate = new Date(existing.dateUpdated || 0).getTime();
            const currentDate = new Date(record.dateUpdated || record.updatedAt || record.dateAdded || record.createdAt || 0).getTime();
            
            if (currentDate > existingDate) {
              console.log(`🔄 Found duplicate for ${appointmentId}, replacing ${existing.recordId} with newer ${record.id || record._id}`);
              customFieldsMap.set(appointmentId, {
                pageUrl: props.pageurl || '',
                coverImageUrl: props.coverimageurl || '',
                downloadFileUrl: props.downloadfileurl || '',
                internalNote: props.internalnote || '',
                basicEmbedCode: props.basic_embed_code || '',
                enhancedEmbedCode: props.enhanced_embed_code || '',
                eliteEmbedCode: props.elite_embed_code || '',
                recordId: record.id || record._id,
                dateUpdated: record.dateUpdated || record.updatedAt || record.dateAdded || record.createdAt
              });
            }
            
            // Track duplicate count
            duplicateTracker.set(appointmentId, (duplicateTracker.get(appointmentId) || 1) + 1);
          }
        }
      });
      
      console.log(`📋 Built lookup map with ${customFieldsMap.size} custom field records`);
      
      // Attach custom fields to each event
      let matchedCount = 0;
      events.forEach(event => {
        // Extract base ID from composite appointment ID if needed
        const baseId = event.id.includes('_') && /\d{13}_\d+$/.test(event.id)
          ? event.id.split('_')[0]
          : event.id;
        
        const customFields = customFieldsMap.get(baseId);
        if (customFields) {
          event.pageUrl = customFields.pageUrl;
          event.coverImageUrl = customFields.coverImageUrl;
          event.downloadFileUrl = customFields.downloadFileUrl;
          event.internalNote = customFields.internalNote;
          event.customFieldsRecordId = customFields.recordId;
          matchedCount++;
        }
      });
      
      console.log(`✅ Attached custom fields to ${matchedCount}/${events.length} events`);
      
    } catch (error: any) {
      console.error('❌ Failed to batch-load custom fields:', error.message);
      console.error('Error response:', error.response?.data);
      // Don't throw - just log the error and continue without custom fields
    }
  }

  /**
   * Get the configured location ID
   */
  getLocationId(): string {
    return this.locationId;
  }

  /**
   * Get location information for the configured location
   */
  async getLocationInfo(): Promise<any> {
    if (this.developmentMode) {
      // Return mock location data in development mode
      return {
        id: this.locationId,
        name: 'Development Location',
        address: '123 Main Street',
        city: 'Salt Lake City',
        state: 'UT',
        country: 'US',
        postalCode: '84101',
        timezone: 'America/Denver',
        phone: '(555) 555-5555',
        email: 'info@example.com',
        website: 'https://example.com'
      };
    }

    try {
      const response = await this.client.get(`/locations/${this.locationId}`);
      return response.data.location || response.data;
    } catch (error: any) {
      console.error('Failed to fetch location info:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const ghlService = new GoHighLevelService();
export type { ContactData, PaymentLinkData };