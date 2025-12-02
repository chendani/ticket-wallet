
import React, { useState, useMemo, useEffect } from 'react';
import { Event, Ticket, NewTicketPayload, User } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Header from './components/Header';
import EventList from './components/EventList';
import AddTicketFlow from './components/AddTicketFlow';
import EventDetail from './components/EventDetail';
import { PlusIcon } from './components/icons/PlusIcon';
import MergeEventsModal from './components/MergeEventsModal';
import ReminderModal from './components/ReminderModal';
import AlertModal from './components/AlertModal';
import ConfirmationModal from './components/ConfirmationModal';
import LoginScreen from './components/auth/LoginScreen';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import Loader from './components/Loader';

const reminderOptions: { [key: string]: number } = {
  '1h': 60,
  '2h': 120,
  '1d': 24 * 60,
  '2d': 48 * 60,
};

// Function to find common significant words between two strings
const doNamesMatch = (name1: string, name2: string): boolean => {
    if (!name1 || !name2) return false;
    const words1 = new Set(name1.toLowerCase().split(' ').filter(w => w.length > 3));
    const words2 = new Set(name2.toLowerCase().split(' ').filter(w => w.length > 3));
    if (words1.size === 0 || words2.size === 0) {
        return name1.toLowerCase() === name2.toLowerCase();
    }
    for (const word of words1) {
        if (words2.has(word)) {
            return true;
        }
    }
    return false;
};

// Helper to extract a common name for suggestion
const suggestCommonName = (name1: string, name2: string): string => {
    if (!name1 || !name2) return name1 || name2;
    const words1 = name1.split(/\s+/);
    const words2 = name2.split(/\s+/);
    
    // Find common words (case insensitive, length > 2)
    const commonWords = words1.filter(w1 => 
        words2.some(w2 => w2.toLowerCase() === w1.toLowerCase() && w1.length > 1)
    );

    if (commonWords.length > 0) {
        return commonWords.join(' ');
    }
    return name2; // Default to target name if no commonality
};


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  // Events state is now just React state, populated from IndexedDB
  const [events, setEvents] = useState<Event[]>([]);
  
  // Keep small preferences in LocalStorage
  const sentRemindersStorageKey = user ? `sentReminders_${user.id}` : 'sentReminders_temp';
  const [sentReminders, setSentReminders] = useLocalStorage<string[]>(sentRemindersStorageKey, []);

  const [currentView, setCurrentView] = useState<'list' | 'add' | 'detail'>('list');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

  // Merge Modal State
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeData, setMergeData] = useState<{ sourceId: string; targetId: string; suggestedName: string } | null>(null);

  // Reminder Modal State
  const [reminderEvent, setReminderEvent] = useState<Event | null>(null);

  // Alert Modal State
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Delete Event State
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  // Load Data from IndexedDB on user change
  useEffect(() => {
      if (user) {
          setIsDataLoading(true);
          storageService.migrateFromLocalStorage(user.id).then(() => {
              return storageService.getUserEvents(user.id);
          }).then(loadedEvents => {
              setEvents(loadedEvents);
              setIsDataLoading(false);
          }).catch(err => {
              console.error("Failed to load events", err);
              setIsDataLoading(false);
          });
      } else {
          setEvents([]);
      }
  }, [user]);

  // Save Data to IndexedDB whenever events change
  useEffect(() => {
      if (user && !isDataLoading) {
          // Debounce could be added here for performance if needed, 
          // but for now direct save is safer for data integrity.
          storageService.saveUserEvents(user.id, events).catch(err => console.error("Save failed", err));
      }
  }, [events, user, isDataLoading]);

  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const hasSystemPermission = 'Notification' in window && Notification.permission === 'granted';

      const now = new Date().getTime();
      events.forEach(event => {
        if (event.reminder && event.reminder !== 'none' && !sentReminders.includes(event.id)) {
          const eventDateTime = new Date(`${event.date}T${event.time || '00:00:00'}`).getTime();
          const reminderMinutes = reminderOptions[event.reminder];
          if (!reminderMinutes) return;
          const reminderTime = eventDateTime - reminderMinutes * 60 * 1000;

          if (now >= reminderTime && now < reminderTime + 60 * 1000) {
            
            if (hasSystemPermission) {
                new Notification('תזכורת לאירוע קרוב', {
                    body: `האירוע "${event.name}" מתחיל בקרוב!`,
                });
            }

            setReminderEvent(event);
            setSentReminders(prev => [...prev, event.id]);
          }
        }
      });
    };
    const intervalId = setInterval(checkReminders, 60000); 
    return () => clearInterval(intervalId);
  }, [events, sentReminders, setSentReminders, user]);
  
  const handleBatchAdd = (newTicketsPayload: NewTicketPayload[]) => {
    const finalEvents = newTicketsPayload.reduce((currentEvents, payload) => {
      const { ticket, eventDetails } = payload;
      
      const newEventDate = eventDetails.date || new Date().toISOString().split('T')[0];
      
      const existingEventIndex = currentEvents.findIndex(e => 
        e.date === newEventDate &&
        doNamesMatch(e.name, eventDetails.name)
      );

      if (existingEventIndex > -1) {
        const newEventsList = [...currentEvents];
        const updatedEvent = {
          ...newEventsList[existingEventIndex],
          tickets: [...newEventsList[existingEventIndex].tickets, ticket]
        };
        newEventsList[existingEventIndex] = updatedEvent;
        return newEventsList;
      } else {
        const newEvent: Event = {
          id: `evt_${Date.now()}_${Math.random()}`,
          name: eventDetails.name,
          date: newEventDate,
          time: eventDetails.time,
          location: eventDetails.location,
          tickets: [ticket],
          reminder: 'none',
        };
        return [...currentEvents, newEvent];
      }
    }, [...events]);

    setEvents(finalEvents);
  };


  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('detail');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedEventId(null);
  };
  
  const handleDeleteTicket = (eventId: string, ticketId: string) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          tickets: event.tickets.filter(ticket => ticket.id !== ticketId)
        };
      }
      return event;
    }).filter(event => event.tickets.length > 0); 
    setEvents(updatedEvents);
  };

  const handleSetReminder = (eventId: string, reminder: Event['reminder']) => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, reminder } : event
      )
    );
  };
  
  const handleDismissReminder = () => {
    if (reminderEvent) {
        setEvents(prevEvents => 
            prevEvents.map(e => e.id === reminderEvent.id ? { ...e, reminder: 'none' } : e)
        );
        setReminderEvent(null);
    }
  };

  const handleUpdateEvent = (eventId: string, updatedData: Partial<Omit<Event, 'id' | 'tickets'>>) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, ...updatedData } : event
      )
    );
  };

  const handleUpdateTicket = (eventId: string, updatedTicket: Ticket) => {
    setEvents(prevEvents =>
      prevEvents.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            tickets: event.tickets.map(ticket =>
              ticket.id === updatedTicket.id ? updatedTicket : ticket
            )
          };
        }
        return event;
      })
    );
  };
  
  const handleMoveTicket = (
      sourceEventId: string,
      ticketId: string,
      destination: { eventId: string } | { newEventDetails: Omit<Event, 'id' | 'tickets' | 'reminder'> }
  ) => {
      let ticketToMove: Ticket | null = null;
      const sourceEvent = events.find(e => e.id === sourceEventId);
      if (!sourceEvent) return;

      const updatedSourceEventTickets = sourceEvent.tickets.filter(t => {
          if (t.id === ticketId) {
              ticketToMove = t;
              return false;
          }
          return true;
      });

      if (!ticketToMove) return;

      const updatedSourceEvent = {
          ...sourceEvent,
          tickets: updatedSourceEventTickets,
      };

      let finalEvents = [...events];

      if ('eventId' in destination) {
          finalEvents = finalEvents.map(event => {
              if (event.id === sourceEventId) return updatedSourceEvent;
              if (event.id === destination.eventId) {
                  return { ...event, tickets: [...event.tickets, ticketToMove!] };
              }
              return event;
          });
      } else {
          const newEvent: Event = {
              id: `evt_${Date.now()}_${Math.random()}`,
              ...destination.newEventDetails,
              tickets: [ticketToMove],
              reminder: 'none',
          };
          finalEvents = finalEvents.map(event =>
              event.id === sourceEventId ? updatedSourceEvent : event
          );
          finalEvents.push(newEvent);
      }
      
      const eventsWithContent = finalEvents.filter(e => e.tickets.length > 0);
      setEvents(eventsWithContent);
      
      if (updatedSourceEvent.tickets.length === 0 && selectedEventId === sourceEventId) {
          handleBack();
      }
  };

  const handleAttemptMerge = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    
    const sourceEvent = events.find(e => e.id === sourceId);
    const targetEvent = events.find(e => e.id === targetId);
    
    if (sourceEvent && targetEvent) {
        if (sourceEvent.date !== targetEvent.date) {
            setAlertMessage('לא ניתן לאחד אירועים בתאריכים שונים. אנא ערוך את התאריך של אחד האירועים לפני האיחוד.');
            return;
        }

        const suggested = suggestCommonName(sourceEvent.name, targetEvent.name);
        setMergeData({
            sourceId,
            targetId,
            suggestedName: suggested
        });
        setMergeModalOpen(true);
    }
  };

  const handleConfirmMerge = (newName: string) => {
    if (!mergeData) return;
    
    const { sourceId, targetId } = mergeData;
    const sourceEvent = events.find(e => e.id === sourceId);
    
    if (!sourceEvent) return;
    
    const updatedEvents = events.map(event => {
        if (event.id === targetId) {
            return {
                ...event,
                name: newName,
                tickets: [...event.tickets, ...sourceEvent.tickets]
            };
        }
        return event;
    }).filter(event => event.id !== sourceId);

    setEvents(updatedEvents);
    setMergeModalOpen(false);
    setMergeData(null);
  };
  
  const handleAttemptDeleteEvent = (eventId: string) => {
      const event = events.find(e => e.id === eventId);
      if (event) {
          setEventToDelete(event);
      }
  };

  const handleConfirmDeleteEvent = () => {
      if (eventToDelete) {
          setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
          setEventToDelete(null);
      }
  };


  const sortedEvents = useMemo(() => {
    const now = new Date().getTime();

    const filtered = events.filter(event => {
      if (!dateFilter.start && !dateFilter.end) return true;
      if (!event.date) return false;

      try {
        const eventTime = new Date(`${event.date}T00:00:00`).getTime();
        const filterStartTime = dateFilter.start ? new Date(`${dateFilter.start}T00:00:00`).getTime() : null;
        const filterEndTime = dateFilter.end ? new Date(`${dateFilter.end}T00:00:00`).getTime() : null;

        if (filterStartTime !== null && eventTime < filterStartTime) return false;
        if (filterEndTime !== null && eventTime > filterEndTime) return false;
        
        return true;
      } catch (e) {
        console.error("Invalid date found for event:", event);
        return false;
      }
    });

    const upcomingEvents: Event[] = [];
    const pastEvents: Event[] = [];

    filtered.forEach(event => {
        const eventTime = new Date(`${event.date}T${event.time || '00:00:00'}`).getTime();
        if (eventTime >= now) {
            upcomingEvents.push(event);
        } else {
            pastEvents.push(event);
        }
    });

    upcomingEvents.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
        const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
        return dateA - dateB;
    });

    pastEvents.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
        const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
        return dateB - dateA;
    });

    return [...upcomingEvents, ...pastEvents];
  }, [events, dateFilter]);

  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const handleLogout = () => {
      authService.logout();
      setUser(null);
  };

  if (!user) {
      return <LoginScreen onLoginSuccess={setUser} />;
  }
  
  if (isDataLoading) {
      return (
          <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white">
              <Loader />
              <p className="mt-4 text-gray-300">טוען את הארנק שלך...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 pb-24">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto p-4 max-w-4xl">
        {currentView === 'list' && (
          <EventList 
            events={sortedEvents} 
            onSelectEvent={handleSelectEvent}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            hasAnyEvents={events.length > 0}
            onMergeEvents={handleAttemptMerge}
            onDeleteEvent={handleAttemptDeleteEvent}
          />
        )}
        {currentView === 'add' && (
          <AddTicketFlow onBatchAdd={handleBatchAdd} onCancel={() => setCurrentView('list')} />
        )}
        {currentView === 'detail' && selectedEvent && (
          <EventDetail 
            event={selectedEvent}
            allEvents={events}
            onBack={handleBack} 
            onDeleteTicket={handleDeleteTicket} 
            onSetReminder={handleSetReminder}
            onUpdateEvent={handleUpdateEvent}
            onUpdateTicket={handleUpdateTicket}
            onMoveTicket={handleMoveTicket}
          />
        )}
      </main>
      
      <MergeEventsModal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        onConfirm={handleConfirmMerge}
        sourceEvent={mergeData ? events.find(e => e.id === mergeData.sourceId) || null : null}
        targetEvent={mergeData ? events.find(e => e.id === mergeData.targetId) || null : null}
        suggestedName={mergeData?.suggestedName || ''}
      />

      <ReminderModal 
        event={reminderEvent}
        onClose={handleDismissReminder}
      />

      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        message={alertMessage || ''}
      />
      
      <ConfirmationModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleConfirmDeleteEvent}
        title="מחיקת אירוע"
        message="האם אתה בטוח שברצונך למחוק את האירוע ואת כל הכרטיסים שנמצאים תחת אותו האירוע? פעולה זו אינה הפיכה."
      />

      {currentView === 'list' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setCurrentView('add')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full p-4 shadow-lg flex items-center justify-center transition-transform transform hover:scale-110"
            aria-label="הוסף כרטיס חדש"
          >
            <PlusIcon />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
