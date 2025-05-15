'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';

export default function DiagnosticPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  // Status states
  const [logs, setLogs] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [mediaStatus, setMediaStatus] = useState('Not requested');
  const [offerStatus, setOfferStatus] = useState('Not created');
  const [answerStatus, setAnswerStatus] = useState('Not received');
  const [iceStatus, setIceStatus] = useState('No candidates');
  const [connectionState, setConnectionState] = useState('New');
  const [socketUrl, setSocketUrl] = useState('https://localhost:3000');
  
  // Room ID for testing
  const [roomId, setRoomId] = useState('diagnostic-test-room');
  
  // Add log helper function
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, timestamp, type }]);
    console.log(`[${type}][${timestamp}] ${message}`);
  };
  
  // Reset everything
  const resetConnection = () => {
    addLog('Resetting connection...', 'system');
    
    // Stop any running media streams
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Reset states
    setSocketConnected(false);
    setMediaStatus('Not requested');
    setOfferStatus('Not created');
    setAnswerStatus('Not received');
    setIceStatus('No candidates');
    setConnectionState('New');
    
    addLog('Connection reset complete', 'system');
  };
  
  // Test socket connection only
  const testSocket = () => {
    resetConnection();
    addLog('Testing socket connection...', 'system');
    
    try {
      const socket = io(socketUrl, {
        rejectUnauthorized: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        auth: {
          userName: session?.user?.name || 'Diagnostic User',
          userId: session?.user?.id || 'test-user'
        }
      });
      
      socketRef.current = socket;
      
      socket.on('connect', () => {
        addLog(`Socket connected with ID: ${socket.id}`, 'success');
        setSocketConnected(true);
        socket.emit('join-room', roomId);
        addLog(`Joined room: ${roomId}`, 'info');
      });
      
      socket.on('connect_error', (error) => {
        addLog(`Socket connection error: ${error.message}`, 'error');
        setSocketConnected(false);
      });
      
      socket.on('disconnect', (reason) => {
        addLog(`Socket disconnected: ${reason}`, 'warning');
        setSocketConnected(false);
      });
      
      socket.on('error', (error) => {
        addLog(`Socket error: ${error}`, 'error');
      });
      
      socket.on('reconnect', (attemptNumber) => {
        addLog(`Socket reconnected after ${attemptNumber} attempts`, 'success');
      });
      
      socket.on('reconnect_error', (error) => {
        addLog(`Socket reconnection error: ${error.message}`, 'error');
      });
      
      socket.on('reconnect_failed', () => {
        addLog('Socket reconnection failed after all attempts', 'error');
      });
      
      addLog('Socket connection initiated', 'info');
    } catch (error) {
      addLog(`Error creating socket: ${error.message}`, 'error');
    }
  };
  
  // Test media access only
  const testMedia = async () => {
    addLog('Testing media access...', 'system');
    setMediaStatus('Requesting permissions...');
    
    try {
      const constraints = { video: true, audio: true };
      addLog(`Requesting user media with constraints: ${JSON.stringify(constraints)}`, 'info');
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      addLog('Media access granted!', 'success');
      
      // Display media info
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      addLog(`Video tracks: ${videoTracks.length}, Audio tracks: ${audioTracks.length}`, 'info');
      
      if (videoTracks.length > 0) {
        const videoSettings = videoTracks[0].getSettings();
        addLog(`Video: ${videoSettings.width}x${videoSettings.height} @ ${videoSettings.frameRate}fps`, 'info');
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        addLog('Local video element updated with stream', 'info');
      } else {
        addLog('Local video ref not available!', 'error');
      }
      
      setMediaStatus('Permissions granted');
    } catch (error) {
      addLog(`Media access error: ${error.message}`, 'error');
      setMediaStatus(`Error: ${error.message}`);
    }
  };
  
  // Test full WebRTC connection
  const testFullConnection = async () => {
    resetConnection();
    addLog('Starting full WebRTC connection test...', 'system');
    
    // 1. Setup socket connection
    try {
      addLog('Setting up socket connection...', 'info');
      const socket = io(socketUrl, {
        rejectUnauthorized: false,
        reconnection: true,
        reconnectionAttempts: 3,
        auth: {
          userName: session?.user?.name || 'Diagnostic User',
          userId: session?.user?.id || 'test-user'
        }
      });
      
      socketRef.current = socket;
      
      socket.on('connect', () => {
        addLog(`Socket connected with ID: ${socket.id}`, 'success');
        setSocketConnected(true);
        socket.emit('join-room', roomId);
        addLog(`Joined room: ${roomId}`, 'info');
      });
      
      socket.on('connect_error', (error) => {
        addLog(`Socket connection error: ${error.message}`, 'error');
        setSocketConnected(false);
      });
      
      // Continue with next steps when socket is connected
      socket.on('connect', async () => {
        // 2. Get user media
        await setupMedia();
      });
      
      // Event listeners for WebRTC signaling
      socket.on('offer', async (data) => {
        addLog(`Received offer from ${data.senderId}`, 'info');
        await handleOffer(data);
      });
      
      socket.on('answer', async (data) => {
        addLog(`Received answer from ${data.senderId}`, 'info');
        await handleAnswer(data);
      });
      
      socket.on('ice-candidate', async (data) => {
        addLog(`Received ICE candidate from ${data.senderId}`, 'info');
        await handleIceCandidate(data);
      });
      
      socket.on('user-connected', (userId) => {
        addLog(`User connected to room: ${userId}`, 'info');
      });
      
      socket.on('user-disconnected', (userId) => {
        addLog(`User disconnected from room: ${userId}`, 'warning');
      });
    } catch (error) {
      addLog(`Error setting up socket: ${error.message}`, 'error');
    }
  };
  
  // Setup media for full connection test
  const setupMedia = async () => {
    try {
      addLog('Requesting media permissions...', 'info');
      setMediaStatus('Requesting permissions...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      addLog('Media access granted', 'success');
      setMediaStatus('Permissions granted');
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        addLog('Local video element updated with stream', 'info');
      }
      
      // Proceed to setup peer connection
      setupPeerConnection(stream);
    } catch (error) {
      addLog(`Media access error: ${error.message}`, 'error');
      setMediaStatus(`Error: ${error.message}`);
    }
  };
  
  // Setup peer connection for full test
  const setupPeerConnection = (stream) => {
    try {
      addLog('Creating RTCPeerConnection...', 'info');
      
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      addLog(`Using ICE servers: ${JSON.stringify(configuration.iceServers)}`, 'info');
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
        addLog(`Added ${track.kind} track to peer connection`, 'info');
      });
      
      // Set up event handlers for peer connection
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          addLog(`Generated ICE candidate: ${event.candidate.candidate.split(' ')[0]}...`, 'info');
          setIceStatus(`Generated candidate: ${event.candidate.candidate.split(' ')[0]}...`);
          
          // Send ICE candidate to signaling server
          socketRef.current.emit('ice-candidate', {
            roomId: roomId,
            candidate: event.candidate
          });
        } else {
          addLog('ICE candidate gathering complete', 'info');
          setIceStatus('Gathering complete');
        }
      };
      
      peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        addLog(`ICE connection state changed to: ${state}`, 'info');
        setIceStatus(`Connection: ${state}`);
      };
      
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        addLog(`Connection state changed to: ${state}`, 'info');
        setConnectionState(state);
      };
      
      peerConnection.onsignalingstatechange = () => {
        addLog(`Signaling state changed to: ${peerConnection.signalingState}`, 'info');
      };
      
      peerConnection.ontrack = (event) => {
        addLog(`Received remote track: ${event.track.kind}`, 'success');
        
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          addLog('Remote video element updated with stream', 'success');
        }
      };
      
      // Create offer
      createOffer(peerConnection);
    } catch (error) {
      addLog(`Error setting up peer connection: ${error.message}`, 'error');
    }
  };
  
  // Create and send offer
  const createOffer = async (peerConnection) => {
    try {
      addLog('Creating offer...', 'info');
      setOfferStatus('Creating...');
      
      const offer = await peerConnection.createOffer();
      addLog('Offer created successfully', 'success');
      
      addLog('Setting local description...', 'info');
      await peerConnection.setLocalDescription(offer);
      addLog('Local description set', 'success');
      
      setOfferStatus('Created and set locally');
      
      // Send offer to signaling server
      socketRef.current.emit('newOffer', {
        roomId: roomId,
        offer: offer,
        userName: session?.user?.name || 'Diagnostic User'
      });
      
      addLog('Offer sent to signaling server', 'success');
      setOfferStatus('Sent to peer');
    } catch (error) {
      addLog(`Error creating/sending offer: ${error.message}`, 'error');
      setOfferStatus(`Error: ${error.message}`);
    }
  };
  
  // Handle incoming offer
  const handleOffer = async (data) => {
    try {
      const peerConnection = peerConnectionRef.current;
      
      if (!peerConnection) {
        addLog('No peer connection available to handle offer', 'error');
        return;
      }
      
      addLog('Setting remote description from offer...', 'info');
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      addLog('Remote description set from offer', 'success');
      
      // Create answer
      addLog('Creating answer...', 'info');
      const answer = await peerConnection.createAnswer();
      addLog('Answer created successfully', 'success');
      
      addLog('Setting local description for answer...', 'info');
      await peerConnection.setLocalDescription(answer);
      addLog('Local description set for answer', 'success');
      
      // Send answer to signaling server
      socketRef.current.emit('answer', {
        roomId: roomId,
        answer: answer,
        userName: session?.user?.name || 'Diagnostic User'
      });
      
      addLog('Answer sent to signaling server', 'success');
    } catch (error) {
      addLog(`Error handling offer: ${error.message}`, 'error');
    }
  };
  
  // Handle incoming answer
  const handleAnswer = async (data) => {
    try {
      const peerConnection = peerConnectionRef.current;
      
      if (!peerConnection) {
        addLog('No peer connection available to handle answer', 'error');
        return;
      }
      
      addLog('Setting remote description from answer...', 'info');
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      addLog('Remote description set from answer', 'success');
      setAnswerStatus('Received and set');
    } catch (error) {
      addLog(`Error handling answer: ${error.message}`, 'error');
      setAnswerStatus(`Error: ${error.message}`);
    }
  };
  
  // Handle incoming ICE candidate
  const handleIceCandidate = async (data) => {
    try {
      const peerConnection = peerConnectionRef.current;
      
      if (!peerConnection) {
        addLog('No peer connection available to handle ICE candidate', 'error');
        return;
      }
      
      addLog('Adding ICE candidate...', 'info');
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      addLog('ICE candidate added successfully', 'success');
    } catch (error) {
      addLog(`Error handling ICE candidate: ${error.message}`, 'error');
    }
  };
  
  // Check WebRTC support
  useEffect(() => {
    // Check for WebRTC support
    if (typeof window !== 'undefined') {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addLog('WebRTC is not supported in this browser', 'error');
      } else {
        addLog('WebRTC is supported in this browser', 'success');
      }
      
      // Check for secure context
      if (!window.isSecureContext) {
        addLog('Page is not running in a secure context (HTTPS)', 'error');
      } else {
        addLog('Page is running in a secure context (HTTPS)', 'success');
      }
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    return <div className="flex justify-center items-center h-screen">Please log in to access this page</div>;
  }
  
  return (
    <div className="container mx-auto p-4 text-black">
      <h1 className="text-2xl font-bold mb-6 text-black">WebRTC Connection Diagnostics</h1>
      
      {/* Controls section */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">Connection Controls</h2>
        
        <div className="mb-4">
          <label className="block mb-2 text-black">Signaling Server URL:</label>
          <div className="flex">
            <input
              type="text"
              value={socketUrl}
              onChange={(e) => setSocketUrl(e.target.value)}
              className="flex-1 p-2 border rounded mr-2 text-black"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 text-black">Test Room ID:</label>
          <div className="flex">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="flex-1 p-2 border rounded mr-2 text-black"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testSocket}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Socket Only
          </button>
          <button
            onClick={testMedia}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Media Only
          </button>
          <button
            onClick={testFullConnection}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Full WebRTC Connection
          </button>
          <button
            onClick={resetConnection}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset All
          </button>
        </div>
      </div>
      
      {/* Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">Connection Status</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-black">Socket Connection:</span>
              <span className={`px-2 py-1 rounded ${socketConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {socketConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-black">Media Status:</span>
              <span className={`px-2 py-1 rounded ${
                mediaStatus.includes('Error') ? 'bg-red-100 text-red-800' :
                mediaStatus === 'Permissions granted' ? 'bg-green-100 text-green-800' :
                mediaStatus === 'Requesting permissions...' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {mediaStatus}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-black">SDP Offer:</span>
              <span className={`px-2 py-1 rounded ${
                offerStatus.includes('Error') ? 'bg-red-100 text-red-800' :
                offerStatus === 'Sent to peer' ? 'bg-green-100 text-green-800' :
                offerStatus === 'Created and set locally' ? 'bg-yellow-100 text-yellow-800' :
                offerStatus === 'Creating...' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {offerStatus}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-black">SDP Answer:</span>
              <span className={`px-2 py-1 rounded ${
                answerStatus.includes('Error') ? 'bg-red-100 text-red-800' :
                answerStatus === 'Received and set' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {answerStatus}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-black">ICE Status:</span>
              <span className={`px-2 py-1 rounded ${
                iceStatus.includes('Error') ? 'bg-red-100 text-red-800' :
                iceStatus === 'Gathering complete' ? 'bg-green-100 text-green-800' :
                iceStatus.includes('candidate') ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {iceStatus}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-black">Connection State:</span>
              <span className={`px-2 py-1 rounded ${
                connectionState === 'connected' ? 'bg-green-100 text-green-800' :
                connectionState === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                connectionState === 'failed' || connectionState === 'disconnected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {connectionState}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">Video Preview</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 font-medium text-black">Local Video:</p>
              <div className="bg-black rounded relative" style={{ paddingBottom: '75%' }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div>
              <p className="mb-2 font-medium text-black">Remote Video:</p>
              <div className="bg-black rounded relative" style={{ paddingBottom: '75%' }}>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Log Display */}
      <div className="p-4 bg-gray-100 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-black">Connection Logs</h2>
        
        <div className="bg-gray-900 text-gray-100 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-300">No logs yet. Start a test to see logs.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                log.type === 'system' ? 'text-purple-400' :
                'text-gray-300'
              }`}>
                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Help Section */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">Troubleshooting Tips</h2>
        
        <ul className="list-disc pl-5 space-y-2 text-black">
          <li>Make sure your server is running with HTTPS (SSL/TLS certificates).</li>
          <li>Check that your browser allows camera and microphone access.</li>
          <li>Ensure your server is correctly handling signaling events.</li>
          <li>Verify that CORS is properly configured on your server.</li>
          <li>Try using different STUN/TURN servers if connection fails.</li>
          <li>Check network firewalls that might be blocking WebRTC connections.</li>
          <li>Test with two browsers on the same computer to eliminate network issues.</li>
          <li>Try using <code className="bg-gray-200 px-1 rounded">127.0.0.1</code> instead of <code className="bg-gray-200 px-1 rounded">localhost</code> in the server URL.</li>
          <li>Open browser developer tools and check for errors in the console.</li>
        </ul>
      </div>
    </div>
  );
}