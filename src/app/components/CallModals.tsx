// src/app/components/CallModals.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { FaPhone, FaPhoneSlash, FaUser, FaVolumeUp } from 'react-icons/fa';
import { MdCallEnd, MdCall } from 'react-icons/md';

// Types for our call state
type CallState = {
  isIncoming: boolean;
  isOutgoing: boolean;
  callerId: string | null;
  callerName: string;
  calleeId: string | null;
  calleeName: string;
  callId: string | null;
  callerPicture: string;
  calleePicture: string;
};

// Initial call state
const initialCallState: CallState = {
  isIncoming: false,
  isOutgoing: false,
  callerId: null,
  callerName: '',
  calleeId: null,
  calleeName: '',
  callId: null,
  callerPicture: '/default-profile.png',
  calleePicture: '/default-profile.png',
};

interface CallModalsProps {
  socket: any;
  userId: number | string;
  userName: string;
  userPicture?: string;
  isConnected?: boolean;
}

const CallModals: React.FC<CallModalsProps> = ({ 
  socket, 
  userId, 
  userName,
  userPicture = '/default-profile.png',
  isConnected = false
}) => {
  const router = useRouter();
  const [callState, setCallState] = useState<CallState>(initialCallState);
  const [timer, setTimer] = useState<number>(30);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [callDuration, setCallDuration] = useState<string>('00:00');
  const [functionReady, setFunctionReady] = useState<boolean>(false);
  const [lastCallAttempt, setLastCallAttempt] = useState<number>(0);
  const socketRef = useRef(socket);
  const callStateRef = useRef(callState);
  
  // Update refs when props change
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);
  
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);
  
  // Find or create portal container
  useEffect(() => {
    if (typeof document !== 'undefined') {
      let element = document.getElementById('call-modals-container');
      if (!element) {
        element = document.createElement('div');
        element.id = 'call-modals-container';
        document.body.appendChild(element);
      }
      setPortalElement(element);
    }
    
    return () => {
      // Don't remove the container on unmount to keep it persistent across page navigation
    };
  }, []);
  
  // Reset call state to initial values
  const resetCallState = () => {
    setCallState(initialCallState);
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    setTimer(30);
    setCallDuration('00:00');
    stopRingtone();
  };

  // Format timer as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      console.log('Incoming call:', data);
      
      // Prevent call while another call is active
      if (callStateRef.current.isIncoming || callStateRef.current.isOutgoing) {
        console.log('Incoming call ignored - already in a call');
        return;
      }
      
      // Play ringtone
      playRingtone('/sounds/ringtone.mp3', true);
      
      setCallState({
        isIncoming: true,
        isOutgoing: false,
        callerId: data.callerId,
        callerName: data.callerName || 'Unknown Caller',
        calleeId: userId.toString(),
        calleeName: userName,
        callId: data.callId,
        callerPicture: data.callerPicture || '/default-profile.png',
        calleePicture: userPicture,
      });
      
      startCallTimer();
    };

    const handleCallAccepted = (data: any) => {
      console.log('Call accepted:', data);
      if (callStateRef.current.isOutgoing && data.callId === callStateRef.current.callId) {
        stopRingtone();
        startCallDurationTimer();
      }
    };

    const handleCallDeclined = (data: any) => {
      console.log('Call declined:', data);
      stopRingtone();
      
      if ((callStateRef.current.isOutgoing && data.callId === callStateRef.current.callId) ||
          (callStateRef.current.isIncoming && data.callId === callStateRef.current.callId)) {
        resetCallState();
        showNotification('Call ended', data.message || 'The call was declined or not answered');
      }
    };

    const handleSessionReady = (data: any) => {
      console.log('Session ready:', data);
      stopRingtone();
      resetCallState();
      
      // Build session URL with peer database ID if available
      let sessionUrl = `/live-session?roomId=${data.roomId}&peerId=${data.peer.id}&peerName=${encodeURIComponent(data.peer.name)}`;
      
      // Add database ID if available (for user profile viewing and reporting)
      if (data.peer.dbId) {
        sessionUrl += `&peerDbId=${data.peer.dbId}`;
      }
      
      setTimeout(() => {
        router.push(sessionUrl);
      }, 500);
    };

    // User status events
    const handleUserStatusChanged = (data: any) => {
      // This helps track if users go offline during call attempts
      console.log(`User ${data.userId} status changed to ${data.status}`);
    };

    // Register event listeners
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_declined', handleCallDeclined);
    socket.on('session_ready', handleSessionReady);
    socket.on('user_status_changed', handleUserStatusChanged);

    // Cleanup on unmount
    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_declined', handleCallDeclined);
      socket.off('session_ready', handleSessionReady);
      socket.off('user_status_changed', handleUserStatusChanged);
    };
  }, [socket, userId, userName, router, userPicture]);

  // Enhanced ringtone functions
  const playRingtone = (src: string, loop: boolean = false) => {
    try {
      stopRingtone(); // Stop any existing ringtone
      
      const audio = new Audio(src);
      audio.loop = loop;
      audio.volume = 0.7; // Set reasonable volume
      
      // Try to play, with fallback for user interaction requirements
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.log('Audio play blocked by browser policy:', e);
          // Show visual notification if audio is blocked
          showNotification('Call Alert', 'Please enable sound for call notifications');
        });
      }
      
      // Store reference for cleanup
      (window as any).callRingtone = audio;
    } catch (e) {
      console.log('Error playing ringtone:', e);
    }
  };

  const stopRingtone = () => {
    try {
      if ((window as any).callRingtone) {
        (window as any).callRingtone.pause();
        (window as any).callRingtone.currentTime = 0;
        (window as any).callRingtone = null;
      }
    } catch (e) {
      console.log('Error stopping ringtone:', e);
    }
  };

  // Enhanced notification system
  const showNotification = (title: string, message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (typeof document !== 'undefined') {
      // Remove any existing notifications
      const existingNotifications = document.querySelectorAll('.call-notification');
      existingNotifications.forEach(notification => {
        document.body.removeChild(notification);
      });
      
      const notificationContainer = document.createElement('div');
      notificationContainer.className = `call-notification fixed top-5 right-5 bg-white p-4 rounded-lg shadow-lg z-50 max-w-sm border-l-4 ${
        type === 'error' ? 'border-red-500' : 
        type === 'success' ? 'border-green-500' : 
        'border-blue-500'
      }`;
      notificationContainer.style.animation = 'slideInRight 0.3s ease-out, slideOutRight 0.3s ease-in 4.7s';
      
      const iconColor = type === 'error' ? 'text-red-500' : 
                       type === 'success' ? 'text-green-500' : 
                       'text-blue-500';
      
      notificationContainer.innerHTML = `
        <div class="flex items-start">
          <div class="mr-3 ${iconColor}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              ${type === 'error' ? 
                '<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.25 16.518l-1.732 1.732L12 14.732 8.482 18.25l-1.732-1.732L10.268 12 6.75 8.482l1.732-1.732L12 10.268l3.518-3.518 1.732 1.732L13.732 12l3.518 3.518z"/>' :
                type === 'success' ?
                '<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.25 17.75l-4.5-4.5 1.775-1.775L10.75 14.2l6.225-6.225 1.775 1.775-8 8z"/>' :
                '<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.25 17.75h-2.5V15.25h2.5v2.5zm0-4.5h-2.5V6.75h2.5v6.5z"/>'
              }
            </svg>
          </div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900">${title}</div>
            <div class="text-sm text-gray-600 mt-1">${message}</div>
          </div>
          <button class="ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>
      `;
      
      document.body.appendChild(notificationContainer);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(notificationContainer)) {
          document.body.removeChild(notificationContainer);
        }
      }, 5000);
      
      // Add styles if not already present
      if (!document.getElementById('notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'notification-styles';
        styleElement.innerHTML = `
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
        `;
        document.head.appendChild(styleElement);
      }
    }
  };

  // Timer for auto-declining calls
  const startCallTimer = () => {
    if (timerId) clearInterval(timerId);
    
    setTimer(30);
    const id = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(id);
          if (callStateRef.current.isIncoming) {
            handleDeclineCall();
          } else if (callStateRef.current.isOutgoing) {
            handleCancelCall();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerId(id);
  };

  // Timer for call duration
  const startCallDurationTimer = () => {
    if (timerId) clearInterval(timerId);
    
    let seconds = 0;
    const id = setInterval(() => {
      seconds += 1;
      setCallDuration(formatTime(seconds));
    }, 1000);
    
    setTimerId(id);
  };

  // Enhanced function to initiate a call
  const initiateCall = (targetUserId: string, targetUserName: string, targetUserPicture: string = '/default-profile.png') => {
    const currentTime = Date.now();
    
    // Prevent rapid call attempts (rate limiting)
    if (currentTime - lastCallAttempt < 2000) {
      showNotification('Rate Limited', 'Please wait before making another call attempt', 'error');
      return false;
    }
    setLastCallAttempt(currentTime);
    
    // Check socket connection
    if (!socket || !userId) {
      showNotification('Connection Error', 'Call system is not ready. Please try again.', 'error');
      return false;
    }
    
    if (!socket.connected) {
      showNotification('Connection Error', 'Not connected to server. Please check your connection and try again.', 'error');
      return false;
    }
    
    // Check if already in a call
    if (callState.isIncoming || callState.isOutgoing) {
      showNotification('Call in Progress', 'You are already in a call', 'error');
      return false;
    }
    
    // Validate target user
    if (!targetUserId || targetUserId === userId.toString()) {
      showNotification('Invalid Call', 'Cannot call yourself', 'error');
      return false;
    }
    
    // Generate a unique call ID
    const callId = `call-${Date.now()}-${userId}-${Math.floor(Math.random() * 1000)}`;
    
    console.log(`Initiating call to user ${targetUserId} (${targetUserName})`);
    
    // Update local call state
    setCallState({
      isIncoming: false,
      isOutgoing: true,
      callerId: userId.toString(),
      callerName: userName,
      calleeId: targetUserId,
      calleeName: targetUserName,
      callId: callId,
      callerPicture: userPicture,
      calleePicture: targetUserPicture,
    });
    
    // Emit the call event to server
    socket.emit('direct_call', {
      callId,
      callerId: userId.toString(),
      callerName: userName,
      callerPicture: userPicture,
      calleeId: targetUserId,
      calleeName: targetUserName,
    });
    
    // Start call timer
    startCallTimer();
    
    // Play dialing sound
    playRingtone('/sounds/dialing.mp3', true);
    
    console.log(`Call initiated successfully. Call ID: ${callId}`);
    return true;
  };

  // Handle accepting an incoming call
  const handleAcceptCall = () => {
    if (!socket || !callState.isIncoming) return;
    
    console.log('Accepting incoming call:', callState.callId);
    stopRingtone();
    
    socket.emit('accept_call', {
      callId: callState.callId,
      callerId: callState.callerId,
      callerName: callState.callerName,
      calleeId: callState.calleeId,
      calleeName: callState.calleeName,
      callerPicture: callState.callerPicture,
      calleePicture: callState.calleePicture,
    });
    
    startCallDurationTimer();
  };

  // Handle declining an incoming call
  const handleDeclineCall = () => {
    if (!socket || !callState.isIncoming) return;
    
    console.log('Declining incoming call:', callState.callId);
    stopRingtone();
    
    socket.emit('decline_call', {
      callId: callState.callId,
      callerId: callState.callerId,
      calleeId: callState.calleeId,
    });
    
    resetCallState();
  };

  // Handle cancelling an outgoing call
  const handleCancelCall = () => {
    if (!socket || !callState.isOutgoing) return;
    
    console.log('Cancelling outgoing call:', callState.callId);
    stopRingtone();
    
    socket.emit('cancel_call', {
      callId: callState.callId,
      callerId: callState.callerId,
      calleeId: callState.calleeId,
    });
    
    resetCallState();
  };

  // Expose the initiateCall function to the window object with better management
  useEffect(() => {
    if (typeof window !== 'undefined' && socket && isConnected) {
      console.log('Exposing initiateCall function to window');
      
      // Clear any existing function
      if (window.initiateCall) {
        delete window.initiateCall;
      }
      
      // Set new function with metadata
      window.initiateCall = initiateCall;
      window.initiateCallSocketId = socket.id;
      window.initiateCallUserId = userId;
      window.initiateCallReady = true;
      setFunctionReady(true);
      
      console.log('initiateCall function is now available globally');
    } else if (typeof window !== 'undefined') {
      // Clean up if socket is not connected
      window.initiateCallReady = false;
      setFunctionReady(false);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        // Only clean up if this is our function
        if (window.initiateCallSocketId === socket?.id && window.initiateCallUserId === userId) {
          console.log('Cleaning up initiateCall function');
          window.initiateCallReady = false;
          delete window.initiateCall;
          delete window.initiateCallSocketId;
          delete window.initiateCallUserId;
          setFunctionReady(false);
        }
      }
    };
  }, [socket, userId, userName, isConnected]);

  // Clean up on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callState.isIncoming || callState.isOutgoing) {
        if (callState.isIncoming) {
          handleDeclineCall();
        } else {
          handleCancelCall();
        }
      }
      stopRingtone();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopRingtone();
    };
  }, [callState]);

  // Don't render if no active call or no portal element
  if ((!callState.isIncoming && !callState.isOutgoing) || !portalElement) {
    return null;
  }

  // Use React createPortal to render modals at the document body level
  return createPortal(
    <>
      {/* Enhanced backdrop with blur effect */}
      <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md z-50 flex items-center justify-center">
        {/* Enhanced modal container with better animations */}
        <div className="bg-white bg-opacity-95 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100">
          {/* Incoming Call Modal */}
          {callState.isIncoming && (
            <div className="flex flex-col items-center p-8">
              {/* Enhanced caller info with animated rings */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-green-400 opacity-30 animate-ping scale-125"></div>
                <div className="absolute inset-0 rounded-full bg-green-300 opacity-40 animate-pulse scale-110"></div>
                <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping scale-150 animation-delay-500"></div>
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-green-400 shadow-xl">
                  <img 
                    src={callState.callerPicture} 
                    alt={callState.callerName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/default-profile.png';
                    }}
                  />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{callState.callerName}</h2>
              <p className="text-lg font-medium mb-8 text-gray-600 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Incoming call...
              </p>
              
              {/* Enhanced timer with circular progress */}
              <div className="w-full mb-10">
                <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${((30 - timer) / 30) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-3 text-center text-gray-600">
                  Auto-decline in <span className="font-semibold text-red-600">{timer}</span> seconds
                </p>
              </div>
              
              {/* Enhanced call actions */}
              <div className="flex justify-center items-center space-x-16">
                <button 
                  onClick={handleDeclineCall}
                  className="group flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mb-3 transform transition-all duration-200 group-hover:scale-110 group-active:scale-95 shadow-lg group-hover:shadow-xl">
                    <MdCallEnd className="h-10 w-10 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Decline</span>
                </button>
                
                <button 
                  onClick={handleAcceptCall}
                  className="group flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-3 transform transition-all duration-200 group-hover:scale-110 group-active:scale-95 shadow-lg group-hover:shadow-xl">
                    <MdCall className="h-10 w-10 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Accept</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Outgoing Call Modal */}
          {callState.isOutgoing && (
            <div className="flex flex-col items-center p-8">
              {/* Enhanced calling animation */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping scale-125"></div>
                <div className="absolute inset-0 rounded-full bg-blue-300 opacity-40 animate-pulse scale-110"></div>
                <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping scale-150 animation-delay-700"></div>
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-blue-400 shadow-xl">
                  <img 
                    src={callState.calleePicture} 
                    alt={callState.calleeName}
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.src = '/default-profile.png';
                    }}
                  />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-4 text-gray-900">{callState.calleeName}</h2>
              <div className="flex items-center space-x-3 mb-10">
                <div className="flex space-x-1">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                </div>
                <span className="text-lg font-medium text-gray-600">Calling</span>
              </div>
              
              {/* Enhanced timer */}
              <div className="w-full mb-10">
                <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-blue-400 to-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${((30 - timer) / 30) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-3 text-center text-gray-600">
                  Call expires in <span className="font-semibold text-red-600">{timer}</span> seconds
                </p>
              </div>
              
              {/* Enhanced call action */}
              <div className="flex justify-center items-center">
                <button 
                  onClick={handleCancelCall}
                  className="group flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mb-3 transform transition-all duration-200 group-hover:scale-110 group-active:scale-95 shadow-lg group-hover:shadow-xl">
                    <MdCallEnd className="h-10 w-10 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">End Call</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add custom styles for animations */}
      <style jsx>{`
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </>,
    portalElement
  );
};

export default CallModals;