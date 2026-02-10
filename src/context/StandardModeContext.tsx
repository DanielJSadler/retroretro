'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface StandardModeContextType {
  isStandardMode: boolean;
  toggleStandardMode: () => void;
}

const StandardModeContext = createContext<StandardModeContextType | undefined>(undefined);

export function StandardModeProvider({ children }: { children: React.ReactNode }) {
  const [isStandardMode, setIsStandardMode] = useState(false);

  // Initialize from local storage if available
  useEffect(() => {
    const stored = localStorage.getItem('retro-standard-mode');
    if (stored) {
      setIsStandardMode(stored === 'true');
    }
  }, []);

  const toggleStandardMode = () => {
    const newValue = !isStandardMode;
    setIsStandardMode(newValue);
    localStorage.setItem('retro-standard-mode', String(newValue));
    
    // Update body class for global CSS overrides
    if (newValue) {
      document.body.classList.add('standard-mode');
    } else {
      document.body.classList.remove('standard-mode');
    }
  };

  // Sync body class on mount/change
  useEffect(() => {
    if (isStandardMode) {
      document.body.classList.add('standard-mode');
    } else {
      document.body.classList.remove('standard-mode');
    }
  }, [isStandardMode]);

  return (
    <StandardModeContext.Provider value={{ isStandardMode, toggleStandardMode }}>
      {children}
    </StandardModeContext.Provider>
  );
}

export function useStandardMode() {
  const context = useContext(StandardModeContext);
  if (context === undefined) {
    throw new Error('useStandardMode must be used within a StandardModeProvider');
  }
  return context;
}
