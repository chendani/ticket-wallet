
// Fix: Import React to provide types for function return signature.
import React, { useState, useEffect, useRef } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Use a ref to track if it's the first render to avoid double initialization effects if not needed,
  // but simpler here: we need to initialize state based on the CURRENT key.
  
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Update stored value if the key changes (e.g. user switching)
  useEffect(() => {
    setStoredValue(readValue());
  }, [key]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const valueToStore =
          typeof storedValue === 'function'
            ? (storedValue as any)(storedValue)
            : storedValue;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
