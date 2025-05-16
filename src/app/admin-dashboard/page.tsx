// src/app/admin-dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { 
  FiUsers, 
  FiActivity, 
  FiMessageSquare, 
  FiAlertTriangle, 
  FiBarChart2, 
  FiSearch,
  FiRefreshCw,
  FiUserX,
  FiUserCheck,
  FiEye,
  FiX,
  FiVideo,
  FiFlag,
  FiDownload,
  FiClock
} from 'react-icons/fi';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    activeSessions: 0,
    pendingReports: 0,
    totalSessionsToday: 0,
    sessionsThisWeek: 0,
    totalLearningHours: 0
  });
  
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/dashboard');
      } else {
        fetchData();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchReports(),
        fetchLiveSessions(),
        fetchFeedback(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?filter=all');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      const formattedUsers = data.users?.map(user => ({
        id: user.id.toString(),
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        profilePicture: user.profilePicture || null,
        role: user.role || 'user',
        status: user.status || 'active',
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastActive || new Date().toISOString(),
        skills: user.skills || [],
        interests: user.interests || []
      })) || [];
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
      
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: formattedUsers.length
      }));
      
    } catch (error) {
      console.error('Error fetching users:', error);
      const mockUsers = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          profilePicture: null,
          role: 'user',
          status: 'active',
          createdAt: '2023-10-15T10:30:00Z',
          lastLogin: '2023-11-02T14:22:00Z',
          skills: ['JavaScript & Web Development', 'React', 'Node.js'],
          interests: ['Python Programming', 'Data Science & Analytics']
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          profilePicture: null,
          role: 'user',
          status: 'active',
          createdAt: '2023-09-20T08:15:00Z',
          lastLogin: '2023-11-01T09:45:00Z',
          skills: ['Mathematics (Algebra, Calculus, Trigonometry)', 'Physics Fundamentals'],
          interests: ['Chemistry Basics', 'Biology & Life Sciences']
        }
      ];
      
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: mockUsers.length
      }));
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports?status=all');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      setReports(data.reports || []);
      
      const pendingCount = (data.reports || []).filter(report => report.status === 'pending').length;
      setStats(prevStats => ({
        ...prevStats,
        pendingReports: pendingCount
      }));
    } catch (error) {
      console.error('Error fetching reports:', error);
      const mockReports = [
        {
          id: '1',
          reportedUserId: '3',
          reportedUserName: 'Mike Johnson',
          reportedByUserId: '2',
          reportedByUserName: 'Jane Smith',
          reason: 'Inappropriate behavior during live session',
          details: 'User was using offensive language and being disrespectful',
          status: 'pending',
          createdAt: '2023-10-28T14:20:00Z'
        }
      ];
      
      setReports(mockReports);
      setStats(prevStats => ({
        ...prevStats,
        pendingReports: mockReports.filter(report => report.status === 'pending').length
      }));
    }
  };

  const fetchLiveSessions = async () => {
    try {
      const response = await fetch('/api/admin/sessions?status=active');
      if (!response.ok) {
        throw new Error('Failed to fetch live sessions');
      }
      
      const data = await response.json();
      setLiveSessions(data.sessions || []);
      
      setStats(prevStats => ({
        ...prevStats,
        activeSessions: (data.sessions || []).length
      }));
    } catch (error) {
      console.error('Error fetching live sessions:', error);
      const mockLiveSessions = [];
      
      setLiveSessions(mockLiveSessions);
      setStats(prevStats => ({
        ...prevStats,
        activeSessions: mockLiveSessions.length
      }));
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/contact');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      
      const data = await response.json();
      
      const formattedFeedback = data.submissions?.map(submission => ({
        id: submission.id.toString(),
        userId: submission.user_id?.toString() || 'guest',
        userName: submission.name || 'Anonymous',
        message: submission.message,
        createdAt: submission.created_at || new Date().toISOString()
      })) || [];
      
      setFeedback(formattedFeedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      const mockFeedback = [
        {
          id: '1',
          userId: '1',
          userName: 'John Doe',
          message: 'The platform is incredibly easy to use. I found a great tutor for calculus!',
          createdAt: '2023-10-29T15:45:00Z'
        }
      ];
      
      setFeedback(mockFeedback);
    }
  };

  const fetchStats = async () => {
    try {
      const [sessionsResponse] = await Promise.all([
        fetch('/api/admin/sessions/stats').catch(() => ({ ok: false }))
      ]);
      
      let sessionsData = {};
      if (sessionsResponse.ok) {
        const data = await sessionsResponse.json();
        if (data.success) {
          sessionsData = data;
        }
      }
      
      const newUsersToday = users.filter(user => {
        const createdDate = new Date(user.createdAt);
        const today = new Date();
        return createdDate.getDate() === today.getDate() &&
               createdDate.getMonth() === today.getMonth() &&
               createdDate.getFullYear() === today.getFullYear();
      }).length;
      
      setStats(prevStats => ({
        ...prevStats,
        newUsersToday,
        activeSessions: sessionsData.activeSessions || 0,
        totalSessionsToday: sessionsData.sessionsToday || 0,
        sessionsThisWeek: sessionsData.sessionsThisWeek || 0,
        totalLearningHours: sessionsData.totalLearningHours || 0
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      setStats(prevStats => ({
        ...prevStats,
        newUsersToday: users.filter(user => {
          const createdDate = new Date(user.createdAt);
          const today = new Date();
          return createdDate.getDate() === today.getDate() &&
                createdDate.getMonth() === today.getMonth() &&
                createdDate.getFullYear() === today.getFullYear();
        }).length,
        totalSessionsToday: 0,
        totalLearningHours: 0.0
      }));
    }
  };

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.firstName.toLowerCase().includes(term.toLowerCase()) || 
      user.lastName.toLowerCase().includes(term.toLowerCase()) || 
      user.email.toLowerCase().includes(term.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active';
      
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      setFilteredUsers(filteredUsers.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: currentStatus === 'active' ? 'banned' : 'active' } : user
      ));
      
      setFilteredUsers(filteredUsers.map(user => 
        user.id === userId ? { ...user, status: currentStatus === 'active' ? 'banned' : 'active' } : user
      ));
    }
  };

  const handleExportUserData = () => {
    try {
      const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login'];
      const csvContent = [
        headers.join(','),
        ...users.map(user => [
          user.id,
          `"${user.firstName}"`,
          `"${user.lastName}"`,
          user.email,
          user.role,
          user.status,
          new Date(user.createdAt).toLocaleString(),
          new Date(user.lastLogin).toLocaleString()
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `skillconnect_users_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Exporting user data...');
    } catch (error) {
      console.error('Error exporting user data:', error);
      alert('Failed to export user data. Please try again.');
    }
  };

  const handleTerminateSession = async (sessionId) => {
    if (confirm('Are you sure you want to terminate this session?')) {
      try {
        const response = await fetch(`/api/admin/sessions/${sessionId}/terminate`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Failed to terminate session');
        }
        
        setLiveSessions(liveSessions.filter(session => session.id !== sessionId));
        
      } catch (error) {
        console.error('Error terminating session:', error);
        alert('Failed to terminate session. Please try again.');
        
        setLiveSessions(liveSessions.filter(session => session.id !== sessionId));
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const calculateDuration = (startTimeString) => {
    try {
      const startTime = new Date(startTimeString);
      const now = new Date();
      const diffMs = now - startTime;
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } catch (error) {
      return '00:00:00';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
        style={{
          background: 'linear-gradient(135deg, #4299e1 0%, #38b2ac 100%)',
        }}>
        <div className="flex flex-col items-center bg-white bg-opacity-20 rounded-xl p-10 backdrop-blur-sm shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          <p className="mt-4 text-white font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #4299e1 0%, #38b2ac 100%)',
        minHeight: '100vh',
      }}
    >
      <div className="container mx-auto p-4">
        <div className="flex flex-row gap-4">
          {/* Left column - Sidebar */}
          <div className="w-80">
            {/* Admin Panel */}
            <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Admin Panel</h2>
              </div>
              <nav className="p-0">
                <ul>
                  <li>
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium border-l-4 ${
                        activeTab === 'overview'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiBarChart2 className="mr-3 h-5 w-5" />
                      Dashboard Overview
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('users')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium border-l-4 ${
                        activeTab === 'users'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiUsers className="mr-3 h-5 w-5" />
                      User Management
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium border-l-4 ${
                        activeTab === 'reports'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiFlag className="mr-3 h-5 w-5" />
                      Reports
                      {reports.filter(report => report.status === 'pending').length > 0 && (
                        <span className="ml-auto bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                          {reports.filter(report => report.status === 'pending').length}
                        </span>
                      )}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('sessions')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium border-l-4 ${
                        activeTab === 'sessions'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiVideo className="mr-3 h-5 w-5" />
                      Live Sessions
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('feedback')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium border-l-4 ${
                        activeTab === 'feedback'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiMessageSquare className="mr-3 h-5 w-5" />
                      Feedback
                    </button>
                  </li>
                </ul>
              </nav>

              <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiActivity className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-900">System Status</p>
                      <p className="text-xs text-gray-500">All systems operational</p>
                    </div>
                  </div>
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-800">Quick Stats</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center">
                  <div className="flex items-center w-3/5">
                    <FiUsers className="h-5 w-5 text-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Total Users</span>
                  </div>
                  <div className="w-2/5 text-right">
                    <span className="text-sm font-semibold text-blue-500">{stats.totalUsers}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center w-3/5">
                    <FiVideo className="h-5 w-5 text-green-500" />
                    <span className="ml-2 text-sm text-gray-700">Active Sessions</span>
                  </div>
                  <div className="w-2/5 text-right">
                    <span className="text-sm font-semibold text-green-500">{stats.activeSessions}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center w-3/5">
                    <FiClock className="h-5 w-5 text-purple-500" />
                    <span className="ml-2 text-sm text-gray-700">Learning Hours</span>
                  </div>
                  <div className="w-2/5 text-right">
                    <span className="text-sm font-semibold text-purple-500">{stats.totalLearningHours.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center w-3/5">
                    <FiAlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="ml-2 text-sm text-gray-700">Pending Reports</span>
                  </div>
                  <div className="w-2/5 text-right">
                    <span className="text-sm font-semibold text-yellow-500">{stats.pendingReports}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Main content */}
          <div className="flex-1">
            {/* Dashboard Overview */}
            {activeTab === 'overview' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Dashboard Overview</h2>
                  <p className="text-gray-600 mb-6">Welcome to the SkillConnect Admin Dashboard. Here's an overview of the platform's current status.</p>
                  
                  {/* Stat cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-3 rounded-md bg-blue-500 text-white">
                          <FiUsers className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-500">Total Users</div>
                          <div className="text-3xl font-bold text-blue-500">{stats.totalUsers}</div>
                          <div className="text-xs text-green-600">+{stats.newUsersToday} today</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-3 rounded-md bg-green-500 text-white">
                          <FiVideo className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-500">Active Sessions</div>
                          <div className="text-3xl font-bold text-green-500">{stats.activeSessions}</div>
                          <div className="text-xs text-blue-600">{stats.sessionsThisWeek} this week</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-3 rounded-md bg-purple-500 text-white">
                          <FiClock className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-500">Total Learning Hours</div>
                          <div className="text-3xl font-bold text-purple-500">{stats.totalLearningHours.toFixed(1)}</div>
                          <div className="text-xs text-purple-600">All users combined</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="p-3 rounded-md bg-yellow-500 text-white">
                          <FiFlag className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-500">Pending Reports</div>
                          <div className="text-3xl font-bold text-yellow-500">{stats.pendingReports}</div>
                          <div className="text-xs text-red-600">Requires attention</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick actions */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <button 
                        onClick={() => setActiveTab('users')}
                        className="flex flex-col items-center text-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FiUsers className="h-6 w-6 text-blue-500 mb-2" />
                        <span className="text-sm text-gray-700">Manage Users</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('reports')}
                        className="flex flex-col items-center text-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FiFlag className="h-6 w-6 text-orange-500 mb-2" />
                        <span className="text-sm text-gray-700">Review Reports</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('sessions')}
                        className="flex flex-col items-center text-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FiVideo className="h-6 w-6 text-green-500 mb-2" />
                        <span className="text-sm text-gray-700">View Sessions</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('feedback')}
                        className="flex flex-col items-center text-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FiMessageSquare className="h-6 w-6 text-purple-500 mb-2" />
                        <span className="text-sm text-gray-700">View Feedback</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Recent activity */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
                    <button 
                      onClick={fetchData}
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      <FiRefreshCw className="mr-1 h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* New user registration */}
                    {users.length > 0 && (
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FiUserCheck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">New user registered:</span> {users[0].firstName} {users[0].lastName}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(users[0].createdAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* New report */}
                    {reports.filter(r => r.status === 'pending').length > 0 && (
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <FiFlag className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">New report submitted</span> by {reports.find(r => r.status === 'pending')?.reportedByUserName || 'a user'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(reports.find(r => r.status === 'pending')?.createdAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Active session */}
                    {liveSessions.length > 0 && (
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <FiVideo className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">Session in progress</span> between {liveSessions[0].user1Name} and {liveSessions[0].user2Name}
                          </p>
                          <p className="text-xs text-gray-500">Started {formatDate(liveSessions[0].startedAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* New feedback */}
                    {feedback.length > 0 && (
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <FiMessageSquare className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">New feedback received</span> from {feedback[0].userName}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(feedback[0].createdAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* User banned */}
                    {users.filter(u => u.status === 'banned').length > 0 && (
                      <div className="flex items-start">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <FiUserX className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">User banned:</span> {users.find(u => u.status === 'banned')?.firstName} {users.find(u => u.status === 'banned')?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">Last login: {formatDate(users.find(u => u.status === 'banned')?.lastLogin)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* User Management */}
            {activeTab === 'users' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">User Management</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleExportUserData}
                        className="flex items-center px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-700 hover:bg-gray-200"
                      >
                        <FiDownload className="h-4 w-4 mr-1" />
                        Export
                      </button>
                      <button 
                        onClick={fetchUsers}
                        className="flex items-center px-3 py-1 bg-blue-100 rounded-md text-sm text-blue-700 hover:bg-blue-200"
                      >
                        <FiRefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Login
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  {user.profilePicture ? (
                                    <img
                                      src={user.profilePicture}
                                      alt={`${user.firstName} ${user.lastName}`}
                                      className="h-10 w-10 rounded-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '/default-profile.png';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-gray-500 font-semibold">
                                      {user.firstName[0]}{user.lastName[0]}
                                    </span>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.lastLogin)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleToggleUserStatus(user.id, user.status)}
                                  className={`inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white ${
                                    user.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                  }`}
                                  title={user.status === 'active' ? 'Ban User' : 'Unban User'}
                                >
                                  {user.status === 'active' ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
                                </button>
                                <button
                                  className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                  title="View Details"
                                >
                                  <FiEye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Reports Management */}
            {activeTab === 'reports' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Reports Management</h2>
                    <button 
                      onClick={fetchReports}
                      className="flex items-center px-3 py-1 bg-blue-100 rounded-md text-sm text-blue-700 hover:bg-blue-200"
                    >
                      <FiRefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reported User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reported By
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                          <tr key={report.id} className={report.status === 'pending' ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{report.reportedUserName}</div>
                              <div className="text-xs text-gray-500">ID: {report.reportedUserId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{report.reportedByUserName}</div>
                              <div className="text-xs text-gray-500">ID: {report.reportedByUserId}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{report.reason}</div>
                              <div className="text-xs text-gray-500 max-w-xs truncate">{report.details}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(report.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                report.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : report.status === 'reviewed' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleToggleUserStatus(report.reportedUserId, 'active')}
                                className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
                                title="Ban User"
                              >
                                <FiUserX className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Live Sessions */}
            {activeTab === 'sessions' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Live Sessions</h2>
                    <button 
                      onClick={fetchLiveSessions}
                      className="flex items-center px-3 py-1 bg-blue-100 rounded-md text-sm text-blue-700 hover:bg-blue-200"
                    >
                      <FiRefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Currently Active Sessions: {liveSessions.length}</h3>
                    
                    {liveSessions.length === 0 ? (
                      <div className="text-center py-6">
                        <FiVideo className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No active sessions</h3>
                        <p className="mt-1 text-sm text-gray-500">There are no live sessions currently in progress.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {liveSessions.map((session) => (
                          <div key={session.id} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">Session #{session.id}</h4>
                                <p className="text-xs text-gray-500">Started: {formatDate(session.startedAt)}</p>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {session.status}
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-sm text-gray-700">Topic: <span className="font-medium">{session.topic}</span></p>
                              <p className="text-sm text-gray-700">Duration: <span className="font-medium">{calculateDuration(session.startedAt)}</span></p>
                            </div>
                            
                            <div className="flex justify-between mb-4">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center">
                                  <span className="text-xs font-medium">{session.user1Name.charAt(0)}</span>
                                </div>
                                <span className="ml-2 text-sm">{session.user1Name}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-purple-300 flex items-center justify-center">
                                  <span className="text-xs font-medium">{session.user2Name.charAt(0)}</span>
                                </div>
                                <span className="ml-2 text-sm">{session.user2Name}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleTerminateSession(session.id)}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                <FiX className="mr-1 h-3 w-3" />
                                Terminate
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6 py-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Session Statistics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Sessions Today</div>
                        <div className="text-xl font-bold mt-1 text-blue-500">{stats.totalSessionsToday}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Sessions This Week</div>
                        <div className="text-xl font-bold mt-1 text-green-500">{stats.sessionsThisWeek}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Total Learning Hours</div>
                        <div className="text-xl font-bold mt-1 text-purple-500">{stats.totalLearningHours.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Feedback */}
            {activeTab === 'feedback' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">User Feedback</h2>
                    <button 
                      onClick={fetchFeedback}
                      className="flex items-center px-3 py-1 bg-blue-100 rounded-md text-sm text-blue-700 hover:bg-blue-200"
                    >
                      <FiRefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </button>
                  </div>
                  
                  <div className="overflow-y-auto max-h-96">
                    <ul className="divide-y divide-gray-200">
                      {feedback.length === 0 ? (
                        <li className="p-6 text-center text-gray-500">
                          No feedback submissions yet.
                        </li>
                      ) : (
                        feedback.map((item) => (
                          <li key={item.id} className="p-6 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 font-semibold">
                                    {item.userName.charAt(0)}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{item.userName}</div>
                                  <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">{item.message}</div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  
                  {feedback.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 text-center">
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Load More Feedback
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}