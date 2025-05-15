// src/app/components/chat/chat-panel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RiSendPlaneFill } from 'react-icons/ri';
import { FaTimes } from 'react-icons/fa';
import ChatMessage from './chat-message';

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
}

interface ChatPanelProps {
  user: ChatUser;
  messages: Message[];
  currentUserId: string;
  currentUserPicture: string;
  onSendMessage: (text: string) => void;
  onClose: () => void;
  isConnected: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  user,
  messages,
  currentUserId,
  currentUserPicture,
  onSendMessage,
  onClose,
  isConnected
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-100">
        <div className="flex items-center">
          <div className="relative mr-2">
            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/default-profile.png';
              }}
            />
            {user.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
            )}
          </div>
          <div>
            <span className="font-medium text-gray-800">{user.name}</span>
            {!isConnected && (
              <span className="ml-2 text-xs bg-red-500 text-white px-1 py-0.5 rounded">
                offline
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 bg-white"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Send a message to start the conversation</p>
          </div>
        ) : (
          <div>
            {messages.map((message, index) => (
              <ChatMessage
                key={`${message.id}-${index}`}
                id={message.id}
                text={message.text}
                isCurrentUser={message.sender_id === currentUserId}
                timestamp={message.created_at}
                senderPicture={user.profilePicture}
                currentUserPicture={currentUserPicture}
                isPending={message.pending}
                isFailed={message.failed}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center bg-gray-100 rounded-full">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none px-4 py-2 text-gray-800 placeholder-gray-500 rounded-l-full"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className={`p-2 mr-1 rounded-full ${
              newMessage.trim() && isConnected
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            }`}
          >
            <RiSendPlaneFill className="h-5 w-5" />
          </button>
        </div>
        {!isConnected && (
          <p className="text-xs text-red-500 mt-1 text-center">
            You're offline. Messages will be sent when you're back online.
          </p>
        )}
      </form>
    </div>
  );
};

export default ChatPanel;