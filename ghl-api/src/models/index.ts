// Data models and type definitions for RACC Membership Portal
// Based on /specs/001-a-membership-portal/data-model.md

/**
 * Core Member entity from GoHighLevel CRM
 */
export interface Member {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  profile?: {
    company?: string;
    membershipTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    phone?: string;
    website?: string;
    bio?: string;
  };
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Business nominations submitted by members
 */
export interface Nomination {
  id: string;
  nomineeName: string;
  nomineeContact: string;
  submitterId?: string; // nullable for anonymous submissions
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO 8601
}

/**
 * Chamber events with RSVP support
 */
export interface Event {
  id: string;
  title: string;
  description?: string;
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  location?: string;
  visibility: 'public' | 'members-only' | 'private';
  ownerId: string; // Member.id
  version: number; // For optimistic locking
  allowRsvp?: boolean;
  maxAttendees?: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * RSVP responses for events
 */
export interface EventRsvp {
  id: string;
  eventId: string;
  memberId: string;
  status: 'attending' | 'not-attending' | 'maybe';
  guestCount?: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Discussion forum topics
 */
export interface DiscussionTopic {
  id: string;
  title: string;
  createdBy: string; // Member.id
  createdAt: string; // ISO 8601
}

/**
 * Posts within discussion topics
 */
export interface DiscussionPost {
  id: string;
  topicId: string; // DiscussionTopic.id
  authorId: string; // Member.id
  body: string;
  hidden: boolean; // Moderation flag
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Educational courses offered by chamber
 */
export interface Course {
  id: string;
  title: string;
  description?: string;
  modules: CourseModule[];
  createdAt: string; // ISO 8601
}

/**
 * Individual modules within courses
 */
export interface CourseModule {
  id: string;
  title: string;
  content: string;
  order: number;
  estimatedMinutes?: number;
}

/**
 * Member progress through courses
 */
export interface CourseProgress {
  id: string;
  courseId: string; // Course.id
  memberId: string; // Member.id
  progress: number; // Percentage (0-100)
  completedModules: string[]; // CourseModule.id[]
  completedAt?: string; // ISO 8601 when progress reaches 100%
}

/**
 * Job postings from member businesses
 */
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  status: 'active' | 'filled' | 'expired';
  ownerId: string; // Member.id
  expiresAt?: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * News articles and announcements
 */
export interface News {
  id: string;
  title: string;
  body: string;
  tags: string[];
  publishedAt?: string; // ISO 8601, null for drafts
  ownerId: string; // Member.id
  featured?: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Audit log for moderation actions
 */
export interface ModerationLog {
  id: string;
  actorId: string; // Member.id of moderator
  action: 'hide' | 'remove' | 'restore' | 'approve' | 'reject';
  targetType: 'post' | 'nomination' | 'job' | 'news';
  targetId: string;
  reason?: string;
  createdAt: string; // ISO 8601
}

/**
 * User roles and permissions
 */
export interface Role {
  id: string;
  name: 'visitor' | 'member' | 'admin' | 'content-manager';
  permissions: string[]; // e.g., ['events:create', 'content:moderate']
}

/**
 * Content creation limits per member
 */
export interface ContentLimitPolicy {
  id: string;
  type: 'news' | 'event' | 'job';
  perMemberLimit: number;
  effectiveFrom: string; // ISO 8601
}

/**
 * Session data for Better Auth PKCE
 */
export interface AuthSession {
  id: string;
  memberId: string;
  token: string; // Ephemeral access token
  expiresAt: string; // ISO 8601
  createdAt: string; // ISO 8601
}

// Validation schemas (for runtime validation)
export const ValidationRules = {
  Event: {
    titleRequired: true,
    endsAtAfterStartsAt: true,
    versionRequiredForUpdates: true
  },
  Nomination: {
    nomineeNameRequired: true,
    nomineeContactRequired: true
  },
  JobListing: {
    titleRequired: true,
    descriptionRequired: true
  },
  News: {
    titleRequired: true,
    bodyRequired: true
  }
} as const;
