/**
 * Type extensions for Express Request object
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        ghlContactId?: string;
      };
      session?: {
        id: string;
        memberId: string;
        token: string;
        expiresAt: string;
        createdAt: string;
        user: any;
      };
    }
  }
}

export {};
