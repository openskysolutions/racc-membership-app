
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LocationInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website?: string;
  timezone: string;
  phone?: string;
  email?: string;
  // Add other location properties as needed
}

export const getLocationInfo = async (): Promise<LocationInfo> => {
  try {
    // Backend will use the location ID from its own environment
    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch location info: ${response.statusText}`);
    }

    const data = await response.json();
    return data.location || data; // Handle different response structures
  } catch (error) {
    console.error('Error fetching location info:', error);
    throw error;
  }
};