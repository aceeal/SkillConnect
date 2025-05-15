'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import io from 'socket.io-client';

export default function SimplestLiveSessionPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const roomId = searchParams.get('roomId') || 'simple-test-room';
  
  // Refs for video and connections
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  // Basic state for logging
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Helper for logging
  const addLog = (message) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Main WebRTC setup - as simple as possible
  useEffect(() => {
    if (!session?.user) return;
    
    addLog('Starting connection process');
    
    // 1. Create socket connection
    const socket = io('https://localhost:3000', {
      rejectUnauthorized: false,
      auth: {
        userName: session.user.name || 'Anonymous'
      }
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      addLog(`Socket connected: ${socket.id}`);
      
      // Join room immediately on connect
      socket.emit('join-room', roomId);
      addLog(`Joined room: ${roomId}`);
      
      // Get media and continue setup
      startWebRTC();
    });
    
    socket.on('connect_error', (error) => {
      addLog(`Socket connection error: ${error.message}`);
    });
    
    // Listen for WebRTC signaling events
    socket.on('offer', async (data) => {
      addLog('Received offer');
      await handleOffer(data);
    });
    
    socket.on('answer', async (data) => {
      addLog('Received answer');
      await handleAnswer(data);
    });
    
    socket.on('ice-candidate', async (data) => {
      addLog('Received ICE candidate');
      await handleIceCandidate(data);
    });
    
    // Function to initialize WebRTC and get media
    async function startWebRTC() {
      try {
        // Get user media
        addLog('Requesting media...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        addLog('Media access granted');
        
        // Set local video stream immediately
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          try {
            await localVideoRef.current.play();
            addLog('Local video playing');
          } catch (e) {
            addLog(`Local video play failed: ${e.message}`);
          }
        } else {
          addLog('Local video ref not available');
        }
        
        // Create peer connection
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        
        peerConnectionRef.current = peerConnection;
        addLog('Created peer connection');
        
        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
          addLog(`Added ${track.kind} track to peer connection`);
        });
        
        // Set up ICE candidate handling
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            addLog('Generated ICE candidate');
            socket.emit('ice-candidate', {
              roomId,
              candidate: event.candidate
            });
          }
        };
        
        // Handle remote tracks
        peerConnection.ontrack = (event) => {
          addLog(`Received ${event.track.kind} track from remote peer`);
          
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            addLog('Setting remote video stream');
            remoteVideoRef.current.srcObject = event.streams[0];
            try {
              remoteVideoRef.current.play();
              addLog('Remote video playing');
              setIsConnected(true);
            } catch (e) {
              addLog(`Remote video play failed: ${e.message}`);
            }
          } else {
            addLog('Remote video ref not available');
          }
        };
        
        // Monitor connection state
        peerConnection.onconnectionstatechange = () => {
          addLog(`Connection state changed: ${peerConnection.connectionState}`);
          if (peerConnection.connectionState === 'connected') {
            setIsConnected(true);
          }
        };
        
        peerConnection.oniceconnectionstatechange = () => {
          addLog(`ICE connection state changed: ${peerConnection.iceConnectionState}`);
        };
        
        // Create and send offer (with delay to ensure everything is set up)
        setTimeout(async () => {
          try {
            addLog('Creating offer...');
            const offer = await peerConnection.createOffer();
            
            addLog('Setting local description...');
            await peerConnection.setLocalDescription(offer);
            
            addLog('Sending offer...');
            socket.emit('newOffer', {
              roomId,
              offer
            });
          } catch (error) {
            addLog(`Error creating/sending offer: ${error.message}`);
          }
        }, 1000);
      } catch (error) {
        addLog(`WebRTC setup error: ${error.message}`);
      }
    }
    
    // Handler for incoming offers
    async function handleOffer(data) {
      try {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) {
          addLog('No peer connection available for handling offer');
          return;
        }
        
        addLog('Setting remote description from offer...');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        addLog('Creating answer...');
        const answer = await peerConnection.createAnswer();
        
        addLog('Setting local description for answer...');
        await peerConnection.setLocalDescription(answer);
        
        addLog('Sending answer...');
        socket.emit('answer', {
          roomId,
          answer
        });
      } catch (error) {
        addLog(`Error handling offer: ${error.message}`);
      }
    }
    
    // Handler for incoming answers
    async function handleAnswer(data) {
      try {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) {
          addLog('No peer connection available for handling answer');
          return;
        }
        
        addLog('Setting remote description from answer...');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        addLog('Remote description set successfully');
      } catch (error) {
        addLog(`Error handling answer: ${error.message}`);
      }
    }
    
    // Handler for incoming ICE candidates
    async function handleIceCandidate(data) {
      try {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) {
          addLog('No peer connection available for handling ICE candidate');
          return;
        }
        
        addLog('Adding ICE candidate...');
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        addLog('ICE candidate added successfully');
      } catch (error) {
        addLog(`Error handling ICE candidate: ${error.message}`);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [session, roomId]);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Simplest Live Session Test</h1>
      <p className="mb-4">Room ID: {roomId}</p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="w-full md:w-1/2">
          <h2 className="font-bold mb-2">Local Video</h2>
          <div className="bg-black relative" style={{ height: '300px' }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <h2 className="font-bold mb-2">Remote Video</h2>
          <div className="bg-black relative" style={{ height: '300px' }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
            />
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                Waiting for connection...
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="font-bold mb-2">Connection Logs</h2>
        <div className="bg-gray-100 p-4 rounded h-40 overflow-y-auto text-xs">
          {logs.length === 0 ? (
            <p>No logs yet</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}