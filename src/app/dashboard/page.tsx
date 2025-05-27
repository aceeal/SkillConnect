// src/app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiVideo, FiMessageSquare, FiStar, FiUser, FiClock, FiFilter, FiBookOpen, FiTool, FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { getGlobalSocket } from '@/app/components/GlobalCallHandler';
import SessionBookingModal from '@/app/components/SessionBookingModal';

// Create a global function to open chat that pages can use
if (typeof window !== 'undefined' && !window.openChatWithUser) {
  window.openChatWithUser = (userId, userName, userImage) => {
    // Dispatch a custom event that the chat component can listen for
    const event = new CustomEvent('openChat', {
      detail: { 
        userId, 
        userName, 
        userImage 
      }
    });
    window.dispatchEvent(event);
    return true;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('online'); // Show online users by default
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState('');
  
  // Session booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedUserForBooking, setSelectedUserForBooking] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // You can make this adjustable if needed
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    sessionsToday: 0,
    hoursLearned: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Check if global socket is connected
  // Modified socket connection check for dashboard page
  useEffect(() => {
    const socket = getGlobalSocket();
    
    const checkSocketStatus = () => {
      if (socket) {
        setSocketConnected(socket.connected);
        
        if (!socket.connected) {
          setSocketError('Socket connection is disconnected. Some features may be unavailable.');
        } else {
          setSocketError('');
        }
      } else {
        // Give the connection a moment to establish before showing error
        setTimeout(() => {
          const socketCheck = getGlobalSocket();
          if (!socketCheck) {
            setSocketError('Communication server connection not available. Some features may be unavailable.');
          }
        }, 3000); // 3 second grace period
      }
    };
    
    // Initial check
    checkSocketStatus();
    
    // Set up event listeners if socket exists
    if (socket) {
      const handleConnect = () => {
        setSocketConnected(true);
        setSocketError('');
      };
      
      const handleDisconnect = () => {
        setSocketConnected(false);
        setSocketError('Connection to communication server lost. Some features may be unavailable.');
      };
      
      const handleError = (err) => {
        console.error('Socket error:', err);
        setSocketError('Connection error: Try refreshing the page.');
      };
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleError);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleError);
      };
    }
    
    // If no socket, set up an interval to check
    const interval = setInterval(checkSocketStatus, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Update last_login timestamp periodically
  useEffect(() => {
    if (!session?.user) return;

    // Update last_login when page loads
    updateLastLogin();

    // Then update every 5 minutes
    const interval = setInterval(updateLastLogin, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session]);

  // Load favorites from localStorage when component mounts
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  const updateLastLogin = async () => {
    try {
      await fetch('/api/update-last-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  // Fetch users when filter or search changes
  useEffect(() => {
    if (!session?.user) return;
    
    fetchUsers();
  }, [session, activeFilter, searchTerm]);

  // New function to fetch session stats and learning hours
  const fetchUserStats = async () => {
    try {
      setIsLoadingStats(true);
      
      // Fetch sessions this week
      const sessionsResponse = await fetch('/api/stats/sessions');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.success) {
          setStats(prev => ({
            ...prev,
            sessionsToday: sessionsData.sessionsThisWeek
          }));
          console.log('Sessions this week:', sessionsData.sessionsThisWeek);
        }
      } else {
        console.error('Failed to fetch sessions stats:', await sessionsResponse.text());
      }
      
      // Fetch learning hours
      const hoursResponse = await fetch('/api/stats/learning-hours');
      if (hoursResponse.ok) {
        const hoursData = await hoursResponse.json();
        if (hoursData.success) {
          setStats(prev => ({
            ...prev,
            hoursLearned: hoursData.learningHours
          }));
          console.log('Learning hours:', hoursData.learningHours);
        }
      } else {
        console.error('Failed to fetch learning hours:', await hoursResponse.text());
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Call fetchUserStats when component mounts
  useEffect(() => {
    if (!session?.user) return;
    
    fetchUserStats();
    // We can set a refresh interval for stats if needed
    // const statsInterval = setInterval(fetchUserStats, 5 * 60 * 1000); // Refresh every 5 minutes
    
    // return () => clearInterval(statsInterval);
  }, [session]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('filter', activeFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      
      // Sort users with favorites at the top
      const sortedUsers = sortUsersWithFavoritesOnTop(data.users || []);
      setFilteredUsers(sortedUsers);
      
      // Update user stats - FIXED: using onlineStatus instead of status
      setStats(prev => ({
        ...prev,
        totalUsers: data.users.length,
        onlineUsers: data.users.filter(user => user.onlineStatus === 'online').length,
      }));
      
      // Reset to first page when users change
      setCurrentPage(1);
      
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort users with favorites at the top
  const sortUsersWithFavoritesOnTop = (userList) => {
    return [...userList].sort((a, b) => {
      // First check if user is a favorite
      const aIsFavorite = favorites.includes(a.id);
      const bIsFavorite = favorites.includes(b.id);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // If both have the same favorite status, then sort by online status
      // FIXED: using onlineStatus instead of status
      if (a.onlineStatus === 'online' && b.onlineStatus !== 'online') return -1;
      if (a.onlineStatus !== 'online' && b.onlineStatus === 'online') return 1;
      
      // If still tied, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  };

  // Filter users based on active filter and favorites
  useEffect(() => {
    let filtered = [...users];
    
    // Apply filter - FIXED: using onlineStatus instead of status
    if (activeFilter === 'online') {
      filtered = filtered.filter(user => user.onlineStatus === 'online');
    } else if (activeFilter === 'offline') {
      filtered = filtered.filter(user => user.onlineStatus !== 'online');
    } else if (activeFilter === 'favorites') {
      filtered = filtered.filter(user => favorites.includes(user.id));
    }
    
    // Apply search term if present
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        (user.skills && user.skills.some(skill => skill.toLowerCase().includes(searchLower))) ||
        (user.interests && user.interests.some(interest => interest.toLowerCase().includes(searchLower)))
      );
    }
    
    // Sort with favorites on top if not in favorites filter
    if (activeFilter !== 'favorites') {
      filtered = sortUsersWithFavoritesOnTop(filtered);
    }
    
    setFilteredUsers(filtered);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [users, activeFilter, favorites, searchTerm]);

  // Pagination logic
  const getPaginatedUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredUsers.length / usersPerPage);
  };

  const handlePrevePage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, getTotalPages()));
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Handle starting a call - this uses the exposed window.initiateCall function from CallModals
  // Improved handleStartCall function for dashboard page
  const handleStartCall = (userId, userName, userImage) => {
    console.log('=== DASHBOARD CALL DEBUG ===');
    console.log('Attempting to call:', userId, userName);
    
    // Check socket first
    const socket = getGlobalSocket();
    console.log('Socket exists:', !!socket);
    console.log('Socket connected:', socket?.connected);
    
    if (!socket || !socket.connected) {
      alert('Unable to make calls - not connected to server. Please refresh the page.');
      return;
    }
    
    // Check if global function exists
    console.log('Window initiateCall exists:', !!window.initiateCall);
    console.log('Window initiateCallReady:', window.initiateCallReady);
    
    // Simple retry mechanism
    const attemptCall = (attempt = 1) => {
      if (window.initiateCall && window.initiateCallReady) {
        console.log(`Attempt ${attempt}: Calling window.initiateCall`);
        try {
          const success = window.initiateCall(userId.toString(), userName, userImage);
          console.log('Call result:', success);
          if (!success) {
            alert('Failed to start call. User might be offline or busy.');
          }
        } catch (error) {
          console.error('Error calling initiateCall:', error);
          alert('Error starting call: ' + error.message);
        }
      } else if (attempt <= 3) {
        console.log(`Attempt ${attempt}: Function not ready, retrying in 500ms...`);
        setTimeout(() => attemptCall(attempt + 1), 500);
      } else {
        console.error('Call function not available after 3 attempts');
        alert('Call system not ready. Please try again in a moment.');
      }
    };
    
    attemptCall();
  };

  // Handle session booking
  const handleBookSession = (user) => {
    setSelectedUserForBooking({
      id: user.id,
      name: user.name,
      profilePicture: user.profilePicture || '/default-profile.png'
    });
    setIsBookingModalOpen(true);
  };

  // Enhanced handle send message function that opens the chat with the user
  const handleSendMessage = (userId) => {
    // Find the user data we need
    const user = users.find(user => user.id === userId);
    
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return;
    }
    
    // Use the global function if available
    if (typeof window !== 'undefined') {
      if (window.openChatWithUser) {
        window.openChatWithUser(
          String(userId), 
          user.name, 
          user.profilePicture || '/default-profile.png'
        );
      } else {
        // Fallback: Store the user in localStorage and dispatch event
        localStorage.setItem('pendingChatUser', JSON.stringify({
          id: String(userId),
          name: user.name,
          profilePicture: user.profilePicture || '/default-profile.png',
          status: user.onlineStatus === 'online' ? 'online' : 'offline' // FIXED: using onlineStatus
        }));
        
        // Dispatch a custom event that the chat component can listen for
        const event = new CustomEvent('openChat', { 
          detail: { 
            userId: String(userId), 
            userName: user.name, 
            userImage: user.profilePicture || '/default-profile.png' 
          } 
        });
        window.dispatchEvent(event);
        
        console.log(`Messaging user ${userId} (${user.name})`);
      }
    }
  };

  const handleAddFavorite = (userId) => {
    const newFavorites = favorites.includes(userId)
      ? favorites.filter(id => id !== userId)
      : [...favorites, userId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const navigateToProfile = (userId) => {
    router.push(`/user/${userId}`);
  };

  // Format the hours learned value to show with one decimal place
  const formatHoursLearned = (hours) => {
    return typeof hours === 'number' ? hours.toFixed(1) : '0.0';
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-xl p-8 transition-all duration-300 hover:shadow-2xl">
        {/* Socket Connection Error */}
        {socketError && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {socketError}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, skills or interests..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${activeFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('favorites')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${activeFilter === 'favorites' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => setActiveFilter('online')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${activeFilter === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Online
                </button>
                <button
                  onClick={() => setActiveFilter('offline')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${activeFilter === 'offline' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Offline
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FiUser className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Connections</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FiVideo className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sessions This Week</dt>
                    <dd className="flex items-baseline">
                      {isLoadingStats ? (
                        <div className="text-2xl font-semibold text-gray-400">-</div>
                      ) : (
                        <div className="text-2xl font-semibold text-gray-900">{stats.sessionsToday}</div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <FiClock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Hours Learned</dt>
                    <dd className="flex items-baseline">
                      {isLoadingStats ? (
                        <div className="text-2xl font-semibold text-gray-400">-</div>
                      ) : (
                        <div className="text-2xl font-semibold text-gray-900">{formatHoursLearned(stats.hoursLearned)}</div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <FiStar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Favorite Users</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{favorites.length}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Grid */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Available Connections
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Find peers to connect with based on your skills and interests
            </p>
            <div className="mt-3 flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                <span className="text-gray-600">Can Teach</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-1"></span>
                <span className="text-gray-600">Wants to Learn</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
                <span className="text-gray-600">Favorite</span>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <FiFilter className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {getPaginatedUsers().map((user, index) => {
                  const isFavorite = favorites.includes(user.id);
                  return (
                  <li key={`${user.id}-${index}`} className={`hover:bg-gray-50 transition-colors duration-150 ${isFavorite ? 'bg-yellow-50' : ''}`}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center cursor-pointer p-2 rounded-md" 
                          onClick={() => navigateToProfile(user.id)}
                        >
                          <div className="relative">
                            <img 
                              src={user.profilePicture} 
                              alt={`${user.name}'s avatar`} 
                              className={`h-12 w-12 rounded-full object-cover border-2 ${isFavorite ? 'border-yellow-400' : 'border-gray-200'}`}
                              onError={(e) => {
                                e.currentTarget.src = '/default-profile.png';
                              }}
                            />
                            {/* FIXED: using onlineStatus instead of status */}
                            <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${
                              user.onlineStatus === 'online' ? 'bg-green-400' : 'bg-gray-300'
                            }`}></span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
                              {isFavorite && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <FiStar className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
                                  Favorite
                                </span>
                              )}
                              {/* FIXED: using onlineStatus instead of status */}
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.onlineStatus === 'online' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.onlineStatus}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Last active: {formatTimeAgo(user.lastActive)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStartCall(user.id, user.name, user.profilePicture)}
                            className={`inline-flex items-center p-2 border shadow-sm text-sm leading-4 font-medium rounded-md ${
                              user.onlineStatus === 'online' // FIXED: using onlineStatus instead of status
                                ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100' 
                                : 'border-gray-300 text-gray-400 cursor-not-allowed'
                            }`}
                            title="Start video call"
                            disabled={user.onlineStatus !== 'online'} // FIXED: using onlineStatus instead of status
                          >
                            <FiVideo className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleBookSession(user)}
                            className="inline-flex items-center p-2 border border-purple-300 shadow-sm text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100"
                            title="Book a session"
                          >
                            <FiCalendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSendMessage(user.id)}
                            className="inline-flex items-center p-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                            title="Send message"
                          >
                            <FiMessageSquare className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering profile navigation
                              handleAddFavorite(user.id);
                            }}
                            className={`inline-flex items-center p-2 border shadow-sm text-sm leading-4 font-medium rounded-md ${
                              isFavorite 
                                ? 'border-yellow-400 bg-yellow-100 text-yellow-700' 
                                : 'border-gray-300 bg-white text-gray-600 hover:bg-yellow-50'
                            }`}
                            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <FiStar className={`h-4 w-4 ${isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Skills Section - What they can teach */}
                        <div className="flex flex-col">
                          <div className="flex items-center mb-1">
                            <FiTool className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-xs font-medium text-gray-700">Can Teach:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {user.skills && user.skills.length > 0 ? (
                              user.skills.map((skill, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500 italic">No skills listed</span>
                            )}
                          </div>
                        </div>

                        {/* Interests Section - What they want to learn */}
                        <div className="flex flex-col">
                          <div className="flex items-center mb-1">
                            <FiBookOpen className="h-4 w-4 text-purple-600 mr-1" />
                            <span className="text-xs font-medium text-gray-700">Wants to Learn:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {user.interests && user.interests.length > 0 ? (
                              user.interests.map((interest, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                  {interest}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500 italic">No interests listed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )})}
              </ul>
              
              {/* Pagination Controls */}
              {getTotalPages() > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Showing {Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length)} to{' '}
                      {Math.min(currentPage * usersPerPage, filteredUsers.length)} of{' '}
                      {filteredUsers.length} results
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handlePrevePage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FiChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                      const startPage = Math.max(1, currentPage - 2);
                      const pageNumber = startPage + i;
                      
                      if (pageNumber > getTotalPages()) return null;
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageClick(pageNumber)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === getTotalPages()}
                      className={`p-2 rounded-md text-sm font-medium ${
                        currentPage === getTotalPages()
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Session Booking Modal */}
      <SessionBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedUserForBooking(null);
        }}
        targetUser={selectedUserForBooking || { id: 0, name: '', profilePicture: '' }}
      />
      
      {/* Script to initialize the global chat opener */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Monitor for custom chat events
          window.addEventListener('load', function() {
            // Check for pending chat user from localStorage on page load
            const pendingChatUser = localStorage.getItem('pendingChatUser');
            if (pendingChatUser) {
              try {
                const userData = JSON.parse(pendingChatUser);
                // Remove the item to avoid reopening on refresh
                localStorage.removeItem('pendingChatUser');
                
                // Dispatch event to open chat with this user
                const event = new CustomEvent('openChat', { 
                  detail: { 
                    userId: userData.id, 
                    userName: userData.name, 
                    userImage: userData.profilePicture 
                  } 
                });
                window.dispatchEvent(event);
              } catch (error) {
                console.error('Error parsing pending chat user:', error);
              }
            }
          });
        `
      }} />
    </div>
  );
}