// src/app/components/NotificationSystem.tsx
'use client';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export default function NotificationSystem() {
  const { data: session } = useSession();
  const lastNotificationCheck = useRef<number>(0);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    // Function to check for new notifications
    const checkForNewNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?unread_only=true');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.notifications) {
            // Check if there are newer notifications than our last check
            const newNotifications = data.notifications.filter((notification: any) => {
              const notificationTime = new Date(notification.createdAt).getTime();
              return notificationTime > lastNotificationCheck.current;
            });

            if (newNotifications.length > 0) {
              // Update last check time
              lastNotificationCheck.current = Date.now();
              
              // Dispatch event for each new notification
              newNotifications.forEach((notification: any) => {
                const event = new CustomEvent('newNotification', { 
                  detail: {
                    ...notification,
                    title: getNotificationTitle(notification.type),
                    message: notification.message
                  }
                });
                window.dispatchEvent(event);
                
                // Show browser notification if permission is granted
                if (Notification.permission === 'granted') {
                  new Notification(getNotificationTitle(notification.type), {
                    body: notification.message,
                    icon: '/logo.png',
                    tag: `skillconnect-${notification.id}`,
                    requireInteraction: notification.type === 'session_booking'
                  });
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking for new notifications:', error);
      }
    };

    const getNotificationTitle = (type: string) => {
      switch (type) {
        case 'session_booking':
          return 'Session Booking Request';
        case 'message':
          return 'New Message';
        default:
          return 'SkillConnect Notification';
      }
    };

    // Initialize last check time
    lastNotificationCheck.current = Date.now();

    // Request notification permission if not already granted
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }

    // Start polling for new notifications every 10 seconds
    pollingInterval.current = setInterval(checkForNewNotifications, 10000);

    // Initial check
    checkForNewNotifications();

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [session]);

  return null; // This component doesn't render anything
}