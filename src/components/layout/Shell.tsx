import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-[#ecf0f1]">
      <Sidebar />
      <div className="ml-[220px]">
        <Header />
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
