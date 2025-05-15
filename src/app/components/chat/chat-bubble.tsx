// src/app/components/chat/chat-bubble.tsx
'use client';

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { RiMailLine, RiEdit2Line } from 'react-icons/ri';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import ChatPanel from './chat-panel';
import NewMessageModal from './new-message-modal';
import { useChatSocket } from '../../hooks/use-chat-socket';

// Set to true to enable detailed logging
const DEBUG = true;

// Message Interface
interface Message {
  id: string;
  text: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
  pending?: boolean;
  failed?: boolean;
}

// Chat User Interface
interface ChatUser {
  id: string;
  name: string;
  profilePicture: string;
  status: 'online' | 'offline' | 'away';
  lastMessage?: Message;
  unreadCount: number;
}

// Interface for User from the New Message Modal
interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  status?: string;
}

// Define the ref type for external use
export interface ChatBubbleRef {
  openChat: (user: ChatUser) => void;
}

const ChatBubble = forwardRef<ChatBubbleRef, {}>((props, ref) => {
  const { data: session, status } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [currentUserPicture, setCurrentUserPicture] = useState('/default-profile.png');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  
  // Use our custom hook for socket functionality
  const { 
    isConnected, 
    sendMessage: socketSendMessage,
    registerMessageListeners,
    reconnect 
  } = useChatSocket();
  
  // Ref to track processed message IDs
  const processedMessageIds = useRef<Set<string>>(new Set());
  
  // Expose the openChat method via ref
  useImperativeHandle(ref, () => ({
    openChat: (user: ChatUser) => {
      // Ensure we have a standardized user ID format
      const userId = String(user.id);
      const existingUser = findExistingUser(userId);
      
      if (existingUser) {
        openChat(existingUser);
      } else {
        // Create a standardized user object and open chat
        const newUser: ChatUser = {
          id: userId,
          name: user.name,
          profilePicture: user.profilePicture || '/default-profile.png',
          status: user.status || 'offline',
          unreadCount: user.unreadCount || 0
        };
        
        // Add to chat users safely
        addChatUserSafely(newUser);
        
        // Fetch messages and open chat
        fetchMessages(userId);
        openChat(newUser);
      }
    }
  }));

  // Helper function to find an existing user by ID (standardized to string)
  const findExistingUser = (userId: string): ChatUser | undefined => {
    return chatUsers.find(u => String(u.id) === String(userId));
  };
  
  // Helper function to safely add a chat user without duplicates
  const addChatUserSafely = (user: ChatUser) => {
    const userId = String(user.id);
    
    setChatUsers(prev => {
      // Check if user already exists
      const exists = prev.some(u => String(u.id) === userId);
      if (exists) {
        if (DEBUG) console.log(`User ${userId} already exists in chat users, not adding duplicate`);
        return prev;
      }
      
      if (DEBUG) console.log(`Adding new user ${userId} to chat users`);
      return [...prev, user];
    });
  };

  // Listen for external open chat events
  useEffect(() => {
    const handleOpenChatEvent = (event: CustomEvent) => {
      const { userId, userName, userImage } = event.detail;
      
      if (DEBUG) console.log('Received openChat event', { userId, userName, userImage });
      
      // Ensure we have a standardized ID format
      const standardizedUserId = String(userId);
      
      // First, check if we have this user in our chat users list
      const existingUser = findExistingUser(standardizedUserId);
      
      if (existingUser) {
        openChat(existingUser);
      } else {
        // Create a new chat user object
        const newUser: ChatUser = {
          id: standardizedUserId,
          name: userName || 'User',
          profilePicture: userImage || '/default-profile.png',
          status: 'offline', // Default to offline
          unreadCount: 0
        };
        
        // Add to chat users safely
        addChatUserSafely(newUser);
        
        // Initialize empty messages if needed
        setMessages(prev => {
          if (!prev[standardizedUserId]) {
            return {
              ...prev,
              [standardizedUserId]: []
            };
          }
          return prev;
        });
        
        // Fetch messages for this user
        fetchMessages(standardizedUserId);
        
        // Open the chat
        openChat(newUser);
      }
    };
    
    // Register a global handler
    window.openChatWithUser = (userId: string, userName: string, userImage: string) => {
      const event = new CustomEvent('openChat', {
        detail: { userId, userName, userImage }
      });
      window.dispatchEvent(event);
      return true;
    };
    
    // Add event listener
    window.addEventListener('openChat', handleOpenChatEvent as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('openChat', handleOpenChatEvent as EventListener);
      // @ts-ignore
      delete window.openChatWithUser;
    };
  }, [chatUsers]);
  
  // Register message listeners
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    
    if (DEBUG) console.log('Setting up message listeners');
    
    // Register socket event listeners
    const cleanup = registerMessageListeners(
      // Message received handler
      (data) => {
        if (DEBUG) console.log('Message received in component:', data);
        handleReceivedMessage(data);
      },
      // Message sent confirmation handler
      (data) => {
        if (DEBUG) console.log('Message sent confirmation in component:', data);
        handleMessageConfirmation(data);
      }
    );
    
    // Force reconnect when component mounts
    reconnect();
    
    return cleanup;
  }, [status, session, registerMessageListeners, reconnect]);
  
  // Load user data on session change
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Load user profile picture
      if (session.user.image) {
        setCurrentUserPicture(session.user.image);
      } else {
        fetchUserProfile();
      }
      
      // Load chat conversations
      fetchConversations();
    }
  }, [status, session]);
  
  // Helper to fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        if (data.profilePicture) {
          setCurrentUserPicture(data.profilePicture);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      const data = await response.json();
      
      if (data.conversations && Array.isArray(data.conversations)) {
        // Process conversations
        const users: ChatUser[] = data.conversations.map((conv: any) => ({
          id: String(conv.userId),
          name: `${conv.firstName} ${conv.lastName}`,
          profilePicture: conv.profilePicture || '/default-profile.png',
          status: conv.isOnline ? 'online' : 'offline',
          lastMessage: conv.lastMessage ? {
            id: String(conv.lastMessage.id),
            text: conv.lastMessage.text,
            sender_id: String(conv.lastMessage.sender_id),
            receiver_id: String(conv.lastMessage.receiver_id),
            is_read: !!conv.lastMessage.is_read,
            created_at: conv.lastMessage.created_at
          } : undefined,
          unreadCount: conv.unreadCount || 0
        }));
        
        // Replace entire users list to avoid duplicates from earlier sessions
        setChatUsers(users);
        
        // Set total unread count
        const total = users.reduce((sum, user) => sum + user.unreadCount, 0);
        setUnreadTotal(total);
        
        // Fetch messages for each conversation
        users.forEach(user => {
          fetchMessages(user.id);
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };
  
  // Fetch messages for a conversation
  const fetchMessages = async (userId: string) => {
    try {
      // Ensure consistent ID format
      const standardizedUserId = String(userId);
      
      if (DEBUG) console.log(`Fetching messages for user ${standardizedUserId}`);
      
      const response = await fetch(`/api/messages?userId=${standardizedUserId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages)) {
        // Process messages
        const msgs: Message[] = data.messages.map((msg: any) => ({
          id: String(msg.id),
          text: msg.text,
          sender_id: String(msg.sender_id),
          receiver_id: String(msg.receiver_id),
          is_read: !!msg.is_read,
          created_at: msg.created_at
        }));
        
        if (DEBUG) console.log(`Fetched ${msgs.length} messages for user ${standardizedUserId}`);
        
        // Add message IDs to processed set
        msgs.forEach(msg => {
          processedMessageIds.current.add(msg.id);
        });
        
        // Sort messages by timestamp
        const sortedMsgs = [...msgs].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        setMessages(prev => ({
          ...prev,
          [standardizedUserId]: sortedMsgs
        }));
      }
    } catch (error) {
      console.error(`Error fetching messages for user ${userId}:`, error);
    }
  };
  
  // Handle received message
  const handleReceivedMessage = (data: any) => {
    // Skip if already processed
    if (processedMessageIds.current.has(String(data.id))) {
      if (DEBUG) console.log(`Skipping duplicate message: ${data.id}`);
      return;
    }
    
    // Add to processed IDs
    processedMessageIds.current.add(String(data.id));
    
    // Create message object
    const newMessage: Message = {
      id: String(data.id),
      text: data.text,
      sender_id: String(data.senderId),
      receiver_id: String(data.receiverId),
      is_read: false,
      created_at: data.timestamp || new Date().toISOString()
    };
    
    // Standardize sender ID
    const senderId = String(data.senderId);
    
    // Add to messages
    setMessages(prev => {
      const prevMessages = prev[senderId] || [];
      
      // Skip if message already exists
      if (prevMessages.some(msg => msg.id === newMessage.id)) {
        return prev;
      }
      
      const updatedMessages = [...prevMessages, newMessage].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      if (DEBUG) console.log(`Added new message from ${senderId} to messages state`);
      
      return {
        ...prev,
        [senderId]: updatedMessages
      };
    });
    
    // Update chat users
    setChatUsers(prev => {
      const userIndex = prev.findIndex(u => String(u.id) === senderId);
      
      if (userIndex === -1) {
        // New user - will need to fetch their info
        // For now just return current state
        return prev;
      }
      
      const newUsers = [...prev];
      newUsers[userIndex] = {
        ...newUsers[userIndex],
        lastMessage: newMessage,
        unreadCount: newUsers[userIndex].unreadCount + 1
      };
      
      if (DEBUG) console.log(`Updated chat users with new message from ${senderId}`);
      
      return newUsers;
    });
    
    // Update total unread count
    setUnreadTotal(prev => prev + 1);
    
    // Show notification if needed
    if (!expanded || activeChat?.id !== senderId) {
      showNotification(data.senderName || 'New message', data.text);
    }
  };
  
  // Handle message confirmation
  const handleMessageConfirmation = (data: any) => {
    // Skip if already processed
    if (processedMessageIds.current.has(String(data.id))) {
      if (DEBUG) console.log(`Skipping duplicate confirmation: ${data.id}`);
      return;
    }
    
    // Add to processed IDs
    processedMessageIds.current.add(String(data.id));
    
    // Get receiver ID (standardized)
    const receiverId = String(data.receiverId);
    
    // Update messages - replace temp message or add new one
    setMessages(prev => {
      const prevMessages = prev[receiverId] || [];
      
      // Check for any pending messages with matching text
      const pendingIndex = prevMessages.findIndex(msg => 
        msg.pending && msg.text === data.text
      );
      
      if (pendingIndex !== -1) {
        // Replace pending message
        const newMessages = [...prevMessages];
        newMessages[pendingIndex] = {
          ...newMessages[pendingIndex],
          id: String(data.id),
          pending: false,
          created_at: data.timestamp || newMessages[pendingIndex].created_at
        };
        
        if (DEBUG) console.log(`Updated pending message to confirmed for ${receiverId}`);
        
        return {
          ...prev,
          [receiverId]: newMessages
        };
      } else {
        // Add as new message
        const newMessage: Message = {
          id: String(data.id),
          text: data.text,
          sender_id: session?.user?.id?.toString() || '',
          receiver_id: receiverId,
          is_read: false,
          created_at: data.timestamp || new Date().toISOString()
        };
        
        const updatedMessages = [...prevMessages, newMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        if (DEBUG) console.log(`Added confirmed message to ${receiverId}`);
        
        return {
          ...prev,
          [receiverId]: updatedMessages
        };
      }
    });
    
    // Update chat users with last message
    setChatUsers(prev => {
      const userIndex = prev.findIndex(u => String(u.id) === receiverId);
      
      if (userIndex === -1) return prev;
      
      const newUsers = [...prev];
      newUsers[userIndex] = {
        ...newUsers[userIndex],
        lastMessage: {
          id: String(data.id),
          text: data.text,
          sender_id: session?.user?.id?.toString() || '',
          receiver_id: receiverId,
          is_read: false,
          created_at: data.timestamp || new Date().toISOString()
        }
      };
      
      return newUsers;
    });
  };
  
  // Helper to show notification
  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/logo.png'
          });
        }
      });
    }
  };
  
  // Send message
  const sendMessage = async (userId: string, text: string) => {
    if (!text.trim()) return;
    
    // Create temporary message ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Standardize user ID
    const standardizedUserId = String(userId);
    
    // Create temporary message
    const tempMessage: Message = {
      id: tempId,
      text: text.trim(),
      sender_id: session?.user?.id?.toString() || '',
      receiver_id: standardizedUserId,
      is_read: false,
      created_at: new Date().toISOString(),
      pending: true
    };
    
    // Add to processed IDs
    processedMessageIds.current.add(tempId);
    
    // Update UI immediately
    setMessages(prev => {
      const prevMessages = prev[standardizedUserId] || [];
      const newMessages = [...prevMessages, tempMessage].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      if (DEBUG) console.log(`Added pending message to ${standardizedUserId} in UI`);
      
      return {
        ...prev,
        [standardizedUserId]: newMessages
      };
    });
    
    // Update chat users
    setChatUsers(prev => {
      const userIndex = prev.findIndex(u => String(u.id) === standardizedUserId);
      
      if (userIndex === -1) return prev;
      
      const newUsers = [...prev];
      newUsers[userIndex] = {
        ...newUsers[userIndex],
        lastMessage: tempMessage
      };
      
      return newUsers;
    });
    
    // Try to send via socket first
    let sentViaSocket = false;
    if (isConnected) {
      sentViaSocket = !!socketSendMessage(standardizedUserId, text.trim());
      if (DEBUG) console.log(`Message to ${standardizedUserId} sent via socket: ${sentViaSocket}`);
    }
    
    // Always send via API for reliability
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          receiverId: standardizedUserId,
          text: text.trim()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Add API message ID to processed set
      processedMessageIds.current.add(String(data.message.id));
      
      // If not sent via socket, update UI as if confirmation was received
      if (!sentViaSocket || !isConnected) {
        if (DEBUG) console.log('Updating UI after API send (no socket confirmation expected)');
        
        setMessages(prev => {
          const prevMessages = prev[standardizedUserId] || [];
          return {
            ...prev,
            [standardizedUserId]: prevMessages.map(msg => 
              msg.id === tempId 
                ? { 
                    ...msg, 
                    id: String(data.message.id), 
                    pending: false,
                    created_at: data.message.created_at || msg.created_at 
                  } 
                : msg
            )
          };
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark message as failed
      setMessages(prev => {
        const prevMessages = prev[standardizedUserId] || [];
        return {
          ...prev,
          [standardizedUserId]: prevMessages.map(msg => 
            msg.id === tempId ? { ...msg, pending: false, failed: true } : msg
          )
        };
      });
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Open chat with user
  const openChat = (user: ChatUser) => {
    // Ensure consistent ID format
    const standardizedUserId = String(user.id);
    
    setActiveChat({
      ...user,
      id: standardizedUserId
    });
    setExpanded(true);
    
    // Always fetch messages when opening a chat to ensure we have the latest
    fetchMessages(standardizedUserId);
    
    // Mark messages as read
    if (user.unreadCount > 0) {
      markMessagesAsRead(standardizedUserId);
    }
  };
  
  // Handle user selection from new message modal
  const handleNewMessageUserSelect = (user: User) => {
    // Close the modal
    setIsNewMessageModalOpen(false);
    
    // Standardize ID format
    const standardizedUserId = String(user.id);
    
    // Check if we already have a chat with this user
    const existingChatUser = findExistingUser(standardizedUserId);
    
    if (existingChatUser) {
      // Open existing chat
      openChat(existingChatUser);
    } else {
      // Create a new chat user object
      const newChatUser: ChatUser = {
        id: standardizedUserId,
        name: user.name,
        profilePicture: user.profilePicture || '/default-profile.png',
        status: user.status === 'online' ? 'online' : 'offline',
        unreadCount: 0
      };
      
      // Add to chat users safely
      addChatUserSafely(newChatUser);
      
      // Open chat with new user
      openChat(newChatUser);
      
      // Initialize empty messages array for this user
      setMessages(prev => {
        if (!prev[standardizedUserId]) {
          return {
            ...prev,
            [standardizedUserId]: []
          };
        }
        return prev;
      });
      
      // Fetch messages for this user
      fetchMessages(standardizedUserId);
    }
  };
  
  // Mark messages as read
  const markMessagesAsRead = async (userId: string) => {
    try {
      // Standardize ID format
      const standardizedUserId = String(userId);
      
      const response = await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          senderId: standardizedUserId 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }
      
      // Update unread count
      setChatUsers(prev => 
        prev.map(u => {
          if (String(u.id) === standardizedUserId) {
            // Subtract current unread count from total
            setUnreadTotal(total => Math.max(0, total - u.unreadCount));
            
            // Reset unread count
            return { ...u, unreadCount: 0 };
          }
          return u;
        })
      );
      
      // Update is_read status
      setMessages(prev => {
        const userMessages = prev[standardizedUserId] || [];
        return {
          ...prev,
          [standardizedUserId]: userMessages.map(msg => ({
            ...msg,
            is_read: msg.sender_id === standardizedUserId ? true : msg.is_read
          }))
        };
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  // Format timestamp for chat list
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return new Intl.DateTimeFormat('en-US', { 
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true 
      }).format(date);
    } else if (diffInDays < 7) {
      return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    } else {
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short',
        day: 'numeric',
      }).format(date);
    }
  };
  
  // Don't render anything if not authenticated
  if (status !== 'authenticated' || !session) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 right-4 z-50 flex flex-col items-end">
      {/* Chat header */}
      <div 
        className="bg-blue-600 text-white rounded-t-lg shadow-lg w-80 cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center">
            <RiMailLine className="text-white text-xl mr-2" />
            <span className="font-bold">Messages</span>
            {!isConnected && (
              <span className="ml-2 text-xs bg-red-500 text-white px-1 py-0.5 rounded">
                offline
              </span>
            )}
          </div>
          <div className="flex items-center">
            {unreadTotal > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1 mr-2">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsNewMessageModalOpen(true);
              }}
              className="text-white hover:text-gray-200 mr-2"
            >
              <RiEdit2Line className="text-lg" />
            </button>
            {expanded ? (
              <FaChevronDown className="text-white" />
            ) : (
              <FaChevronUp className="text-white" />
            )}
          </div>
        </div>
      </div>
      
      {/* Chat content */}
      <div 
        className={`bg-white rounded-b-lg shadow-lg w-80 transition-all duration-300 overflow-hidden ${
          expanded ? 'max-h-96' : 'max-h-0'
        }`}
      >
        {activeChat ? (
          // Chat panel
          <div className="h-96">
            <ChatPanel
              user={activeChat}
              messages={messages[String(activeChat.id)] || []}
              currentUserId={session.user.id?.toString() || ''}
              currentUserPicture={currentUserPicture}
              onSendMessage={(text) => sendMessage(activeChat.id, text)}
              onClose={() => setActiveChat(null)}
              isConnected={isConnected}
            />
          </div>
        ) : (
          // Chat list
          <div className="h-96 overflow-y-auto">
            {chatUsers.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {chatUsers.map((user, index) => (
                  <div 
                    key={`${user.id}-${index}`} // Fixed: Added index to ensure unique keys
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                    onClick={() => openChat(user)}
                  >
                    <div className="flex items-start">
                      <div className="relative mr-3">
                        <img 
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/default-profile.png';
                          }}
                        />
                        {user.status === 'online' && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-gray-900 truncate">{user.name}</h4>
                          <span className="text-xs text-gray-500">
                            {user.lastMessage && formatMessageTime(user.lastMessage.created_at)}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {user.lastMessage ? (
                              <>
                                {user.lastMessage.sender_id === session.user.id?.toString() 
                                  ? "You: " 
                                  : ""
                                }
                                {user.lastMessage.text}
                              </>
                            ) : (
                              "No messages yet"
                            )}
                          </p>
                          {user.unreadCount > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                              {user.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* New Message Modal */}
      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        onSelectUser={handleNewMessageUserSelect}
      />
    </div>
  );
});

ChatBubble.displayName = 'ChatBubble';

export default ChatBubble;