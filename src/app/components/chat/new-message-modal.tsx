// src/app/components/chat/new-meesage-modal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { BiSearch } from 'react-icons/bi';

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  status?: string;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  onSelectUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users from the database when modal opens
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/users?filter=all');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        
        if (data.users && Array.isArray(data.users)) {
          const formattedUsers: User[] = data.users.map((user: any) => ({
            id: String(user.id),
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture || '/default-profile.png',
            status: user.status
          }));
          
          setUsers(formattedUsers);
          setFilteredUsers(formattedUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle user selection
  const handleSelectUser = (user: User) => {
    onSelectUser(user);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white text-gray-800 w-full max-w-md rounded-xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-primary text-white">
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes />
          </button>
          <h2 className="text-xl font-bold">New message</h2>
          <div className="w-5"></div> {/* Empty div for spacing balance */}
        </div>
        
        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative flex items-center">
            <BiSearch className="absolute left-3 text-gray-500 text-lg" />
            <input
              type="text"
              placeholder="Search people"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-gray-100 border-0 rounded-full py-2 pl-10 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        {/* User list */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? `No users found matching "${searchQuery}"` : "No users available"}
            </div>
          ) : (
            <div>
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200"
                >
                  <div className="relative mr-3">
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-profile.png';
                      }}
                    />
                    {user.status === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewMessageModal;