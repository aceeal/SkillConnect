// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaEye, FaVideo, FaToggleOn, FaToggleOff, FaChevronRight, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DeleteAccountModal from '@/app/components/DeleteAccountModal';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('privacy');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Privacy Settings
  const [profileVisibility, setProfileVisibility] = useState('all');
  const [showSkills, setShowSkills] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
  const [allowMessages, setAllowMessages] = useState('all');
  
  // Session Settings
  const [defaultMicState, setDefaultMicState] = useState(true);
  const [defaultCameraState, setDefaultCameraState] = useState(true);
  
  // Delete Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchSettings();
    }
  }, [status, session]);

  const fetchSettings = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/user-settings?userId=${session.user.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch settings: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update state with fetched settings
      setProfileVisibility(data.profile_visibility || 'all');
      setShowSkills(data.show_skills !== false && data.show_skills !== 0);
      setShowInterests(data.show_interests !== false && data.show_interests !== 0);
      setAllowMessages(data.allow_messages || 'all');
      setDefaultMicState(data.default_mic_state !== false && data.default_mic_state !== 0);
      setDefaultCameraState(data.default_camera_state !== false && data.default_camera_state !== 0);
    } catch (error) {
      setError('Could not load your settings. Please try again later.');
      toast.error('Failed to load settings', {
        transition: Slide
      });
    }
  };

  const saveSettings = async () => {
    if (!session?.user?.id) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const settingsData = {
        userId: session.user.id.toString(),
        settings: {
          profile_visibility: profileVisibility,
          show_skills: showSkills,
          show_interests: showInterests,
          allow_messages: allowMessages,
          default_mic_state: defaultMicState,
          default_camera_state: defaultCameraState
        }
      };
      
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to update settings');
      }
      
      await response.json();
      toast.success('Settings saved successfully!', {
        transition: Slide
      });
      
      // Refresh settings to confirm they were saved
      fetchSettings();
    } catch (error) {
      setError(error.message || 'Failed to save settings. Please try again.');
      toast.error(`Failed to save settings: ${error.message || 'Unknown error'}`, {
        transition: Slide
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const settingTabs = [
    { key: 'privacy', label: 'Privacy', icon: <FaEye /> },
    { key: 'session', label: 'Session', icon: <FaVideo /> },
    { key: 'account', label: 'Account', icon: <FaTrash /> }, // New tab for account management
  ];
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }
  
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
           style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md"
        >
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-6 text-gray-600">Please sign in to access your settings.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-white hover:text-blue-600 border-2 border-blue-600 transition-all duration-300"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-6"
         style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        transition={Slide}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
      />
      
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6">
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Customize your SkillConnect experience</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="space-y-1">
              {settingTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.key 
                      ? tab.key === 'account' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  <span>{tab.label}</span>
                  <FaChevronRight className="ml-auto h-4 w-4 opacity-50" />
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content Area */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Visibility</label>
                      <select
                        value={profileVisibility}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                      >
                        <option value="all">Everyone</option>
                        <option value="none">Only Me</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-900">Show Skills on Profile</h3>
                        <p className="text-sm text-gray-500">Make your skills visible to others</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSkills(!showSkills)}
                        className={`text-2xl ${showSkills ? 'text-blue-600' : 'text-gray-400'}`}
                      >
                        {showSkills ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-900">Show Interests on Profile</h3>
                        <p className="text-sm text-gray-500">Make your interests visible to others</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowInterests(!showInterests)}
                        className={`text-2xl ${showInterests ? 'text-blue-600' : 'text-gray-400'}`}
                      >
                        {showInterests ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Who Can Message You</label>
                      <select
                        value={allowMessages}
                        onChange={(e) => setAllowMessages(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                      >
                        <option value="all">Everyone</option>
                        <option value="none">Only Me</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Session Settings */}
                {activeTab === 'session' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-900">Default Microphone State</h3>
                        <p className="text-sm text-gray-500">Start sessions with microphone on</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDefaultMicState(!defaultMicState)}
                        className={`text-2xl ${defaultMicState ? 'text-blue-600' : 'text-gray-400'}`}
                      >
                        {defaultMicState ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div>
                        <h3 className="font-medium text-gray-900">Default Camera State</h3>
                        <p className="text-sm text-gray-500">Start sessions with camera on</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDefaultCameraState(!defaultCameraState)}
                        className={`text-2xl ${defaultCameraState ? 'text-blue-600' : 'text-gray-400'}`}
                      >
                        {defaultCameraState ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Management */}
                {activeTab === 'account' && (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <FaExclamationTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-red-800">Danger Zone</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>Actions in this section are permanent and cannot be undone.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 border border-red-300 rounded-md bg-red-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-base font-medium text-red-800">Delete Account</h4>
                            <p className="mt-1 text-sm text-red-600">
                              Permanently delete your account and all associated data.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                          >
                            <FaTrash className="mr-2" />
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Save Button - Only show for privacy and session tabs */}
            {(activeTab === 'privacy' || activeTab === 'session') && (
              <div className="mt-6 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg border-2 border-blue-600 hover:bg-white hover:text-blue-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}