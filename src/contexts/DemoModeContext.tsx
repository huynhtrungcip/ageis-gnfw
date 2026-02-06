import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoModeContextType {
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  demoMode: true,
  setDemoMode: () => {},
});

const STORAGE_KEY = 'aegis_demo_mode';

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default to true (demo ON) if not set
    return stored === null ? true : stored === 'true';
  });

  const setDemoMode = (enabled: boolean) => {
    setDemoModeState(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  };

  return (
    <DemoModeContext.Provider value={{ demoMode, setDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
