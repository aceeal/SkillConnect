// src/app/components/auth-redirect.tsx
'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (status === 'authenticated') {
      const isAdmin = session?.user?.role === 'admin';
      const isAdminPath = pathname?.startsWith('/admin-dashboard');
      
      // If admin on non-admin page, redirect to admin dashboard
      if (isAdmin && isAdminPath === false && pathname !== '/') {
        router.push('/admin-dashboard');
      }
      
      // If regular user trying to access admin routes, redirect to dashboard
      if (!isAdmin && isAdminPath) {
        router.push('/dashboard');
      }
    } else if (status === 'unauthenticated' && 
              !pathname?.includes('/login') && 
              !pathname?.includes('/signup')) {
      // Optional: Redirect unauthenticated users to login
      // Uncomment if you want this behavior
      // router.push('/login');
    }
  }, [status, pathname, router, session]);
  
  return null;
}