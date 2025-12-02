
import { Event } from '../types';

const DB_NAME = 'TicketWalletDB';
const DB_VERSION = 1;
const STORE_NAME = 'events';

// Helper to open the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
      reject("Could not open database");
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
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
    // In a pure local-first approach with IndexedDB, we store the whole array or individual items.
    // To keep compatibility with the current App structure (which manages the whole array),
    // we will store a single record containing the array for the user, OR filter by user.
    // OPTIMIZATION: Storing large base64 strings in a single record is bad. 
    // We will store each event as a separate row in the DB.
    
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 1. First, we need to get all existing events for this user to know what to delete if needed,
    // or we simpler: we just put/update the items passed in.
    // However, ensuring deletions sync is tricky without a full sync logic.
    // For this local app version, let's implement a "Save All" approach that is robust.
    
    // Strategy: We prefix IDs with the user ID to scope them locally? 
    // Actually, in the App.tsx we already scope by user.
    // Let's store the list wrapper to mimic localStorage behavior but with unlimited size.
    
    // REVISED STRATEGY for simplicity and stability:
    // We will store a single object keyed by `events_${userId}` containing the array.
    // IndexedDB handles large objects reasonably well.
    
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

    return new Promise((resolve, reject) => {
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
  
  // Migration helper: If user had data in localStorage, move it to IndexedDB
  migrateFromLocalStorage: async (userId: string) => {
      const localData = localStorage.getItem(`events_${userId}`);
      if (localData) {
          try {
              const events = JSON.parse(localData);
              if (Array.isArray(events) && events.length > 0) {
                  await storageService.saveUserEvents(userId, events);
                  localStorage.removeItem(`events_${userId}`); // Clear to save space
                  console.log("Migrated data from LocalStorage to IndexedDB");
              }
          } catch (e) {
              console.error("Migration failed", e);
          }
      }
  }
};
