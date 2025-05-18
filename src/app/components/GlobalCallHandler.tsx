// src/app/components/GlobalCallHandler.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import io from 'socket.io-client';
import CallModals from './CallModals';

// Global socket instance
let globalSocket: any = null;
let socketInitializing = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

export function GlobalCallHandler() {
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Only proceed if user is authenticated and we don't already have a connection
    if (status === 'authenticated' && session?.user) {
      // If the socket isn't connected and we're not already trying to connect
      if (!globalSocket && !socketInitializing) {
        initializeSocket(session);
      } else if (globalSocket) {
        // Update connection status based on existing socket
        setIsConnected(globalSocket.connected);
        
        // Add event listeners to existing socket
        const handleConnect = () => {
          if (DEBUG) console.log('Socket reconnected');
          setIsConnected(true);
          setConnectionError(null);
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          
          // Authenticate on reconnection
          globalSocket.emit('authenticate', { 
            userId: session.user.id,
            userName: session.user.name || 'Anonymous User'
          });
        };
        
        const handleError = (err: any) => {
          console.error('Socket error:', err);
          setConnectionError(`Socket error: ${err.message}`);
        };
        
        const handleDisconnect = (reason: string) => {
          if (DEBUG) console.log(`Socket disconnected: ${reason}`);
          setIsConnected(false);
          
          // If disconnected due to transport error, attempt to reconnect
          if ((reason === 'transport error' || reason === 'transport close') && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            handleReconnect(session);
          }
        };
        
        globalSocket.on('connect', handleConnect);
        globalSocket.on('connect_error', handleError);
        globalSocket.on('disconnect', handleDisconnect);
        
        return () => {
          if (globalSocket) {
            globalSocket.off('connect', handleConnect);
            globalSocket.off('connect_error', handleError);
            globalSocket.off('disconnect', handleDisconnect);
          }
        };
      }
    }
    
    // Cleanup function - intentionally not disconnecting to maintain connection
    return () => {};
  }, [session, status]);

  const initializeSocket = (session: any) => {
    socketInitializing = true;
    if (DEBUG) console.log('Initializing socket connection...');
    
    // Create socket with error handling
    try {
      // Dynamic socket URL based on environment
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://skillconnect-production-84cc.up.railway.app'
          : 'http://localhost:3000');
      
      if (DEBUG) console.log(`Connecting to socket server at: ${socketUrl}`);
      
      // Socket options based on environment
      const socketOptions: any = {
        auth: {
          userName: session.user.name || 'Anonymous User',
          userId: session.user.id
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000, // 10 second timeout
        transports: ['websocket', 'polling'] // Try websocket first, fallback to polling
      };

      // Only add rejectUnauthorized for localhost in development
      if (socketUrl.includes('localhost') && process.env.NODE_ENV !== 'production') {
        socketOptions.rejectUnauthorized = false;
      }

      const socket = io(socketUrl, socketOptions);

      socket.on('connect', () => {
        if (DEBUG) console.log('Global socket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        socketInitializing = false;
        reconnectAttempts = 0;
        
        // Authenticate on connection
        socket.emit('authenticate', { 
          userId: session.user.id,
          userName: session.user.name || 'Anonymous User'
        });
      });

      socket.on('connect_error', (err) => {
        console.error('Global socket connection error:', err);
        setIsConnected(false);
        setConnectionError(`Connection error: ${err.message}`);
        socketInitializing = false;
      });

      socket.on('disconnect', (reason) => {
        if (DEBUG) console.log(`Socket disconnected: ${reason}`);
        setIsConnected(false);
        
        // If disconnected due to transport error, attempt to reconnect
        if ((reason === 'transport error' || reason === 'transport close') && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          handleReconnect(session);
        }
      });

      // Debug all incoming message events if debug mode is enabled
      if (DEBUG) {
        socket.onAny((event, ...args) => {
          console.log(`[SOCKET EVENT] ${event}:`, args);
        });
      }

      // Add event listeners for message tracking
      socket.on('message_sent', (data: any) => {
        if (DEBUG) console.log('Message sent confirmation received:', data.id);
      });

      socket.on('receive_message', (data: any) => {
        if (DEBUG) console.log('New message received:', data.id);
      });

      // User status tracking
      socket.on('user_status_changed', (data: any) => {
        if (DEBUG) console.log(`User ${data.userId} is now ${data.status}`);
      });

      // Store socket globally
      globalSocket = socket;
    } catch (error: any) {
      console.error('Socket initialization error:', error);
      setConnectionError(`Socket initialization error: ${error.message}`);
      socketInitializing = false;
    }
  };

  const handleReconnect = (session: any) => {
    reconnectAttempts++;
    if (DEBUG) console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    
    setTimeout(() => {
      if (session && (!globalSocket || !globalSocket.connected)) {
        // Close existing socket if it exists
        if (globalSocket) {
          globalSocket.close();
          globalSocket = null;
        }
        
        // Try to initialize a new socket
        initializeSocket(session);
      }
    }, 2000 * reconnectAttempts); // Progressive backoff
  };

  // Always render the CallModals if we have a session
  // It will handle its own conditional rendering based on connection status
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
              if (session) {
                // Reset and try to reconnect
                if (globalSocket) {
                  globalSocket.close();
                  globalSocket = null;
                }
                socketInitializing = false;
                reconnectAttempts = 0;
                setConnectionError(null);
                initializeSocket(session);
              }
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {DEBUG && (
        <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded z-50">
          Socket: {isConnected ? 'Connected ✓' : 'Disconnected ✗'}
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

// Modified getGlobalSocket function - now ensures socket is connected
export function getGlobalSocket() {
  // If socket exists but isn't connected, try to connect it
  if (globalSocket && !globalSocket.connected && !socketInitializing) {
    if (DEBUG) console.log('Socket exists but not connected. Connecting...');
    globalSocket.connect();
  }
  
  if (DEBUG && globalSocket) {
    console.log('getGlobalSocket called. Socket connected:', globalSocket.connected);
  }
  
  return globalSocket;
}

// Function to disconnect the socket (useful for sign out)
export function disconnectGlobalSocket() {
  if (globalSocket) {
    if (DEBUG) console.log('Disconnecting global socket');
    globalSocket.disconnect();
  }
}

// New function to check if socket is connected
export function isSocketConnected() {
  return globalSocket && globalSocket.connected;
}

export default GlobalCallHandler;