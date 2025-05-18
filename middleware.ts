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

  // If the path is public and the user is logged in
  if (isPublicPath && token) {
    // Check if user is banned before allowing access to public pages
    if (token.accountStatus === 'banned') {
      // Allow access to login page to show banned message
      if (path === "/login") {
        // Add banned parameter to login URL
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("banned", "true");
        return NextResponse.redirect(loginUrl);
      }
      // For other public pages, redirect to login with banned message
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("banned", "true");
      return NextResponse.redirect(loginUrl);
    }
    
    // If user is not banned and on public page, redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If the path is protected and the user is not logged in, redirect to login
  if (!isPublicPath && !token) {
    // Add the original path to the login URL as a callback
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in but banned, redirect to login with banned message
  if (!isPublicPath && token && token.accountStatus === 'banned') {
    console.log(`Middleware: User ${token.id} is banned, redirecting to login`);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("banned", "true");
    loginUrl.searchParams.set("signout", "true"); // This will trigger a sign out
    return NextResponse.redirect(loginUrl);
  }

  // Continue to the requested page
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (except auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/(?!auth)|_next/static|_next/image|favicon.ico).*)",
  ],
};