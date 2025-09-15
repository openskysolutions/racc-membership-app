
const GHL_LOCATION_ID = '5FAB1z0AhuVlEdqOzjVX';
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
    const response = await fetch(`${API_BASE_URL}/locations/${GHL_LOCATION_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.TEMP_GHL_TOKEN}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
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