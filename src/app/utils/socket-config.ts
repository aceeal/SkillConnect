// utils/socket-config.ts
export const getSocketUrl = (): string => {
    // Check if we're running in the browser
    if (typeof window === 'undefined') {
      // Server-side: return the production URL or default
      return process.env.NEXTAUTH_URL || 'http://localhost:3000';
    }
  
    // Client-side environment detection
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
    // If we're in development OR running on localhost, use localhost
    if (isDevelopment || isLocalhost) {
      return 'http://localhost:3000';
    }
  
    // Otherwise, use the production URL
    return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
  };
  
  export const getSocketConfig = () => {
    const socketUrl = getSocketUrl();
    
    return {
      url: socketUrl,
      options: {
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        timeout: 20000,
        autoConnect: true
      }
    };
  };