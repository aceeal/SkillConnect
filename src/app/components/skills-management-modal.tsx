// src/app/components/skills-management-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SkillsInterestsSelector from './skills-interests-selector';

interface SkillsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (skills: string[], interests: string[]) => void;
  userId: string | number;
}

const SkillsManagementModal: React.FC<SkillsManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userId
}) => {
  const [activeTab, setActiveTab] = useState('skills');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch skills
      const skillsResponse = await fetch(`/api/user-skills?userId=${userId}`);
      if (!skillsResponse.ok) {
        throw new Error('Failed to fetch skills');
      }
      const skillsData = await skillsResponse.json();
      setSkills(skillsData.skills || []);

      // Fetch interests
      const interestsResponse = await fetch(`/api/user-interests?userId=${userId}`);
      if (!interestsResponse.ok) {
        throw new Error('Failed to fetch interests');
      }
      const interestsData = await interestsResponse.json();
      setInterests(interestsData.interests || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      // Save skills
      const skillsResponse = await fetch('/api/user-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skills }),
      });

      if (!skillsResponse.ok) {
        throw new Error('Failed to save skills');
      }

      // Save interests
      const interestsResponse = await fetch('/api/user-interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interests }),
      });

      if (!interestsResponse.ok) {
        throw new Error('Failed to save interests');
      }

      // Call the onSave callback with updated data
      onSave(skills, interests);
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAddInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">Manage Skills & Interests</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'skills'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('skills')}
            >
              Skills
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'interests'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('interests')}
            >
              Interests
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'skills' ? (
                <SkillsInterestsSelector
                  title="What skills do you have to teach others?"
                  selectedItems={skills}
                  onSelect={handleAddSkill}
                  onRemove={handleRemoveSkill}
                  onAddCustom={handleAddSkill}
                  type="skills"
                />
              ) : (
                <SkillsInterestsSelector
                  title="What are you interested in learning?"
                  selectedItems={interests}
                  onSelect={handleAddInterest}
                  onRemove={handleRemoveInterest}
                  onAddCustom={handleAddInterest}
                  type="interests"
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center">
                <span className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></span>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SkillsManagementModal;