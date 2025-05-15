// src/app/components/CallModals.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
}

const CallModals: React.FC<CallModalsProps> = ({ 
  socket, 
  userId, 
  userName,
  userPicture = '/default-profile.png'
}) => {
  const router = useRouter();
  const [callState, setCallState] = useState<CallState>(initialCallState);
  const [timer, setTimer] = useState<number>(30); // 30 seconds countdown
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [callDuration, setCallDuration] = useState<string>('00:00');
  const [functionReady, setFunctionReady] = useState<boolean>(false);
  
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

    // Handle incoming call
    const handleIncomingCall = (data: any) => {
      console.log('Incoming call:', data);
      
      // Play a sound to alert the user
      try {
        const audio = new Audio('/sounds/ringtone.mp3'); // Make sure to add a ringtone sound
        audio.loop = true;
        audio.play().catch(e => console.log('Audio play error:', e));
        
        // Store the audio element to stop it later
        (window as any).callRingtone = audio;
      } catch (e) {
        console.log('Error playing ringtone:', e);
      }
      
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
      
      // Start the timer for auto-decline
      startCallTimer();
    };

    // Handle call accepted
    const handleCallAccepted = (data: any) => {
      console.log('Call accepted:', data);
      if (callState.isOutgoing && data.callId === callState.callId) {
        // Stop any playing ringtone
        stopRingtone();
        // Start call duration timer
        startCallDurationTimer();
        // Will redirect to session in handleSessionReady
      }
    };

    // Handle call declined
    const handleCallDeclined = (data: any) => {
      console.log('Call declined:', data);
      
      // Stop any playing ringtone
      stopRingtone();
      
      if (callState.isOutgoing && data.callId === callState.callId) {
        resetCallState();
        
        // Show a nicer notification instead of an alert
        showNotification('Call ended', 'The call was declined or not answered');
      }
    };

    // Handle session ready (redirect to live session)
    const handleSessionReady = (data: any) => {
      console.log('Session ready:', data);
      
      // Stop any playing ringtone
      stopRingtone();
      
      // Reset call state
      resetCallState();
      
      // Create the URL with all needed parameters
      const sessionUrl = `/live-session?roomId=${data.roomId}&peerId=${data.peer.id}&peerName=${encodeURIComponent(data.peer.name)}`;
      
      // We need a slight delay to ensure both users are ready
      setTimeout(() => {
        router.push(sessionUrl);
      }, 500);
    };

    // Register event listeners
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_declined', handleCallDeclined);
    socket.on('session_ready', handleSessionReady);

    // Cleanup on unmount
    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_declined', handleCallDeclined);
      socket.off('session_ready', handleSessionReady);
      
      // Stop any playing ringtone
      stopRingtone();
    };
  }, [socket, userId, userName, callState, router, userPicture]);

  // Helper to stop ringtone
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
    // Create notification element
    if (typeof document !== 'undefined') {
      const notificationContainer = document.createElement('div');
      notificationContainer.className = 'fixed top-5 right-5 bg-white p-4 rounded-lg shadow-lg z-50 animate-fade-in';
      notificationContainer.style.animation = 'fadeIn 0.3s ease-in-out, fadeOut 0.3s ease-in-out 2.7s';
      notificationContainer.style.color = 'black';
      
      notificationContainer.innerHTML = `
        <div class="flex items-center">
          <div class="mr-3 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></div>
          <div>
            <div class="font-semibold" style="color: black;">${title}</div>
            <div class="text-sm" style="color: black;">${message}</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(notificationContainer);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (document.body.contains(notificationContainer)) {
          document.body.removeChild(notificationContainer);
        }
      }, 3000);
      
      // Add these styles to the document
      if (!document.getElementById('notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'notification-styles';
        styleElement.innerHTML = `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
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
          // Auto decline if timer reaches 0
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

  // Function to initiate a call
  const initiateCall = (targetUserId: string, targetUserName: string, targetUserPicture: string = '/default-profile.png') => {
    if (!socket || !userId) {
      showNotification('Connection Error', 'Cannot make call: connection not ready');
      return false;
    }
    
    if (!socket.connected) {
      showNotification('Connection Error', 'Socket not connected. Please try again in a moment.');
      return false;
    }
    
    // Generate a call ID
    const callId = `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
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
    
    // Play a dialing sound
    try {
      const audio = new Audio('/sounds/dialing.mp3'); // Make sure to add this sound
      audio.loop = true;
      audio.play().catch(e => console.log('Audio play error:', e));
      
      // Store the audio element to stop it later
      (window as any).callRingtone = audio;
    } catch (e) {
      console.log('Error playing dialing sound:', e);
    }
    
    return true;
  };

  // Handle accepting an incoming call
  const handleAcceptCall = () => {
    if (!socket || !callState.isIncoming) return;
    
    // Stop ringtone
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
    
    // Start call duration timer
    startCallDurationTimer();
    
    // The session_ready event will handle redirecting to the live session
  };

  // Handle declining an incoming call
  const handleDeclineCall = () => {
    if (!socket || !callState.isIncoming) return;
    
    // Stop ringtone
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
    
    // Stop dialing sound
    stopRingtone();
    
    socket.emit('cancel_call', {
      callId: callState.callId,
      callerId: callState.callerId,
      calleeId: callState.calleeId,
    });
    
    resetCallState();
  };

  // Expose the initiateCall function to the parent component
  useEffect(() => {
    if (typeof window !== 'undefined' && socket) {
      console.log('Exposing initiateCall function to window');
      // @ts-ignore - We're deliberately attaching to window
      window.initiateCall = initiateCall;
      window.initiateCallSocketId = socket.id;
      window.initiateCallReady = true;
      setFunctionReady(true);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        // Only remove if this is the component that set it
        if (window.initiateCallSocketId === socket?.id) {
          console.log('Cleaning up initiateCall function');
          // @ts-ignore - Clean up
          window.initiateCallReady = false;
          delete window.initiateCall;
          delete window.initiateCallSocketId;
        }
      }
    };
  }, [socket, userId, userName]);

  // Only render modals if there's an active call and we have a portal element
  if ((!callState.isIncoming && !callState.isOutgoing) || !portalElement) {
    return null;
  }

  // Use React createPortal to render modals at the document body level
  return createPortal(
    <>
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center">
        {/* Modal Container with glass effect */}
        <div className="bg-white bg-opacity-90 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Incoming Call Modal */}
          {callState.isIncoming && (
            <div className="flex flex-col items-center p-8">
              {/* Caller info with pulsing animation */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full bg-green-300 opacity-30 animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-green-400 shadow-lg">
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
              
              <h2 className="text-2xl font-bold text-black mb-2">{callState.callerName}</h2>
              <p className="text-lg font-medium mb-6 text-black">is calling you...</p>
              
              {/* Timer with progress bar */}
              <div className="w-full mb-8">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(timer / 30) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-2 text-center text-black">
                  Call expires in {timer} seconds
                </p>
              </div>
              
              {/* Call actions */}
              <div className="flex justify-center items-center space-x-10">
                <button 
                  onClick={handleDeclineCall}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-2 transform transition-transform hover:scale-110 active:scale-95 shadow-lg">
                    <MdCallEnd className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-black">Decline</span>
                </button>
                
                <button 
                  onClick={handleAcceptCall}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-2 transform transition-transform hover:scale-110 active:scale-95 shadow-lg">
                    <MdCall className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-black">Accept</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Outgoing Call Modal */}
          {callState.isOutgoing && (
            <div className="flex flex-col items-center p-8">
              {/* Animated connecting circles */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full bg-blue-300 opacity-30 animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-400 shadow-lg">
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
              
              <h2 className="text-2xl font-bold mb-2 text-black">{callState.calleeName}</h2>
              <div className="flex items-center space-x-2 mb-8">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></span>
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></span>
                <span className="text-lg font-medium ml-2 text-black">Calling</span>
              </div>
              
              {/* Timer with progress bar */}
              <div className="w-full mb-8">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(timer / 30) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-2 text-center text-black">
                  Call expires in {timer} seconds
                </p>
              </div>
              
              {/* Call actions */}
              <div className="flex justify-center items-center">
                <button 
                  onClick={handleCancelCall}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-2 transform transition-transform hover:scale-110 active:scale-95 shadow-lg">
                    <MdCallEnd className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-black">End Call</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    portalElement
  );
};

export default CallModals;