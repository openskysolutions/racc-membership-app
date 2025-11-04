/**
 * Database service for SQLite user management
 * Handles user registration, authentication, and session management
 */

import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';

interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  businessName?: string;
  phone?: string;
  website?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  ghlContactId?: string;
  paymentStatus?: string;
  membershipTier?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Session {
  id?: number;
  userId: number;
  sessionId: string;
  accessToken: string;
  expiresAt: string;
  createdAt?: string;
}

class DatabaseService {
  private db: Database | null = null;

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      const dbPath = path.join(__dirname, '../../data/membership.db');
      
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Create users table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          businessName TEXT,
          phone TEXT,
          website TEXT,
          role TEXT DEFAULT 'member',
          status TEXT DEFAULT 'pending',
          emailVerified BOOLEAN DEFAULT FALSE,
          ghlContactId TEXT,
          paymentStatus TEXT DEFAULT 'pending',
          membershipTier TEXT DEFAULT 'standard',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create sessions table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          sessionId TEXT UNIQUE NOT NULL,
          accessToken TEXT NOT NULL,
          expiresAt DATETIME NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create appointment_custom_fields table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS appointment_custom_fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          appointmentId TEXT UNIQUE NOT NULL,
          pageUrl TEXT,
          coverImageUrl TEXT,
          downloadFileUrl TEXT,
          internalNote TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
        CREATE INDEX IF NOT EXISTS idx_users_ghlContactId ON users (ghlContactId);
        CREATE INDEX IF NOT EXISTS idx_sessions_sessionId ON sessions (sessionId);
        CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions (userId);
        CREATE INDEX IF NOT EXISTS idx_appointment_custom_fields_appointmentId ON appointment_custom_fields (appointmentId);
      `);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new user with hashed password
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.passwordHash, saltRounds);

      const result = await this.db.run(`
        INSERT INTO users (
          firstName, lastName, email, passwordHash, businessName, 
          phone, website, role, status, emailVerified, ghlContactId,
          paymentStatus, membershipTier
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.firstName,
        userData.lastName,
        userData.email,
        passwordHash,
        userData.businessName || null,
        userData.phone || null,
        userData.website || null,
        userData.role,
        userData.status,
        userData.emailVerified,
        userData.ghlContactId || null,
        userData.paymentStatus || 'pending',
        userData.membershipTier || 'standard'
      ]);

      if (result.lastID) {
        return await this.getUserById(result.lastID);
      }
      throw new Error('Failed to create user');
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.db.get(`
      SELECT * FROM users WHERE id = ?
    `, [id]);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.db.get(`
      SELECT * FROM users WHERE email = ?
    `, [email]);

    return user || null;
  }

  /**
   * Get user by GoHighLevel contact ID
   */
  async getUserByGhlContactId(ghlContactId: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const user = await this.db.get(`
      SELECT * FROM users WHERE ghlContactId = ?
    `, [ghlContactId]);

    return user || null;
  }

  /**
   * Verify user password
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  /**
   * Update user's GoHighLevel contact ID
   */
  async updateUserGhlContactId(userId: number, ghlContactId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(`
      UPDATE users 
      SET ghlContactId = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [ghlContactId, userId]);
  }

  /**
   * Update user's payment status
   */
  async updateUserPaymentStatus(userId: number, paymentStatus: string, membershipTier?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const updates = [paymentStatus];
    let query = `
      UPDATE users 
      SET paymentStatus = ?, updatedAt = CURRENT_TIMESTAMP
    `;

    if (membershipTier) {
      query += `, membershipTier = ?`;
      updates.push(membershipTier);
    }

    query += ` WHERE id = ?`;
    updates.push(userId.toString());

    await this.db.run(query, updates);
  }

  /**
   * Update user status (active/pending/suspended)
   */
  async updateUserStatus(userId: number, status: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(`
      UPDATE users 
      SET status = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [status, userId]);
  }

  /**
   * Create a new session
   */
  async createSession(userId: number, sessionId: string, accessToken: string, expiresAt: string): Promise<Session> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.run(`
      INSERT INTO sessions (userId, sessionId, accessToken, expiresAt)
      VALUES (?, ?, ?, ?)
    `, [userId, sessionId, accessToken, expiresAt]);

    if (result.lastID) {
      return await this.getSessionById(result.lastID);
    }
    throw new Error('Failed to create session');
  }

  /**
   * Get session by session ID
   */
  async getSessionBySessionId(sessionId: string): Promise<Session | null> {
    if (!this.db) throw new Error('Database not initialized');

    const session = await this.db.get(`
      SELECT * FROM sessions WHERE sessionId = ? AND expiresAt > datetime('now')
    `, [sessionId]);

    return session || null;
  }

  /**
   * Get session by access token
   */
  async getSessionByToken(accessToken: string): Promise<Session | null> {
    if (!this.db) throw new Error('Database not initialized');

    const session = await this.db.get(`
      SELECT * FROM sessions WHERE accessToken = ? AND expiresAt > datetime('now')
    `, [accessToken]);

    return session || null;
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: number): Promise<Session> {
    if (!this.db) throw new Error('Database not initialized');

    const session = await this.db.get(`
      SELECT * FROM sessions WHERE id = ?
    `, [id]);

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(`
      DELETE FROM sessions WHERE sessionId = ?
    `, [sessionId]);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(`
      DELETE FROM sessions WHERE expiresAt <= datetime('now')
    `);
  }

  /**
   * Update user information (admin only)
   */
  async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const allowedFields = [
      'firstName', 'lastName', 'email', 'businessName', 'phone', 'website',
      'role', 'status', 'membershipTier', 'paymentStatus', 'emailVerified'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Build dynamic update query
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await this.db.run(query, updateValues);
  }

  /**
   * Delete user account (admin only)
   */
  async deleteUser(userId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Delete user sessions first (cascade should handle this, but let's be explicit)
    await this.db.run('DELETE FROM sessions WHERE userId = ?', [userId]);
    
    // Delete the user
    const result = await this.db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.changes === 0) {
      throw new Error('User not found or already deleted');
    }
  }

  /**
   * Get all users (for admin purposes)
   */
  async getAllUsers(limit = 100, offset = 0): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const users = await this.db.all(`
      SELECT * FROM users 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return users;
  }

  /**
   * Save or update custom fields for an appointment
   */
  async upsertAppointmentCustomFields(
    appointmentId: string,
    customFields: {
      pageUrl?: string;
      coverImageUrl?: string;
      downloadFileUrl?: string;
      internalNote?: string;
    }
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const { pageUrl, coverImageUrl, downloadFileUrl, internalNote } = customFields;

    await this.db.run(`
      INSERT INTO appointment_custom_fields (
        appointmentId, pageUrl, coverImageUrl, downloadFileUrl, internalNote, updatedAt
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(appointmentId) DO UPDATE SET
        pageUrl = excluded.pageUrl,
        coverImageUrl = excluded.coverImageUrl,
        downloadFileUrl = excluded.downloadFileUrl,
        internalNote = excluded.internalNote,
        updatedAt = CURRENT_TIMESTAMP
    `, [appointmentId, pageUrl || null, coverImageUrl || null, downloadFileUrl || null, internalNote || null]);
  }

  /**
   * Get custom fields for an appointment
   */
  async getAppointmentCustomFields(appointmentId: string): Promise<{
    pageUrl: string;
    coverImageUrl: string;
    downloadFileUrl: string;
    internalNote: string;
  } | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.get(
      'SELECT pageUrl, coverImageUrl, downloadFileUrl, internalNote FROM appointment_custom_fields WHERE appointmentId = ?',
      [appointmentId]
    );

    if (!result) return null;

    return {
      pageUrl: result.pageUrl || '',
      coverImageUrl: result.coverImageUrl || '',
      downloadFileUrl: result.downloadFileUrl || '',
      internalNote: result.internalNote || ''
    };
  }

  /**
   * Get custom fields for multiple appointments (batch operation)
   */
  async getAppointmentCustomFieldsBatch(appointmentIds: string[]): Promise<Map<string, {
    pageUrl: string;
    coverImageUrl: string;
    downloadFileUrl: string;
    internalNote: string;
  }>> {
    if (!this.db) throw new Error('Database not initialized');
    if (appointmentIds.length === 0) return new Map();

    const placeholders = appointmentIds.map(() => '?').join(',');
    const results = await this.db.all(
      `SELECT appointmentId, pageUrl, coverImageUrl, downloadFileUrl, internalNote 
       FROM appointment_custom_fields 
       WHERE appointmentId IN (${placeholders})`,
      appointmentIds
    );

    const customFieldsMap = new Map();
    for (const result of results) {
      customFieldsMap.set(result.appointmentId, {
        pageUrl: result.pageUrl || '',
        coverImageUrl: result.coverImageUrl || '',
        downloadFileUrl: result.downloadFileUrl || '',
        internalNote: result.internalNote || ''
      });
    }

    return customFieldsMap;
  }

  /**
   * Delete custom fields for an appointment
   */
  async deleteAppointmentCustomFields(appointmentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('DELETE FROM appointment_custom_fields WHERE appointmentId = ?', [appointmentId]);
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();