declare global {
  namespace Express {
    interface Request {
      member?: any; // or use a more specific type like User, Member, etc.
    }
  }
}

export {};