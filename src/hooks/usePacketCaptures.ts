import { useState, useEffect, useCallback } from 'react';
import { db, isApiConfigured } from '@/lib/postgrest';
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
  const shouldMock = demoMode || !isApiConfigured();
  const [sessions, setSessions] = useState<CaptureSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (shouldMock) {
      setSessions(mockSessions);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await (db.from('packet_captures').select('*').order('created_at', { ascending: false }) as any);
      if (error) throw error;
      setSessions(data || []);
    } catch { /* fallback */ }
    setLoading(false);
  }, [shouldMock]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createCapture = async (name: string, iface: string, filter: string) => {
    if (shouldMock) {
      const s: CaptureSession = {
        id: Date.now().toString(), name, interface: iface, filter,
        status: 'running', packets: 0, size_bytes: 0, pcap_file: null,
        started_at: new Date().toISOString(), stopped_at: null, created_at: new Date().toISOString(),
      };
      setSessions(prev => [s, ...prev]);
      toast.success('Capture session started');
      return;
    }
    const { data, error } = await (db.from('packet_captures').insert({ name, interface: iface, filter, status: 'stopped' }) as any);
    if (error) { toast.error('Failed to create capture'); return; }
    toast.success('Capture session created — use agent to start');
    fetchSessions();
  };

  const updateCapture = async (id: string, updates: Partial<CaptureSession>) => {
    if (shouldMock) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      toast.success('Capture updated');
      return;
    }
    await (db.from('packet_captures').update(updates).eq('id', id) as any);
    toast.success('Capture updated');
    fetchSessions();
  };

  const deleteCapture = async (id: string) => {
    if (shouldMock) {
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Capture deleted');
      return;
    }
    await (db.from('packet_captures').delete().eq('id', id) as any);
    toast.success('Capture deleted');
    fetchSessions();
  };

  const toggleStatus = async (session: CaptureSession) => {
    const newStatus = session.status === 'running' ? 'stopped' : 'running';
    if (shouldMock) {
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: newStatus as any } : s));
      toast.success(newStatus === 'running' ? 'Capture started' : 'Capture stopped');
      return;
    }
    await (db.from('packet_captures').update({ status: newStatus }).eq('id', session.id) as any);
    toast.success(newStatus === 'running' ? 'Capture started via agent' : 'Capture stopped');
    fetchSessions();
  };

  return { sessions, loading, fetchSessions, createCapture, updateCapture, deleteCapture, toggleStatus };
}
