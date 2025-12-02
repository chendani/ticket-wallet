
import React from 'react';
import { Event } from '../types';
import EventCard from './EventCard';
import { FilterIcon } from './icons/FilterIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface EventListProps {
  events: Event[];
  onSelectEvent: (eventId: string) => void;
  dateFilter: { start: string | null; end: string | null };
  onDateFilterChange: (filter: { start: string | null; end: string | null }) => void;
  hasAnyEvents: boolean;
  onMergeEvents: (sourceId: string, targetId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventList: React.FC<EventListProps> = ({ events, onSelectEvent, dateFilter, onDateFilterChange, hasAnyEvents, onMergeEvents, onDeleteEvent }) => {
  if (!hasAnyEvents) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">אין לך כרטיסים עדיין</h2>
        <p className="text-gray-400">לחץ על כפתור הפלוס כדי להוסיף את הכרטיס הראשון שלך!</p>
      </div>
    );
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value || null;
    // If there is an end date and the new start date is after it, reset the end date
    // to prevent getting stuck in an invalid range (Start > End) which yields 0 results.
    if (newStart && dateFilter.end && newStart > dateFilter.end) {
        onDateFilterChange({ start: newStart, end: null });
    } else {
        onDateFilterChange({ start: newStart, end: dateFilter.end });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateFilterChange({ start: dateFilter.start, end: e.target.value || null });
  };

  const clearFilter = () => {
    onDateFilterChange({ start: null, end: null });
  };

  // Get start of today (00:00:00) to compare dates without time
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  // Split events into upcoming and past
  // Logic: If event date is today or future -> Upcoming. If before today -> Past.
  // Use 'T00:00:00' to ensure we parse the YYYY-MM-DD string as local time, not UTC.
  const upcomingEvents = events.filter(event => {
      const eventDate = new Date(`${event.date}T00:00:00`);
      return eventDate.getTime() >= todayTime;
  });

  const pastEvents = events.filter(event => {
      const eventDate = new Date(`${event.date}T00:00:00`);
      return eventDate.getTime() < todayTime;
  });

  const renderEventList = (list: Event[], isPast: boolean) => {
      return list.map(event => (
          <EventCard 
              key={event.id} 
              event={event} 
              onSelectEvent={onSelectEvent} 
              isPast={isPast} 
              onMergeEvents={onMergeEvents}
              onDeleteEvent={onDeleteEvent}
          />
      ));
  };

  const isFiltering = !!(dateFilter.start || dateFilter.end);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-4">האירועים שלך</h2>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
              <FilterIcon className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">סינון לפי תאריך</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">מתאריך</label>
                  <input
                      type="date"
                      id="start-date"
                      value={dateFilter.start || ''}
                      onChange={handleStartDateChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                  />
              </div>
              <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-1">עד תאריך</label>
                  <input
                      type="date"
                      id="end-date"
                      value={dateFilter.end || ''}
                      onChange={handleEndDateChange}
                      min={dateFilter.start || ''}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                  />
              </div>
              {isFiltering && (
                  <button
                      onClick={clearFilter}
                      className="bg-gray-600 hover:bg-red-500/80 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 rtl:space-x-reverse transition-colors"
                  >
                      <XCircleIcon className="h-5 w-5" />
                      <span>נקה סינון</span>
                  </button>
              )}
          </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-10 bg-gray-800/50 rounded-lg">
            <h2 className="text-xl font-bold mb-2">לא נמצאו אירועים בטווח התאריכים</h2>
            <p className="text-gray-400">נסה לשנות את התאריכים או <button onClick={clearFilter} className="text-purple-400 hover:underline font-semibold">לנקות את הסינון</button>.</p>
        </div>
      ) : (
        <div className="space-y-8">
            {upcomingEvents.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center">
                        <span className="ml-2 rtl:mr-2 rtl:ml-0">📅</span> אירועים עתידיים
                    </h3>
                    <div className="space-y-4">
                        {renderEventList(upcomingEvents, false)}
                    </div>
                </div>
            )}
            
            {pastEvents.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-gray-400 mb-3 flex items-center">
                        <span className="ml-2 rtl:mr-2 rtl:ml-0">🕰️</span> אירועים שחלפו
                    </h3>
                    <div className="space-y-4">
                        {renderEventList(pastEvents, true)}
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default EventList;
