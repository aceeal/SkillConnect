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
  FiTrash2,
  FiEye,
  FiVideo,
  FiFlag,
  FiDownload,
  FiClock,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiList,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [reportFilter, setReportFilter] = useState(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Try to get the stored filter from localStorage
      const savedFilter = localStorage.getItem('adminReportFilter');
      return savedFilter || 'all'; // Default to 'all' if no saved preference
    }
    return 'all'; // Default to 'all' on server-side rendering
  });
  const [liveSessions, setLiveSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]); // New state for completed sessions
  const [sessionLogFilter, setSessionLogFilter] = useState('all'); // New state for filtering session logs
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  
  // Pagination states for session logs
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this adjustable if needed
  
  // Pagination states for user lists
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [usersPerPage] = useState(10); // You can make this adjustable if needed
  
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

  // Add this useEffect to save the user's filter preference
  useEffect(() => {
    // Save the current filter to localStorage when it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminReportFilter', reportFilter);
    }
  }, [reportFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      await Promise.all([
        fetchUsers(),
        fetchReports(),
        fetchLiveSessions(),
        fetchCompletedSessions(), // New function call
        fetchFeedback(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setErrors(prev => ({...prev, general: 'Error fetching admin data'}));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?filter=all');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.users || !Array.isArray(data.users)) {
        throw new Error('Invalid response format: users array not found');
      }
      
      const formattedUsers = data.users.map(user => ({
        id: user.id.toString(),
        // Handle both possible naming conventions
        firstName: user.first_name || user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.last_name || user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        profilePicture: user.profile_picture || user.profilePicture || null,
        role: user.role || 'user',
        status: user.status || 'active',
        onlineStatus: user.onlineStatus || user.online_status || 'offline', // Add online status
        // Fix the date mapping - handle both snake_case and camelCase
        createdAt: user.created_at || user.createdAt || new Date().toISOString(),
        lastLogin: user.last_login || user.lastLogin || user.lastActive || null,
        skills: user.skills || [],
        interests: user.interests || []
      }));
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
      
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: formattedUsers.length
      }));
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrors(prev => ({...prev, users: error.message}));
      // Don't set any placeholder data to force fixing the real issue
      setUsers([]);
      setFilteredUsers([]);
    }
  };

  const fetchReports = async () => {
    try {
      // Fetch reports using the correct endpoint
      const response = await fetch('/api/reports');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch reports: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw reports data:', data); // Debug log
      
      if (!data.reports || !Array.isArray(data.reports)) {
        throw new Error('Invalid response format: reports array not found');
      }
      
      // Map the reports data to match the expected structure
      // Handle both possible naming conventions
      const formattedReports = data.reports.map(report => ({
        id: report.id.toString(),
        reportedUserId: (report.reported_user_id || report.reportedUserId).toString(),
        reportedUserName: `${report.reported_user_first_name || report.reportedUserFirstName || ''} ${report.reported_user_last_name || report.reportedUserLastName || ''}`.trim() || 'Unknown User',
        reportedByUserId: (report.reported_by_user_id || report.reportedByUserId).toString(),
        reportedByUserName: `${report.reporter_first_name || report.reporterFirstName || ''} ${report.reporter_last_name || report.reporterLastName || ''}`.trim() || 'Unknown User',
        reason: report.reason || 'No reason provided',
        details: report.details || report.admin_notes || report.adminNotes || '', 
        status: report.status || 'pending',
        createdAt: report.created_at || report.createdAt || new Date().toISOString()
      }));
      
      console.log('Formatted reports:', formattedReports); // Debug log
      
      setReports(formattedReports);
      setFilteredReports(formattedReports);
      
      // Update stats with pending reports count
      const pendingCount = formattedReports.filter(report => report.status === 'pending').length;
      setStats(prevStats => ({
        ...prevStats,
        pendingReports: pendingCount
      }));
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      setErrors(prev => ({...prev, reports: error.message}));
      // Don't set any placeholder data
      setReports([]);
      setFilteredReports([]);
    }
  };

  const fetchLiveSessions = async () => {
    try {
      // Specifically fetch only ongoing sessions
      const response = await fetch('/api/admin/sessions?status=ongoing');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch live sessions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Live sessions data:', data); // Debug log
      
      if (!data.sessions || !Array.isArray(data.sessions)) {
        throw new Error('Invalid response format: sessions array not found');
      }
      
      // Filter to ensure we only have ongoing sessions
      const ongoingSessions = data.sessions.filter(session => session.status === 'ongoing');
      
      // Get user profile pictures for each session
      const sessionsWithUserDetails = await Promise.all(ongoingSessions.map(async (session) => {
        try {
          // Fetch user1 details
          const user1Response = await fetch(`/api/users/${session.user1Id}`);
          const user1Data = await user1Response.json();
          
          // Fetch user2 details
          const user2Response = await fetch(`/api/users/${session.user2Id}`);
          const user2Data = await user2Response.json();
          
          return {
            ...session,
            user1ProfilePicture: user1Data.user?.profilePicture || user1Data.user?.profile_picture || null,
            user2ProfilePicture: user2Data.user?.profilePicture || user2Data.user?.profile_picture || null
          };
        } catch (error) {
          console.error('Error fetching user details for session:', error);
          return session;
        }
      }));
      
      setLiveSessions(sessionsWithUserDetails);
      
      setStats(prevStats => ({
        ...prevStats,
        activeSessions: sessionsWithUserDetails.length
      }));
    } catch (error) {
      console.error('Error fetching live sessions:', error);
      setErrors(prev => ({...prev, sessions: error.message}));
      // Don't set any placeholder data
      setLiveSessions([]);
    }
  };

  // Function to fetch completed and terminated sessions
  const fetchCompletedSessions = async () => {
    try {
      // Fetch only completed and terminated sessions
      const response = await fetch('/api/admin/sessions?status=completed,terminated,disconnected');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch completed sessions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Completed sessions data:', data); // Debug log
      
      if (!data.sessions || !Array.isArray(data.sessions)) {
        throw new Error('Invalid response format: completed sessions array not found');
      }
      
      // Filter to make sure we only have completed, terminated, or disconnected sessions
      const nonOngoingSessions = data.sessions.filter(
        session => ['completed', 'terminated', 'disconnected'].includes(session.status)
      );
      
      // Get user profile pictures for each completed session
      const sessionsWithUserDetails = await Promise.all(nonOngoingSessions.map(async (session) => {
        try {
          // Fetch user1 details
          const user1Response = await fetch(`/api/users/${session.user1Id}`);
          const user1Data = await user1Response.json();
          
          // Fetch user2 details
          const user2Response = await fetch(`/api/users/${session.user2Id}`);
          const user2Data = await user2Response.json();
          
          return {
            ...session,
            user1ProfilePicture: user1Data.user?.profilePicture || user1Data.user?.profile_picture || null,
            user2ProfilePicture: user2Data.user?.profilePicture || user2Data.user?.profile_picture || null
          };
        } catch (error) {
          console.error('Error fetching user details for completed session:', error);
          return session;
        }
      }));
      
      setCompletedSessions(sessionsWithUserDetails);
      
      // Reset to first page when sessions are fetched
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
      setErrors(prev => ({...prev, completedSessions: error.message}));
      // Don't set any placeholder data
      setCompletedSessions([]);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/contact');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch feedback: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Feedback data:', data); // Debug log
      
      if (!data.submissions || !Array.isArray(data.submissions)) {
        throw new Error('Invalid response format: submissions array not found');
      }
      
      const formattedFeedback = data.submissions.map(submission => ({
        id: submission.id.toString(),
        userId: submission.user_id?.toString() || 'guest',
        userName: submission.name || 'Anonymous',
        message: submission.message,
        createdAt: submission.created_at || submission.createdAt || new Date().toISOString()
      }));
      
      setFeedback(formattedFeedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setErrors(prev => ({...prev, feedback: error.message}));
      // Don't set any placeholder data
      setFeedback([]);
    }
  };

  const fetchStats = async () => {
    try {
      const [sessionsResponse, reportsResponse] = await Promise.all([
        fetch('/api/admin/sessions/stats').catch(() => ({ ok: false })),
        fetch('/api/admin/reports/count').catch(() => ({ ok: false }))
      ]);
      
      let sessionsData = {};
      let reportsData = {};
      
      if (sessionsResponse.ok) {
        const data = await sessionsResponse.json();
        console.log('Sessions stats data:', data); // Debug log
        if (data.success) {
          sessionsData = data;
        }
      } else {
        console.error('Failed to fetch sessions stats:', await sessionsResponse.text().catch(() => 'Unknown error'));
      }
      
      if (reportsResponse.ok) {
        const data = await reportsResponse.json();
        console.log('Reports count data:', data); // Debug log
        if (data.success) {
          reportsData = data;
        }
      } else {
        console.error('Failed to fetch reports count:', await reportsResponse.text().catch(() => 'Unknown error'));
      }
      
      // Calculate new users today from actual data
      const today = new Date();
      const newUsersToday = users.filter(user => {
        const createdDate = new Date(user.createdAt);
        return createdDate.getDate() === today.getDate() &&
               createdDate.getMonth() === today.getMonth() &&
               createdDate.getFullYear() === today.getFullYear();
      }).length;
      
      setStats(prevStats => ({
        ...prevStats,
        newUsersToday,
        activeSessions: sessionsData.activeSessions || liveSessions.length,
        totalSessionsToday: sessionsData.totalSessions || 0,
        sessionsThisWeek: sessionsData.sessionsThisWeek || 0,
        totalLearningHours: sessionsData.totalLearningHours || 0,
        pendingReports: reportsData.pending || prevStats.pendingReports
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      setErrors(prev => ({...prev, stats: error.message}));
    }
  };

  // Filter reports based on status
  useEffect(() => {
    if (reportFilter === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.status === reportFilter));
    }
  }, [reports, reportFilter]);

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.firstName.toLowerCase().includes(term.toLowerCase()) || 
        user.lastName.toLowerCase().includes(term.toLowerCase()) || 
        user.email.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    
    // Reset to first page when search changes
    setCurrentUserPage(1);
  };

  // Updated toggle user status function
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update user status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Status update response:', data);
      
      // Update the user in state with the new status
      setUsers(users.map(user => 
        user.id.toString() === userId.toString() ? { ...user, status: newStatus } : user
      ));
      
      setFilteredUsers(filteredUsers.map(user => 
        user.id.toString() === userId.toString() ? { ...user, status: newStatus } : user
      ));
      
      alert(`User successfully ${newStatus === 'banned' ? 'banned' : 'unbanned'}`);
      
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status: ' + error.message);
    }
  };

  // Fixed report status update - using the correct endpoint
  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reportId, 
          status: newStatus,
          adminNotes: `Status updated to ${newStatus} on ${new Date().toISOString()}`
        }),
      });
        
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update report status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update reports in state
        const updatedReports = reports.map(report => 
          report.id === reportId ? { ...report, status: newStatus } : report
        );
        setReports(updatedReports);
        
        // Update filtered reports based on the current filter
        if (reportFilter === 'all') {
          // If showing all reports, update the report in the filtered list too
          setFilteredReports(updatedReports);
        } else if (reportFilter === newStatus) {
          // If filter matches the new status, ensure it shows in the filtered list
          setFilteredReports(
            filteredReports.map(report => 
              report.id === reportId ? { ...report, status: newStatus } : report
            )
          );
        } else {
          // If filter doesn't match new status, remove from filtered list
          setFilteredReports(filteredReports.filter(report => report.id !== reportId));
        }
        
        // Update stats for pending reports count
        const pendingCount = updatedReports.filter(report => report.status === 'pending').length;
        setStats(prevStats => ({
          ...prevStats,
          pendingReports: pendingCount
        }));
        
        // Add a success notification
        alert(`Report successfully marked as ${newStatus}. To view this report, change the filter to "${newStatus}" or "All Reports".`);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Failed to update report status: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (confirm(`Are you sure you want to delete the account for ${userName}? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete user: ${response.status}`);
        }
        
        // Remove user from state
        setUsers(users.filter(user => user.id !== userId));
        setFilteredUsers(filteredUsers.filter(user => user.id !== userId));
        
        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          totalUsers: prevStats.totalUsers - 1
        }));
        
        alert('User account deleted successfully.');
        
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user account: ' + error.message);
      }
    }
  };

  const handleExportUserData = () => {
    try {
      const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Status', 'Online Status', 'Created At', 'Last Login'];
      const csvContent = [
        headers.join(','),
        ...users.map(user => [
          user.id,
          `"${user.firstName}"`,
          `"${user.lastName}"`,
          user.email,
          user.status,
          user.onlineStatus,
          new Date(user.createdAt).toLocaleString(),
          user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
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
      alert('Failed to export user data: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Not available';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
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
  
  const calculateDuration = (startTimeString, endTimeString = null) => {
    try {
      const startTime = new Date(startTimeString);
      const endTime = endTimeString ? new Date(endTimeString) : new Date();
      const diffMs = endTime - startTime;
      
      if (diffMs < 0) return '00:00:00';
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } catch (error) {
      return '00:00:00';
    }
  };

  // Pagination logic for session logs
  const getFilteredCompletedSessions = () => {
    return completedSessions.filter(session => 
      sessionLogFilter === 'all' || session.status === sessionLogFilter
    );
  };

  const getPaginatedSessions = () => {
    const filteredSessions = getFilteredCompletedSessions();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSessions.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredSessions = getFilteredCompletedSessions();
    return Math.ceil(filteredSessions.length / itemsPerPage);
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

  // Pagination logic for user lists
  const getPaginatedUsers = () => {
    const startIndex = (currentUserPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const getTotalUserPages = () => {
    return Math.ceil(filteredUsers.length / usersPerPage);
  };

  const handleUserPrevePage = () => {
    setCurrentUserPage(prev => Math.max(prev - 1, 1));
  };

  const handleUserNextPage = () => {
    setCurrentUserPage(prev => Math.min(prev + 1, getTotalUserPages()));
  };

  const handleUserPageClick = (pageNumber) => {
    setCurrentUserPage(pageNumber);
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sessionLogFilter]);

  // Reset to page 1 when users data changes
  useEffect(() => {
    setCurrentUserPage(1);
  }, [users]);

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

  // Display API errors if any
  const ErrorDisplay = ({ errors }) => {
    if (Object.keys(errors).length === 0) return null;
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800">API Errors Detected</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(errors).map(([key, error]) => (
            <div key={key} className="flex items-start">
              <span className="text-red-700 font-semibold mr-2">{key}:</span>
              <span className="text-red-600">{error}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm text-red-700">
          Fix these errors to see real data instead of empty states.
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #4299e1 0%, #38b2ac 100%)',
        minHeight: '100vh',
      }}
    >
      <div className="container mx-auto p-4">
        {Object.keys(errors).length > 0 && <ErrorDisplay errors={errors} />}
        
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
                    
                    {/* Empty state if no activities */}
                    {users.length === 0 && reports.filter(r => r.status === 'pending').length === 0 && 
                     liveSessions.length === 0 && feedback.length === 0 && users.filter(u => u.status === 'banned').length === 0 && (
                      <div className="flex items-center justify-center py-6">
                        <div className="text-center">
                          <FiActivity className="mx-auto h-10 w-10 text-gray-400" />
                          <p className="mt-2 text-sm font-medium text-gray-900">No recent activity</p>
                          <p className="mt-1 text-xs text-gray-500">Check back later or fix API errors to see activity</p>
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
                    {users.length === 0 ? (
                      <div className="text-center py-8">
                        <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-500">Fix API connection to see users</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                              User
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                              Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                              Status (Account/Online)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                              Joined
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                              Last Login
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getPaginatedUsers().map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap w-1/4">
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
                              <td className="px-6 py-4 whitespace-nowrap w-1/4">
                                <div className="text-sm text-gray-900">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap w-1/6">
                                <div className="flex flex-col space-y-1">
                                  {/* Account Status (for admin actions) */}
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {user.status === 'active' ? 'Active' : 'Banned'}
                                  </span>
                                  
                                  {/* Online Status (shows connectivity) */}
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.onlineStatus === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    <span className={`w-2 h-2 rounded-full mr-1 ${
                                      user.onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                    }`}></span>
                                    {user.onlineStatus === 'online' ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/6">
                                {formatDate(user.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/6">
                                {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-20">
                                <div className="flex justify-end space-x-1">
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
                                    title="View Profile"
                                    onClick={() => window.open(`/user/${user.id}`, '_blank')}
                                  >
                                    <FiEye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
                                    title="Delete Account"
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  {/* Pagination Controls for Users */}
                  {filteredUsers.length > 0 && getTotalUserPages() > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">
                          Showing {Math.min((currentUserPage - 1) * usersPerPage + 1, filteredUsers.length)} to{' '}
                          {Math.min(currentUserPage * usersPerPage, filteredUsers.length)} of{' '}
                          {filteredUsers.length} results
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={handleUserPrevePage}
                          disabled={currentUserPage === 1}
                          className={`p-2 rounded-md text-sm font-medium ${
                            currentUserPage === 1
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <FiChevronLeft className="h-4 w-4" />
                        </button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, getTotalUserPages()) }, (_, i) => {
                          const startPage = Math.max(1, currentUserPage - 2);
                          const pageNumber = startPage + i;
                          
                          if (pageNumber > getTotalUserPages()) return null;
                          
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handleUserPageClick(pageNumber)}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                currentUserPage === pageNumber
                                  ? 'bg-blue-500 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={handleUserNextPage}
                          disabled={currentUserPage === getTotalUserPages()}
                          className={`p-2 rounded-md text-sm font-medium ${
                            currentUserPage === getTotalUserPages()
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <FiChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
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
                    <div className="flex space-x-2">
                      <select
                        value={reportFilter}
                        onChange={(e) => setReportFilter(e.target.value)}
                        className="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Reports</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button 
                        onClick={fetchReports}
                        className="flex items-center px-3 py-1 bg-blue-100 rounded-md text-sm text-blue-700 hover:bg-blue-200"
                      >
                        <FiRefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </button>
                    </div>
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
                        {filteredReports.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                              {errors.reports ? 
                                'Error fetching reports. Please check API connection.' : 
                                reportFilter === 'all' ? 'No reports found.' : `No ${reportFilter} reports found.`}
                            </td>
                          </tr>
                        ) : (
                          filteredReports.map((report) => (
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
                                {report.details && (
                                  <div className="text-xs text-gray-500 max-w-xs truncate">{report.details}</div>
                                )}
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
                                <div className="flex justify-end space-x-1">
                                  {report.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                        title="Mark as Reviewed"
                                      >
                                        <FiEye className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700"
                                        title="Mark as Resolved"
                                      >
                                        <FiCheck className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleToggleUserStatus(report.reportedUserId, 'active')}
                                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
                                    title="Ban User"
                                  >
                                    <FiUserX className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
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
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Live Sessions</h2>
                    <button 
                      onClick={() => {
                        fetchLiveSessions();
                        fetchCompletedSessions();
                      }}
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
                        <p className="mt-1 text-sm text-gray-500">
                          {errors.sessions ? 'Error fetching sessions. Please check API connection.' : 'There are no live sessions currently in progress.'}
                        </p>
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
                                {session.status || 'active'}
                              </span>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-sm text-gray-700">Topic: <span className="font-medium">{session.topic || 'General'}</span></p>
                              <p className="text-sm text-gray-700">Duration: <span className="font-medium">{calculateDuration(session.startedAt)}</span></p>
                            </div>
                            
                            <div className="flex justify-between">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center overflow-hidden">
                                  {session.user1ProfilePicture ? (
                                    <img 
                                      src={session.user1ProfilePicture} 
                                      alt={session.user1Name || 'User 1'} 
                                      className="h-8 w-8 object-cover"
                                      onError={(e) => {
                                        e.target.src = '/default-profile.png';
                                        e.target.onerror = null;
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">{(session.user1Name || 'User 1').charAt(0)}</span>
                                  )}
                                </div>
                                <span className="ml-2 text-sm text-gray-900">{session.user1Name || 'User 1'}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-purple-300 flex items-center justify-center overflow-hidden">
                                  {session.user2ProfilePicture ? (
                                    <img 
                                      src={session.user2ProfilePicture} 
                                      alt={session.user2Name || 'User 2'} 
                                      className="h-8 w-8 object-cover"
                                      onError={(e) => {
                                        e.target.src = '/default-profile.png';
                                        e.target.onerror = null;
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">{(session.user2Name || 'User 2').charAt(0)}</span>
                                  )}
                                </div>
                                <span className="ml-2 text-sm text-gray-900">{session.user2Name || 'User 2'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Logs Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Session Logs</h2>
                    <div className="flex space-x-2">
                      <select
                        value={sessionLogFilter}
                        onChange={(e) => setSessionLogFilter(e.target.value)}
                        className="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Sessions</option>
                        <option value="completed">Completed</option>
                        <option value="terminated">Terminated</option>
                        <option value="disconnected">Disconnected</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Session ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participants
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Topic
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Started
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ended
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedSessions().length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                              {errors.completedSessions ? 
                                'Error fetching session logs. Please check API connection.' : 
                                'No sessions found for the selected filter.'}
                            </td>
                          </tr>
                        ) : (
                          getPaginatedSessions().map((session) => (
                            <tr key={session.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                #{session.id}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <div className="flex -space-x-2">
                                    <div className="h-6 w-6 rounded-full bg-blue-300 flex items-center justify-center overflow-hidden ring-2 ring-white">
                                      {session.user1ProfilePicture ? (
                                        <img 
                                          src={session.user1ProfilePicture} 
                                          alt={session.user1Name || 'User 1'} 
                                          className="h-6 w-6 object-cover"
                                          onError={(e) => {
                                            e.target.src = '/default-profile.png';
                                            e.target.onerror = null;
                                          }}
                                        />
                                      ) : (
                                        <span className="text-xs font-medium">{(session.user1Name || 'User 1').charAt(0)}</span>
                                      )}
                                    </div>
                                    <div className="h-6 w-6 rounded-full bg-purple-300 flex items-center justify-center overflow-hidden ring-2 ring-white">
                                      {session.user2ProfilePicture ? (
                                        <img 
                                          src={session.user2ProfilePicture} 
                                          alt={session.user2Name || 'User 2'} 
                                          className="h-6 w-6 object-cover"
                                          onError={(e) => {
                                            e.target.src = '/default-profile.png';
                                            e.target.onerror = null;
                                          }}
                                        />
                                      ) : (
                                        <span className="text-xs font-medium">{(session.user2Name || 'User 2').charAt(0)}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    {session.user1Name} & {session.user2Name}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.topic || 'General'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(session.startedAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(session.endedAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {calculateDuration(session.startedAt, session.endedAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  session.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : session.status === 'terminated' 
                                      ? 'bg-red-100 text-red-800' 
                                      : session.status === 'disconnected'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {session.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls */}
                  {getTotalPages() > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">
                          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, getFilteredCompletedSessions().length)} to{' '}
                          {Math.min(currentPage * itemsPerPage, getFilteredCompletedSessions().length)} of{' '}
                          {getFilteredCompletedSessions().length} results
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
                          {errors.feedback ? 'Error fetching feedback. Please check API connection.' : 'No feedback submissions yet.'}
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