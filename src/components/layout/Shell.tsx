import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { CommandBar } from './CommandBar';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-44">
        <CommandBar />
        <main className="p-3">
          {children}
        </main>
      </div>
    </div>
  );
}
