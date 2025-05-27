// src/app/components/SessionBookingModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiUser, FiGlobe, FiMapPin, FiMessageSquare, FiX } from 'react-icons/fi';

interface SessionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: number;
    name: string;
    profilePicture: string;
  };
}

export default function SessionBookingModal({ isOpen, onClose, targetUser }: SessionBookingModalProps) {
  const [sessionType, setSessionType] = useState<'online' | 'offline'>('online');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSessionType('online');
      setScheduledDate('');
      setScheduledTime('');
      setNotes('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum time (current time if today is selected)
  const getMinTime = () => {
    const today = new Date();
    const selectedDateObj = new Date(scheduledDate);
    
    if (scheduledDate && selectedDateObj.toDateString() === today.toDateString()) {
      const hours = today.getHours().toString().padStart(2, '0');
      const minutes = today.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validation
      if (!scheduledDate || !scheduledTime) {
        setError('Please select a date and time for the session');
        return;
      }

      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      
      if (selectedDateTime <= now) {
        setError('Please select a future date and time');
        return;
      }

      const response = await fetch('/api/session-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestedUserId: targetUser.id,
          sessionType,
          scheduledDate,
          scheduledTime,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success notification
        showNotification('Success', 'Session booking request sent successfully!', 'success');
        onClose();
      } else {
        setError(data.error || 'Failed to send session booking request');
      }
    } catch (error) {
      console.error('Error sending session booking:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    if (typeof document !== 'undefined') {
      // Remove existing notifications
      const existing = document.querySelectorAll('.session-notification');
      existing.forEach(n => n.remove());
      
      const notification = document.createElement('div');
      notification.className = `session-notification fixed top-5 right-5 p-4 rounded-lg shadow-lg z-50 border-l-4 ${
        type === 'success' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
      }`;
      notification.innerHTML = `
        <div class="flex items-start">
          <div class="flex-1">
            <div class="font-semibold ${type === 'success' ? 'text-green-900' : 'text-red-900'}">${title}</div>
            <div class="text-sm ${type === 'success' ? 'text-green-700' : 'text-red-700'} mt-1">${message}</div>
          </div>
          <button class="ml-2 ${type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'}" onclick="this.parentElement.parentElement.remove()">
            ×
          </button>
        </div>
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);
    }
  };

  const formatDateTime = () => {
    if (!scheduledDate || !scheduledTime) return '';
    
    const dateObj = new Date(`${scheduledDate}T${scheduledTime}`);
    const dateStr = dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = dateObj.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${dateStr} at ${timeStr}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="bg-white bg-opacity-20 p-3 rounded-full mr-3"
                    >
                      <FiCalendar className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold">Book a Session</h2>
                      <p className="text-blue-100 text-sm">Schedule a learning session</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Target User Info */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center bg-gray-50 rounded-lg p-4 mb-6"
                >
                  <img
                    src={targetUser.profilePicture}
                    alt={targetUser.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.currentTarget.src = '/default-profile.png';
                    }}
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <FiUser className="w-4 h-4 text-gray-500 mr-2" />
                      <h3 className="font-semibold text-gray-900">{targetUser.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">Session partner</p>
                  </div>
                </motion.div>

                {/* Session Type */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Session Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSessionType('online')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        sessionType === 'online'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <FiGlobe className="w-6 h-6 mb-2" />
                        <span className="font-medium">Online</span>
                        <span className="text-xs opacity-75">Video call session</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionType('offline')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        sessionType === 'offline'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <FiMapPin className="w-6 h-6 mb-2" />
                        <span className="font-medium">In-Person</span>
                        <span className="text-xs opacity-75">Meet in person</span>
                      </div>
                    </button>
                  </div>
                </motion.div>

                {/* Date and Time */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiCalendar className="w-4 h-4 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={getMinDate()}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiClock className="w-4 h-4 inline mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      min={getMinTime()}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                    />
                  </div>
                </motion.div>

                {/* Session Preview */}
                {scheduledDate && scheduledTime && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
                  >
                    <div className="flex items-center text-blue-700">
                      <FiCalendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">Session scheduled for:</span>
                    </div>
                    <p className="text-blue-600 mt-1 font-semibold">{formatDateTime()}</p>
                  </motion.div>
                )}

                {/* Notes */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mb-6"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMessageSquare className="w-4 h-4 inline mr-1" />
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any specific topics, goals, or requirements for this session..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 bg-white placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{notes.length}/500 characters</p>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <p className="text-red-700 text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex space-x-3"
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !scheduledDate || !scheduledTime}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      'Send Request'
                    )}
                  </button>
                </motion.div>
              </form>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 text-center">
                <p className="text-xs text-gray-500">
                  The other person will receive a notification about your session request
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}