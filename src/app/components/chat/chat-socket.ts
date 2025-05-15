// src/app/components/chat/chat-socket.ts
import { getGlobalSocket } from '../GlobalCallHandler';

// Debug mode
const DEBUG = true;

// Get socket from existing GlobalCallHandler
export const getSocket = () => {
  const socket = getGlobalSocket();
  
  if (DEBUG && socket) {
    console.log('Chat using GlobalCallHandler socket, connected:', socket.connected);
  }
  
  return socket;
};

// Check if socket is connected
export const isSocketConnected = () => {
  const socket = getSocket();
  return socket && socket.connected;
};

// Send message
export const sendMessage = (receiverId: string, text: string) => {
  const socket = getSocket();
  
  if (!socket || !socket.connected) {
    if (DEBUG) console.log('Socket not connected, cannot send message');
    return false;
  }

  if (DEBUG) console.log(`Sending message to ${receiverId}: ${text}`);
  
  // Generate temporary ID to track this message
  const tempId = `temp-${Date.now()}`;
  
  // Use the same event name as your server expects
  socket.emit('send_message', {
    receiverId,
    text,
    tempId
  });
  
  return tempId;
};

// Register message listeners
export const registerMessageListeners = (
  onMessageReceived: (data: any) => void,
  onMessageSent: (data: any) => void
) => {
  const socket = getSocket();
  
  if (!socket) {
    if (DEBUG) console.log('Cannot register listeners - no socket available');
    return () => {};
  }

  // Make sure these event names match exactly what your server emits
  const handleReceiveMessage = (data: any) => {
    if (DEBUG) console.log('Received message event:', data);
    onMessageReceived(data);
  };

  const handleMessageSent = (data: any) => {
    if (DEBUG) console.log('Message sent confirmation event:', data);
    onMessageSent(data);
  };

  // Remove any existing listeners to prevent duplicates
  socket.off('receive_message', handleReceiveMessage);
  socket.off('message_sent', handleMessageSent);
  
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
};

// Force socket to reconnect
export const reconnectSocket = () => {
  const socket = getSocket();
  
  if (socket) {
    if (!socket.connected) {
      if (DEBUG) console.log('Attempting to reconnect socket');
      socket.connect();
    } else {
      if (DEBUG) console.log('Socket already connected');
    }
  } else {
    if (DEBUG) console.log('No socket available to reconnect');
  }
};