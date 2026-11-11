import { api } from './apiClient';
import { getApiBaseUrl, getAppBaseUrl } from '@/lib/config';

export interface PublicCard {
  firstName: string;
  lastName: string;
  name: string;
  businessName?: string;
  logoUrl?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface CardSettings {
  publicId: string;
  enabled: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  preview: PublicCard | null;
}

export type CardSettingsUpdate = Partial<Pick<CardSettings, 'enabled' | 'showPhone' | 'showEmail' | 'showWebsite'>>;

/** The URL encoded in the QR code. Uses a stable token, so it survives name/slug changes. */
export const cardShareUrl = (publicId: string): string => `${getAppBaseUrl()}/card/${publicId}`;

export const cardVCardUrl = (publicId: string): string => `${getApiBaseUrl()}/cards/${publicId}/vcard`;

export const getMyCard = async (): Promise<CardSettings> => {
  const response = await api.get('/cards/me');
  if (!response.ok) throw new Error('Failed to load your card');
  return response.json();
};

export const updateMyCard = async (update: CardSettingsUpdate): Promise<CardSettings> => {
  const response = await api.put('/cards/me', update);
  if (!response.ok) throw new Error('Failed to update your card');
  return response.json();
};

/** Public: no auth required. Returns null when the card doesn't exist or has been turned off. */
export const getPublicCard = async (publicId: string): Promise<PublicCard | null> => {
  const response = await api.get(`/cards/${encodeURIComponent(publicId)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to load card');
  return response.json();
};
