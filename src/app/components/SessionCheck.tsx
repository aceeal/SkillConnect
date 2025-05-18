// src/app/components/SessionCheck.tsx
'use client';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BannedUserModal from './BannedUserModal';

export default function SessionCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showBannedModal, setShowBannedModal] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Check account status every 30 seconds for more responsive detection
      const checkAccountStatus = async () => {
        try {
          const response = await fetch('/api/user/check-status');
          
          if (response.ok) {
            const data = await response.json();
            
            // If user is banned, show modal
            if (data.isBanned) {
              console.log('User is banned, showing modal');
              setShowBannedModal(true);
              return;
            }
          } else if (response.status === 401) {
            // Session is invalid, redirect to login
            await signOut({ redirect: false });
            router.push('/login');
          }
        } catch (error) {
          console.error('Error checking account status:', error);
        }
      };

      // Check immediately
      checkAccountStatus();

      // Set up interval to check every 30 seconds
      const interval = setInterval(checkAccountStatus, 30 * 1000);

      return () => clearInterval(interval);
    }
  }, [session, status, router]);

  const handleModalClose = () => {
    setShowBannedModal(false);
    // Auto sign out after a short delay
    setTimeout(async () => {
      await signOut({ redirect: false });
      router.push('/login?banned=true');
    }, 500);
  };

  return (
    <BannedUserModal 
      isOpen={showBannedModal} 
      onClose={handleModalClose}
    />
  );
}