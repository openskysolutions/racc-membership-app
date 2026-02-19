/**
 * GoHighLevel Forms Service
 * Handles fetching and managing forms from GoHighLevel API
 */

import axios, { AxiosInstance } from 'axios';

interface GHLForm {
  id: string;
  name: string;
  locationId: string;
  fields?: any[];
  submitButtonText?: string;
  submitButtonColor?: string;
  thankyouUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FormsListResponse {
  forms: GHLForm[];
  total: number;
}

class FormsService {
  private client: AxiosInstance | null;
  private locationId: string;
  private developmentMode: boolean;

  constructor() {
    this.developmentMode = process.env.NODE_ENV === 'development' || !process.env.PRIVATE_INTEGRATION_TOKEN || !process.env.LOCATION_ID;
    this.locationId = process.env.LOCATION_ID || '';

    if (!this.developmentMode) {
      this.client = axios.create({
        baseURL: 'https://services.leadconnectorhq.com',
        headers: {
          'Authorization': `Bearer ${process.env.PRIVATE_INTEGRATION_TOKEN}`,
          'Content-Type': 'application/json',
          'Version': '2021-04-15', // Using older API version for better compatibility
        },
        timeout: 30000, // 30 second timeout
      });
    } else {
      console.log('⚠️  FormsService: Running in development mode without GoHighLevel API access');
      this.client = null;
    }
  }

  /**
   * Get list of forms for the location
   */
  async getForms(options?: { limit?: number; skip?: number }): Promise<FormsListResponse> {
    if (this.developmentMode || !this.client) {
      console.log('📋 FormsService: Returning mock forms data (development mode)');
      return this.getMockForms();
    }

    try {
      const params: any = {
        locationId: this.locationId,
      };

      if (options?.limit) params.limit = options.limit;
      if (options?.skip) params.skip = options.skip;

      console.log('📋 Fetching forms from GoHighLevel API...', params);
      
      const response = await this.client.get('/forms/', { params });

      console.log('✅ Successfully fetched forms from GoHighLevel API:', response.data);

      return {
        forms: response.data.forms || [],
        total: response.data.total || response.data.forms?.length || 0,
      };
    } catch (error: any) {
      console.error('❌ Error fetching forms from GoHighLevel:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        // Forms API might not be available, return empty list
        return { forms: [], total: 0 };
      }
      
      throw new Error(`Failed to fetch forms: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get a specific form by ID
   */
  async getFormById(formId: string): Promise<GHLForm | null> {
    if (this.developmentMode || !this.client) {
      console.log('📋 FormsService: Returning mock form data (development mode)');
      const mockForms = this.getMockForms();
      return mockForms.forms.find(f => f.id === formId) || null;
    }

    try {
      console.log(`📋 Fetching form ${formId} from GoHighLevel API...`);
      
      const response = await this.client.get(`/forms/${formId}`, {
        params: { locationId: this.locationId }
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching form from GoHighLevel:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        return null;
      }
      
      throw new Error(`Failed to fetch form: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get form submission URL
   */
  getFormSubmitUrl(formId: string): string {
    // GoHighLevel form submission URL format
    return `https://api.leadconnectorhq.com/forms/submit/${formId}`;
  }

  /**
   * Get embeddable form URL
   */
  getFormEmbedUrl(formId: string): string {
    // GoHighLevel form embed URL format
    return `https://api.leadconnectorhq.com/widget/form/${formId}`;
  }

  /**
   * Mock forms data for development
   */
  private getMockForms(): FormsListResponse {
    return {
      forms: [
        {
          id: 'mock-form-1',
          name: 'Contact Us Form',
          locationId: this.locationId,
          submitButtonText: 'Submit',
          submitButtonColor: '#3B82F6',
          thankyouUrl: '/thank-you',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-form-2',
          name: 'Membership Application',
          locationId: this.locationId,
          submitButtonText: 'Apply Now',
          submitButtonColor: '#10B981',
          thankyouUrl: '/thank-you',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-form-3',
          name: 'Event Registration',
          locationId: this.locationId,
          submitButtonText: 'Register',
          submitButtonColor: '#8B5CF6',
          thankyouUrl: '/thank-you',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 3,
    };
  }
}

// Export singleton instance
export const formsService = new FormsService();
export type { GHLForm, FormsListResponse };
