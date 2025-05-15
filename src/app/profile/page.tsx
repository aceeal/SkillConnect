'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { FaEdit, FaLock, FaFacebook, FaTwitter, FaMapMarkerAlt, FaCalendarAlt, FaEnvelope, FaPhone, FaTasks, FaLightbulb } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import SkillsManagementModal from '@/app/components/skills-management-modal';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  
  // User data states
  const [bio, setBio] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('09876543210');
  const [profilePicture, setProfilePicture] = useState('');
  const [location, setLocation] = useState('');
  const [joinDate, setJoinDate] = useState('');
  
  // Edit states
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingProfilePicture, setIsEditingProfilePicture] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Social links
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  
  // Image upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  
  // Activity feed
  const [activityFeed, setActivityFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Skills and interests
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  
  // Refresh flag to trigger data refetching
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch user data
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchProfileData();
    }
  }, [status, session, refreshTrigger]); // Add refreshTrigger to dependencies

  // Fetch user skills and interests separately
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserSkillsAndInterests();
    }
  }, [status, session, refreshTrigger]);

  const fetchUserSkillsAndInterests = async () => {
    try {
      // Fetch skills
      const skillsResponse = await fetch('/api/user-skills');
      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        setUserSkills(skillsData.skills || []);
      }

      // Fetch interests
      const interestsResponse = await fetch('/api/user-interests');
      if (interestsResponse.ok) {
        const interestsData = await interestsResponse.json();
        setUserInterests(interestsData.interests || []);
      }
    } catch (error) {
      console.error('Error fetching skills and interests:', error);
    }
  };

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      // Use the existing /api/user endpoint
      const response = await fetch('/api/user');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      console.log("Fetched profile data:", data); // For debugging
      
      // Update state with fetched data
      setBio(data.bio || '');
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setEmail(data.email || '');
      setPhoneNumber(data.phoneNumber || '09876543210');
      setProfilePicture(data.profilePicture || '');
      setLocation(data.location || 'TRACE College');
      setJoinDate(data.joinDate || 'March 2025');
      
      // Set social media
      if (data.socialMedia) {
        setFacebook(data.socialMedia.facebook || 'https://facebook.com/');
        setTwitter(data.socialMedia.twitter || 'https://twitter.com/');
      }
      
      // Set activity feed
      if (data.recentActivities && Array.isArray(data.recentActivities)) {
        const formattedActivities = data.recentActivities.map((activity, index) => ({
          id: activity.id || index + 1,
          action: activity.description,
          date: formatActivityDate(activity.created_at)
        }));
        setActivityFeed(formattedActivities);
      }

      setApiError('');
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setApiError('Failed to load profile data. Please try refreshing the page.');
      
      // Set some default values from session
      if (session?.user) {
        setFirstName(session.user.name?.split(' ')[0] || '');
        setLastName(session.user.name?.split(' ')[1] || '');
        setEmail(session.user.email || '');
        setProfilePicture(session.user.image || '');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for activity feed
  const formatActivityDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle file upload
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file is an image and size is reasonable
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Start progress simulation
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);
    
    // Create FormData to send the file
    const formData = new FormData();
    formData.append('profileImage', file);
    formData.append('userId', session.user.id);
    
    try {
      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      setUploadProgress(100);
      
      // Update profile picture state with the new URL
      setProfilePicture(data.imageUrl);
      
      // Add a small delay before completion to show 100% progress
      setTimeout(() => {
        setIsUploading(false);
        
        // Add to activity feed
        const newActivity = {
          id: Date.now(),
          action: "Updated profile picture",
          date: 'Just now'
        };
        setActivityFeed([newActivity, ...activityFeed]);
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
      setIsUploading(false);
    }
  };
  
  const handleSaveBio = async () => {
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio, userId: session.user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bio.');
      }

      setIsEditingBio(false);
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert('Error updating bio.');
    }
  };

  const handleSaveName = async () => {
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, userId: session.user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update name.');
      }

      setIsEditingName(false);
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert('Error updating name.');
    }
  };

  const handleSaveEmail = async () => {
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, userId: session.user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update email.');
      }

      setIsEditingEmail(false);
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert('Error updating email.');
    }
  };

  const handleSaveContact = async () => {
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber, 
          location, 
          email, // Add email to the request
          userId: session.user.id 
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update contact information.');
      }
  
      setIsEditingContact(false);
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert('Error updating contact information.');
    }
  };

  const handleSaveLocation = async () => {
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location, userId: session.user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update location.');
      }

      setIsEditingLocation(false);
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert('Error updating location.');
    }
  };

  const handleSaveProfilePicture = async () => {
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profilePicture, userId: session.user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile picture.');
      }

      setIsEditingProfilePicture(false);
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert('Error updating profile picture.');
    }
  };

  const handleSaveSocial = async () => {
    try {
      console.log('Saving social links:', { facebook, twitter });
      
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          facebook, 
          twitter, 
          userId: session.user.id 
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update social links.');
      }
  
      const data = await response.json();
      console.log('Social update response:', data);
  
      setIsEditingSocial(false);
      
      // Add to activity feed
      const newActivity = {
        id: Date.now(),
        action: "Updated social media links",
        date: 'Just now'
      };
      setActivityFeed([newActivity, ...activityFeed]);
      
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating social links:', error);
      alert(error.message || 'Error updating social links.');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword, 
          userId: session.user.id 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password.');
      }

      alert('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingPassword(false);
      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Error changing password.');
    }
  };
  
  // Handle skills and interests update
  const handleSaveSkillsAndInterests = (updatedSkills, updatedInterests) => {
    setUserSkills(updatedSkills);
    setUserInterests(updatedInterests);
    
    // Add to activity feed
    const newActivity = {
      id: Date.now(),
      action: "Updated skills and interests",
      date: 'Just now'
    };
    setActivityFeed([newActivity, ...activityFeed]);
    
    // Trigger refresh
    setRefreshTrigger(prev => prev + 1);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full h-32 w-32 bg-white bg-opacity-20 mb-4"></div>
          <div className="h-8 w-48 bg-white bg-opacity-20 rounded mb-4"></div>
          <div className="h-4 w-64 bg-white bg-opacity-20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg text-gray-500 p-8 bg-white rounded-lg shadow-lg"
        >
          <p className="mb-4">Please sign in to view your profile.</p>
          <button className="px-4 py-2 bg-primary text-white rounded-lg">Sign In</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
      }}
    >
      {apiError && (
        <div className="max-w-6xl mx-auto mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{apiError}</p>
        </div>
      )}
      
      <motion.div 
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Profile Basics */}
          <motion.div 
            className="bg-white shadow-lg rounded-lg p-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="flex flex-col items-center mb-6" variants={itemVariants}>
              <div className="relative">
                <motion.img
                  src={profilePicture || '/default-profile.png'}
                  alt="Profile Picture"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                <button
                  className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-md hover:bg-opacity-90 transition-all"
                  onClick={() => setIsEditingProfilePicture(true)}
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
              
              <motion.div variants={itemVariants} className="mt-4 text-center">
                <div className="flex items-center justify-center">
                  <h2 className="text-2xl font-bold text-black">
                    {firstName} {lastName}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="ml-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 p-1.5 transition-all"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Contact Information Section - Added and centered */}
            <motion.div variants={itemVariants} className="mb-6 border-t border-b border-gray-200 py-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-black">Contact Information</h3>
                <button
                  onClick={() => setIsEditingContact(true)}
                  className="text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 p-1.5 transition-all"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-black">
                  <FaEnvelope className="text-gray-500 mr-3 w-4 h-4" />
                  <span>{email}</span>
                </div>
                <div className="flex items-center text-black">
                  <FaPhone className="text-gray-500 mr-3 w-4 h-4" />
                  <span>{phoneNumber}</span>
                </div>
                <div className="flex items-center text-black">
                  <FaMapMarkerAlt className="text-gray-500 mr-3 w-4 h-4" />
                  <span>{location}</span>
                </div>
                <div className="flex items-center text-black">
                  <FaCalendarAlt className="text-gray-500 mr-3 w-4 h-4" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mt-2 pb-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-black">Social Profiles</h3>
                <button
                  onClick={() => setIsEditingSocial(true)}
                  className="text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 p-1.5 transition-all"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-3 space-y-3">
                <a href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center text-black hover:text-primary transition-colors">
                  <FaFacebook className="mr-2" /> Facebook
                </a>
                <a href={twitter} target="_blank" rel="noopener noreferrer" className="flex items-center text-black hover:text-primary transition-colors">
                  <FaTwitter className="mr-2" /> Twitter
                </a>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-black">Account Security</h3>
              </div>
              
              <button
                onClick={() => setIsEditingPassword(true)}
                className="mt-3 flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full justify-center"
              >
                <FaLock className="mr-2" /> Change Password
              </button>
            </motion.div>
          </motion.div>
          
          {/* Center Column - Main Content */}
          <motion.div 
            className="bg-white shadow-lg rounded-lg p-6 md:col-span-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-black">About Me</h3>
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 p-1.5 transition-all"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
              
              {isEditingBio ? (
                <div className="mt-3">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-black"
                    rows={4}
                  />
                  <div className="mt-2 flex justify-end gap-3">
                    <motion.button
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-white hover:text-red-500 border border-red-500 transition-colors"
                      onClick={() => setIsEditingBio(false)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                      onClick={handleSaveBio}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Save
                    </motion.button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-black leading-relaxed">
                  {bio || 'No bio available. Click the edit button to add one.'}
                </p>
              )}
            </motion.div>
            
            <motion.div variants={itemVariants} className="mt-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-black">Skills & Interests</h3>
                <button
                  onClick={() => setIsEditingSkills(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
                >
                  <FaEdit className="w-4 h-4" /> Manage Skills & Interests
                </button>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-3">
                    <FaTasks className="text-green-600 mr-2" />
                    <h4 className="text-lg font-medium text-black">Skills</h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {userSkills.length > 0 ? (
                      userSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic">No skills added yet. Click "Manage Skills & Interests" to add some.</p>
                    )}
                  </div>
                </div>
                
                {/* Interests Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-3">
                    <FaLightbulb className="text-blue-600 mr-2" />
                    <h4 className="text-lg font-medium text-black">Interests</h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {userInterests.length > 0 ? (
                      userInterests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic">No interests added yet. Click "Manage Skills & Interests" to add some.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mt-8">
              <h3 className="text-xl font-semibold text-black">Recent Activity</h3>
              
              <div className="mt-3 space-y-4">
                {activityFeed.length > 0 ? (
                  activityFeed.map(activity => (
                    <motion.div 
                      key={activity.id}
                      className="flex items-start border-l-4 border-primary pl-3 py-1"
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <div>
                        <p className="text-black">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No recent activity to display.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {/* Skills Management Modal */}
        {isEditingSkills && (
          <SkillsManagementModal
            isOpen={isEditingSkills}
            onClose={() => setIsEditingSkills(false)}
            onSave={handleSaveSkillsAndInterests}
            userId={session.user.id}
          />
        )}
        
        {/* Edit Password Modal */}
        {isEditingPassword && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-lg p-6 max-w-md w-full"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ 
                type: "tween",
                duration: 0.2,
                ease: "easeOut"
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-black">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <motion.button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg flex-1 border border-red-500 hover:bg-white hover:text-red-500 transition-colors"
                  onClick={() => setIsEditingPassword(false)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="px-4 py-2 bg-primary text-white rounded-lg flex-1"
                  onClick={handleChangePassword}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Update Password
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Contact Information Modal */}
        {isEditingContact && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-lg p-6 max-w-md w-full"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ 
                type: "tween",
                duration: 0.2,
                ease: "easeOut"
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-black">Edit Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Location (City, Country)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <motion.button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg flex-1 border border-red-500 hover:bg-white hover:text-red-500 transition-colors"
                  onClick={() => setIsEditingContact(false)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="px-4 py-2 bg-primary text-white rounded-lg flex-1"
                  onClick={handleSaveContact}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Name Modal */}
        {isEditingName && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-lg p-6 max-w-md w-full"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ 
                type: "tween",
                duration: 0.2,
                ease: "easeOut"
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-black">Edit Name</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                />
              </div>
              <div className="mt-4 flex gap-4">
                <motion.button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg flex-1 border border-red-500 hover:bg-white hover:text-red-500 transition-colors"
                  onClick={() => setIsEditingName(false)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="px-4 py-2 bg-primary text-white rounded-lg flex-1"
                  onClick={handleSaveName}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Profile Picture Modal */}
        {isEditingProfilePicture && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-lg p-6 max-w-md w-full"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ 
                type: "tween",
                duration: 0.2,
                ease: "easeOut"
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-black">Edit Profile Picture</h2>
              
              <div className="mb-6">
                <div className="text-center mb-4">
                  <img 
                    src={profilePicture || '/default-profile.png'} 
                    alt="Preview" 
                    className="w-32 h-32 rounded-full object-cover mx-auto border-2 border-gray-300"
                  />
                </div>
                
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-base font-medium"
                    disabled={isUploading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                    </svg>
                    {isUploading ? 'Uploading...' : 'Choose Image From Device'}
                  </button>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  
                  {isUploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-2 text-gray-400">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-1">Use Image URL</label>
                  <input
                    type="text"
                    placeholder="Enter image URL"
                    value={profilePicture}
                    onChange={(e) => setProfilePicture(e.target.value)}
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <motion.button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg flex-1 mr-2 border border-red-500 hover:bg-white hover:text-red-500 transition-colors"
                  onClick={() => setIsEditingProfilePicture(false)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  className="px-4 py-2 bg-primary text-white rounded-lg flex-1 ml-2"
                  onClick={handleSaveProfilePicture}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isUploading}
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Social Links Modal */}
        {isEditingSocial && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-lg p-6 max-w-md w-full"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ 
                type: "tween",
                duration: 0.2,
                ease: "easeOut"
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-black">Edit Social Links</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Facebook</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 px-3 py-2 rounded-l-lg text-gray-500 border border-r-0">
                      <FaFacebook />
                    </span>
                    <input
                      type="text"
                      placeholder="Facebook URL"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="w-full border p-2 rounded-r-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Twitter</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 px-3 py-2 rounded-l-lg text-gray-500 border border-r-0">
                      <FaTwitter />
                    </span>
                    <input
                      type="text"
                      placeholder="Twitter URL"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="w-full border p-2 rounded-r-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <motion.button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg flex-1 border border-red-500 hover:bg-white hover:text-red-500 transition-colors"
                  onClick={() => setIsEditingSocial(false)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="px-4 py-2 bg-primary text-white rounded-lg flex-1"
                  onClick={handleSaveSocial}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}