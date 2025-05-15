// /src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcrypt";

// Import the correct database module
import { executeQuery } from "../../../../../lib/db";

// Define auth options - but don't export it directly as it causes Next.js 15 issues
const authOptions = {
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
    error: "/login",
    newUser: "/signup"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.first_name + ' ' + user.last_name;
        token.image = user.profile_picture || '/default-profile.png';
        token.firstName = user.first_name;
        token.lastName = user.last_name;
        token.bio = user.bio;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.image = token.image;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.bio = token.bio;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === "development",
};

// Create handler
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests
export { handler as GET, handler as POST };

// For Next.js 15 compatibility, we export authOptions differently
export { authOptions };