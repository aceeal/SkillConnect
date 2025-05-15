'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { FaUser, FaMapMarkerAlt, FaCalendarAlt, FaEnvelope, FaPhone, FaFacebook, FaTwitter, FaComment } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function ViewProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  
  const [profileData, setProfileData] = useState<any>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  
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

  useEffect(() => {
    // Add debugging information
    console.log('ViewProfilePage loaded');
    console.log('Status:', status);
    console.log('Session:', session);
    console.log('User ID parameter:', userId);

    if (status === 'authenticated' && session?.user && userId) {
      if (session.user.id?.toString() === userId) {
        setIsCurrentUser(true);
        router.push('/profile');
        return;
      }
      fetchProfileData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, userId, router]);

  const fetchProfileData = async () => {
    console.log('Fetching profile data for user ID:', userId);
    setIsLoading(true);
    try {
      // Use the original API endpoint since that's what's set up in your system
      const response = await fetch(`/api/users/${userId}`);
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        } else {
          throw new Error('Failed to fetch profile data');
        }
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      setUserSettings(data.settings || {});
      
      if (data.profile) {
        // Add default values to ensure consistent display
        const enhancedProfile = {
          ...data.profile,
          phoneNumber: data.profile.phoneNumber || 'Not provided',
          location: data.profile.location || 'Not provided',
          socialMedia: data.profile.socialMedia || {},
        };
        
        // Ensure socialMedia has facebook and twitter properties
        if (enhancedProfile.socialMedia) {
          enhancedProfile.socialMedia.facebook = enhancedProfile.socialMedia.facebook || '';
          enhancedProfile.socialMedia.twitter = enhancedProfile.socialMedia.twitter || '';
        }
        
        setProfileData(enhancedProfile);
      } else {
        setProfileData(null);
      }
      
      // Debug the settings
      console.log('User settings received:', data.settings);
      console.log('Profile visibility:', data.settings?.profileVisibility);
      
      setError(null);
    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle send message - uses the global mechanisms to open the existing chat bubble
  const handleSendMessage = () => {
    if (!canSendMessage()) {
      alert('This user does not allow messages');
      return;
    }

    if (!profileData) return;

    // Try to use the global openChatWithUser function if it exists
    if (typeof window !== 'undefined') {
      if (window.openChatWithUser) {
        window.openChatWithUser(
          String(userId),
          `${profileData.firstName} ${profileData.lastName}`,
          profileData.profilePicture || '/default-profile.png'
        );
      } else {
        // Fallback: Dispatch a custom event that the chat component listens for
        const event = new CustomEvent('openChat', {
          detail: {
            userId: String(userId),
            userName: `${profileData.firstName} ${profileData.lastName}`,
            userImage: profileData.profilePicture || '/default-profile.png'
          }
        });
        window.dispatchEvent(event);
        
        // Also store in localStorage as an extra fallback
        localStorage.setItem('pendingChatUser', JSON.stringify({
          id: String(userId),
          name: `${profileData.firstName} ${profileData.lastName}`,
          profilePicture: profileData.profilePicture || '/default-profile.png',
          status: profileData.status || 'offline'
        }));
        
        console.log(`Messaging user ${userId} (${profileData.firstName} ${profileData.lastName})`);
      }
    }
  };

  const isProfileVisible = () => {
    console.log('Checking profile visibility with settings:', userSettings);
    
    // If we don't have settings yet, consider profile not visible
    if (!userSettings) return false;
    
    // Check both property naming conventions (camelCase and snake_case)
    const visibility = userSettings.profileVisibility || userSettings.profile_visibility;
    console.log('Profile visibility value:', visibility);
    
    // Return true only if explicitly set to 'all'
    return visibility === 'all';
  };

  const isContentVisible = (contentType: string) => {
    if (!userSettings) return false;
    
    switch (contentType) {
      case 'skills':
        return (userSettings.showSkills !== false && userSettings.showSkills !== 0) || 
               (userSettings.show_skills !== false && userSettings.show_skills !== 0);
      case 'interests':
        return (userSettings.showInterests !== false && userSettings.showInterests !== 0) || 
               (userSettings.show_interests !== false && userSettings.show_interests !== 0);
      default:
        return true;
    }
  };

  const canSendMessage = () => {
    if (!userSettings) return false;
    
    // Check both property naming conventions
    const messagePermission = userSettings.allowMessages || userSettings.allow_messages;
    return messagePermission === 'all';
  };

  // Show loading state - matching your profile page style
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full h-32 w-32 bg-white bg-opacity-20 mb-4"></div>
          <div className="h-8 w-48 bg-white bg-opacity-20 rounded mb-4"></div>
          <div className="h-4 w-64 bg-white bg-opacity-20 rounded"></div>
          <div className="mt-4 text-white font-bold">Loading profile...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-black mb-4">Error</h2>
          <p className="text-black mb-6">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check if we have the settings but profile is not visible
  if (userSettings && !isProfileVisible()) {
    console.log('Profile is set to private. Showing private profile message.');
    return (
      <div className="min-h-screen p-6 flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FaUser className="text-black w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-4">Private Profile</h2>
          <p className="text-black mb-6">
            This user has set their profile to private. You cannot view their information.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show loading message if we don't have profile data yet
  if (!profileData) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-black mb-4">No Profile Data</h2>
          <p className="text-black mb-6">
            This profile couldn't be loaded or doesn't exist.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show the normal profile if everything is loaded and profile is visible
  return (
    <div className="min-h-screen p-6" 
         style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
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
                  src={profileData.profilePicture || '/default-profile.png'}
                  alt="Profile Picture"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </div>
              
              <motion.div variants={itemVariants} className="mt-4 text-center">
                <h2 className="text-2xl font-bold text-black">
                  {profileData.firstName} {profileData.lastName}
                </h2>
              </motion.div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mb-6 border-t border-b border-gray-200 py-4">
              <h3 className="text-lg font-semibold text-black mb-3">Contact Information</h3>
              
              <div className="space-y-2">
                {profileData.email && (
                  <div className="flex items-center text-black">
                    <FaEnvelope className="text-black mr-3 w-4 h-4" />
                    <span>{profileData.email}</span>
                  </div>
                )}
                
                {/* Always show phone number */}
                <div className="flex items-center text-black">
                  <FaPhone className="text-black mr-3 w-4 h-4" />
                  <span>{profileData.phoneNumber}</span>
                </div>
                
                {/* Always show location */}
                <div className="flex items-center text-black">
                  <FaMapMarkerAlt className="text-black mr-3 w-4 h-4" />
                  <span>{profileData.location}</span>
                </div>
                
                {profileData.joinDate && (
                  <div className="flex items-center text-black">
                    <FaCalendarAlt className="text-black mr-3 w-4 h-4" />
                    <span>Joined {profileData.joinDate}</span>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Always show social media section */}
            <motion.div variants={itemVariants} className="mt-2 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-3">Social Profiles</h3>
              
              <div className="mt-3 space-y-3">
                {profileData.socialMedia?.facebook && (
                  <a href={profileData.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center text-black hover:text-primary transition-colors">
                    <FaFacebook className="mr-2" /> Facebook
                  </a>
                )}
                
                {profileData.socialMedia?.twitter && (
                  <a href={profileData.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center text-black hover:text-primary transition-colors">
                    <FaTwitter className="mr-2" /> Twitter
                  </a>
                )}
                
                {(!profileData.socialMedia?.facebook && !profileData.socialMedia?.twitter) && (
                  <p className="text-black italic">No social profiles linked</p>
                )}
              </div>
            </motion.div>
            
            {canSendMessage() && (
              <motion.div variants={itemVariants} className="mt-6">
                <button
                  onClick={handleSendMessage}
                  className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <FaComment className="mr-2" /> Send Message
                </button>
              </motion.div>
            )}
          </motion.div>
          
          {/* Center Column - Main Content */}
          <motion.div 
            className="bg-white shadow-lg rounded-lg p-6 md:col-span-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-semibold text-black">About Me</h3>
              <p className="mt-3 text-black leading-relaxed">
                {profileData.bio || 'No bio available.'}
              </p>
            </motion.div>
            
            {isContentVisible('skills') && (
              <motion.div variants={itemVariants} className="mt-8">
                <h3 className="text-xl font-semibold text-black">Skills</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profileData.skills && profileData.skills.length > 0 ? (
                    profileData.skills.map((skill: string, index: number) => (
                      <motion.span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-black rounded-full text-sm"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -2 }}
                      >
                        {skill}
                      </motion.span>
                    ))
                  ) : (
                    <p className="text-black italic">No skills listed.</p>
                  )}
                </div>
              </motion.div>
            )}
            
            {isContentVisible('interests') && (
              <motion.div variants={itemVariants} className="mt-8">
                <h3 className="text-xl font-semibold text-black">Interests</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profileData.interests && profileData.interests.length > 0 ? (
                    profileData.interests.map((interest: string, index: number) => (
                      <motion.span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-black rounded-full text-sm"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -2 }}
                      >
                        {interest}
                      </motion.span>
                    ))
                  ) : (
                    <p className="text-black italic">No interests listed.</p>
                  )}
                </div>
              </motion.div>
            )}
            
            <motion.div variants={itemVariants} className="mt-8">
              <h3 className="text-xl font-semibold text-black">Recent Activity</h3>
              <div className="mt-3 space-y-4">
                {profileData.recentActivities && profileData.recentActivities.length > 0 ? (
                  profileData.recentActivities.map((activity: any) => (
                    <motion.div 
                      key={activity.id}
                      className="flex items-start border-l-4 border-primary pl-3 py-1"
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <div>
                        <p className="text-black">{activity.description}</p>
                        <p className="text-xs text-black">
                          {activity.date}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-black italic">No recent activity to display.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}