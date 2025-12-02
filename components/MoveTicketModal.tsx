import React, { useState, useMemo } from 'react';
import { Ticket, Event } from '../types';
import { XIcon } from './icons/XIcon';

interface MoveTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (destination: { eventId: string } | { newEventDetails: Omit<Event, 'id' | 'tickets' | 'reminder'> }) => void;
  ticket: Ticket;
  currentEventId: string;
  allEvents: Event[];
}

const MoveTicketModal: React.FC<MoveTicketModalProps> = ({ isOpen, onClose, onMove, ticket, currentEventId, allEvents }) => {
  const [moveType, setMoveType] = useState<'existing' | 'new'>('existing');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [newEventDetails, setNewEventDetails] = useState({
    name: '',
    date: '',
    time: '',
    location: ''
  });

  const destinationEvents = useMemo(() => {
    return allEvents.filter(e => e.id !== currentEventId);
  }, [allEvents, currentEventId]);

  const canMove = useMemo(() => {
    if (moveType === 'existing') {
      return !!selectedEventId;
    }
    if (moveType === 'new') {
      return newEventDetails.name.trim() !== '' && newEventDetails.date.trim() !== '';
    }
    return false;
  }, [moveType, selectedEventId, newEventDetails]);
  
  const handleMove = () => {
    if (!canMove) return;

    if (moveType === 'existing') {
      onMove({ eventId: selectedEventId });
    } else {
      onMove({ newEventDetails });
    }
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEventDetails({ ...newEventDetails, [e.target.name]: e.target.value });
  };
  
  if (!isOpen) return null;

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
          <h2 className="text-2xl font-bold text-white">העברת כרטיס</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-300 mb-6">
          העבר את הכרטיס <span className="font-bold text-purple-300">{ticket.type}</span> לאירוע אחר.
        </p>
        
        <div className="space-y-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                    <input type="radio" name="moveType" value="existing" checked={moveType === 'existing'} onChange={() => setMoveType('existing')} className="form-radio text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500" />
                    <span className="text-white">לאירוע קיים</span>
                </label>
                <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                    <input type="radio" name="moveType" value="new" checked={moveType === 'new'} onChange={() => setMoveType('new')} className="form-radio text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500"/>
                    <span className="text-white">לאירוע חדש</span>
                </label>
            </div>

            {moveType === 'existing' ? (
                <div>
                    <label htmlFor="event-select" className="block text-sm font-medium text-gray-300 mb-1">בחר אירוע יעד</label>
                    <select
                        id="event-select"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                        disabled={destinationEvents.length === 0}
                    >
                        <option value="">{destinationEvents.length > 0 ? 'בחר...' : 'אין אירועים אחרים'}</option>
                        {destinationEvents.map(event => (
                            <option key={event.id} value={event.id}>{event.name} - {new Date(event.date).toLocaleDateString('he-IL')}</option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="space-y-3 p-4 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-white">פרטי האירוע החדש</h3>
                    <div>
                        <label htmlFor="eventName" className="block text-sm font-medium text-gray-300 mb-1">שם האירוע</label>
                        <input type="text" name="name" id="eventName" value={newEventDetails.name} onChange={handleDetailChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="eventDate" className="block text-sm font-medium text-gray-300 mb-1">תאריך</label>
                            <input type="date" name="date" id="eventDate" value={newEventDetails.date} onChange={handleDetailChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" required />
                        </div>
                        <div>
                            <label htmlFor="eventTime" className="block text-sm font-medium text-gray-300 mb-1">שעה</label>
                            <input type="time" name="time" id="eventTime" value={newEventDetails.time} onChange={handleDetailChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-300 mb-1">מיקום</label>
                        <input type="text" name="location" id="eventLocation" value={newEventDetails.location} onChange={handleDetailChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                </div>
            )}
        </div>

        <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleMove}
            disabled={!canMove}
            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            העבר כרטיס
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveTicketModal;
