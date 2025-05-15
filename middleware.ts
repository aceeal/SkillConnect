// middleware.ts at the root level of your project
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/signup" || path === "/forgot-password";

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If the path is public and the user is logged in, redirect to home
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If the path is protected and the user is not logged in, redirect to login
  if (!isPublicPath && !token) {
    // Add the original path to the login URL as a callback
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Continue to the requested page
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/profile/:path*",
    "/dashboard/:path*",
    "/connect/:path*",
    "/live-session/:path*",
  ],
};