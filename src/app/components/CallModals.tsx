// src/app/components/CallModals.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
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
  const [lastCallAttempt, setLastCallAttempt] = useState<number>(0);
  
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
  }, []);
  
  // Reset call state to initial values
  const resetCallState = () => {
    console.log('Resetting call state');
    setCallState(initialCallState);
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    setTimer(30);
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
    if (!socket || !isConnected) return;

    console.log('Setting up socket event listeners for calls');

    const handleIncomingCall = (data: any) => {
      console.log('Incoming call received:', data);
      
      // Don't accept new calls if already in one
      if (callState.isIncoming || callState.isOutgoing) {
        console.log('Already in call, declining incoming call');
        socket.emit('decline_call', {
          callId: data.callId,
          callerId: data.callerId,
          calleeId: userId.toString()
        });
        return;
      }
      
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
      if (callState.isOutgoing && data.callId === callState.callId) {
        stopRingtone();
        // Keep the outgoing call state, just stop the timer
        if (timerId) {
          clearInterval(timerId);
          setTimerId(null);
        }
      }
    };

    const handleCallDeclined = (data: any) => {
      console.log('Call declined:', data);
      stopRingtone();
      resetCallState();
      showNotification('Call ended', data.message || 'The call was declined');
    };

    const handleSessionReady = (data: any) => {
      console.log('Session ready:', data);
      stopRingtone();
      resetCallState();
      
      // Build session URL
      let sessionUrl = `/live-session?roomId=${data.roomId}&peerId=${data.peer.id}&peerName=${encodeURIComponent(data.peer.name)}`;
      if (data.peer.dbId) {
        sessionUrl += `&peerDbId=${data.peer.dbId}`;
      }
      
      setTimeout(() => {
        router.push(sessionUrl);
      }, 300);
    };

    // Attach event listeners
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_declined', handleCallDeclined);
    socket.on('session_ready', handleSessionReady);

    // Cleanup function
    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_declined', handleCallDeclined);
      socket.off('session_ready', handleSessionReady);
    };
  }, [socket, isConnected, userId, userName, userPicture, callState.isIncoming, callState.isOutgoing, callState.callId, timerId, router]);

  // Enhanced ringtone functions
  const playRingtone = (src: string, loop: boolean = false) => {
    try {
      stopRingtone();
      const audio = new Audio(src);
      audio.loop = loop;
      audio.volume = 0.7;
      audio.play().catch(e => console.log('Audio play failed:', e));
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

  // Show notification
  const showNotification = (title: string, message: string) => {
    if (typeof document !== 'undefined') {
      // Remove existing notifications
      const existing = document.querySelectorAll('.call-notification');
      existing.forEach(n => n.remove());
      
      const notification = document.createElement('div');
      notification.className = 'call-notification fixed top-5 right-5 bg-white p-4 rounded-lg shadow-lg z-50 border-l-4 border-blue-500';
      notification.innerHTML = `
        <div class="flex items-start">
          <div class="flex-1">
            <div class="font-semibold text-gray-900">${title}</div>
            <div class="text-sm text-gray-600 mt-1">${message}</div>
          </div>
          <button class="ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
            ×
          </button>
        </div>
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);
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
          if (callState.isIncoming) {
            handleDeclineCall();
          } else if (callState.isOutgoing) {
            handleCancelCall();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerId(id);
  };

  // SIMPLIFIED: Enhanced function to initiate a call
  const initiateCall = (targetUserId: string, targetUserName: string, targetUserPicture: string = '/default-profile.png') => {
    console.log('=== INITIATE CALL DEBUG ===');
    console.log('Target:', targetUserId, targetUserName);
    console.log('Socket:', socket ? 'exists' : 'null');
    console.log('Socket connected:', socket?.connected);
    console.log('User ID:', userId);
    console.log('Current call state:', callState);
    
    const currentTime = Date.now();
    
    // Rate limiting
    if (currentTime - lastCallAttempt < 2000) {
      console.log('Rate limited');
      showNotification('Rate Limited', 'Please wait before making another call');
      return false;
    }
    setLastCallAttempt(currentTime);
    
    // Basic checks
    if (!socket) {
      console.log('No socket');
      showNotification('Error', 'Call system not ready - no socket');
      return false;
    }
    
    if (!socket.connected) {
      console.log('Socket not connected');
      showNotification('Error', 'Not connected to server');
      return false;
    }
    
    if (callState.isIncoming || callState.isOutgoing) {
      console.log('Already in call');
      showNotification('Error', 'Already in a call');
      return false;
    }
    
    if (!targetUserId || targetUserId === userId.toString()) {
      console.log('Invalid target');
      showNotification('Error', 'Invalid call target');
      return false;
    }
    
    // Generate call ID
    const callId = `call-${Date.now()}-${userId}-${Math.floor(Math.random() * 1000)}`;
    console.log('Generated call ID:', callId);
    
    // Update local state FIRST
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
    
    // Send call request
    console.log('Sending direct_call event');
    socket.emit('direct_call', {
      callId,
      callerId: userId.toString(),
      callerName: userName,
      callerPicture: userPicture,
      calleeId: targetUserId,
      calleeName: targetUserName,
    });
    
    // Start timer and sound
    startCallTimer();
    playRingtone('/sounds/dialing.mp3', true);
    
    console.log('Call initiated successfully');
    return true;
  };

  // Handle accepting an incoming call
  const handleAcceptCall = () => {
    if (!socket || !callState.isIncoming) return;
    
    console.log('Accepting call:', callState.callId);
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
  };

  // Handle declining an incoming call
  const handleDeclineCall = () => {
    if (!socket || !callState.isIncoming) return;
    
    console.log('Declining call:', callState.callId);
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
    
    console.log('Cancelling call:', callState.callId);
    stopRingtone();
    
    socket.emit('cancel_call', {
      callId: callState.callId,
      callerId: callState.callerId,
      calleeId: callState.calleeId,
    });
    
    resetCallState();
  };

  // SIMPLIFIED: Expose function to window
  useEffect(() => {
    if (typeof window !== 'undefined' && socket && isConnected) {
      console.log('Exposing initiateCall to window');
      window.initiateCall = initiateCall;
      window.initiateCallReady = true;
    } else {
      console.log('Not exposing initiateCall - socket:', !!socket, 'connected:', isConnected);
      if (typeof window !== 'undefined') {
        window.initiateCallReady = false;
      }
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.initiateCall;
        window.initiateCallReady = false;
      }
    };
  }, [socket, isConnected, userId, userName, userPicture]);

  // Clean up on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callState.isIncoming) handleDeclineCall();
      if (callState.isOutgoing) handleCancelCall();
      stopRingtone();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopRingtone();
    };
  }, [callState]);

  // Don't render if no active call
  if (!callState.isIncoming && !callState.isOutgoing) {
    return null;
  }

  // Don't render if no portal element
  if (!portalElement) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white bg-opacity-95 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Incoming Call */}
        {callState.isIncoming && (
          <div className="flex flex-col items-center p-8">
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-green-400 opacity-30 animate-ping scale-125"></div>
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
            <p className="text-lg font-medium mb-8 text-gray-600">Incoming call...</p>
            
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
            
            <div className="flex justify-center items-center space-x-16">
              <button 
                onClick={handleDeclineCall}
                className="group flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mb-3 transform transition-all duration-200 group-hover:scale-110 shadow-lg">
                  <MdCallEnd className="h-10 w-10 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Decline</span>
              </button>
              
              <button 
                onClick={handleAcceptCall}
                className="group flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-3 transform transition-all duration-200 group-hover:scale-110 shadow-lg">
                  <MdCall className="h-10 w-10 text-white" />
                </div>
                <span className="text-gray-700 font-medium">Accept</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Outgoing Call */}
        {callState.isOutgoing && (
          <div className="flex flex-col items-center p-8">
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping scale-125"></div>
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
            
            <div className="flex justify-center items-center">
              <button 
                onClick={handleCancelCall}
                className="group flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mb-3 transform transition-all duration-200 group-hover:scale-110 shadow-lg">
                  <MdCallEnd className="h-10 w-10 text-white" />
                </div>
                <span className="text-gray-700 font-medium">End Call</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    portalElement
  );
};

export default CallModals;