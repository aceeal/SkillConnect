// src/app/components/DeleteAccountModal.tsx
'use client';

import React, { useState } from 'react';
import { FaExclamationTriangle, FaTimes, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset state when modal is opened/closed
  React.useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmText('');
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setError(null);
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }
      
      // Account successfully deleted, sign out the user
      await signOut({ redirect: false });
      
      // Redirect to home page
      window.location.href = '/';
      
    } catch (error: any) {
      setError(error.message || 'An error occurred');
      setIsDeleting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            
            {/* Header */}
            <div className="flex items-center mb-6">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <FaExclamationTriangle className="text-red-600 w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Delete Account</h2>
            </div>
            
            {/* Warning message */}
            <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-700 font-medium mb-2">Warning: This action cannot be undone</p>
              <p className="text-gray-700">
                Once you delete your account, all of your data will be permanently removed. This includes your:
              </p>
              <ul className="list-disc ml-5 mt-2 text-gray-700 space-y-1">
                <li>Profile information</li>
                <li>Skills and interests</li>
                <li>Activity history</li>
                <li>Messages and connections</li>
                <li>All other account data</li>
              </ul>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-100 text-red-700 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-black"
                    placeholder="Your current password"
                    disabled={isDeleting}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-1">
                    Type DELETE to confirm
                  </label>
                  <input
                    type="text"
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-black"
                    placeholder="DELETE"
                    disabled={isDeleting}
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || confirmText !== 'DELETE' || !password}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="mr-2" />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccountModal;