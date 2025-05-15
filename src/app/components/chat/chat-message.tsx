// src/app/components/chat/chat-message.tsx
'use client';

import React from 'react';

interface MessageProps {
  id: string;
  text: string;
  isCurrentUser: boolean;
  timestamp: string;
  senderName?: string;
  senderPicture?: string;
  currentUserPicture?: string;
  isPending?: boolean;
  isFailed?: boolean;
}

const ChatMessage: React.FC<MessageProps> = ({
  id,
  text,
  isCurrentUser,
  timestamp,
  senderName,
  senderPicture = '/default-profile.png',
  currentUserPicture = '/default-profile.png',
  isPending = false,
  isFailed = false
}) => {
  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', { 
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true 
      }).format(date);
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} w-full overflow-hidden mb-3`}>
      {!isCurrentUser && (
        <img 
          src={senderPicture} 
          alt={senderName || 'User'}
          className="h-8 w-8 rounded-full object-cover mr-2 self-end"
          onError={(e) => {
            e.currentTarget.src = '/default-profile.png';
          }}
        />
      )}
      <div 
        className={`max-w-[75%] rounded-2xl p-3 ${
          isCurrentUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-800'
        } ${isPending ? 'opacity-70' : ''} ${isFailed ? 'border border-red-500' : ''}`}
      >
        <p className="text-sm break-words whitespace-normal">{text}</p>
        <div className="text-xs mt-1 text-right opacity-75 flex justify-end items-center">
          {formatTime(timestamp)}
          {isPending && (
            <span className="ml-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          )}
          {isFailed && (
            <span className="ml-1 text-red-300">!</span>
          )}
        </div>
      </div>
      {isCurrentUser && (
        <img 
          src={currentUserPicture} 
          alt="You"
          className="h-8 w-8 rounded-full object-cover ml-2 self-end"
          onError={(e) => {
            e.currentTarget.src = '/default-profile.png';
          }}
        />
      )}
    </div>
  );
};

export default ChatMessage;