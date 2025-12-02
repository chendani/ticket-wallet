import React from 'react';
import { XIcon } from './icons/XIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
