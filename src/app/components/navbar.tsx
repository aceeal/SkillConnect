'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;
  const isLoading = status === 'loading';
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState('/default-profile.png');
  
  const dropdownRef = useRef(null);
  const imageLoaded = useRef(false);

  // Fetch the user's profile data to get the correct image URL
  useEffect(() => {
    if (user && user.id && !imageLoaded.current) {
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/user');
          if (response.ok) {
            const userData = await response.json();
            if (userData.profilePicture) {
              setProfileImage(userData.profilePicture);
              imageLoaded.current = true;
            } else if (user.image) {
              setProfileImage(user.image);
              imageLoaded.current = true;
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          if (user.image) {
            setProfileImage(user.image);
          }
        }
      };
      
      fetchUserData();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout with proper URL preservation
  const handleLogout = async () => {
    try {
      // Get the current URL
      const currentUrl = window.location.href;
      
      // Extract the protocol and host to construct the base URL
      const urlObj = new URL(currentUrl);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      
      // Sign out with the proper callbackUrl that preserves the protocol
      await signOut({ 
        redirect: false
      });
      
      // Manually redirect to the home page with the same protocol
      window.location.href = baseUrl;
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback in case of error
      router.push('/');
    }
  };

  // Force reload profile image when navigating to profile page
  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    imageLoaded.current = false; // Reset the image loaded flag to fetch fresh data next time
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex justify-between items-center">
        {/* Left Side: Logo and Title - Always render this */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.png"
              alt="SkillConnect Logo"
              width={32}
              height={32}
              className="rounded-full transition-transform duration-300 group-hover:scale-105"
            />
            <span className="ml-3 text-xl font-bold text-gray-800 font-poppins group-hover:text-blue-600 transition-colors duration-300">
              SkillConnect
            </span>
          </Link>
        </div>

        {/* Right Side: Navigation Links */}
        <div className="flex items-center space-x-8">
          <Link
            href="/"
            className="text-gray-800 hover:text-blue-600 font-medium transition duration-300 relative group"
          >
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          {/* Show placeholder or actual dashboard link */}
          {isLoading ? (
            <div className="inline-block font-medium text-gray-300 animate-pulse">Dashboard</div>
          ) : (
            user && (
              <Link
                href={user.role === 'admin' ? "/admin-dashboard" : "/dashboard"}
                className="text-gray-800 hover:text-blue-600 font-medium transition duration-300 relative group"
              >
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )
          )}

          {/* Profile or Login Button - Show placeholder during loading */}
          {isLoading ? (
            <div className="flex items-center">
              {/* We don't know yet if user is logged in, so show both possibilities with visibility toggle */}
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          ) : user ? (
            <div className="relative h-full flex items-center" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="focus:outline-none transition-transform duration-300 hover:scale-105 h-8 w-8 flex items-center justify-center"
                aria-label="Open user menu"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-profile.png';
                    }}
                  />
                </div>
              </button>

              {/* Fixed Dropdown Menu Positioning */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                      onClick={handleProfileClick}
                    >
                      <FiUser className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FiSettings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </div>
                  
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <FiLogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-gray-800 hover:text-white hover:bg-blue-600 font-medium rounded-md transition duration-300 border border-gray-200 hover:border-blue-600"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}