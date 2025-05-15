// src/types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
      // Add missing custom properties
      firstName?: string | null;
      lastName?: string | null;
      bio?: string | null;
    }
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: number;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extend the built-in JWT types
   */
  interface JWT {
    id: number;
    role?: string;
  }
}
