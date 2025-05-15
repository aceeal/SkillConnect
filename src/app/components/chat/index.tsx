// src/app/components/chat/index.ts
import ChatBubble from './chat-bubble';

// Export the main component as default
export default ChatBubble;

// Named exports for convenience
export { ChatBubble };
export { default as ChatPanel } from './chat-panel';
export { default as ChatMessage } from './chat-message';