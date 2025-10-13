declare global {
  namespace Express {
    interface Request {
      member?: any; // or use a more specific type like User, Member, etc.
      user?: {
        id: string | number;
        name: string;
        email: string;
        role: string;
        status: string;
      };
      session?: any;
    }
  }
}

export {};