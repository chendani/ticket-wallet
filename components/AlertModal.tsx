
import React from 'react';
import { XIcon } from './icons/XIcon';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm border border-red-500/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">שגיאה</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
