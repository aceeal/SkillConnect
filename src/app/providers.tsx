// src/app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Custom session provider that prevents session flashing during development
export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Use this effect to help debug session issues
  useEffect(() => {
    console.log('Path changed:', pathname);
  }, [pathname]);

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}