import { useState, useEffect, useCallback } from 'react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { toast } from 'sonner';

export interface CaptureSession {
  id: string;
  name: string;
  interface: string;
  filter: string;
  status: 'running' | 'stopped' | 'completed' | 'error';
  packets: number;
  size_bytes: number;
  pcap_file: string | null;
  started_at: string | null;
  stopped_at: string | null;
  created_at: string;
}

const mockSessions: CaptureSession[] = [
  { id: '1', name: 'WAN Traffic Debug', interface: 'wan1', filter: 'host 8.8.8.8', status: 'running', packets: 15420, size_bytes: 13107200, pcap_file: null, started_at: '2024-01-15 10:30:00', stopped_at: null, created_at: '2024-01-15' },
  { id: '2', name: 'Internal DNS', interface: 'internal', filter: 'port 53', status: 'completed', packets: 8540, size_bytes: 2202009, pcap_file: null, started_at: '2024-01-15 09:00:00', stopped_at: '2024-01-15 09:30:00', created_at: '2024-01-15' },
  { id: '3', name: 'HTTP Analysis', interface: 'any', filter: 'tcp port 80 or tcp port 443', status: 'stopped', packets: 45230, size_bytes: 40580300, pcap_file: null, started_at: '2024-01-14 14:00:00', stopped_at: '2024-01-14 15:00:00', created_at: '2024-01-14' },
];

export function usePacketCaptures() {
  const { demoMode } = useDemoMode();
  const [sessions, setSessions] = useState<CaptureSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (demoMode) {
      setSessions(mockSessions);
    } else {
      setSessions([]);
    }
    setLoading(false);
  }, [demoMode]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createCapture = async (name: string, iface: string, filter: string) => {
    const s: CaptureSession = {
      id: Date.now().toString(), name, interface: iface, filter,
      status: 'running', packets: 0, size_bytes: 0, pcap_file: null,
      started_at: new Date().toISOString(), stopped_at: null, created_at: new Date().toISOString(),
    };
    setSessions(prev => [s, ...prev]);
    toast.success('Capture session started');
  };

  const updateCapture = async (id: string, updates: Partial<CaptureSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    toast.success('Capture updated');
  };

  const deleteCapture = async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success('Capture deleted');
  };

  const toggleStatus = async (session: CaptureSession) => {
    const newStatus = session.status === 'running' ? 'stopped' : 'running';
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: newStatus as any } : s));
    toast.success(newStatus === 'running' ? 'Capture started' : 'Capture stopped');
  };

  return { sessions, loading, fetchSessions, createCapture, updateCapture, deleteCapture, toggleStatus };
}
