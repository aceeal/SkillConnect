// GlobalCallHandler.tsx - Updated to handle reconnection after sessions
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import io from 'socket.io-client';
import CallModals from './CallModals';

// Global socket instance
let globalSocket: any = null;
let socketInitializing = false;

const DEBUG = true;

export function GlobalCallHandler() {
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const pathname = usePathname();

  // Re-authenticate when returning from live session
  useEffect(() => {
    if (pathname && !pathname.includes('/live-session') && globalSocket && globalSocket.connected && session?.user) {
      console.log('Returned from live session, re-authenticating...');
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        globalSocket.emit('authenticate', { 
          userId: session.user.id,
          userName: session.user.name || 'Anonymous User'
        });
      }, 1000);
    }
  }, [pathname, session]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !globalSocket && !socketInitializing) {
      initializeSocket(session);
    }
  }, [session, status]);

  const initializeSocket = (session: any) => {
    socketInitializing = true;
    console.log('Initializing socket...');
    
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://skillconnect-production-84cc.up.railway.app'
        : 'http://localhost:3000');
    
    const socketOptions = {
      auth: {
        userName: session.user.name || 'Anonymous User',
        userId: session.user.id
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    };

    const socket = io(socketUrl, socketOptions);

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setConnectionError(null);
      socketInitializing = false;
      
      // Always authenticate on connect
      socket.emit('authenticate', { 
        userId: session.user.id,
        userName: session.user.name || 'Anonymous User'
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
      setConnectionError(`Connection error: ${err.message}`);
      socketInitializing = false;
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      // Attempt to reconnect if disconnected due to transport issues
      if (reason === 'transport error' || reason === 'transport close') {
        setTimeout(() => {
          if (!socket.connected) {
            console.log('Attempting to reconnect...');
            socket.connect();
          }
        }, 2000);
      }
    });

    // Handle reconnection
    socket.on('reconnect', () => {
      console.log('Socket reconnected, re-authenticating...');
      socket.emit('authenticate', { 
        userId: session.user.id,
        userName: session.user.name || 'Anonymous User'
      });
    });

    globalSocket = socket;
  };

  if (!session?.user) {
    return null;
  }

  return (
    <>
      {connectionError && (
        <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50">
          {connectionError}
          <button 
            className="ml-2 text-red-700 font-bold" 
            onClick={() => {
              if (globalSocket) {
                globalSocket.close();
                globalSocket = null;
              }
              socketInitializing = false;
              setConnectionError(null);
              initializeSocket(session);
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {DEBUG && (
        <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded z-50 text-xs">
          Socket: {isConnected ? 'Connected ✓' : 'Disconnected ✗'}
          <br />
          Function: {typeof window !== 'undefined' && window.initiateCallReady ? 'Ready ✓' : 'Not Ready ✗'}
        </div>
      )}
      
      <CallModals
        socket={globalSocket}
        userId={session.user.id}
        userName={session.user.name || 'Anonymous User'}
        userPicture={session.user.image || '/default-profile.png'}
        isConnected={isConnected}
      />
    </>
  );
}

export function getGlobalSocket() {
  return globalSocket;
}

export function disconnectGlobalSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}

// Function to re-authenticate current user
export function reAuthenticateUser() {
  if (globalSocket && globalSocket.connected && typeof window !== 'undefined') {
    // Try to get session from sessionStorage or any global state you have
    const event = new Event('requestAuth');
    window.dispatchEvent(event);
  }
}

export default GlobalCallHandler;