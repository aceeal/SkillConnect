// src/app/components/BannedUserModal.tsx
'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BannedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BannedUserModal({ isOpen, onClose }: BannedUserModalProps) {
  const router = useRouter();

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

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login?banned=true');
    onClose();
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <div className="flex items-center justify-center text-white">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="bg-white bg-opacity-20 p-3 rounded-full mr-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.1 14.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </motion.div>
                  <h2 className="text-xl font-bold">Account Suspended</h2>
                </div>
              </div>

              {/* Content */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6"
              >
                {/* Main message */}
                <div className="text-center mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Your account has been suspended by an administrator. You will be automatically logged out and unable to access SkillConnect services.
                    </p>
                  </div>

                  {/* Reasons */}
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">This may have occurred due to:</h3>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Violation of community guidelines</li>
                      <li>Inappropriate behavior during sessions</li>
                      <li>Multiple user reports</li>
                      <li>Terms of service violations</li>
                    </ul>
                  </div>
                </div>

                {/* Support section */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-semibold text-gray-900">Need Help?</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        If you believe this is a mistake, contact our support team for assistance.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </motion.button>

                  <button
                    onClick={onClose}
                    className="w-full text-gray-500 py-2 px-4 rounded-lg font-medium hover:text-gray-700 transition-colors duration-200 text-sm"
                  >
                    Close (You will be logged out automatically)
                  </button>
                </div>
              </motion.div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 text-center">
                <p className="text-xs text-gray-500">
                  For immediate assistance, email us at{' '}
                  <a href="mailto:skillconnectcapstone@gmail.com" className="text-blue-600 hover:underline">
                    skillconnectcapstone@gmail.com
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}