export interface GamificationMeta {
  points: number;
  level: number;
}

export interface Member {
  profilePhoto: string | undefined;
  tags: string[];
  phone: string;
  id: string;
  email: string;
  contactId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar: string;
  slug: string;
  lastLogin: string;
  bio: string;
  businessName?: string;
  companyName?: string;
  website: string;
  locationId: string;
  groupId: string;
  role: string;
  status: string;
  offerSubscriptionMapping: Record<string, any>;
  operationType: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  lastVisitedAt: string;
  joinedAt: string;
  gamificationMeta: GamificationMeta;
  lastActivityAt: string;
  memberSince?: string;
}