
import React, { useState } from 'react';
import { Event } from '../types';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { TicketIcon } from './icons/TicketIcon';
import { TrashIcon } from './icons/TrashIcon';

interface EventCardProps {
  event: Event;
  onSelectEvent: (eventId: string) => void;
  isPast: boolean;
  onMergeEvents: (sourceId: string, targetId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onSelectEvent, isPast, onMergeEvents, onDeleteEvent }) => {
  const [isOver, setIsOver] = useState(false);
  const eventDate = new Date(event.date);
  const day = eventDate.toLocaleDateString('he-IL', { day: '2-digit' });
  const month = eventDate.toLocaleDateString('he-IL', { month: 'short' });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('sourceEventId', event.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const sourceId = e.dataTransfer.getData('sourceEventId');
    if (sourceId && sourceId !== event.id) {
        onMergeEvents(sourceId, event.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      onDeleteEvent(event.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-gray-800 rounded-lg shadow-lg p-5 cursor-pointer transition-all duration-300 border 
        ${isOver ? 'border-purple-400 bg-gray-700 ring-2 ring-purple-500 scale-[1.02]' : 'border-transparent hover:border-purple-500 hover:shadow-purple-500/30 hover:bg-gray-700/50'}
        ${isPast ? 'opacity-60' : ''}`}
      onClick={() => onSelectEvent(event.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 rtl:space-x-reverse pointer-events-none">
          <div className="text-center bg-gray-700 rounded-lg p-3 w-16">
            <div className="text-sm font-bold text-pink-400">{month}</div>
            <div className="text-2xl font-extrabold text-white">{day}</div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{event.name}</h3>
            <div className="flex items-center text-sm text-gray-400 mt-1 space-x-2 rtl:space-x-reverse">
              {event.time && <><CalendarIcon className="h-4 w-4" /><span>{event.time}</span></>}
              {event.time && event.location && <span className="text-gray-600">|</span>}
              {event.location && <><LocationMarkerIcon className="h-4 w-4" /><span>{event.location}</span></>}
            </div>
            <div className="mt-2 flex items-center text-purple-400 text-sm font-semibold space-x-2 rtl:space-x-reverse">
              <TicketIcon className="h-4 w-4" />
              <span>{event.tickets.length} {event.tickets.length === 1 ? 'כרטיס' : 'כרטיסים'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
             <button 
                onClick={handleDeleteClick}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors z-10"
                title="מחק אירוע"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
            <ChevronLeftIcon className="h-6 w-6 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default EventCard;
