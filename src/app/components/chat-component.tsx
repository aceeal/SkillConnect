// src/app/components/chat-component.tsx
import React, { useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

interface ChatComponentProps {
  messages: {
    text: string;
    sender: string;
    timestamp: string;
    senderImage?: string; // Added property for sender's profile image
    receiverImage?: string; // Added property for receiver's profile image
  }[];
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  currentUser: string;
  currentUserImage?: string; // Added property for current user's profile image
  remoteUserImage?: string; // Added property for remote user's profile image
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  currentUser,
  currentUserImage = '/default-profile.png', // Default image path
  remoteUserImage = '/default-profile.png' // Default image path
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use scrollIntoView with a specific container instead of the entire page
      const messageContainer = messagesEndRef.current.parentElement;
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Handle Enter key in chat input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden">
      <div className="bg-black text-white p-3 rounded-t-lg">
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 italic">
            <div className="text-center">
              <p>No messages yet</p>
              <p className="text-xs mt-2">Start the conversation by saying hello!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${message.sender === currentUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2">
                {message.sender !== currentUser && (
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 mb-1 overflow-hidden">
                    <img 
                      src={message.senderImage || remoteUserImage} 
                      alt={message.sender}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-profile.png';
                        // If the image fails to load, fallback to initials
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML += `
                            <div class="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                              ${message.sender.charAt(0).toUpperCase()}
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                )}
                
                <div 
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.sender === currentUser
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.sender !== currentUser && (
                    <div className="text-xs font-bold mb-1 text-gray-600">{message.sender}</div>
                  )}
                  <p className="break-words">{message.text}</p>
                </div>
                
                {message.sender === currentUser && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 mb-1 overflow-hidden">
                    <img 
                      src={message.senderImage || currentUserImage} 
                      alt={message.sender}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-profile.png';
                        // If the image fails to load, fallback to initials
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML += `
                            <div class="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                              ${message.sender.charAt(0).toUpperCase()}
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className={`text-xs mt-1 text-gray-500 ${message.sender === currentUser ? 'pr-8' : 'pl-8'}`}>
                {message.timestamp}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex rounded-full border border-gray-300 overflow-hidden bg-gray-50 focus-within:ring-2 focus-within:ring-blue-300">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-3 text-gray-800 bg-transparent outline-none placeholder-gray-500"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 text-white ${newMessage.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300'} transition-colors`}
          >
            <FaPaperPlane />
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Messages are not end-to-end encrypted
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;