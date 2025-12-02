
import React, { useState, useMemo, useEffect } from 'react';
import { Event, Ticket } from '../types';
import TicketCard from './TicketCard';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { BellIcon } from './icons/BellIcon';
import TicketDetailModal from './TicketDetailModal';
import EditTicketModal from './EditTicketModal';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { CalendarPlusIcon } from './icons/CalendarPlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import ConfirmationModal from './ConfirmationModal';
import MoveTicketModal from './MoveTicketModal';

type EditableEvent = Partial<Pick<Event, 'name' | 'date' | 'time' | 'location'>>;

interface EventDetailProps {
  event: Event;
  allEvents: Event[];
  onBack: () => void;
  onDeleteTicket: (eventId: string, ticketId: string) => void;
  onSetReminder: (eventId: string, reminder: Event['reminder']) => void;
  onUpdateEvent: (eventId: string, updatedData: EditableEvent) => void;
  onUpdateTicket: (eventId: string, updatedTicket: Ticket) => void;
  onMoveTicket: (sourceEventId: string, ticketId: string, destination: { eventId: string } | { newEventDetails: Omit<Event, 'id' | 'tickets' | 'reminder'> }) => void;
}

const getTicketTypeColor = (type: string): string => {
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Ensure 32bit integer
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 60%)`;
};

const createGoogleCalendarLink = (event: Event): string => {
    const title = encodeURIComponent(event.name);
    const location = encodeURIComponent(event.location);
    
    if (!event.date) return '';

    try {
      const startTime = new Date(`${event.date}T${event.time || '00:00:00'}`);
      // Assume 2 hour duration if no end time is specified
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const formatDate = (date: Date) => date.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

      const dates = `${formatDate(startTime)}/${formatDate(endTime)}`;
      
      const details = encodeURIComponent(`כרטיס לאירוע: ${event.name}`);

      return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;

    } catch(e) {
      console.error("Error creating calendar link", e);
      return '';
    }
};


const EventDetail: React.FC<EventDetailProps> = ({ event, allEvents, onBack, onDeleteTicket, onSetReminder, onUpdateEvent, onUpdateTicket, onMoveTicket }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [ticketToMove, setTicketToMove] = useState<Ticket | null>(null);
  const [carouselIndexes, setCarouselIndexes] = useState<Record<string, number>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<EditableEvent>({
    name: event.name,
    date: event.date,
    time: event.time,
    location: event.location,
  });
  
  const eventDate = new Date(event.date);

  const formattedDate = eventDate.toLocaleString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const wazeLink = `https://waze.com/ul?q=${encodeURIComponent(event.location)}`;
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
  const googleCalendarLink = useMemo(() => createGoogleCalendarLink(event), [event]);

  const handleReminderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Event['reminder'];
    onSetReminder(event.id, value);
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedEvent({ ...editedEvent, [e.target.name]: e.target.value });
  };
  
  const handleSaveChanges = () => {
    onUpdateEvent(event.id, editedEvent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedEvent({
        name: event.name,
        date: event.date,
        time: event.time,
        location: event.location,
    });
  };

  const groupedTickets = useMemo(() => {
    return event.tickets.reduce((acc, ticket) => {
      const key = ticket.type || 'ללא סוג';
      (acc[key] = acc[key] || []).push(ticket);
      return acc;
    }, {} as Record<string, Ticket[]>);
  }, [event.tickets]);

  useEffect(() => {
    const initialIndexes: Record<string, number> = {};
    if (event) {
        Object.keys(groupedTickets).forEach(type => {
            initialIndexes[type] = 0;
        });
    }
    setCarouselIndexes(initialIndexes);
  }, [event, groupedTickets]);

  const handleCarouselNav = (type: string, direction: 'next' | 'prev') => {
    const ticketCount = groupedTickets[type]?.length || 0;
    setCarouselIndexes(prev => {
        const currentIndex = prev[type] || 0;
        let newIndex = currentIndex;
        if (direction === 'next') {
            newIndex = Math.min(currentIndex + 1, ticketCount - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }
        return { ...prev, [type]: newIndex };
    });
  };

  const handleConfirmDelete = () => {
    if (ticketToDelete) {
      onDeleteTicket(event.id, ticketToDelete.id);
      setTicketToDelete(null);
    }
  };
  
  const handleConfirmMove = (destination: { eventId: string } | { newEventDetails: Omit<Event, 'id' | 'tickets' | 'reminder'> }) => {
    if (ticketToMove) {
      onMoveTicket(event.id, ticketToMove.id, destination);
      setTicketToMove(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center space-x-2 rtl:space-x-reverse text-purple-400 hover:text-purple-300 mb-6">
        <ArrowRightIcon className="h-5 w-5" />
        <span>חזור לרשימת האירועים</span>
      </button>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        {!isEditing ? (
            <>
                <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">{event.name}</h2>
                    <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" aria-label="ערוך פרטי אירוע">
                        <PencilIcon className="h-5 w-5"/>
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center text-gray-300 space-y-2 sm:space-y-0 sm:space-x-6 rtl:space-x-reverse mb-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CalendarIcon className="h-5 w-5 text-purple-400"/>
                        <span>{formattedDate}{event.time ? ` בשעה ${event.time}` : ''}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <LocationMarkerIcon className="h-5 w-5 text-purple-400"/>
                          <span>{event.location}</span>
                      </div>
                    )}
                </div>
            </>
        ) : (
            <div className="space-y-4">
                <div>
                    <label htmlFor="eventName" className="block text-sm font-medium text-gray-300 mb-1">שם האירוע</label>
                    <input type="text" name="name" id="eventName" value={editedEvent.name} onChange={handleEditChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-300 mb-1">תאריך</label>
                        <input type="date" name="date" id="eventDate" value={editedEvent.date} onChange={handleEditChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                    <div>
                        <label htmlFor="eventTime" className="block text-sm font-medium text-gray-300 mb-1">שעה</label>
                        <input type="time" name="time" id="eventTime" value={editedEvent.time} onChange={handleEditChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-300 mb-1">מיקום</label>
                    <input type="text" name="location" id="eventLocation" value={editedEvent.location} onChange={handleEditChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2">
                    <button onClick={handleCancelEdit} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">ביטול</button>
                    <button onClick={handleSaveChanges} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">שמור שינויים</button>
                </div>
            </div>
        )}
        
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-700 mt-4">
              {event.location && (
                <>
                  <a href={wazeLink} target="_blank" rel="noopener noreferrer" className="bg-blue-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors">נווט עם Waze</a>
                  <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">נווט עם Google Maps</a>
                </>
              )}
              {googleCalendarLink && (
                  <a href={googleCalendarLink} target="_blank" rel="noopener noreferrer" className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-white transition-colors flex items-center space-x-2 rtl:space-x-reverse">
                    <CalendarPlusIcon className="h-5 w-5"/>
                    <span>הוסף ליומן Google</span>
                  </a>
              )}
          </div>
        
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <BellIcon className="h-6 w-6 text-purple-400"/>
          <h3 className="text-xl font-bold text-white">תזכורת</h3>
        </div>
        <p className="text-gray-400 mt-2 mb-4">קבל התראה לפני שהאירוע מתחיל.</p>
        <div className="max-w-xs">
          <select
            value={event.reminder || 'none'}
            onChange={handleReminderChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
            aria-label="הגדר תזכורת לאירוע"
          >
            <option value="none">ללא תזכורת</option>
            <option value="1h">שעה לפני</option>
            <option value="2h">שעתיים לפני</option>
            <option value="1d">יום לפני</option>
            <option value="2d">יומיים לפני</option>
          </select>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-4">הכרטיסים שלך לאירוע</h3>
        {Object.entries(groupedTickets).map(([type, tickets]: [string, Ticket[]]) => {
          const color = getTicketTypeColor(type);
          const currentIndex = carouselIndexes[type] || 0;
          return (
            <div key={type} className="mb-6 bg-gray-800/50 rounded-lg p-4 shadow-inner">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
                    <h4 className="text-xl font-bold" style={{ color }}>
                        {type}
                    </h4>
                    {tickets.length > 1 && (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                            onClick={() => handleCarouselNav(type, 'prev')}
                            disabled={currentIndex === 0}
                            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            aria-label="הכרטיס הקודם"
                        >
                            <ChevronRightIcon className="h-5 w-5 text-white" />
                        </button>
                        <span className="text-gray-300 font-mono text-sm w-12 text-center">{currentIndex + 1}/{tickets.length}</span>
                        <button
                            onClick={() => handleCarouselNav(type, 'next')}
                            disabled={currentIndex === tickets.length - 1}
                            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            aria-label="הכרטיס הבא"
                        >
                            <ChevronLeftIcon className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    )}
                </div>
                
                <div className="relative overflow-hidden">
                  <div 
                      className="flex transition-transform duration-300 ease-in-out"
                      // RTL fix: use positive value to shift content to the right (showing left content)
                      style={{ transform: `translateX(${currentIndex * 100}%)` }}
                  >
                      {tickets.map(ticket => (
                          <div key={ticket.id} className="w-full flex-shrink-0">
                              <TicketCard 
                                  ticket={ticket} 
                                  onView={() => setSelectedTicket(ticket)}
                                  onDelete={() => setTicketToDelete(ticket)}
                                  onEdit={() => setTicketToEdit(ticket)}
                                  onMove={() => setTicketToMove(ticket)}
                              />
                          </div>
                      ))}
                  </div>
                </div>
            </div>
          )
        })}

      {ticketToEdit && (
        <EditTicketModal
          ticket={ticketToEdit}
          onClose={() => setTicketToEdit(null)}
          onSave={(updatedTicket) => {
            onUpdateTicket(event.id, updatedTicket);
            setTicketToEdit(null);
          }}
        />
      )}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onEdit={() => {
              setTicketToEdit(selectedTicket);
              setSelectedTicket(null);
          }}
        />
      )}
      {ticketToMove && (
        <MoveTicketModal
          isOpen={!!ticketToMove}
          onClose={() => setTicketToMove(null)}
          onMove={handleConfirmMove}
          ticket={ticketToMove}
          currentEventId={event.id}
          allEvents={allEvents}
        />
      )}
      <ConfirmationModal
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="אישור מחיקת כרטיס"
        message="האם אתה בטוח שברצונך למחוק את הכרטיס הזה? לא ניתן לשחזר פעולה זו."
      />
    </div>
  );
};

export default EventDetail;
