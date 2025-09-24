import { api } from './apiClient';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
  phone?: string;
  website?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  businessName?: string;
  phone?: string;
  website?: string;
}

/**
 * Fetch user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const response = await api.get(`/auth/profile/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    throw new Error(error.message || 'Failed to fetch profile');
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string, 
  profileData: UpdateProfileRequest
): Promise<UserProfile> => {
  try {
    const response = await api.put(`/auth/profile/${userId}`, profileData);
    
    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};