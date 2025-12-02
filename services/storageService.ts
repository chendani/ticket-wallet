
import { Event } from '../types';

const DB_NAME = 'TicketWalletDB';
const DB_VERSION = 1;
const STORE_NAME = 'events';

// Helper to open the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject("Could not open database");
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const storageService = {
  // Save all events for a specific user
  saveUserEvents: async (userId: string, events: Event[]): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const key = `events_${userId}`;
    
    return new Promise((resolve, reject) => {
        const putRequest = store.put({ id: key, data: events });
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
    });
  },

  // Get events for a specific user
  getUserEvents: async (userId: string): Promise<Event[]> => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const key = `events_${userId}`;

    return new Promise((resolve) => {
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        const result = getRequest.result;
        resolve(result ? result.data : []);
      };

      getRequest.onerror = () => {
        // If error or not found, return empty array
        resolve([]); 
      };
    });
  },
  
  // Migration helper
  migrateFromLocalStorage: async (userId: string) => {
      const localData = localStorage.getItem(`events_${userId}`);
      if (localData) {
          try {
              const events = JSON.parse(localData);
              if (Array.isArray(events) && events.length > 0) {
                  await storageService.saveUserEvents(userId, events);
                  localStorage.removeItem(`events_${userId}`);
                  console.log("Migrated data from LocalStorage to IndexedDB");
              }
          } catch (e) {
              console.error("Migration failed", e);
          }
      }
  }
};