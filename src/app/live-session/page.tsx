// src/app/live-session/page.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import io from 'socket.io-client';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, 
  FaVolumeUp, FaVolumeMute, FaDesktop, FaPhoneSlash, FaFlag, FaStop,
  FaUserFriends, FaHandshake, FaLightbulb, FaExpand, FaCompress } from 'react-icons/fa';
import ChatComponent from '../components/chat-component';
import ReportModal from '../components/report-modal';
import { Suspense } from 'react';

function LiveSessionPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const roomId = searchParams.get('roomId') || 'live-session-room';
  const peerId = searchParams.get('peerId') || '';
  const peerName = searchParams.get('peerName') || 'Remote User';
  
  // References for layout calculations
  const pageContainerRef = useRef(null);
  const videoContainerRef = useRef(null);
  
  // Refs for video and connections
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  
  // UI states
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  
  // Media state with default values from settings
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Layout states
  const [contentHeight, setContentHeight] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [remainingHeight, setRemainingHeight] = useState(0);
  
  // Add state for fullscreen mode
  const [isFullScreen, setIsFullScreen] = useState(false);
  const videoContainerFullscreenRef = useRef(null);
  
  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  // Function to toggle fullscreen
  const toggleFullScreen = () => {
    if (!videoContainerFullscreenRef.current) return;
    
    if (!isFullScreen) {
      // Enter fullscreen
      if (videoContainerFullscreenRef.current.requestFullscreen) {
        videoContainerFullscreenRef.current.requestFullscreen();
      } else if (videoContainerFullscreenRef.current.webkitRequestFullscreen) {
        videoContainerFullscreenRef.current.webkitRequestFullscreen();
      } else if (videoContainerFullscreenRef.current.msRequestFullscreen) {
        videoContainerFullscreenRef.current.msRequestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullScreen(false);
    }
  };
  
  // Listen for fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Settings state
  const [userSettings, setUserSettings] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  // User profile states
  const [localUserProfile, setLocalUserProfile] = useState({
    name: session?.user?.name || 'You',
    interests: [],
    skills: [],
    connectInterests: [],
    connectSkills: []
  });
  
  const [remoteUserProfile, setRemoteUserProfile] = useState({
    id: peerId || '',
    name: peerName || 'Remote User',
    interests: [],
    skills: [],
    connectInterests: [],
    connectSkills: [],
    profileImage: ''
  });
  
  // Profile picture from user's profile
  const [profilePicture, setProfilePicture] = useState('');
  
  // Session state
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Matching interests/skills
  const [matchingInterests, setMatchingInterests] = useState([]);
  const [matchingSkills, setMatchingSkills] = useState([]);
  
  // Chat states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // For debugging
  const [logs, setLogs] = useState([]);
  
  // Helper for logging
  const addLog = (message) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Calculate layout heights on mount and window resize
  useEffect(() => {
    const calculateHeights = () => {
      // Calculate available height for content (viewport height minus navbar and footer)
      // Assuming navbar is 64px (h-16) and footer is approximately 120px
      const navbarHeight = 64;
      const footerHeight = 120;
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - navbarHeight - footerHeight;
      
      setContentHeight(availableHeight);
      
      // If we have the video container reference, calculate its height
      if (videoContainerRef.current) {
        // For 16:9 ratio: if container width is W, height should be W * (9/16)
        const containerWidth = videoContainerRef.current.clientWidth;
        // Calculate height for 16:9 aspect ratio
        const aspectRatioHeight = containerWidth * (9/16);
        
        // Use the calculated height, but ensure it doesn't exceed available content height
        const calculatedVideoHeight = Math.min(aspectRatioHeight, availableHeight * 0.8);
        setVideoHeight(calculatedVideoHeight);
        
        // Calculate remaining height
        const newRemainingHeight = availableHeight - calculatedVideoHeight - 20; // 20px for margins
        setRemainingHeight(newRemainingHeight);
      }
    };
    
    // Calculate on mount
    calculateHeights();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateHeights);
    
    return () => {
      window.removeEventListener('resize', calculateHeights);
    };
  }, []);
  
  // Fetch user profile, skills and interests
  useEffect(() => {
    const fetchUserProfileData = async () => {
      if (!session?.user?.id) return;
      
      try {
        addLog('Fetching user profile data...');
        
        // Fetch user profile for profile picture
        const profileResponse = await fetch('/api/user');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfilePicture(profileData.profilePicture || '');
          addLog('Profile picture loaded');
        }
        
        // Fetch skills from profile
        const skillsResponse = await fetch('/api/user-skills');
        if (!skillsResponse.ok) {
          throw new Error(`Failed to fetch skills: ${skillsResponse.status}`);
        }
        const skillsData = await skillsResponse.json();
        
        // Fetch interests from profile
        const interestsResponse = await fetch('/api/user-interests');
        if (!interestsResponse.ok) {
          throw new Error(`Failed to fetch interests: ${interestsResponse.status}`);
        }
        const interestsData = await interestsResponse.json();
        
        // Get connect page skills/interests from URL params if available
        const connectSkills = searchParams.get('skills')?.split(',') || [];
        const connectInterests = searchParams.get('interests')?.split(',') || [];
        
        // Combine profile skills/interests with connect skills/interests
        const allSkills = [...new Set([...(skillsData.skills || []), ...connectSkills])];
        const allInterests = [...new Set([...(interestsData.interests || []), ...connectInterests])];
        
        // Update local user profile
        setLocalUserProfile(prev => ({
          ...prev,
          skills: allSkills,
          interests: allInterests,
          connectSkills: connectSkills,
          connectInterests: connectInterests
        }));
        
        addLog(`Loaded ${allSkills.length} skills and ${allInterests.length} interests (combined from profile and connect page)`);
      } catch (error) {
        addLog(`Error fetching user data: ${error.message}`);
        console.error('Error fetching user data:', error);
      }
    };
    
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserProfileData();
    }
  }, [session, status, searchParams]);
  
  // Fetch user settings
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!session?.user?.id) return;
      
      try {
        addLog('Fetching user settings...');
        const response = await fetch(`/api/user-settings?userId=${session.user.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.status}`);
        }
        
        const settings = await response.json();
        addLog('User settings loaded successfully');
        addLog(`Raw camera setting: ${JSON.stringify(settings.default_camera_state)}`);
        addLog(`Raw mic setting: ${JSON.stringify(settings.default_mic_state)}`);
        
        // Explicitly convert settings to boolean values
        // Settings can come as 0/1, true/false, or string values
        const cameraEnabled = settings.default_camera_state === true || 
                              settings.default_camera_state === 1 || 
                              settings.default_camera_state === "1" || 
                              settings.default_camera_state === "true";
                              
        const micEnabled = settings.default_mic_state === true || 
                           settings.default_mic_state === 1 || 
                           settings.default_mic_state === "1" || 
                           settings.default_mic_state === "true";
        
        addLog(`Camera enabled from settings: ${cameraEnabled}`);
        addLog(`Mic enabled from settings: ${micEnabled}`);
        
        // Update media states based on settings
        setIsCameraOn(cameraEnabled);
        setIsMicOn(micEnabled);
        
        // Store settings for future reference
        setUserSettings(settings);
        setSettingsLoaded(true);
      } catch (error) {
        addLog(`Error fetching settings: ${error.message}`);
        console.error('Settings fetch error:', error);
        // Use defaults if settings can't be loaded
        setSettingsLoaded(true);
      }
    };
    
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserSettings();
    }
  }, [session, status]);
  
  // Find matching interests and skills on profile updates
  useEffect(() => {
    // Find matching interests
    const commonInterests = localUserProfile.interests.filter(interest => 
      remoteUserProfile.interests.includes(interest)
    );
    setMatchingInterests(commonInterests);
    
    // Find matching skills
    const commonSkills = localUserProfile.skills.filter(skill => 
      remoteUserProfile.skills.includes(skill)
    );
    setMatchingSkills(commonSkills);
  }, [localUserProfile, remoteUserProfile]);
  
  // Add this useEffect in src/app/live-session/page.tsx
  useEffect(() => {
    // Handler for page unload/navigation
    const handleBeforeUnload = () => {
      if (isConnected && socketRef.current) {
        // Send event to server to end the session
        socketRef.current.emit('end_session', {
          roomId: roomId,
          status: 'completed'
        });
        
        // No need to wait for response or redirect since page is unloading
      }
    };
    
    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Also handle component unmount case
      if (isConnected && socketRef.current) {
        socketRef.current.emit('end_session', {
          roomId: roomId,
          status: 'completed'
        });
      }
    };
  }, [isConnected, roomId]);

  // Session timer
  useEffect(() => {
    let timer;
    
    if (isConnected) {
      timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);
  
  // Auto-hide controls timer
  useEffect(() => {
    let hideTimer;
    if (showControls && isConnected) {
      hideTimer = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [showControls, isConnected]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      // Update local user profile with session data
      setLocalUserProfile(prev => ({
        ...prev,
        name: session.user?.name || 'You'
      }));
    }
  }, [status, router, session]);
  
  // Update remote video volume
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = volumeLevel / 100;
    }
  }, [volumeLevel]);
  
  // Main WebRTC setup - wait for settings to be loaded first
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || !settingsLoaded) {
      return;
    }
    
    setIsConnecting(true);
    setIsConnected(false);
    setConnectionFailed(false);
    
    addLog('Starting connection process');
    addLog(`Initial camera state: ${isCameraOn ? 'ON' : 'OFF'}`);
    addLog(`Initial microphone state: ${isMicOn ? 'ON' : 'OFF'}`);
    
    // Get the socket URL from environment variable or default
    let socketUrl;
    if (process.env.NODE_ENV === 'production') {
      // In production, use the environment variable or the current origin
      socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    } else {
      // In development, always use localhost:3000
      socketUrl = 'http://localhost:3000';
    }
    addLog(`Connecting to socket server: ${socketUrl}`);
    
    // 1. Create socket connection
    const socket = io(socketUrl, {
      auth: {
        userName: session.user.name || 'Anonymous',
        userId: session.user.id
      },
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      timeout: 20000
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
      setIsConnecting(false);
      setConnectionFailed(true);
    });
    
    // Listen for WebRTC signaling events
    socket.on('offer', async (data) => {
      addLog('Received offer');
      await handleOffer(data);
      
      // Update remote user profile if available
      if (data.userProfile) {
        setRemoteUserProfile(prev => ({
          ...prev,
          id: data.userId || prev.id,
          name: data.userName || 'Remote User',
          interests: data.userProfile.interests || [],
          skills: data.userProfile.skills || [],
          connectInterests: data.userProfile.connectInterests || [],
          connectSkills: data.userProfile.connectSkills || [],
          profileImage: data.userProfile.profileImage || ''
        }));
        addLog('Updated remote user profile from offer');
      }
    });
    
    socket.on('answer', async (data) => {
      addLog('Received answer');
      await handleAnswer(data);
      
      // Update remote user profile if available
      if (data.userProfile) {
        setRemoteUserProfile(prev => ({
          ...prev,
          id: data.userId || prev.id,
          name: data.userName || 'Remote User',
          interests: data.userProfile.interests || [],
          skills: data.userProfile.skills || [],
          connectInterests: data.userProfile.connectInterests || [],
          connectSkills: data.userProfile.connectSkills || [],
          profileImage: data.userProfile.profileImage || ''
        }));
        addLog('Updated remote user profile from answer');
      }
    });
    
    socket.on('ice-candidate', async (data) => {
      addLog('Received ICE candidate');
      await handleIceCandidate(data);
    });
    
    socket.on('user-disconnected', (userId) => {
      addLog(`User disconnected: ${userId}`);
      setIsConnected(false);
    });
    
    // Handle chat messages
    socket.on('chat-message', (data) => {
      addLog(`Received chat message: ${data.text}`);
      setMessages(prev => [...prev, data]);
    });
    
    // Function to initialize WebRTC and get media
    async function startWebRTC() {
      try {
        // Get user media based on settings
        addLog('Requesting media...');
        
        // Request media with constraints based on settings
        const mediaConstraints = {
          video: true,  // Always request video, we'll enable/disable it after
          audio: true   // Always request audio, we'll enable/disable it after
        };
        
        addLog(`Requesting media with constraints: ${JSON.stringify(mediaConstraints)}`);
        const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        
        // Save reference to stream
        localStreamRef.current = stream;
        
        addLog('Media access granted');
        
        // Apply initial states based on settings
        addLog(`Applying initial states - Camera: ${isCameraOn ? 'ON' : 'OFF'}, Mic: ${isMicOn ? 'ON' : 'OFF'}`);
        
        // Handle microphone initial state - CRITICAL PART
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          // This is what actually mutes the microphone at hardware level
          audioTrack.enabled = isMicOn;
          addLog(`Set initial microphone hardware state to: ${isMicOn ? 'ENABLED' : 'DISABLED'}`);
        }
        
        // Handle camera initial state - CRITICAL PART
        if (!isCameraOn) {
          // If camera should be off initially, turn it off immediately
          addLog('Setting initial camera state to OFF');
          
          // Process to turn off camera completely (not just disable)
          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0) {
            const videoTrack = videoTracks[0];
            
            // Actually stop the camera track - IMPORTANT
            videoTrack.stop();
            addLog('Stopped video track hardware');
            
            // Remove it from the stream
            stream.removeTrack(videoTrack);
            
            // Create a black canvas track for replacement
            const blackCanvas = document.createElement('canvas');
            blackCanvas.width = 640;
            blackCanvas.height = 480;
            const ctx = blackCanvas.getContext('2d');
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, blackCanvas.width, blackCanvas.height);
            
            // Create black track
            const blackStream = blackCanvas.captureStream();
            const blackTrack = blackStream.getVideoTracks()[0];
            
            // Update local display
            if (localVideoRef.current) {
              const tempStream = new MediaStream();
              tempStream.addTrack(blackTrack);
              localVideoRef.current.srcObject = tempStream;
              addLog('Applied black canvas to local video');
              
              try {
                await localVideoRef.current.play();
                addLog('Local video (black canvas) playing');
              } catch (e) {
                addLog(`Local video play failed: ${e.message}`);
              }
            }
          }
        } else {
          // Set local video stream if camera is enabled
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
        
        // Add tracks to peer connection based on settings
        if (isCameraOn) {
          // Add all tracks if camera is on
          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
            addLog(`Added ${track.kind} track to peer connection`);
          });
        } else {
          // If camera is off initially, we need special handling
          
          // First, add any audio tracks
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            peerConnection.addTrack(audioTracks[0], stream);
            addLog('Added audio track to peer connection');
          }
          
          // Create a black video track for the peer connection
          const blackCanvas = document.createElement('canvas');
          blackCanvas.width = 640;
          blackCanvas.height = 480;
          const ctx = blackCanvas.getContext('2d');
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, blackCanvas.width, blackCanvas.height);
          
          const blackStream = blackCanvas.captureStream();
          const blackTrack = blackStream.getVideoTracks()[0];
          
          // Add the black track to the peer connection
          peerConnection.addTrack(blackTrack, blackStream);
          addLog('Added black video track to peer connection to indicate camera off');
        }
        
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
              setIsConnecting(false);
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
            setIsConnecting(false);
          } else if (peerConnection.connectionState === 'failed' || 
                     peerConnection.connectionState === 'disconnected' || 
                     peerConnection.connectionState === 'closed') {
            setIsConnected(false);
            
            if (peerConnection.connectionState === 'failed') {
              setConnectionFailed(true);
              setIsConnecting(false);
            }
          }
        };
        
        peerConnection.oniceconnectionstatechange = () => {
          addLog(`ICE connection state changed: ${peerConnection.iceConnectionState}`);
          if (peerConnection.iceConnectionState === 'connected' || 
              peerConnection.iceConnectionState === 'completed') {
            setIsConnected(true);
            setIsConnecting(false);
          } else if (peerConnection.iceConnectionState === 'failed' || 
                     peerConnection.iceConnectionState === 'disconnected' || 
                     peerConnection.iceConnectionState === 'closed') {
            setIsConnected(false);
            
            if (peerConnection.iceConnectionState === 'failed') {
              setConnectionFailed(true);
              setIsConnecting(false);
            }
          }
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
              offer,
              userId: session.user.id,
              userName: session.user.name,
              userProfile: {
                interests: localUserProfile.interests,
                skills: localUserProfile.skills,
                connectInterests: localUserProfile.connectInterests,
                connectSkills: localUserProfile.connectSkills,
                profileImage: profilePicture
              }
            });
          } catch (error) {
            addLog(`Error creating/sending offer: ${error.message}`);
          }
        }, 1000);
      } catch (error) {
        addLog(`WebRTC setup error: ${error.message}`);
        setConnectionFailed(true);
        setIsConnecting(false);
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
          answer,
          userId: session.user.id,
          userName: session.user.name,
          userProfile: {
            interests: localUserProfile.interests,
            skills: localUserProfile.skills,
            connectInterests: localUserProfile.connectInterests,
            connectSkills: localUserProfile.connectSkills,
            profileImage: profilePicture
          }
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
      addLog('Cleaning up WebRTC and socket connection');
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [session, roomId, status, localUserProfile, settingsLoaded]);
  
  // Format session duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Media control functions
  const toggleCamera = async () => {
    try {
      if (isCameraOn) {
        // TURN CAMERA OFF
        addLog('Turning camera off...');
        
        if (localStreamRef.current) {
          const videoTracks = localStreamRef.current.getVideoTracks();
          if (videoTracks.length > 0) {
            const videoTrack = videoTracks[0];
            
            // Actually stop the camera track completely
            videoTrack.stop();
            
            // Remove it from the stream
            localStreamRef.current.removeTrack(videoTrack);
            
            // Create a "black" video track to replace the camera
            // This ensures the remote user sees us as off, not frozen
            const blackCanvas = document.createElement('canvas');
            blackCanvas.width = 640;
            blackCanvas.height = 480;
            const ctx = blackCanvas.getContext('2d');
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, blackCanvas.width, blackCanvas.height);
            
            // Convert the canvas to a video stream
            const blackStream = blackCanvas.captureStream();
            const blackTrack = blackStream.getVideoTracks()[0];
            
            // Update local video display with the black track
            if (localVideoRef.current) {
              const tempStream = new MediaStream();
              tempStream.addTrack(blackTrack);
              localVideoRef.current.srcObject = tempStream;
            }
            
            // Replace the track in the peer connection with the black track
            if (peerConnectionRef.current) {
              const senders = peerConnectionRef.current.getSenders();
              const videoSender = senders.find(sender => sender.track?.kind === 'video');
              
              if (videoSender) {
                try {
                  // Replace with black track instead of null
                  await videoSender.replaceTrack(blackTrack);
                  addLog('Replaced video track with black track in peer connection');
                } catch (error) {
                  addLog(`Error replacing video track: ${error.message}`);
                }
              }
            }
            
            // Update UI state
            setIsCameraOn(false);
            addLog('Camera turned off successfully');
          }
        }
      } else {
        // TURN CAMERA ON
        addLog('Turning camera on...');
        
        try {
          // Get new video stream
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = newStream.getVideoTracks()[0];
          
          addLog('New video track acquired');
          
          // If localStreamRef doesn't exist, create a new one
          if (!localStreamRef.current) {
            const existingAudioTracks = [];
            if (peerConnectionRef.current) {
              const audioSender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'audio');
              if (audioSender && audioSender.track) {
                existingAudioTracks.push(audioSender.track);
              }
            }
            localStreamRef.current = new MediaStream([...existingAudioTracks, newVideoTrack]);
          } else {
            // Add the new track to our stream
            localStreamRef.current.addTrack(newVideoTrack);
          }
          
          // Update local video display
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            addLog('Updated local video display');
          }
          
          // Replace the track in the peer connection
          if (peerConnectionRef.current) {
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            
            if (videoSender) {
              await videoSender.replaceTrack(newVideoTrack);
              addLog('Replaced video track in peer connection');
            } else {
              // If no video sender exists, add a new track
              peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current);
              addLog('Added new video track to peer connection');
            }
          }
          
          // Update UI state
          setIsCameraOn(true);
          addLog('Camera turned on successfully');
        } catch (error) {
          addLog(`Error turning on camera: ${error.message}`);
          console.error('Camera restart error:', error);
        }
      }
    } catch (error) {
      addLog(`Toggle camera error: ${error.message}`);
      console.error('Toggle camera error:', error);
    }
  };
  
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        addLog(`Microphone ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };
  
  const toggleVolume = () => {
    if (remoteVideoRef.current) {
      const newState = !isVolumeOn;
      remoteVideoRef.current.muted = !newState;
      setIsVolumeOn(newState);
      addLog(`Volume ${newState ? 'enabled' : 'muted'}`);
    }
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolumeLevel(newVolume);
    
    if (newVolume === 0 && isVolumeOn) {
      setIsVolumeOn(false);
      if (remoteVideoRef.current) remoteVideoRef.current.muted = true;
    } else if (newVolume > 0 && !isVolumeOn) {
      setIsVolumeOn(true);
      if (remoteVideoRef.current) remoteVideoRef.current.muted = false;
    }
    
    addLog(`Volume level set to ${newVolume}%`);
  };
  
  const shareScreen = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        
        setIsScreenSharing(false);
        addLog('Screen sharing stopped');
        
        // Restore camera stream to local video
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        
        // Replace track in peer connection
        if (peerConnectionRef.current && localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
              addLog('Replaced screen share with camera in peer connection');
            }
          }
        }
        
        return;
      }
      
      // Start screen sharing
      addLog('Starting screen sharing...');
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: false
      });
      
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      
      // Display screen share in local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        addLog('Local video showing screen share');
      }
      
      // Replace track in peer connection
      if (peerConnectionRef.current) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender => sender.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(videoTrack);
            addLog('Replaced camera with screen share in peer connection');
          }
        }
      }
      
      // Handle stream ending (user stops sharing)
      stream.getVideoTracks()[0].onended = () => {
        addLog('Screen sharing ended by user');
        setIsScreenSharing(false);
        screenStreamRef.current = null;
        
        // Restore camera to local video
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        
        // Replace track in peer connection
        if (peerConnectionRef.current && localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
              addLog('Restored camera track in peer connection after screen share ended');
            }
          }
        }
      };
    } catch (error) {
      addLog(`Screen sharing error: ${error.message}`);
      setIsScreenSharing(false);
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
    }
  };
  
  // Update this function in src/app/live-session/page.tsx
  const endCall = () => {
    addLog('Ending call...');
    
    // Notify server that session is ending with "completed" status
    if (socketRef.current) {
      socketRef.current.emit('end_session', {
        roomId: roomId,
        status: 'completed'
      });
    }
    
    // Stop media streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Redirect to dashboard or connect page
    router.push('/connect');
  };
  
  // Helper function to get formatted timestamp
  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Chat function to send message
  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    
    const messageData = {
      text: newMessage,
      sender: localUserProfile.name,
      timestamp: getFormattedTime()
    };
    
    // Add message to local state
    setMessages(prev => [...prev, messageData]);
    
    // Send message to the remote user via socket
    socketRef.current.emit('chat-message', {
      ...messageData,
      roomId
    });
    
    // Clear input
    setNewMessage('');
    addLog(`Sent chat message: ${newMessage}`);
  };
  
  // Handle report submission
  const handleSubmitReport = async () => {
    if (!reportReason) {
      alert('Please select a reason for reporting');
      return;
    }
    
    try {
      // Make sure we have a numeric ID
      let reportedId;
      
      // Try to parse the ID as a number if it's not already one
      if (typeof remoteUserProfile.id !== 'number') {
        // First check if it's a numeric string
        if (/^\d+$/.test(remoteUserProfile.id)) {
          reportedId = parseInt(remoteUserProfile.id, 10);
        } else {
          // If it's a socket ID or other non-numeric format, 
          // we need to handle this differently.
          // For now, alert the user that we can't process the report
          alert('Cannot report this user at this time. Please try again later or contact support.');
          setShowReportModal(false);
          return;
        }
      } else {
        reportedId = remoteUserProfile.id;
      }
      
      // Now proceed with the API call using the numeric ID
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedUserId: reportedId,
          reason: reportReason,
          additionalInfo: '', // You can add handling for additional info if needed
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit report');
      }
      
      // Close the modal and reset the reason
      setShowReportModal(false);
      setReportReason('');
      
      // Show success message
      alert('Thank you for your report. Our team will review it shortly.');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again later.');
    }
  };
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-blue-500">Loading...</div>
      </div>
    );
  }
  
  return (
    <div 
      className="flex flex-col overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        height: `calc(100vh - 115px)`
      }}
      ref={pageContainerRef}
    >
      <div className="flex-grow container mx-auto px-6 flex flex-col py-2">
        {/* Profile Header */}
        {(isConnected || isConnecting) && (
          <div className="bg-gray-900 rounded-lg p-3 mb-3 shadow-lg">
            <div className="flex items-center justify-between">
              {/* Local user profile summary */}
              <div className="flex items-center space-x-2">
                <a 
                  href="/profile" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 overflow-hidden">
                    {profilePicture ? (
                      <img 
                        src={profilePicture || '/default-profile.png'} 
                        alt={localUserProfile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                        {localUserProfile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </a>
                <div>
                  <h3 className="font-medium text-white">{localUserProfile.name}</h3>
                  <div className="flex space-x-1">
                    {localUserProfile.skills.slice(0, 2).map((skill, idx) => (
                      <span key={idx} className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                    {localUserProfile.skills.length > 2 && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        +{localUserProfile.skills.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Session info and matching indicators */}
              <div className="text-center flex flex-col items-center">
                <div className="bg-black bg-opacity-70 px-4 py-1 rounded-full text-white mb-1">
                  <span className="font-medium">Session: {formatDuration(sessionDuration)}</span>
                </div>
                {matchingInterests.length > 0 && (
                  <div className="text-xs px-3 py-1 bg-amber-500 rounded-full text-white">
                    {matchingInterests.length} shared {matchingInterests.length === 1 ? 'interest' : 'interests'}
                  </div>
                )}
              </div>
              
              {/* Remote user profile summary */}
              <div className="flex items-center space-x-2">
                <div>
                  <h3 className="font-medium text-white text-right">{remoteUserProfile.name}</h3>
                  <div className="flex space-x-1 justify-end">
                    {remoteUserProfile.skills.slice(0, 2).map((skill, idx) => (
                      <span key={idx} className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                    {remoteUserProfile.skills.length > 2 && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        +{remoteUserProfile.skills.length - 2}
                      </span>
                    )}
                  </div>
                </div>
                <a 
                  href={`/user/${remoteUserProfile.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(`/user/${remoteUserProfile.id}`, '_blank');
                  }}
                  className="cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500 overflow-hidden">
                    {remoteUserProfile.profileImage ? (
                      <img 
                        src={remoteUserProfile.profileImage} 
                        alt={remoteUserProfile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                        {remoteUserProfile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Main content area with video and sidebar */}
        <div className="flex flex-1 gap-3 overflow-hidden" ref={videoContainerRef}>
          {/* Video Section (Left) with 16:9 aspect ratio */}
          <div className="w-3/4 flex flex-col">
            <div 
              className="relative w-full rounded-lg overflow-hidden shadow-2xl bg-black"
              style={{ 
                height: videoHeight || 'auto', 
                minHeight: '300px' 
              }}
              ref={videoContainerFullscreenRef}
            >
              {/* Remote Video - Main view */}
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline
                muted={!isVolumeOn}
                className="w-full h-full object-cover" 
              />
              
              {/* Connection states overlays */}
              {isConnecting && !isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white">
                  <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
                  <div className="text-xl font-medium">Connecting to {remoteUserProfile.name}...</div>
                </div>
              )}
              
              {connectionFailed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <div className="text-xl font-medium">Connection failed</div>
                  <button 
                    onClick={() => router.push('/connect')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Return to Connect
                  </button>
                </div>
              )}
              
              {/* Picture-in-Picture local video */}
              <div className="absolute bottom-4 right-4 w-1/4 z-10 rounded-lg overflow-hidden shadow-lg border-2 border-white">
                <div className="relative pb-[56.25%]"> {/* 16:9 aspect ratio */}
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover bg-gray-800" 
                  />
                  
                  {/* User badge in top-left corner of PiP */}
                  <div className="absolute top-1 left-1 flex items-center bg-black bg-opacity-50 rounded px-1 z-10">
                    <span className="text-white text-xs">{localUserProfile.name}</span>
                    {isMicOn ? 
                      <FaMicrophone className="text-green-500 w-2 h-2 ml-1" /> : 
                      <FaMicrophoneSlash className="text-red-500 w-2 h-2 ml-1" />
                    }
                  </div>
                  
                  {/* Camera off indicator */}
                  {!isCameraOn && !isScreenSharing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {localUserProfile.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Control bar overlay */}
              {isConnected && (
                <div 
                  className="absolute bottom-4 inset-x-0 flex justify-center z-20"
                  onMouseEnter={() => setShowControls(true)}
                >
                  <div 
                    className={`bg-black bg-opacity-60 rounded-full py-2 px-4 flex space-x-6 items-center transition-opacity duration-300 ${
                      showControls ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {/* Camera Control */}
                    <button
                      onClick={toggleCamera}
                      disabled={isScreenSharing}
                      className={`p-3 rounded-full ${
                        isScreenSharing 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : isCameraOn 
                            ? 'text-white hover:bg-gray-700' 
                            : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {isCameraOn ? (
                        <FaVideo className="w-5 h-5" />
                      ) : (
                        <FaVideoSlash className="w-5 h-5" />
                      )}
                    </button>
                    
                    {/* Microphone Control */}
                    <button
                      onClick={toggleMic}
                      className={`p-3 rounded-full ${
                        isMicOn 
                          ? 'text-white hover:bg-gray-700' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {isMicOn ? (
                        <FaMicrophone className="w-5 h-5" />
                      ) : (
                        <FaMicrophoneSlash className="w-5 h-5" />
                      )}
                    </button>
                    
                    {/* Screen Sharing Control */}
                    <button
                      onClick={shareScreen}
                      className={`p-3 rounded-full ${
                        isScreenSharing 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'text-white hover:bg-gray-700'
                      }`}
                    >
                      {isScreenSharing ? (
                        <FaStop className="w-5 h-5" />
                      ) : (
                        <FaDesktop className="w-5 h-5" />
                      )}
                    </button>
                    
                    {/* End Call Control */}
                    <button
                      onClick={endCall}
                      className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <FaPhoneSlash className="w-5 h-5" />
                    </button>
                    
                    {/* Volume Control */}
                    <div className="relative">
                      <button
                        onClick={toggleVolume}
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        className={`p-3 rounded-full ${isVolumeOn ? 'text-white hover:bg-gray-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
                      >
                        {isVolumeOn ? (
                          <FaVolumeUp className="w-5 h-5" />
                        ) : (
                          <FaVolumeMute className="w-5 h-5" />
                        )}
                      </button>
                      
                      {/* Volume slider */}
                      {showVolumeSlider && (
                        <div 
                          className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 p-2 rounded-lg z-10"
                          onMouseLeave={() => setShowVolumeSlider(false)}
                        >
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volumeLevel}
                            onChange={handleVolumeChange}
                            className="w-24 accent-white"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Fullscreen Button */}
                    <button
                      onClick={toggleFullScreen}
                      className="p-3 text-white rounded-full hover:bg-gray-700"
                    >
                      {isFullScreen ? (
                        <FaCompress className="w-5 h-5" />
                      ) : (
                        <FaExpand className="w-5 h-5" />
                      )}
                    </button>
                    
                    {/* Report Button */}
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="p-3 text-white rounded-full hover:bg-gray-700"
                    >
                      <FaFlag className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Session Tips section below the video - simplified version */}
            <div className="mt-3 bg-gray-900 rounded-lg p-3 shadow-lg">
              <h3 className="text-white font-medium mb-2 flex items-center">
                <FaLightbulb className="mr-2 text-amber-400" /> Session Tips
              </h3>
              <div className="flex justify-between text-xs text-gray-200">
                <div className="w-1/3 pr-2">
                  <h4 className="font-medium text-white mb-1">Getting Started</h4>
                  <ul className="space-y-1 pl-3 list-disc">
                    <li>Introduce yourself and your learning goals</li>
                    <li>Discuss what you hope to achieve in this session</li>
                  </ul>
                </div>
                <div className="w-1/3 px-2 border-l border-r border-gray-700">
                  <h4 className="font-medium text-white mb-1">During Session</h4>
                  <ul className="space-y-1 pl-3 list-disc">
                    <li>Use screen sharing to demonstrate techniques</li>
                    <li>Take notes in the chat for reference later</li>
                  </ul>
                </div>
                <div className="w-1/3 pl-2">
                  <h4 className="font-medium text-white mb-1">Wrapping Up</h4>
                  <ul className="space-y-1 pl-3 list-disc">
                    <li>Summarize what you've learned</li>
                    <li>Exchange contact information for follow-ups</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right sidebar with chat */}
          <div className="w-1/4 h-full flex flex-col">
            {/* Chat component - dynamically sized to match the total height */}
            <div className="flex-grow h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden">
              <ChatComponent 
                messages={messages.map(msg => ({
                  ...msg,
                  senderImage: msg.sender === localUserProfile.name ? profilePicture : remoteUserProfile.profileImage
                }))}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendMessage={sendMessage}
                currentUser={localUserProfile.name}
                currentUserImage={profilePicture}
                remoteUserImage={remoteUserProfile.profileImage}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          remoteUserName={remoteUserProfile.name}
          reportReason={reportReason}
          setReportReason={setReportReason}
          submitReport={handleSubmitReport}
          closeReportModal={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
export default function LiveSessionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LiveSessionPageContent />
    </Suspense>
  );
}