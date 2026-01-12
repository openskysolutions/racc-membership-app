/**
 * Database service for PostgreSQL user management
 * Handles user registration, authentication, and session management
 * Production-ready with connection pooling and error handling
 */

import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcrypt';

interface User {
  id?: number;
  email: string;
  passwordHash: string;
  role: string;
  status: string;
  emailVerified: boolean;
  ghlContactId?: string;
  lastLoginAt?: string;
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
  private pool: Pool | null = null;

  /**
   * Initialize database connection pool and create tables
   */
  async initialize(): Promise<void> {
    try {
      // Create connection pool
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false // DigitalOcean requires SSL
        } : undefined,
        max: 5, // Increased to handle concurrent requests when marking winners
        min: 1,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('PostgreSQL connected successfully');
      client.release();

      // Create tables
      await this.createTables();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create database tables if they don't exist
   */
  private async createTables(): Promise<void> {
    const client = await this.pool!.connect();
    try {
      await client.query('BEGIN');

      // Create users table - minimal schema for authentication only
      // All profile data (firstName, lastName, businessName, phone, etc.) comes from GoHighLevel
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          "passwordHash" VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'member',
          status VARCHAR(50) DEFAULT 'pending',
          "emailVerified" BOOLEAN DEFAULT FALSE,
          "ghlContactId" VARCHAR(255) UNIQUE,
          "lastLoginAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index on email for faster lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      `);

      // Create index on ghlContactId
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_ghl_contact_id ON users("ghlContactId")
      `);

      // Create sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL,
          "sessionId" VARCHAR(255) UNIQUE NOT NULL,
          "accessToken" TEXT NOT NULL,
          "expiresAt" TIMESTAMP NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create index on sessionId for faster lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions("sessionId")
      `);

      // Create appointment_custom_fields table
      await client.query(`
        CREATE TABLE IF NOT EXISTS appointment_custom_fields (
          id SERIAL PRIMARY KEY,
          "appointmentId" VARCHAR(255) UNIQUE NOT NULL,
          "pageUrl" TEXT,
          "coverImageUrl" TEXT,
          "downloadFileUrl" TEXT,
          "internalNote" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create trigger to auto-update updatedAt timestamp
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW."updatedAt" = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      await client.query(`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users
      `);

      await client.query(`
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
      `);

      await client.query(`
        DROP TRIGGER IF EXISTS update_appointment_custom_fields_updated_at ON appointment_custom_fields
      `);

      await client.query(`
        CREATE TRIGGER update_appointment_custom_fields_updated_at
        BEFORE UPDATE ON appointment_custom_fields
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
      `);

      await client.query('COMMIT');
      console.log('Database tables created successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new user (authentication only - profile data comes from GHL)
   */
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.pool) throw new Error('Database not initialized');

    const result = await this.pool.query(
      `INSERT INTO users 
        (email, "passwordHash", role, status, "emailVerified", "ghlContactId")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user.email,
        user.passwordHash,
        user.role,
        user.status,
        user.emailVerified,
        user.ghlContactId || null
      ]
    );

    return this.mapUser(result.rows[0]);
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    if (!this.pool) throw new Error('Database not initialized');

    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0 ? this.mapUser(result.rows[0]) : null;
  }

  /**
   * Find user by ID
   */
  async findUserById(id: number): Promise<User | null> {
    if (!this.pool) throw new Error('Database not initialized');

    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? this.mapUser(result.rows[0]) : null;
  }

  /**
   * Find user by GHL Contact ID
   */
  async findUserByGhlContactId(ghlContactId: string): Promise<User | null> {
    if (!this.pool) throw new Error('Database not initialized');

    const result = await this.pool.query(
      'SELECT * FROM users WHERE "ghlContactId" = $1',
      [ghlContactId]
    );

    return result.rows.length > 0 ? this.mapUser(result.rows[0]) : null;
  }

  /**
   * Update user (authentication fields only)
   */
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    if (!this.pool) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = ['email', 'passwordHash', 'role', 'status', 'emailVerified', 'ghlContactId', 'lastLoginAt'];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && allowedFields.includes(key)) {
        const dbKey = key === 'emailVerified' ? '"emailVerified"' :
                      key === 'ghlContactId' ? '"ghlContactId"' :
                      key === 'passwordHash' ? '"passwordHash"' :
                      key === 'lastLoginAt' ? '"lastLoginAt"' : key;
        
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const result = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return this.mapUser(result.rows[0]);
  }

  /**
   * Update user status (helper method for auth flows)
   */
  async updateUserStatus(userId: number, status: string): Promise<void> {
    await this.updateUser(userId, { status });
  }

  /**
   * Update user GHL contact ID (helper method)
   */
  async updateUserGhlContactId(userId: number, ghlContactId: string): Promise<void> {
    await this.updateUser(userId, { ghlContactId });
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
  async getAllUsers(limit?: number): Promise<User[]> {
    if (!this.pool) throw new Error('Database not initialized');

    const query = limit 
      ? `SELECT * FROM users ORDER BY "createdAt" DESC LIMIT $1`
      : `SELECT * FROM users ORDER BY "createdAt" DESC`;
    
    const result = limit
      ? await this.pool.query(query, [limit])
      : await this.pool.query(query);

    return result.rows.map(row => this.mapUser(row));
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');

    await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  /**
   * Update payment status (deprecated - membership status is managed in GHL)
   * Kept for backward compatibility but doesn't store paymentStatus anymore
   */
  async updateUserPaymentStatus(userId: number, paymentStatus: string, membershipTier?: string): Promise<void> {
    // In the new schema, we don't store payment/tier info
    // This is now managed entirely in GoHighLevel via tags and custom fields
    // This method is kept as a no-op for backward compatibility
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
    return bcrypt.hash(password, 10);
  }

  /**
   * Create session
   */
  async createSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    if (!this.pool) throw new Error('Database not initialized');

    const result = await this.pool.query(
      `INSERT INTO sessions ("userId", "sessionId", "accessToken", "expiresAt")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [session.userId, session.sessionId, session.accessToken, session.expiresAt]
    );

    return this.mapSession(result.rows[0]);
  }

  /**
   * Find session by session ID
   */
  async findSessionBySessionId(sessionId: string): Promise<Session | null> {
    if (!this.pool) throw new Error('Database not initialized');

    const result = await this.pool.query(
      'SELECT * FROM sessions WHERE "sessionId" = $1',
      [sessionId]
    );

    return result.rows.length > 0 ? this.mapSession(result.rows[0]) : null;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');

    await this.pool.query('DELETE FROM sessions WHERE "sessionId" = $1', [sessionId]);
  }

  /**
   * Delete expired sessions
   */
  async deleteExpiredSessions(): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');

    await this.pool.query('DELETE FROM sessions WHERE "expiresAt" < NOW()');
  }

  /**
   * Map database row to User object
   */
  private mapUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      status: row.status,
      emailVerified: row.emailVerified,
      ghlContactId: row.ghlContactId,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  /**
   * Map database row to Session object
   */
  private mapSession(row: any): Session {
    return {
      id: row.id,
      userId: row.userId,
      sessionId: row.sessionId,
      accessToken: row.accessToken,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
