import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-[200px] flex flex-col">
        <Header />
        <main className="flex-1 p-3 bg-[#f0f0f0]">
          {children}
        </main>
      </div>
    </div>
  );
}
