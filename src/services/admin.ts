/**
 * Admin Service - API calls for user management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
  phone?: string;
  website?: string;
  role: 'admin' | 'moderator' | 'member';
  status: 'active' | 'pending' | 'suspended';
  emailVerified: boolean;
  ghlContactId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled';
  membershipTier?: 'standard' | 'enhanced' | 'elite';
  createdAt: string;
  updatedAt?: string;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byRole: {
      admin: number;
      moderator: number;
      member: number;
    };
    byMembershipTier: {
      standard: number;
      enhanced: number;
      elite: number;
    };
  };
}

class AdminService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  /**
   * Get all users with optional filtering
   */
  async getUsers(params: {
    limit?: number;
    offset?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}): Promise<{
    users: User[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.role) searchParams.set('role', params.role);
    if (params.status) searchParams.set('status', params.status);

    const response = await fetch(`${API_BASE_URL}/admin/users?${searchParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    return response.json();
  }

  /**
   * Update user information
   */
  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }

    const result = await response.json();
    return result.user;
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: number, status: 'active' | 'pending' | 'suspended', reason?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user status');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  }

  /**
   * Get system statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch statistics');
    }

    return response.json();
  }
}

export const adminService = new AdminService();