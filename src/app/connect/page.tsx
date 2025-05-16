// src/app/connect/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
// Import Socket.io client
import io from 'socket.io-client';

export default function ConnectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [otherInterest, setOtherInterest] = useState('');
  const [otherSkill, setOtherSkill] = useState('');
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [queueUsers, setQueueUsers] = useState<any[]>([]);
  
  // Socket ref to maintain connection across renders
  const socketRef = useRef<any>(null);
  
  // Connection states
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  
  // Match states
  const [matchFound, setMatchFound] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchId, setMatchId] = useState('');
  const [matchExpiry, setMatchExpiry] = useState(0);
  const [matchAccepted, setMatchAccepted] = useState(false);
  
  // Call states
  const [waitingForMatch, setWaitingForMatch] = useState(false);
  const [callingUserId, setCallingUserId] = useState<string | null>(null);
  
  // Loading states
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(true);

  // Categories for skills and interests
  const [categorizedSkills, setCategorizedSkills] = useState<Record<string, string[]>>({});
  const [selectedInterestCategory, setSelectedInterestCategory] = useState<string>('IT and Computer Science');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>('IT and Computer Science');

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Load skills and interests from user profile
      fetchUserSkillsAndInterests();
      // Load skill categories from database
      fetchSkillCategories();
    }
    
    // Clean up socket connection on unmount
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [status, router]);

  // Fetch user skills and interests from database
  const fetchUserSkillsAndInterests = async () => {
    setLoadingSkills(true);
    try {
      // Fetch skills
      const skillsResponse = await fetch('/api/user-skills');
      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        setSkills(skillsData.skills || []);
      }

      // Fetch interests
      const interestsResponse = await fetch('/api/user-interests');
      if (interestsResponse.ok) {
        const interestsData = await interestsResponse.json();
        setInterests(interestsData.interests || []);
      }
    } catch (error) {
      console.error('Error fetching user skills and interests:', error);
    } finally {
      setLoadingSkills(false);
    }
  };

  // Fetch skill categories from database
  const fetchSkillCategories = async () => {
    try {
      const response = await fetch('/api/skill-categories');
      if (response.ok) {
        const data = await response.json();
        setCategorizedSkills(data.categorizedSkills || {});
        
        // Set first category as default if available
        if (Object.keys(data.categorizedSkills || {}).length > 0) {
          const firstCategory = Object.keys(data.categorizedSkills)[0];
          setSelectedInterestCategory(firstCategory);
          setSelectedSkillCategory(firstCategory);
        }
      }
    } catch (error) {
      console.error('Error fetching skill categories:', error);
      // Use default categories if fetch fails
      setCategorizedSkills({
        'IT and Computer Science': [
          'Python Programming',
          'Java Programming',
          'C++ Programming',
          'JavaScript & Web Development',
          'PHP & MySQL',
          'Mobile App Development',
          'Cybersecurity Basics',
          'Data Science & Analytics',
        ],
        'Academic Subjects': [
          'Mathematics (Algebra, Calculus, Trigonometry)',
          'Physics Fundamentals',
          'Chemistry Basics',
          'Biology & Life Sciences',
          'Economics & Business Studies',
          'Financial Literacy & Budgeting',
          'Entrepreneurship Basics',
        ],
        'Technical & Creative Skills': [
          'Graphic Design (Canva, Photoshop)',
          'Video Editing (Premiere Pro, CapCut)',
          'Creative Writing & Essay Writing',
          'Public Speaking & Communication',
        ],
        'Practical Skills': [
          'Guitar Basics',
          'Photography & Videography',
          'Critical Thinking & Problem Solving',
        ],
      });
    }
  };

  // Timer for queue
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (inQueue) {
      interval = setInterval(() => {
        setQueueTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [inQueue]);

  // Timer for match expiry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (matchFound && matchExpiry > 0) {
      interval = setInterval(() => {
        setMatchExpiry(prev => {
          if (prev <= 1) {
            // Match expired
            setMatchFound(false);
            setMatchedUser(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchFound, matchExpiry]);

  // Clean up and set up socket event listeners when joining/leaving queue
  const setupSocketListeners = (socket: any) => {
    // Remove any existing listeners to prevent duplicates
    socket.off('queue-status');
    socket.off('match-found');
    socket.off('match-declined');
    socket.off('match-canceled');
    socket.off('match-expired');
    socket.off('session-ready');
    socket.off('return-to-queue');
    socket.off('direct-call');
    socket.off('direct-call-response');
    
    // Queue status updates
    socket.on('queue-status', (data: any) => {
      console.log('Queue status update:', data);
      // Update queue users from server - ensure we never see ourselves
      if (data.otherUsers) {
        // Double-check to filter out own user if somehow present
        setQueueUsers(data.otherUsers.filter(u => u.id !== socket.id));
      }
      setLoadingQueue(false);
    });
    
    // Match found event
    socket.on('match-found', (data: any) => {
      console.log('Match found:', data);
      setMatchFound(true);
      setMatchedUser(data.peer);
      setMatchId(data.matchId);
      setMatchExpiry(data.expiresIn);
      // Stop showing other queue users when match is found
      setQueueUsers([]);
      setLoadingQueue(false);
    });
    
    // Match response events
    socket.on('match-declined', (data: any) => {
      console.log('Match declined:', data);
      if (data.matchId === matchId) {
        setMatchFound(false);
        setMatchedUser(null);
        setMatchId('');
        setMatchExpiry(0);
        setMatchAccepted(false);
        setWaitingForMatch(false);
        
        // Request updated queue data
        setLoadingQueue(true);
        socket.emit('request-queue-update');
      }
    });
    
    socket.on('match-canceled', (data: any) => {
      console.log('Match canceled:', data);
      setMatchFound(false);
      setMatchedUser(null);
      setMatchId('');
      setMatchExpiry(0);
      setMatchAccepted(false);
      setWaitingForMatch(false);
      
      // Request updated queue data
      setLoadingQueue(true);
      socket.emit('request-queue-update');
    });
    
    // Match expired event
    socket.on('match-expired', (data: any) => {
      console.log('Match expired:', data);
      if (data.matchId === matchId) {
        setMatchFound(false);
        setMatchedUser(null);
        setMatchId('');
        setMatchExpiry(0);
        setMatchAccepted(false);
        setWaitingForMatch(false);
        
        // Request updated queue data
        setLoadingQueue(true);
        socket.emit('request-queue-update');
      }
    });
    
    // Session ready event - both users accepted
    socket.on('session-ready', (data: any) => {
      console.log('Session ready:', data);
      // Navigate to live session with session data
      router.push(`/live-session?roomId=${data.roomId}&peerId=${data.peer.id}&peerName=${data.peer.name}`);
    });
    
    // Return to queue event
    socket.on('return-to-queue', () => {
      console.log('Returning to queue');
      setMatchFound(false);
      setMatchedUser(null);
      setMatchId('');
      setMatchExpiry(0);
      setMatchAccepted(false);
      setWaitingForMatch(false);
      
      // Request updated queue data
      setLoadingQueue(true);
      socket.emit('request-queue-update');
    });
    
    // Direct call events (for calling users in queue)
    socket.on('direct-call', (data: any) => {
      console.log('Direct call received:', data);
      setMatchFound(true);
      setMatchedUser(data.caller);
      setMatchId(data.callId);
      setMatchExpiry(30);
      // Hide other queue users
      setQueueUsers([]);
    });
    
    socket.on('direct-call-response', (data: any) => {
      console.log('Direct call response:', data);
      if (data.accepted) {
        // Call accepted, wait for session-ready
        setWaitingForMatch(true);
      } else {
        // Call declined, return to queue
        setCallingUserId(null);
        setLoadingQueue(true);
        socket.emit('request-queue-update');
      }
    });
  };

  // Socket.io connection and event handlers
  useEffect(() => {
    if (inQueue) {
      if (!socketRef.current) {
        setConnecting(true);
        setLoadingQueue(true);
        
        // Determine socket URL based on environment
        let socketUrl;
        if (process.env.NODE_ENV === 'production') {
          // In production, use the environment variable or the current origin
          socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
        } else {
          // In development, always use localhost:3000
          socketUrl = 'http://localhost:3000';
        }
        console.log('Connecting to socket server:', socketUrl);
        
        // Connect to Socket.io server
        const socket = io(socketUrl, {
          auth: {
            userName: session?.user?.name || 'Anonymous',
            userId: session?.user?.id
          },
          transports: ['websocket', 'polling'],
          forceNew: true,
          reconnection: true,
          timeout: 20000
        });
        
        socket.on('connect', () => {
          console.log('Connected to socket server');
          setConnecting(false);
          setConnectionError('');
          
          // Set up event listeners
          setupSocketListeners(socket);
          
          // Join queue with user data
          const userData = {
            name: session?.user?.name || 'Anonymous User',
            id: session?.user?.id,
            interests: interests.concat(otherInterest ? [otherInterest] : []),
            skills: skills.concat(otherSkill ? [otherSkill] : []),
            profileImage: session?.user?.image || '/default-profile.png'
          };
          
          socket.emit('join-queue', userData);
        });
        
        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setConnecting(false);
          setConnectionError('Failed to connect to server. Please try again.');
          setInQueue(false);
          setLoadingQueue(false);
        });
        
        socketRef.current = socket;
      } else {
        // Already connected, just rejoin queue
        setLoadingQueue(true);
        
        // Reset event listeners
        setupSocketListeners(socketRef.current);
        
        // Join queue with user data
        const userData = {
          name: session?.user?.name || 'Anonymous User',
          id: session?.user?.id,
          interests: interests.concat(otherInterest ? [otherInterest] : []),
          skills: skills.concat(otherSkill ? [otherSkill] : []),
          profileImage: session?.user?.image || '/default-profile.png'
        };
        
        socketRef.current.emit('join-queue', userData);
      }
    }
  }, [inQueue, session]);

  // Request queue update when interest or skill changes
  useEffect(() => {
    if (inQueue && socketRef.current) {
      // If already in queue and we change our interests/skills, update our profile
      const userData = {
        name: session?.user?.name || 'Anonymous User',
        id: session?.user?.id,
        interests: interests.concat(otherInterest ? [otherInterest] : []),
        skills: skills.concat(otherSkill ? [otherSkill] : []),
        profileImage: session?.user?.image || '/default-profile.png'
      };
      
      setLoadingQueue(true);
      socketRef.current.emit('update-profile', userData);
      socketRef.current.emit('request-queue-update');
    }
  }, [interests, skills, otherInterest, otherSkill, session]);

  const handleSelectInterest = (skill: string) => {
    setInterests((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSelectSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleJoinQueue = () => {
    if ((interests.length === 0 && !otherInterest) || (skills.length === 0 && !otherSkill)) {
      alert('Please select at least one interest and one skill.');
      return;
    }

    setInQueue(true);
    setQueueTime(0);
    setLoadingQueue(true);
  };

  const handleLeaveQueue = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-queue');
    }
    
    setInQueue(false);
    setQueueTime(0);
    setQueueUsers([]);
    setMatchFound(false);
    setMatchedUser(null);
    setMatchId('');
    setMatchExpiry(0);
    setMatchAccepted(false);
    setWaitingForMatch(false);
    setCallingUserId(null);
    setLoadingQueue(false);
  };

  // Direct call to a specific user in queue
  const handleCallUser = (userId: string) => {
    if (socketRef.current) {
      setCallingUserId(userId);
      socketRef.current.emit('direct-call', { 
        targetId: userId,
        callerId: socketRef.current.id
      });
    }
  };

  // Respond to match
  const handleAcceptMatch = () => {
    if (socketRef.current && matchId) {
      socketRef.current.emit('match-response', {
        matchId: matchId,
        accepted: true
      });
      setMatchAccepted(true);
      setWaitingForMatch(true);
    }
  };

  const handleDeclineMatch = () => {
    if (socketRef.current && matchId) {
      socketRef.current.emit('match-response', {
        matchId: matchId,
        accepted: false
      });
      setMatchFound(false);
      setMatchedUser(null);
      setMatchId('');
      setMatchExpiry(0);
      
      // Request updated queue data
      setLoadingQueue(true);
      socketRef.current.emit('request-queue-update');
    }
  };

  // Clear all selections
  const handleClearSelections = () => {
    setInterests([]);
    setSkills([]);
    setOtherInterest('');
    setOtherSkill('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'loading' || loadingSkills) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full h-32 w-32 bg-white bg-opacity-20 mb-4"></div>
          <div className="h-8 w-48 bg-white bg-opacity-20 rounded mb-4"></div>
          <div className="h-4 w-64 bg-white bg-opacity-20 rounded"></div>
          <div className="mt-4 text-white font-bold">Loading skills and interests...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl w-full bg-white rounded-lg shadow-lg p-8"
      >
        {!inQueue ? (
          <>
            <motion.h1 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold text-black mb-6 font-poppins text-center"
            >
              Let's Find Your Learning Partner!
            </motion.h1>

            {/* Display current profile skills and interests */}
            <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-black">Your Current Profile</h2>
                <button
                  onClick={handleClearSelections}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  Clear All Selections
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-black mb-2 flex items-center">
                    <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Your Interests (What you want to learn)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {interests.length > 0 ? (
                      interests.map((interest, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">No interests set in your profile yet</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-black mb-2 flex items-center">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Your Skills (What you can teach)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.length > 0 ? (
                      skills.map((skill, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">No skills set in your profile yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* What are you interested in? */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-black mb-4">
                  What are you interested in learning?
                </h2>
                <select
                  value={selectedInterestCategory}
                  onChange={(e) => setSelectedInterestCategory(e.target.value)}
                  className="w-full px-4 py-2 mb-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-black"
                >
                  {Object.keys(categorizedSkills).map((category) => (
                    <option key={category} value={category} className="text-black">
                      {category}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  {categorizedSkills[selectedInterestCategory]?.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => handleSelectInterest(skill)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition ${
                        interests.includes(skill)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-black border-gray-200 hover:border-blue-500 hover:text-blue-500'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Other (Specify your interest)"
                    value={otherInterest}
                    onChange={(e) => setOtherInterest(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-blue-500 text-black"
                  />
                </div>
              </div>

              {/* What are your skills? */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-black mb-4">
                  What are your skills? (What can you teach?)
                </h2>
                <select
                  value={selectedSkillCategory}
                  onChange={(e) => setSelectedSkillCategory(e.target.value)}
                  className="w-full px-4 py-2 mb-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 text-black"
                >
                  {Object.keys(categorizedSkills).map((category) => (
                    <option key={category} value={category} className="text-black">
                      {category}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  {categorizedSkills[selectedSkillCategory]?.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => handleSelectSkill(skill)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition ${
                        skills.includes(skill)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-black border-gray-200 hover:border-green-500 hover:text-green-500'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Other (Specify your skill)"
                    value={otherSkill}
                    onChange={(e) => setOtherSkill(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-green-500 text-black"
                  />
                </div>
              </div>
            </div>

            {/* Join Queue Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center mt-6"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleJoinQueue}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-transparent hover:text-blue-600 transition duration-300"
              >
                Join Queue
              </motion.button>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-6"
            >
              <h1 className="text-3xl font-bold text-black mb-2 font-poppins">
                {connecting ? 'Connecting to Server...' : 
                 matchFound ? 'Match Found!' : 
                 waitingForMatch ? 'Waiting for Response...' :
                 callingUserId ? 'Calling User...' :
                 'Searching for Learning Partners'}
              </h1>
              
              {connectionError && (
                <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">
                  {connectionError}
                </div>
              )}
              
              {!matchFound && !waitingForMatch && !connectionError && !callingUserId && (
                <>
                  <div className="flex items-center justify-center mb-2">
                    <div className="h-16 w-16 relative">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                  <div className="bg-blue-100 text-blue-800 text-xl font-semibold py-2 px-6 rounded-lg inline-block">
                    Queue Time: {formatTime(queueTime)}
                  </div>
                </>
              )}
              
              {matchFound && !matchAccepted && (
                <div className="mb-2">
                  <div className="flex items-center justify-center mb-3">
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity 
                      }}
                      className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <p className="text-white text-5xl">✓</p>
                    </motion.div>
                  </div>
                  <p className="text-lg mb-1 text-black">
                    You have a match! Respond within <span className="font-bold text-red-500">{matchExpiry}</span> seconds.
                  </p>
                </div>
              )}
              
              {(waitingForMatch || callingUserId) && (
                <div className="mb-2">
                  <div className="flex items-center justify-center mb-3">
                    <motion.div 
                      animate={{ 
                        rotate: 360 
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear" 
                      }}
                      className="w-16 h-16"
                    >
                      <svg className="w-full h-full" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="#e0e0e0" strokeWidth="4" fill="none" />
                        <path 
                          d="M12 2a10 10 0 0 1 10 10" 
                          stroke="#3b82f6" 
                          strokeWidth="4" 
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    </motion.div>
                  </div>
                  <p className="text-lg mb-1 text-black">
                    {waitingForMatch ? 'Waiting for your match to respond...' : 'Calling user...'}
                  </p>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  onClick={handleLeaveQueue}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold border-2 border-red-500 hover:bg-transparent hover:text-red-500 transition duration-300"
                >
                  {matchFound ? 'Cancel Match' : callingUserId ? 'Cancel Call' : 'Leave Queue'}
                </button>
              </div>
            </motion.div>

            {/* Match info or queue users */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {matchFound && !matchAccepted ? (
                // Match found UI
                <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gray-300 rounded-full overflow-hidden mr-4">
                      <img 
                        src={matchedUser?.profileImage || '/default-profile.png'} 
                        alt={matchedUser?.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black">{matchedUser?.name}</h3>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-1 text-black">Interests:</h4>
                    <div className="flex flex-wrap gap-2">
                      {matchedUser?.interests?.map((interest, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-1 text-black">Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {matchedUser?.skills?.map((skill, idx) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleDeclineMatch}
                      className="flex-1 py-2 border-2 border-gray-300 bg-gray-200 text-black rounded-lg font-medium hover:bg-transparent hover:text-gray-700 transition duration-300"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={handleAcceptMatch}
                      className="flex-1 py-2 border-2 border-green-500 bg-green-500 text-white rounded-lg font-medium hover:bg-transparent hover:text-green-500 transition duration-300"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ) : !matchFound && !waitingForMatch && !callingUserId ? (
                // Queue users
                <>
                  <h2 className="text-2xl font-semibold text-black mb-4">
                    Other Users in Queue
                  </h2>
                  
                  {loadingQueue ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : queueUsers.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-black">No other users in queue at the moment.</p>
                      <p className="text-black text-sm mt-2">Wait for someone to join or check back later.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {queueUsers.map((user) => (
                        <motion.div 
                          key={user.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm"
                        >
                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 overflow-hidden">
                              <img 
                                src={user.profileImage || '/default-profile.png'} 
                                alt={user.name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <h3 className="text-lg font-semibold text-black">{user.name}</h3>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm font-medium text-black mb-1">Interested in learning:</p>
                            <div className="flex flex-wrap gap-2">
                              {user.interests?.map((interest, idx) => (
                                <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                                  {interest}
                                </span>
                              )) || <span className="text-xs text-black">No interests specified</span>}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm font-medium text-black mb-1">Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {user.skills?.map((skill, idx) => (
                                <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                                  {skill}
                                </span>
                              )) || <span className="text-xs text-black">No skills specified</span>}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleCallUser(user.id)}
                            className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium border-2 border-blue-500 hover:bg-transparent hover:text-blue-500 transition duration-300"
                          >
                            Call Now
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Waiting for match response or calling user
                <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                  <div className="text-center">
                    <img 
                      src={matchedUser?.profileImage || '/default-profile.png'} 
                      alt={matchedUser?.name || 'User'}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3 className="text-xl font-bold text-black mb-2">{matchedUser?.name || 'User'}</h3>
                    <p className="text-black mb-4">
                      {waitingForMatch ? `Waiting for ${matchedUser?.name || 'user'} to respond...` : 'Calling user...'}
                    </p>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <motion.div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        animate={{ width: ["0%", "100%"] }}
                        transition={{ duration: 30, ease: "linear" }}
                      ></motion.div>
                    </div>
                    
                    <p className="text-xs text-black">This may take a moment. You can cancel and return to the queue.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}