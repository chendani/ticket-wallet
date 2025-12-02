
import React from 'react';
import { Event } from '../types';
import { BellIcon } from './icons/BellIcon';

interface ReminderModalProps {
  event: Event | null;
  onClose: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm border border-purple-500 relative">
        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 text-purple-400">
          <BellIcon className="h-8 w-8" />
          <h2 className="text-2xl font-bold text-white">תזכורת לאירוע!</h2>
        </div>
        
        <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
            <p className="text-gray-300 flex flex-col space-y-1">
                <span>{formattedDate}</span>
                {event.time && <span>בשעה: {event.time}</span>}
                {event.location && <span>מיקום: {event.location}</span>}
            </p>
            <p className="mt-4 text-sm text-gray-400">
                האירוע מתקרב. אל תשכח את הכרטיסים!
            </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all transform hover:scale-105"
        >
          תודה על התזכורת
        </button>
      </div>
    </div>
  );
};

export default ReminderModal;
