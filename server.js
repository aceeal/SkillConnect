// server.js
const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');
const next = require('next');
const mysql = require('mysql2/promise');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Define these OUTSIDE the connection handler
const activeQueues = {}; 
const userQueues = {}; 
const sessionMatches = {}; 
const activeSessions = {}; 
const sessionStats = {
  totalSessionsToday: 0,
  sessionsStarted: [],
  averageDuration: 0
};

// Track online users
const onlineUsers = {};

// Database connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '123456',
  database: process.env.MYSQL_DATABASE || 'skillconnect',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
};

// Create connection pool
let pool = null;

// Initialize pool
const getPool = async () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('Database pool created');
  }
  return pool;
};

// Execute database query
async function executeQuery(query, values = []) {
  try {
    const dbPool = await getPool();
    const [results] = await dbPool.execute(query, values);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Save session to database
async function saveSessionToDatabase(session) {
  try {
    // Log the session object for debugging
    console.log(`SAVING SESSION TO DATABASE:`, JSON.stringify({
      id: session.id,
      user1Id: session.user1Id,
      user2Id: session.user2Id,
      user1Name: session.user1Name,
      user2Name: session.user2Name,
      status: session.status,
      topic: session.topic
    }, null, 2));
    
    // ⚠️ CRITICAL: Ensure numeric user IDs, not socket IDs ⚠️
    // If IDs look like socket IDs, dump them for debugging
    if (session.user1Id && (
        session.user1Id.includes('.') || 
        session.user1Id.includes('-') || 
        session.user1Id.includes('_') ||
        session.user1Id.includes('/'))) {
      console.error('⚠️ USER1 ID LOOKS LIKE A SOCKET ID, NOT A DATABASE ID:', session.user1Id);
    }
    
    if (session.user2Id && (
        session.user2Id.includes('.') || 
        session.user2Id.includes('-') || 
        session.user2Id.includes('_') ||
        session.user2Id.includes('/'))) {
      console.error('⚠️ USER2 ID LOOKS LIKE A SOCKET ID, NOT A DATABASE ID:', session.user2Id);
    }
    
    // Ensure the user IDs are strings
    const user1Id = String(session.user1Id || '');
    const user2Id = String(session.user2Id || '');
    
    // Validate user IDs
    if (!user1Id || !user2Id) {
      console.error('Cannot save session - missing user IDs:', { user1Id, user2Id });
      return;
    }
    
    const query = `
      INSERT INTO live_sessions 
      (id, user1_id, user2_id, user1_name, user2_name, started_at, status, topic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      session.id,
      user1Id,
      user2Id,
      session.user1Name,
      session.user2Name,
      new Date(session.startedAt),
      session.status,
      session.topic || 'General Learning'
    ];
    
    const result = await executeQuery(query, values);
    console.log(`Session saved to database: ${session.id}, affected rows:`, result.affectedRows);
  } catch (error) {
    console.error('Error saving session to database:', error);
    console.error('Error details:', error.message);
    // Print full SQL error if available
    if (error.sqlMessage) {
      console.error('SQL error:', error.sqlMessage);
      console.error('SQL state:', error.sqlState);
    }
  }
}

// Update session in database
async function updateSessionInDatabase(sessionId, status) {
  try {
    const query = `
      UPDATE live_sessions 
      SET status = ?, 
          ended_at = CURRENT_TIMESTAMP,
          duration_minutes = TIMESTAMPDIFF(MINUTE, started_at, CURRENT_TIMESTAMP)
      WHERE id = ?
    `;
    
    await executeQuery(query, [status, sessionId]);
    console.log(`Session updated in database: ${sessionId}, status: ${status}`);
  } catch (error) {
    console.error('Error updating session in database:', error);
  }
}

// Helper function to update session statistics - define outside connection handler
function updateSessionStats(duration) {
  const totalSessions = sessionStats.totalSessionsToday;
  const currentAvg = sessionStats.averageDuration;
  
  sessionStats.averageDuration = ((currentAvg * (totalSessions - 1)) + duration) / totalSessions;
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  sessionStats.sessionsStarted = sessionStats.sessionsStarted.filter(date => date > oneDayAgo);
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  sessionStats.totalSessionsToday = sessionStats.sessionsStarted.filter(date => date > startOfToday).length;
}

// Helper to find common interest between users
function findCommonInterest(interests, skills) {
  console.log("Finding common interest between:", { interests, skills });
  if (!interests || !skills || !Array.isArray(interests) || !Array.isArray(skills)) {
    console.log("Invalid inputs for findCommonInterest, returning default");
    return "General Learning";
  }
  
  // Look for exact matches first
  for (const interest of interests) {
    if (skills.includes(interest)) {
      console.log(`Found matching interest/skill: ${interest}`);
      return interest;
    }
  }
  
  // Look for partial matches (case insensitive)
  for (const interest of interests) {
    for (const skill of skills) {
      if (interest.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(interest.toLowerCase())) {
        console.log(`Found partial match: ${interest} and ${skill}`);
        return interest;
      }
    }
  }
  
  // If no match found, use the first interest if available
  if (interests.length > 0) {
    console.log(`No match found, using first interest: ${interests[0]}`);
    return interests[0];
  }
  
  console.log("No interests available, returning default");
  return "General Learning";
}

// This new function gets the recipient's socket ID from user ID
function getRecipientSocketId(userId) {
  // If userId is already a socket ID (for backward compatibility), return it directly
  if (Object.values(onlineUsers).some(user => user.socketId === userId)) {
    return userId;
  }
  
  // Otherwise, look up the socket ID from the onlineUsers map
  return onlineUsers[userId]?.socketId;
}

app.prepare().then(() => {
  const server = express();
  // Use HTTP server instead of HTTPS
  const httpServer = http.createServer(server);
  
  // Create Socket.IO server with CORS enabled for both development and production
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [
            "https://skillconnect-production-84cc.up.railway.app", 
            "https://*.railway.app",
            // Allow your domain with and without www
            process.env.NEXTAUTH_URL
          ].filter(Boolean)
        : [
            "http://localhost:3000", 
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "*"
          ],
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true
    }
  });

  // Store active users by room
  const roomUsers = {};

  // Socket.IO connection handler
    // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Get user information from auth
    const userName = socket.handshake.auth.userName || 'Anonymous';
    const userId = socket.handshake.auth.userId || null;
    console.log(`User ${userName} (${socket.id}) connected with database ID: ${userId}`);
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.warn(`Warning: User ${userName} connected without a valid database ID`);
    }
    
    // Add user to online users map - use numerical database ID if available
    onlineUsers[userId] = {
      socketId: socket.id,
      userName: userName,
      status: 'online',
      dbId: userId // Store database ID explicitly
    };
    
    // Log to help with debugging
    console.log('Current online users:', Object.keys(onlineUsers).length);
    
    // Emit online status to all users
    io.emit('user_status_changed', {
      userId: userId,
      status: 'online'
    });
    
    // Handle authentication event
    socket.on('authenticate', (data) => {
      const authUserId = data.userId || userId;
      const authUserName = data.userName || userName;
      
      console.log(`User ${authUserName} (ID: ${authUserId}) authenticated with socket ${socket.id}`);
      
      // Update or add user to online users map
      onlineUsers[authUserId] = {
        socketId: socket.id,
        userName: authUserName,
        status: 'online',
        dbId: authUserId // Store database ID explicitly
      };
      
      // Log the updated user information
      console.log(`Updated user mapping: ${authUserId} -> ${socket.id}`);
    });
    
    // Helper to remove user from queue - define inside connection handler
    function removeFromQueue(userId) {
      const category = userQueues[userId];
      if (category && activeQueues[category]) {
        activeQueues[category] = activeQueues[category].filter(user => user.id !== userId);
        delete userQueues[userId];
        
        // Send personalized updates to each remaining user
        activeQueues[category].forEach(user => {
          io.to(user.id).emit('queue-status', {
            queueSize: activeQueues[category].length,
            otherUsers: activeQueues[category].filter(u => u.id !== user.id)
          });
        });
      }
    }
    
    // Helper to broadcast queue update to all users in a category
    function broadcastQueueUpdate(category) {
      if (activeQueues[category]) {
        activeQueues[category].forEach(user => {
          io.to(user.id).emit('queue-status', {
            position: activeQueues[category].findIndex(u => u.id === user.id) + 1,
            queueSize: activeQueues[category].length,
            estimatedWaitTime: activeQueues[category].length * 30,
            otherUsers: activeQueues[category].filter(u => u.id !== user.id)
          });
        });
      }
    }
    
    // Helper function to find a match - define inside connection handler
    function findMatch(userId, category) {
      if (!activeQueues[category] || activeQueues[category].length < 2) return;
      
      const currentUser = activeQueues[category].find(u => u.id === userId);
      if (!currentUser) return;
      
      console.log(`Finding match for ${currentUser.name} with interests: ${currentUser.interests} and skills: ${currentUser.skills}`);
      
      // Find potential matches based on skill/interest compatibility
      const potentialMatches = activeQueues[category]
        .filter(u => u.id !== userId)
        .map(user => {
          // Calculate compatibility score
          let compatibilityScore = 0;
          
          // Check if current user's interests match potential match's skills
          const interestMatches = currentUser.interests.filter(interest => 
            user.skills.some(skill => skill.toLowerCase() === interest.toLowerCase())
          );
          
          // Check if current user's skills match potential match's interests
          const skillMatches = currentUser.skills.filter(skill => 
            user.interests.some(interest => interest.toLowerCase() === skill.toLowerCase())
          );
          
          // Add scores for each match
          compatibilityScore += interestMatches.length * 10; // Higher weight for exact matches
          compatibilityScore += skillMatches.length * 10;
          
          // Add some weight for length of time in queue (fairness)
          const waitTime = (new Date() - new Date(user.joinedAt)) / 1000; // in seconds
          compatibilityScore += Math.min(waitTime / 10, 30); // max 30 points for waiting
          
          console.log(`Compatibility score with ${user.name}: ${compatibilityScore}`);
          console.log(`Interest matches: ${interestMatches.join(', ')}`);
          console.log(`Skill matches: ${skillMatches.join(', ')}`);
          
          return {
            user,
            score: compatibilityScore,
            hasExactMatch: interestMatches.length > 0 || skillMatches.length > 0
          };
        })
        .filter(match => match.hasExactMatch) // Only consider users with at least one exact match
        .sort((a, b) => b.score - a.score); // Sort by score (highest first)
      
      console.log(`Found ${potentialMatches.length} potential matches with exact skill/interest compatibility`);
      
      if (potentialMatches.length > 0) {
        // Take the highest scoring match
        const bestMatch = potentialMatches[0].user;
        
        // Create a match ID
        const matchId = `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Store the match
        sessionMatches[matchId] = {
          id: matchId,
          user1: currentUser,
          user2: bestMatch,
          user1Accepted: false,
          user2Accepted: false,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30000) // Expires in 30 seconds
        };
        
        // Notify both users about the match
        io.to(currentUser.id).emit('match-found', {
          matchId,
          peer: bestMatch,
          expiresIn: 30 // seconds
        });
        
        io.to(bestMatch.id).emit('match-found', {
          matchId,
          peer: currentUser,
          expiresIn: 30 // seconds
        });
        
        console.log(`Match found between ${currentUser.name} and ${bestMatch.name}`);
        
        // Set a timeout to clean up expired matches
        setTimeout(() => {
          if (sessionMatches[matchId]) {
            // Match expired without both accepting
            delete sessionMatches[matchId];
            
            // Notify users that the match expired
            io.to(currentUser.id).emit('match-expired', { matchId });
            io.to(bestMatch.id).emit('match-expired', { matchId });
            
            console.log(`Match ${matchId} expired and was cleaned up`);
          }
        }, 30000);
      }
    }
    
    // Handle joining a room
    socket.on('join-room', (roomId) => {
      console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);
      
      // Join the socket.io room
      socket.join(roomId);
      
      // Track users in room
      if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
      }
      roomUsers[roomId].push({ id: socket.id, userName });
      
      // Notify other users in the room
      socket.to(roomId).emit('user-connected', socket.id);
      
      // Log room status
      console.log(`Room ${roomId} has ${roomUsers[roomId].length} users`);
    });
  
    // Handle WebRTC signaling - using newOffer as in client code
    socket.on('newOffer', (data) => {
      console.log(`Offer received from ${userName} (${socket.id}) in room ${data.roomId}`);
      // Forward the offer to other clients in the room with sender info
      socket.to(data.roomId).emit('offer', {
        offer: data.offer,
        senderId: socket.id,
        userName: data.userName,
        userProfile: data.userProfile
      });
    });
  
    socket.on('answer', (data) => {
      console.log(`Answer received from ${userName} (${socket.id}) in room ${data.roomId}`);
      // Forward the answer to other clients in the room with sender info
      socket.to(data.roomId).emit('answer', {
        answer: data.answer,
        senderId: socket.id,
        userName: data.userName,
        userProfile: data.userProfile
      });
    });
  
    socket.on('ice-candidate', (data) => {
      console.log(`ICE candidate received from ${socket.id} in room ${data.roomId}`);
      // Forward the ICE candidate to other clients in the room
      socket.to(data.roomId).emit('ice-candidate', {
        candidate: data.candidate,
        senderId: socket.id
      });
    });
    
    // Enhanced Ice Candidate handling (direct peer-to-peer)
    socket.on('ice_candidate', async (data) => {
      const { candidate, targetId } = data;
      
      // Forward ICE candidate to peer
      io.to(targetId).emit('ice_candidate', { 
        candidate, 
        senderId: socket.id
      });
    });
    
    // Handle chat messages (room-based)
    socket.on('chat-message', (data) => {
      console.log(`Chat message from ${data.sender} in room ${data.roomId}: ${data.text}`);
      // Forward the message to other clients in the room
      socket.to(data.roomId).emit('chat-message', {
        text: data.text,
        sender: data.sender,
        timestamp: data.timestamp
      });
    });
    
    // Enhanced direct message handling (one-to-one)
    socket.on('send_message', async (data) => {
      const { receiverId, text } = data;
      const timestamp = new Date().toISOString();
      const senderId = userId;
      const messageId = Date.now().toString();
      
      console.log(`Direct message from ${userName} (ID: ${senderId}) to ${receiverId}: ${text}`);
      
      // Get the recipient's socket ID
      const recipientSocketId = getRecipientSocketId(receiverId);
      
      if (recipientSocketId) {
        console.log(`Found recipient socket ID: ${recipientSocketId}`);
        
        // Forward message to recipient
        io.to(recipientSocketId).emit('receive_message', {
          id: messageId,
          senderId,
          senderName: userName,
          receiverId,
          text,
          timestamp,
          read: false
        });
      } else {
        console.log(`Recipient ${receiverId} is not currently online`);
      }
      
      // Also send a confirmation to the sender
      socket.emit('message_sent', {
        id: messageId,
        receiverId,
        text,
        timestamp
      });
    });
    
    // Handle enhanced call management
    socket.on('start_call', async (data) => {
      const { calleeId, offer } = data;
      
      console.log(`Call initiated from ${userName} to ${calleeId}`);
      
      // Forward call request to callee
      io.to(calleeId).emit('incoming_call', {
        callerId: socket.id,
        callerName: userName,
        callerPicture: data.callerPicture || '/default-profile.png',
        offer
      });
    });
    
    socket.on('accept_call', async (data) => {
      const { callerId, answer } = data;
      
      console.log(`Call accepted by ${userName} from ${callerId}`);
      
      // Forward answer to caller
      io.to(callerId).emit('call_accepted', {
        answer,
        calleeId: socket.id,
        calleeName: userName
      });
      
      // Generate a unique room ID for the session
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create session object for direct calls - using database IDs
      const directCallSession = {
        id: roomId,
        user1Id: userId, // Use authenticated user ID, not socket ID
        user2Id: callerId,
        user1Name: userName,
        user2Name: onlineUsers[callerId]?.userName || 'User 1',
        startedAt: new Date(),
        status: 'ongoing',
        topic: 'Direct Call'
      };
      
      console.log(`Creating direct call session with user IDs: ${userId} and ${callerId}`);
      
      // Track session in memory
      activeSessions[roomId] = directCallSession;
      
      // Save session to database
      await saveSessionToDatabase(directCallSession);
    });
    
    socket.on('reject_call', async (data) => {
      const { callerId } = data;
      
      console.log(`Call rejected by ${userName} from ${callerId}`);
      
      // Notify caller
      io.to(callerId).emit('call_rejected', {
        calleeId: socket.id,
        calleeName: userName
      });
    });
    
    socket.on('end_call', async (data) => {
      const targetId = data.calleeId || data.callerId;
      
      console.log(`Call ended by ${userName} with ${targetId}`);
      
      if (targetId) {
        io.to(targetId).emit('call_ended', {
          userId: socket.id,
          userName
        });
      }
    });
    
    // Handle user joining queue
    socket.on('join-queue', (userData) => {
      console.log(`User ${userData.name} (${socket.id}) joined queue with interests:`, userData.interests);
      console.log(`User database ID from client: ${userData.id}`);
      
      // Validate database ID
      if (!userData.id || userData.id === 'undefined' || userData.id === 'null') {
        console.warn(`Warning: User ${userData.name} trying to join queue without valid database ID`);
      }
      
      // Store user data
      const category = 'general'; // Use a single category for everyone to make matching more likely
      if (!activeQueues[category]) {
        activeQueues[category] = [];
      }
      
      // Check if user is already in queue
      const existingUserIndex = activeQueues[category].findIndex(user => user.id === socket.id);
      if (existingUserIndex >= 0) {
        // Update existing user data
        activeQueues[category][existingUserIndex] = {
          ...activeQueues[category][existingUserIndex],
          interests: userData.interests || [],
          skills: userData.skills || [],
          dbId: userData.id // Save the actual database ID
        };
      } else {
        // Add user to queue with their matching data
        activeQueues[category].push({
          id: socket.id,  // Socket ID for socket communication
          dbId: userData.id, // Database ID for DB operations
          name: userData.name,
          interests: userData.interests || [],
          skills: userData.skills || [],
          profileImage: userData.profileImage || '/default-profile.png',
          joinedAt: new Date()
        });
      }
      
      // Track which queue this user is in for easy removal
      userQueues[socket.id] = category;
      
      // Send current queue state to the user who just joined
      socket.emit('queue-status', {
        position: activeQueues[category].findIndex(u => u.id === socket.id) + 1,
        queueSize: activeQueues[category].length,
        estimatedWaitTime: activeQueues[category].length * 30,
        otherUsers: activeQueues[category].filter(u => u.id !== socket.id)
      });
      
      // Send personalized updates to each other user in the queue
      activeQueues[category].forEach(user => {
        if (user.id !== socket.id) {
          io.to(user.id).emit('queue-status', {
            position: activeQueues[category].findIndex(u => u.id === user.id) + 1,
            queueSize: activeQueues[category].length,
            estimatedWaitTime: activeQueues[category].length * 30,
            otherUsers: activeQueues[category].filter(u => u.id !== user.id)
          });
        }
      });
      
      // Join the room for this category
      socket.join(category);
      
      // Try to find a match for this user
      findMatch(socket.id, category);
    });

    // Handle user leaving queue
    socket.on('leave-queue', () => {
      const category = userQueues[socket.id];
      if (category && activeQueues[category]) {
        // Remove user from queue
        activeQueues[category] = activeQueues[category].filter(user => user.id !== socket.id);
        delete userQueues[socket.id];
        console.log(`User ${socket.id} left queue in category ${category}`);
        
        // Send personalized updates to each remaining user
        activeQueues[category].forEach(user => {
          io.to(user.id).emit('queue-status', {
            position: activeQueues[category].findIndex(u => u.id === user.id) + 1,
            queueSize: activeQueues[category].length,
            estimatedWaitTime: activeQueues[category].length * 30,
            otherUsers: activeQueues[category].filter(u => u.id !== user.id)
          });
        });
      }
    });

    // Handle request for queue update
    socket.on('request-queue-update', () => {
      const category = userQueues[socket.id];
      if (category && activeQueues[category]) {
        socket.emit('queue-status', {
          position: activeQueues[category].findIndex(u => u.id === socket.id) + 1,
          queueSize: activeQueues[category].length,
          estimatedWaitTime: activeQueues[category].length * 30,
          otherUsers: activeQueues[category].filter(u => u.id !== socket.id)
        });
      }
    });

    // Handle user profile updates
    socket.on('update-profile', (userData) => {
      const category = userQueues[socket.id];
      if (category && activeQueues[category]) {
        // Find and update user data in queue
        const userIndex = activeQueues[category].findIndex(u => u.id === socket.id);
        if (userIndex !== -1) {
          // Update only interests and skills, preserve other data
          activeQueues[category][userIndex].interests = userData.interests || [];
          activeQueues[category][userIndex].skills = userData.skills || [];
          
          console.log(`Updated profile for ${userData.name} (${socket.id}) in category ${category}`);
          
          // Send personalized updates to each user
          broadcastQueueUpdate(category);
        }
      }
    });

    // Handle direct call between users
    socket.on('direct-call', (data) => {
      const { targetId, callerId } = data;
      console.log(`User ${socket.id} (${userName}) is calling user ${targetId}`);
      
      // Find caller info
      let callerInfo = null;
      
      // Check all category queues to find the caller
      Object.values(activeQueues).forEach(queue => {
        const caller = queue.find(u => u.id === socket.id);
        if (caller) {
          callerInfo = caller;
        }
      });
      
      if (!callerInfo) {
        // If caller isn't found in any queue, construct minimal info
        callerInfo = {
          id: socket.id,
          dbId: session?.user?.id, // Include database ID if available
          name: userName,
        };
      }
      
      // Find the target user info to get their database ID if available
      let targetInfo = null;
      Object.values(activeQueues).forEach(queue => {
        const target = queue.find(u => u.id === targetId);
        if (target) {
          targetInfo = target;
        }
      });
      
      if (!targetInfo) {
        targetInfo = {
          id: targetId,
          name: 'Remote User'
        };
      }
      
// This code should be added to your direct-call handler near line ~800
      // Generate a call ID
      const callId = `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Ensure we save database IDs, not socket IDs
      const callerDbId = callerInfo.dbId || userId;
      const targetDbId = targetInfo.dbId;
      
      console.log(`Direct call setup with database IDs: caller=${callerDbId}, target=${targetDbId}`);
      
      // Store a reference to this call
      sessionMatches[callId] = {
        id: callId,
        user1: {
          ...callerInfo,
          dbId: callerDbId
        },
        user2: {
          ...targetInfo,
          dbId: targetDbId
        },
        user1Accepted: true, // Caller has implicitly accepted
        user2Accepted: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30000) // Expires in 30 seconds
      };
      
      // Send the call to the target
      io.to(targetId).emit('direct-call', {
        callId,
        caller: callerInfo
      });
      
      // Set a timeout to handle expired calls
      setTimeout(() => {
        if (sessionMatches[callId] && !sessionMatches[callId].user2Accepted) {
          // Call expired or was declined
          io.to(socket.id).emit('direct-call-response', { 
            callId,
            accepted: false
          });
          delete sessionMatches[callId];
        }
      }, 30000);
    });

    // Handle match responses
    socket.on('match-response', async (data) => {
      const { matchId, accepted } = data;
      
      if (sessionMatches[matchId]) {
        const match = sessionMatches[matchId];
        
        if (accepted) {
          // Mark this user as accepted
          if (match.user1.id === socket.id) {
            match.user1Accepted = true;
          } else if (match.user2.id === socket.id) {
            match.user2Accepted = true;
          }
          
          // If both accepted, create a session
          if (match.user1Accepted && match.user2Accepted) {
            // Generate a room ID for the session
            const roomId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            // Notify both users to join the session
            io.to(match.user1.id).emit('session-ready', { 
              roomId, 
              peer: match.user2,
              matchId 
            });
            
            io.to(match.user2.id).emit('session-ready', { 
              roomId, 
              peer: match.user1,
              matchId 
            });
            
            // Remove users from queues
            removeFromQueue(match.user1.id);
            removeFromQueue(match.user2.id);
            
            // Create session object to track and save
            const newSession = {
              id: roomId,
              user1Id: match.user1.id,
              user1Name: match.user1.name,
              user2Id: match.user2.id,
              user2Name: match.user2.name,
              startedAt: new Date(),
              status: 'ongoing',
              topic: findCommonInterest(match.user1.interests, match.user2.skills) || 'General Learning'
            };
            
            // Track session for admin dashboard
            activeSessions[roomId] = newSession;
            
            // Save session to database
            await saveSessionToDatabase(newSession);
            
            // Update session statistics
            sessionStats.totalSessionsToday++;
            sessionStats.sessionsStarted.push(new Date());
            
            // Broadcast to admin dashboard about new session
            io.emit('admin-session-update', { activeSessions, sessionStats });
            
            console.log(`Session created in room ${roomId} between ${match.user1.name} and ${match.user2.name}`);
            
            // Clean up the match
            delete sessionMatches[matchId];
          }
        } else {
          // User declined, notify the other user
          const otherUserId = match.user1.id === socket.id ? match.user2.id : match.user1.id;
          io.to(otherUserId).emit('match-declined', { matchId });
          
          // Clean up the match
          delete sessionMatches[matchId];
          
          // Send updated queue status to both users
          const category = userQueues[socket.id] || 'general';
          
          // Make sure current user gets updated queue data
          socket.emit('queue-status', {
            position: activeQueues[category]?.findIndex(u => u.id === socket.id) + 1 || 0,
            queueSize: activeQueues[category]?.length || 0,
            estimatedWaitTime: (activeQueues[category]?.length || 0) * 30,
            otherUsers: activeQueues[category]?.filter(u => u.id !== socket.id) || []
          });
          
          // Also notify the other user
          if (userQueues[otherUserId]) {
            io.to(otherUserId).emit('return-to-queue');
            
            const otherCategory = userQueues[otherUserId];
            io.to(otherUserId).emit('queue-status', {
              position: activeQueues[otherCategory]?.findIndex(u => u.id === otherUserId) + 1 || 0,
              queueSize: activeQueues[otherCategory]?.length || 0,
              estimatedWaitTime: (activeQueues[otherCategory]?.length || 0) * 30,
              otherUsers: activeQueues[otherCategory]?.filter(u => u.id !== otherUserId) || []
            });
          }
        }
      }
    });
    
    // Add admin dashboard specific events
    socket.on('admin-get-sessions', () => {
      socket.emit('admin-session-data', { activeSessions, sessionStats });
    });
    
    socket.on('admin-terminate-session', async (data) => {
      const { sessionId } = data;
      if (activeSessions[sessionId]) {
        // Notify users that session is terminated
        io.to(activeSessions[sessionId].user1Id).emit('session-terminated', { reason: 'admin' });
        io.to(activeSessions[sessionId].user2Id).emit('session-terminated', { reason: 'admin' });
        
        // Update session status
        activeSessions[sessionId].status = 'terminated';
        activeSessions[sessionId].endedAt = new Date();
        
        // Update session in database
        await updateSessionInDatabase(sessionId, 'terminated');
        
        // Calculate session duration for stats
        const duration = (activeSessions[sessionId].endedAt - activeSessions[sessionId].startedAt) / 1000; // in seconds
        
        // Update session stats
        updateSessionStats(duration);
        
        // Notify admin dashboard
        io.emit('admin-session-update', { activeSessions, sessionStats });
        
        // Clean up session after some time
        setTimeout(() => {
          delete activeSessions[sessionId];
          io.emit('admin-session-update', { activeSessions, sessionStats });
        }, 60000); // Keep terminated session visible for 1 minute
      }
    });
    
    // Handle end_session event
    socket.on('end_session', async (data) => {
      const { roomId, status } = data;
      
      if (activeSessions[roomId]) {
        // Update session status in memory
        activeSessions[roomId].status = status || 'completed';
        activeSessions[roomId].endedAt = new Date();
        
        // Update session in database
        await updateSessionInDatabase(roomId, status || 'completed');
        
        console.log(`Session ${roomId} ended with status: ${status || 'completed'}`);
        
        // Send update to admin dashboard
        io.emit('admin-session-update', { activeSessions, sessionStats });
      }
    });
    
    // Handle user status updates
    socket.on('set_status', (data) => {
      const { status } = data; // status can be 'online', 'away', 'busy', 'offline'
      
      if (onlineUsers[userId]) {
        onlineUsers[userId].status = status;
        
        // Broadcast status change to all users
        io.emit('user_status_changed', {
          userId,
          status
        });
      }
    });

    // Handle user typing indicators
    socket.on('typing_start', (data) => {
      const { receiverId } = data;
      const recipientSocketId = getRecipientSocketId(receiverId);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing_indicator', {
          userId,
          userName,
          isTyping: true
        });
      }
    });
    
    socket.on('typing_stop', (data) => {
      const { receiverId } = data;
      const recipientSocketId = getRecipientSocketId(receiverId);
      
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing_indicator', {
          userId,
          userName,
          isTyping: false
        });
      }
    });

    // Add the new direct call handlers for dashboard calling feature
    socket.on('direct_call', async (data) => {
      const { callId, callerId, callerName, callerPicture, calleeId } = data;
      
      console.log(`Call initiated: ${callId} from ${callerId} to ${calleeId}`);
      
      // Get the recipient's socketId
      const recipientSocketId = onlineUsers[calleeId]?.socketId;
      
      if (!recipientSocketId) {
        // Recipient is not online, send call_declined event to caller
        socket.emit('call_declined', { 
          callId, 
          message: 'User is not available'
        });
        return;
      }
      
      // Send incoming call notification to recipient
      io.to(recipientSocketId).emit('incoming_call', {
        callId,
        callerId,
        callerName,
        callerPicture
      });
    });

    // Handle call acceptance - this is different from the existing accept_call event
    socket.on('accept_call', async (data) => {
      const { callId, callerId, calleeId, calleeName, calleePicture } = data;
      
      console.log(`Call accepted: ${callId}`);
      
      // Get caller's socket ID
      const callerSocketId = onlineUsers[callerId]?.socketId;
      
      if (!callerSocketId) {
        // Caller is no longer online
        socket.emit('call_declined', { 
          callId, 
          message: 'Caller is no longer available'
        });
        return;
      }
      
      // Send acceptance to caller
      io.to(callerSocketId).emit('call_accepted', {
        callId,
        calleeId,
        calleeName,
        calleePicture
      });
      
      // Generate a unique room ID for the session
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create session object for direct calls
      const directCallSession = {
        id: roomId,
        user1Id: callerId,
        user2Id: calleeId || socket.id,
        user1Name: onlineUsers[callerId]?.userName || 'User 1',
        user2Name: calleeName || userName,
        startedAt: new Date(),
        status: 'ongoing',
        topic: 'Direct Call'
      };
      
      // Track session in memory
      activeSessions[roomId] = directCallSession;
      
      // Save session to database
      await saveSessionToDatabase(directCallSession);
      
      // Notify admin dashboard
      io.emit('admin-session-update', { activeSessions, sessionStats });
      
      // Notify both users that session is ready
      // Send to caller
      io.to(callerSocketId).emit('session_ready', {
        roomId,
        peer: {
          id: calleeId || socket.id,
          name: calleeName || userName,
          picture: calleePicture || '/default-profile.png'
        }
      });
      
      // Send to callee
      socket.emit('session_ready', {
        roomId,
        peer: {
          id: callerId,
          name: onlineUsers[callerId]?.userName || 'User',
          picture: data.callerPicture || '/default-profile.png'
        }
      });
    });

    // Handle call decline
    socket.on('decline_call', (data) => {
      const { callId, callerId } = data;
      
      console.log(`Call declined: ${callId}`);
      
      // Get caller's socket ID
      const callerSocketId = onlineUsers[callerId]?.socketId;
      
      if (callerSocketId) {
        // Notify caller that call was declined
        io.to(callerSocketId).emit('call_declined', {
          callId,
          message: 'Call declined by recipient'
        });
      }
    });

    // Handle call cancellation
    socket.on('cancel_call', (data) => {
      const { callId, calleeId } = data;
      
      console.log(`Call cancelled: ${callId}`);
      
      // Get recipient's socket ID
      const recipientSocketId = onlineUsers[calleeId]?.socketId;
      
      if (recipientSocketId) {
        // Notify recipient that call was cancelled
        io.to(recipientSocketId).emit('call_declined', {
          callId,
          message: 'Call cancelled by caller'
        });
      }
    });

    // Handle disconnections
    socket.on('disconnect', async () => {
      console.log(`User ${userName} (${socket.id}) disconnected`);
      
      // Update user's online status
      if (onlineUsers[userId]) {
        delete onlineUsers[userId];
        
        // Notify all users about status change
        io.emit('user_status_changed', {
          userId,
          status: 'offline'
        });
      }
      
      // Find and clean up any other user ID that might be associated with this socket
      Object.keys(onlineUsers).forEach(uid => {
        if (onlineUsers[uid].socketId === socket.id) {
          delete onlineUsers[uid];
          
          // Notify about status change
          io.emit('user_status_changed', {
            userId: uid,
            status: 'offline'
          });
        }
      });
      
      // Clean up queue entries
      removeFromQueue(socket.id);
      
      // Check if user was in any active matches and notify peers
      Object.values(sessionMatches).forEach(match => {
        if (match.user1.id === socket.id || match.user2.id === socket.id) {
          const peerId = match.user1.id === socket.id ? match.user2.id : match.user1.id;
          io.to(peerId).emit('match-canceled', { matchId: match.id, reason: 'disconnect' });
          delete sessionMatches[match.id];
        }
      });
      
      // Check if user was in active session and notify peer + update admin dashboard
      Object.entries(activeSessions).forEach(async ([sessionId, session]) => {
        if (session.user1Id === socket.id || session.user2Id === socket.id) {
          const peerId = session.user1Id === socket.id ? session.user2Id : session.user1Id;
          io.to(peerId).emit('session-disconnected');
          
          // Update session status
          session.status = 'disconnected';
          session.endedAt = new Date();
          
          // Update session in database
          await updateSessionInDatabase(sessionId, 'disconnected');
          
          // Update admin dashboard
          io.emit('admin-session-update', { activeSessions, sessionStats });
        }
      });
      
      // Remove user from all rooms
      for (const roomId in roomUsers) {
        const index = roomUsers[roomId].findIndex(user => user.id === socket.id);
        if (index !== -1) {
          roomUsers[roomId].splice(index, 1);
          console.log(`Removed user from room ${roomId}. ${roomUsers[roomId].length} users remaining.`);
          
          // Notify others in this room
          socket.to(roomId).emit('user-disconnected', socket.id);
        }
      }
    });
  });

  // Next.js request handler
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start the server with Railway's PORT environment variable
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Production URL: ${process.env.NEXTAUTH_URL || 'Not set'}`);
  });
});