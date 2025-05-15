// src/app/components/report-modal.tsx
import React, { useState } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface ReportModalProps {
  remoteUserName: string;
  reportReason: string;
  setReportReason: React.Dispatch<React.SetStateAction<string>>;
  submitReport: () => void;
  closeReportModal: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  remoteUserName,
  reportReason,
  setReportReason,
  submitReport,
  closeReportModal
}) => {
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <FaExclamationTriangle className="text-red-500 w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Report User</h2>
          </div>
          <button 
            onClick={closeReportModal}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <span className="text-gray-600">You are reporting:</span> 
            <span className="font-semibold ml-1 text-blue-600">{remoteUserName}</span>
          </div>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for reporting
          </label>
          <select 
            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all text-black"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            <option value="" className="text-black">-- Select a reason --</option>
            <option value="inappropriate_behavior" className="text-black">Inappropriate Behavior</option>
            <option value="harassment" className="text-black">Harassment or Bullying</option>
            <option value="hate_speech" className="text-black">Hate Speech</option>
            <option value="inappropriate_content" className="text-black">Inappropriate Content</option>
            <option value="spam" className="text-black">Spam or Scam</option>
            <option value="other" className="text-black">Other</option>
          </select>
        </div>
        
        {(reportReason === 'other' || reportReason === 'inappropriate_behavior') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional details
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all text-black"
              rows={4}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Please provide more details about the issue..."
            ></textarea>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mb-6">
          Our team will review this report and take appropriate action in accordance with our community guidelines. Thank you for helping keep our platform safe.
        </div>
        
        <div className="flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={closeReportModal}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={submitReport}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
            disabled={!reportReason}
          >
            Submit Report
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportModal;