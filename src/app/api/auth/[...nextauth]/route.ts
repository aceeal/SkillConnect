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

          // Get user from database
          const users = await executeQuery({
            query: "SELECT * FROM users WHERE email = ?",
            values: [credentials.email]
          });

          if (!users || users.length === 0) {
            throw new Error("No user found with this email");
          }

          const user = users[0];

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          // Return user object without password
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
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
    async jwt({ token, user }) {
      // Add user details to token when user signs in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Include full name
        token.name = user.first_name + ' ' + user.last_name;
        // Include profile picture
        token.image = user.profile_picture || '/default-profile.png';
        // Include any other fields you need
        token.firstName = user.first_name;
        token.lastName = user.last_name;
        token.bio = user.bio;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID and role to the session from the token
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.image = token.image;
        // Add additional fields
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.bio = token.bio;
      }
      return session;
    }
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