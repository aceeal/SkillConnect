// src/app/components/skills-interests-selector.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SkillsSelectorProps {
  title: string;
  selectedItems: string[];
  onSelect: (item: string) => void;
  onRemove: (item: string) => void;
  onAddCustom: (item: string) => void;
  type: 'skills' | 'interests';
}

const SkillsInterestsSelector: React.FC<SkillsSelectorProps> = ({
  title,
  selectedItems,
  onSelect,
  onRemove,
  onAddCustom,
  type
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('IT and Computer Science');
  const [customItem, setCustomItem] = useState('');
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/skill-categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data.categorizedSkills || {});
        
        // Set the first category as selected if available
        const firstCategory = Object.keys(data.categorizedSkills || {})[0];
        if (firstCategory && !selectedCategory) {
          setSelectedCategory(firstCategory);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories. Please try refreshing.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSelectItem = (item: string) => {
    if (selectedItems.includes(item)) {
      onRemove(item);
    } else {
      onSelect(item);
    }
  };

  const handleAddCustom = () => {
    if (customItem.trim() && !selectedItems.includes(customItem.trim())) {
      onAddCustom(customItem.trim());
      setCustomItem('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-black mb-4">{title}</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              {Object.keys(categories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {selectedCategory && categories[selectedCategory]?.map((item) => (
              <button
                key={item}
                onClick={() => handleSelectItem(item)}
                className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition ${
                  selectedItems.includes(item)
                    ? type === 'skills' 
                      ? 'bg-green-500 text-white border-green-500' 
                      : 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-black border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Add Custom {type === 'skills' ? 'Skill' : 'Interest'}
            </label>
            <div className="flex">
              <input
                type="text"
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Other (Specify your ${type === 'skills' ? 'skill' : 'interest'})`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddCustom}
                className={`px-4 py-2 rounded-r-lg font-medium text-white ${
                  type === 'skills' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                disabled={!customItem.trim()}
              >
                Add
              </motion.button>
            </div>
          </div>
          
          {selectedItems.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2 text-gray-700">
                Selected {type === 'skills' ? 'Skills' : 'Interests'}:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((item) => (
                  <div
                    key={item}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                      type === 'skills' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item}
                    <button 
                      className="hover:text-red-500"
                      onClick={() => onRemove(item)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SkillsInterestsSelector;