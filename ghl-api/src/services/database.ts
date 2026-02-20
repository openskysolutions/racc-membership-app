/**
 * Database service using Prisma ORM for PostgreSQL
 * Handles user registration, authentication, and session management
 * Production-ready with type safety and excellent developer experience
 */

import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

interface User {
  id?: number;
  email: string;
  passwordHash: string;
  role: string;
  status: string;
  emailVerified: boolean;
  ghlContactId?: string | null;
  lastLoginAt?: Date | string | null;
  passwordResetToken?: string | null;
  passwordResetTokenExpiry?: Date | string | null;
  firstName?: string;
  lastName?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface Session {
  id?: number;
  userId: number;
  sessionId: string;
  accessToken: string;
  expiresAt: Date | string;
  createdAt?: Date | string;
}

class DatabaseService {
  /**
   * Initialize database connection (Prisma connects automatically)
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      await prisma.$connect();
      console.log('✅ PostgreSQL connected successfully (Prisma ORM)');
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    }
  }

  /**
   * Create a new user (authentication only - profile data comes from GHL)
   */
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Hash password before storing
    const passwordHash = await bcrypt.hash(user.passwordHash, 12);

    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        passwordHash,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        ghlContactId: user.ghlContactId || null,
      },
    });

    return this.mapUser(newUser);
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? this.mapUser(user) : null;
  }

  /**
   * Find user by ID
   */
  async findUserById(id: number): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? this.mapUser(user) : null;
  }

  /**
   * Find user by GHL Contact ID
   */
  async findUserByGhlContactId(ghlContactId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { ghlContactId },
    });

    return user ? this.mapUser(user) : null;
  }

  /**
   * Update user (authentication fields only)
   */
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    // Filter allowed fields
    const allowedFields = ['email', 'passwordHash', 'role', 'status', 'emailVerified', 'ghlContactId', 'lastLoginAt', 'passwordResetToken', 'passwordResetTokenExpiry'];
    const data: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        // Hash password if it's being updated
        if (key === 'passwordHash' && typeof value === 'string') {
          // We'll handle this separately
          data[key] = value;
        } else {
          data[key] = value;
        }
      }
    });

    // Hash password if it's being updated
    if (data.passwordHash) {
      data.passwordHash = await bcrypt.hash(data.passwordHash, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    return this.mapUser(updatedUser);
  }

  /**
   * Update user status (helper method for auth flows)
   */
  async updateUserStatus(userId: number, status: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  /**
   * Update user GHL contact ID (helper method)
   */
  async updateUserGhlContactId(userId: number, ghlContactId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { ghlContactId },
    });
  }

  /**
   * Get user by ID (alias for findUserById to match SQLite API)
   */
  async getUserById(id: number): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  /**
   * Get user by email (alias for findUserByEmail to match SQLite API)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.findUserByEmail(email);
  }

  /**
   * Get user by GHL contact ID (alias for findUserByGhlContactId to match SQLite API)
   */
  async getUserByGhlContactId(ghlContactId: string): Promise<User | null> {
    return this.findUserByGhlContactId(ghlContactId);
  }

  /**
   * Get all users with optional limit (for admin)
   */
  /**
   * Get all users with optional pagination
   */
  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    const users = await prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => this.mapUser(user));
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Update payment status (deprecated - membership status is managed in GHL)
   * Kept for backward compatibility but doesn't store paymentStatus anymore
   */
  async updateUserPaymentStatus(userId: number, paymentStatus: string, membershipTier?: string): Promise<void> {
    console.log(`[DEPRECATED] updateUserPaymentStatus called for user ${userId}. Payment status is now managed in GoHighLevel.`);
  }

  /**
   * Verify password
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Update user password
   */
  async updateUserPassword(userId: number, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  /**
   * Find user by password reset token
   */
  async getUserByResetToken(token: string): Promise<User & { passwordResetTokenExpiry?: Date | null } | null> {
    const user = await prisma.user.findFirst({
      where: { 
        passwordResetToken: token,
      },
    });

    if (!user) return null;

    return {
      ...this.mapUser(user),
      passwordResetTokenExpiry: user.passwordResetTokenExpiry,
    };
  }

  /**
   * Create session
   */
  async createSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const newSession = await prisma.session.create({
      data: {
        userId: session.userId,
        sessionId: session.sessionId,
        accessToken: session.accessToken,
        expiresAt: new Date(session.expiresAt),
      },
    });

    return this.mapSession(newSession);
  }

  /**
   * Find session by session ID
   */
  async findSessionBySessionId(sessionId: string): Promise<Session | null> {
    const session = await prisma.session.findUnique({
      where: { sessionId },
    });

    return session ? this.mapSession(session) : null;
  }

  /**
   * Find session by access token (backward compatibility)
   */
  async getSessionByToken(accessToken: string): Promise<Session | null> {
    const session = await prisma.session.findFirst({
      where: { accessToken },
    });

    return session ? this.mapSession(session) : null;
  }

  /**
   * Alias for findSessionBySessionId (backward compatibility)
   */
  async getSessionBySessionId(sessionId: string): Promise<Session | null> {
    return this.findSessionBySessionId(sessionId);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await prisma.session.delete({
      where: { sessionId },
    });
  }

  /**
   * Delete expired sessions
   */
  async deleteExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Cleanup expired sessions (alias for deleteExpiredSessions - backward compatibility)
   */
  async cleanupExpiredSessions(): Promise<void> {
    return this.deleteExpiredSessions();
  }

  /**
   * Map Prisma user to User interface
   */
  private mapUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      ghlContactId: user.ghlContactId,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };
  }

  /**
   * Map Prisma session to Session interface
   */
  private mapSession(session: any): Session {
    return {
      id: session.id,
      userId: session.userId,
      sessionId: session.sessionId,
      accessToken: session.accessToken,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt?.toISOString(),
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export Prisma client for advanced queries if needed
export { prisma };
