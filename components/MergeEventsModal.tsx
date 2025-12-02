
import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { Event } from '../types';

interface MergeEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  sourceEvent: Event | null;
  targetEvent: Event | null;
  suggestedName: string;
}

const MergeEventsModal: React.FC<MergeEventsModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  sourceEvent, 
  targetEvent, 
  suggestedName 
}) => {
  const [mergedName, setMergedName] = useState(suggestedName);

  // Update local state when suggestedName changes
  React.useEffect(() => {
    setMergedName(suggestedName);
  }, [suggestedName]);

  if (!isOpen || !sourceEvent || !targetEvent) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">איחוד אירועים</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        <p className="text-gray-300 mb-4">
          האם ברצונך לאחד את האירוע <span className="font-bold text-purple-400">"{sourceEvent.name}"</span> לתוך האירוע <span className="font-bold text-purple-400">"{targetEvent.name}"</span>?
        </p>
        
        <p className="text-sm text-gray-400 mb-4">
          כל הכרטיסים יאוחדו תחת אירוע אחד. בחר שם לאירוע המאוחד:
        </p>

        <div className="mb-6">
            <label htmlFor="mergedName" className="block text-sm font-medium text-gray-300 mb-1">שם האירוע המאוחד</label>
            <input 
                type="text" 
                id="mergedName"
                value={mergedName}
                onChange={(e) => setMergedName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
            />
        </div>

        <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={() => onConfirm(mergedName)}
            disabled={!mergedName.trim()}
            className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            אחד אירועים
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeEventsModal;
