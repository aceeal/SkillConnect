// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcrypt";

// Import the correct database module
import { executeQuery } from "../../../../../lib/db";

// Define auth options as a separate export so it can be imported elsewhere
export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET, // Explicitly define the secret
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          // Get user from database including account_status
          const users = await executeQuery({
            query: "SELECT * FROM users WHERE email = ?",
            values: [credentials.email]
          });

          if (!users || users.length === 0) {
            throw new Error("No user found with this email");
          }

          const user = users[0];

          // Check if user account is banned
          if (user.account_status === 'banned') {
            throw new Error("Your account has been banned. Please contact support for assistance.");
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          // Update last_login timestamp
          try {
            await executeQuery({
              query: "UPDATE users SET last_login = NOW() WHERE id = ?",
              values: [user.id]
            });
          } catch (error) {
            console.error("Failed to update last_login:", error);
          }

          // Return user object without password
          const { password, ...userWithoutPassword } = user;
          return {
            ...userWithoutPassword,
            // Ensure account_status is included
            accountStatus: user.account_status
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || ""
    })
  ],
  pages: {
    signIn: "/login",
    signOut: "/auth/signout",
    error: "/login", // Error code passed in query string as ?error=
    newUser: "/signup" // New users will be directed here on first sign in
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Add user details to token when user signs in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountStatus = user.accountStatus || user.account_status;
        // Include full name
        token.name = user.first_name + ' ' + user.last_name;
        // Include profile picture
        token.image = user.profile_picture || '/default-profile.png';
        // Include any other fields you need
        token.firstName = user.first_name;
        token.lastName = user.last_name;
        token.bio = user.bio;
        token.lastChecked = Date.now();
      }

      // Check account status for existing tokens every minute (if last check was over 1 minute ago)
      const now = Date.now();
      const lastChecked = token.lastChecked || 0;
      const oneMinute = 60 * 1000;

      if (token.id && (now - lastChecked) > oneMinute) {
        try {
          const users = await executeQuery({
            query: "SELECT account_status FROM users WHERE id = ?",
            values: [token.id]
          });

          if (users && users.length > 0) {
            const currentAccountStatus = users[0].account_status;
            
            // If user is now banned, invalidate the token
            if (currentAccountStatus === 'banned') {
              console.log(`User ${token.id} is banned, invalidating token`);
              return null; // This will force the user to sign out
            }
            
            // Update token with current account status and timestamp
            token.accountStatus = currentAccountStatus;
            token.lastChecked = now;
          } else {
            // User not found in database, invalidate token
            console.log(`User ${token.id} not found in database, invalidating token`);
            return null;
          }
        } catch (error) {
          console.error("Error checking account status in JWT callback:", error);
          // Don't invalidate token on error, just log it
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add user ID and role to the session from the token
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.accountStatus = token.accountStatus;
        session.user.name = token.name;
        session.user.image = token.image;
        // Add additional fields
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.bio = token.bio;
      }

      // If account is banned, return null to force sign out
      if (token && token.accountStatus === 'banned') {
        console.log(`Session callback: User ${token.id} is banned, returning null session`);
        return null;
      }

      return session;
    }
  },
  events: {
    async signOut({ token }) {
      // Optional: Log when a user signs out
      if (token && token.id) {
        console.log(`User ${token.id} signed out`);
      }
    },
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
};

// Create handler
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests
export { handler as GET, handler as POST };