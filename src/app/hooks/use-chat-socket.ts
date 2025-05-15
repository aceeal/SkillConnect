// src/app/hooks/use-chat-socket.ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getGlobalSocket } from '../components/GlobalCallHandler';

// Debug mode
const DEBUG = true;

export const useChatSocket = () => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Reference to track if socket events are registered
  const eventsRegistered = useRef(false);
  
  // Function to get socket
  const getSocket = useCallback(() => {
    const socket = getGlobalSocket();
    if (DEBUG && socket) console.log('Got socket, connected:', socket.connected);
    return socket;
  }, []);
  
  // Check if socket is connected
  useEffect(() => {
    if (!session?.user) return;
    
    // Get current socket
    const socket = getSocket();
    if (!socket) {
      setIsConnected(false);
      return;
    }
    
    // Set initial connection state
    setIsConnected(socket.connected);
    
    // Function to check connection status
    const checkConnection = () => {
      const socket = getSocket();
      const connected = socket?.connected || false;
      
      if (connected !== isConnected) {
        if (DEBUG) console.log(`Socket connection changed: ${connected}`);
        setIsConnected(connected);
      }
      
      // Try to reconnect if not connected
      if (!connected && socket) {
        if (DEBUG) console.log('Attempting to reconnect socket');
        socket.connect();
      }
    };
    
    // Set up interval to check connection
    const interval = setInterval(checkConnection, 3000);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, [session, isConnected, getSocket]);
  
  // Register global event handlers
  useEffect(() => {
    if (!session?.user || eventsRegistered.current) return;
    
    const socket = getSocket();
    if (!socket) return;
    
    if (DEBUG) console.log('Setting up global socket event handlers');
    
    // Connection handler
    const handleConnect = () => {
      if (DEBUG) console.log('Socket connected');
      setIsConnected(true);
      setLastError(null);
      
      // Authenticate when connected
      if (session?.user?.id) {
        if (DEBUG) console.log('Authenticating socket with user ID:', session.user.id);
        
        socket.emit('authenticate', { 
          userId: session.user.id,
          userName: session.user.name || 'Anonymous User'
        });
      }
    };
    
    // Disconnection handler
    const handleDisconnect = (reason: string) => {
      if (DEBUG) console.log('Socket disconnected:', reason);
      setIsConnected(false);
    };
    
    // Error handler
    const handleError = (err: any) => {
      console.error('Socket error:', err);
      setLastError(err.message || 'Unknown socket error');
      setIsConnected(false);
    };
    
    // Register handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);
    
    // Mark events as registered
    eventsRegistered.current = true;
    
    // Cleanup function
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
      eventsRegistered.current = false;
    };
  }, [session, getSocket]);
  
  // Send a message
  const sendMessage = useCallback((receiverId: string, text: string) => {
    if (!session?.user) return false;
    
    const socket = getSocket();
    if (!socket || !socket.connected) {
      if (DEBUG) console.log('Cannot send message via socket - not connected');
      return false;
    }
    
    if (DEBUG) console.log(`Sending message to ${receiverId}: ${text}`);
    
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`;
    
    // Emit message event
    socket.emit('send_message', {
      receiverId,
      text,
      tempId
    });
    
    return tempId;
  }, [session, getSocket]);
  
  // Register message listeners
  const registerMessageListeners = useCallback((
    onReceiveMessage: (data: any) => void,
    onMessageSent: (data: any) => void
  ) => {
    const socket = getSocket();
    if (!socket) {
      if (DEBUG) console.log('Cannot register message listeners - no socket');
      return () => {};
    }
    
    if (DEBUG) console.log('Registering message event listeners');
    
    // Define handlers
    const handleReceiveMessage = (data: any) => {
      if (DEBUG) console.log('Received message event:', data);
      onReceiveMessage(data);
    };
    
    const handleMessageSent = (data: any) => {
      if (DEBUG) console.log('Message sent confirmation event:', data);
      onMessageSent(data);
    };
    
    // Remove existing listeners to prevent duplicates
    socket.off('receive_message');
    socket.off('message_sent');
    
    // Add listeners
    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    
    // Return cleanup function
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('message_sent', handleMessageSent);
      }
    };
  }, [getSocket]);
  
  // Force reconnection
  const reconnect = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      if (!socket.connected) {
        if (DEBUG) console.log('Forcing socket reconnection');
        socket.connect();
      } else {
        if (DEBUG) console.log('Socket already connected');
      }
    } else {
      if (DEBUG) console.log('No socket available to reconnect');
    }
  }, [getSocket]);
  
  return {
    isConnected,
    lastError,
    sendMessage,
    registerMessageListeners,
    reconnect
  };
};

export default useChatSocket;