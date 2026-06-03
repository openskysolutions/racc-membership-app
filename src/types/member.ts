export interface GamificationMeta {
  points: number;
  level: number;
}

export interface CustomField {
  id: string;
  value: string;
}

export interface Member {
  // Core Member Fields
  id: string;
  email: string;
  contactId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  businessName?: string;
  companyName?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  profilePhoto?: string;
  bio?: string;
  coverImage?: string;
  
  // GoHighLevel Specific Fields
  tags: string[];
  dateAdded?: string;
  locationId?: string;
  
  // Custom Fields Data
  customFields?: CustomField[];
  memberSince?: string;
  specialties?: string[];
  membershipTier?: 'elite' | 'enhanced' | 'basic' | 'standard';
  coupon_codes?: string[];
  tagline?: string;
  
  // Social Media Links
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;

  // Address Information (flat to match GoHighLevel format)
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  
  // System Fields
  role: string;
  status: string;
  slug?: string;
  lastLogin?: string;
  groupId?: string;
  offerSubscriptionMapping?: Record<string, any>;
  operationType?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  lastVisitedAt?: string;
  joinedAt?: string;
  lastActivityAt?: string;
  
  // Gamification
  gamificationMeta?: GamificationMeta;
  
  // Business Categories (subcategory ids, stored in local DB)
  categories?: string[];

  // Computed Fields
  name?: string;
}