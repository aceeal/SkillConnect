// src/app/components/NotificationDropdown.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiMessageSquare, FiCalendar, FiCheck, FiX, FiTrash2, FiCheckCircle } from 'react-icons/fi';

interface Notification {
  id: number;
  type: 'message' | 'session_booking' | 'system';
  message: string;
  data: any;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  isLoading?: boolean;
}

export default function NotificationDropdown({ isLoading = false }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen for new notifications from the notification system
  useEffect(() => {
    const handleNewNotification = (event: any) => {
      console.log('Notification dropdown received new notification:', event.detail);
      // Refresh notifications when a new one arrives
      if (isOpen) {
        fetchNotifications();
      } else {
        // Just update the unread count
        fetchUnreadCount();
      }
    };

    window.addEventListener('newNotification', handleNewNotification);
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, [isOpen]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && !isLoading) {
      fetchNotifications();
    }
  }, [isOpen, isLoading]);

  // Fetch unread count on component mount and periodically
  useEffect(() => {
    if (!isLoading) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?unread_only=true');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationIds: number[]) => {
    if (notificationIds.length === 0) return;
    
    setProcessingIds(prev => new Set([...prev, ...notificationIds]));
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        notificationIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const markAllAsRead = async () => {
    setIsLoadingNotifications(true);
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    setProcessingIds(prev => new Set([...prev, notificationId]));
    
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleSessionBookingAction = async (notificationId: number, bookingId: number, action: 'accept' | 'decline') => {
    setProcessingIds(prev => new Set([...prev, notificationId]));
    
    try {
      const response = await fetch(`/api/session-bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Mark notification as read and refresh the list
        await markAsRead([notificationId]);
        fetchNotifications();
        
        // Show success message
        showToast(
          `Session booking ${action}ed successfully`,
          action === 'accept' ? 'success' : 'info'
        );
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to update session booking', 'error');
      }
    } catch (error) {
      console.error('Error updating session booking:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Simple toast implementation
    if (typeof document !== 'undefined') {
      const toast = document.createElement('div');
      toast.className = `fixed top-5 right-5 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
      }`;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <FiMessageSquare className="w-4 h-4 text-blue-600" />;
      case 'session_booking':
        return <FiCalendar className="w-4 h-4 text-green-600" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const formatSessionDateTime = (dateString: string, timeString: string) => {
    try {
      // Handle different date formats
      let date;
      
      if (dateString && timeString) {
        // If we have separate date and time strings
        if (dateString.includes('T')) {
          // If date already includes time info, just parse it
          date = new Date(dateString);
        } else {
          // Combine date and time
          date = new Date(`${dateString}T${timeString}`);
        }
      } else if (dateString) {
        // If we only have a date string
        date = new Date(dateString);
      } else {
        throw new Error('No date provided');
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      return `${dateStr} at ${timeStr}`;
    } catch (error) {
      console.error('Date formatting error:', error, 'Date:', dateString, 'Time:', timeString);
      // Return a fallback format
      if (dateString && timeString) {
        return `${dateString} at ${timeString}`;
      } else if (dateString) {
        return dateString;
      }
      return 'Date not available';
    }
  };

  const isSessionBookingRequest = (notification: Notification) => {
    return notification.type === 'session_booking' && 
           notification.data?.bookingId && 
           notification.message.includes('wants to book');
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Loading skeleton for notifications
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start space-x-3 p-3 animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        {isLoading ? (
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <>
            <FiBell className="w-6 h-6" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                {notifications.length > 0 && unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={isLoadingNotifications}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoadingNotifications ? (
                <div className="p-4">
                  <LoadingSkeleton />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          
                          {/* Enhanced Session Booking Details */}
                          {notification.type === 'session_booking' && notification.data && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="space-y-2">
                                {/* Session Type */}
                                {notification.data.sessionType && (
                                  <div className="flex items-center text-xs">
                                    <span className="font-medium text-gray-600 mr-2">Type:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      notification.data.sessionType === 'online' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {notification.data.sessionType === 'online' ? '🌐 Online' : '📍 In-Person'}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Date and Time */}
                                {(notification.data.scheduledDate || notification.data.scheduledTime) && (
                                  <div className="flex items-center text-xs">
                                    <span className="font-medium text-gray-600 mr-2">When:</span>
                                    <span className="text-gray-800">
                                      {formatSessionDateTime(notification.data.scheduledDate, notification.data.scheduledTime)}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Status for accepted/declined/cancelled notifications */}
                                {notification.data.action && (
                                  <div className="flex items-center text-xs">
                                    <span className="font-medium text-gray-600 mr-2">Status:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      notification.data.action === 'accept' ? 'bg-green-100 text-green-800' :
                                      notification.data.action === 'decline' ? 'bg-red-100 text-red-800' :
                                      notification.data.action === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {notification.data.action === 'accept' ? '✅ Accepted' :
                                       notification.data.action === 'decline' ? '❌ Declined' :
                                       notification.data.action === 'cancelled' ? '🚫 Cancelled' :
                                       '📝 Pending'}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Notes if available */}
                                {notification.data.notes && (
                                  <div className="text-xs">
                                    <span className="font-medium text-gray-600">Notes:</span>
                                    <p className="text-gray-700 mt-1 italic">"{notification.data.notes}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>

                          {/* Session Booking Actions */}
                          {isSessionBookingRequest(notification) && (
                            <div className="flex space-x-2 mt-3">
                              <button
                                onClick={() => handleSessionBookingAction(
                                  notification.id, 
                                  notification.data.bookingId, 
                                  'accept'
                                )}
                                disabled={processingIds.has(notification.id)}
                                className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 disabled:opacity-50 transition-colors"
                              >
                                <FiCheck className="w-3 h-3 mr-1" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleSessionBookingAction(
                                  notification.id, 
                                  notification.data.bookingId, 
                                  'decline'
                                )}
                                disabled={processingIds.has(notification.id)}
                                className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
                              >
                                <FiX className="w-3 h-3 mr-1" />
                                Decline
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 flex items-center space-x-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead([notification.id])}
                              disabled={processingIds.has(notification.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                              title="Mark as read"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            disabled={processingIds.has(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                            title="Delete notification"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}