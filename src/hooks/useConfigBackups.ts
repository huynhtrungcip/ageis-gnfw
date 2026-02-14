import { useState, useEffect, useCallback } from 'react';
import { db, isApiConfigured } from '@/lib/postgrest';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { toast } from 'sonner';

export interface ConfigBackup {
  id: string;
  filename: string;
  filepath: string;
  size_bytes: number;
  type: 'manual' | 'auto' | 'pre-upgrade' | 'scheduled';
  status: 'success' | 'failed' | 'in_progress';
  firmware_version: string;
  sections: string[];
  notes: string;
  created_by: string | null;
  created_at: string;
}

const mockBackups: ConfigBackup[] = [
  { id: '1', filename: 'aegis_config_20240201_143022.tar.gz', filepath: '/opt/aegis/backups/configs/aegis_config_20240201_143022.tar.gz', size_bytes: 2516582, type: 'auto', status: 'success', firmware_version: '2.0.0', sections: ['firewall','routes','interfaces','dhcp','dns'], notes: '', created_by: null, created_at: '2024-02-01 14:30:22' },
  { id: '2', filename: 'aegis_config_20240125_090015.tar.gz', filepath: '/opt/aegis/backups/configs/aegis_config_20240125_090015.tar.gz', size_bytes: 2411724, type: 'manual', status: 'success', firmware_version: '2.0.0', sections: ['firewall','routes','interfaces'], notes: 'Pre-maintenance backup', created_by: null, created_at: '2024-01-25 09:00:15' },
  { id: '3', filename: 'aegis_config_20240115_083045.tar.gz', filepath: '/opt/aegis/backups/configs/aegis_config_20240115_083045.tar.gz', size_bytes: 2306867, type: 'pre-upgrade', status: 'success', firmware_version: '1.9.0', sections: ['firewall','routes'], notes: 'Before v2.0 upgrade', created_by: null, created_at: '2024-01-15 08:30:45' },
];

export function useConfigBackups() {
  const { demoMode } = useDemoMode();
  const shouldMock = demoMode || !isApiConfigured();
  const [backups, setBackups] = useState<ConfigBackup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBackups = useCallback(async () => {
    if (shouldMock) {
      setBackups(mockBackups);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await (db.from('config_backups').select('*').order('created_at', { ascending: false }) as any);
      if (error) throw error;
      setBackups(data || []);
    } catch { setBackups(mockBackups); }
    setLoading(false);
  }, [shouldMock]);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const deleteBackup = async (id: string) => {
    if (shouldMock) {
      setBackups(prev => prev.filter(b => b.id !== id));
      toast.success('Backup deleted');
      return;
    }
    await (db.from('config_backups').delete().eq('id', id) as any);
    toast.success('Backup deleted');
    fetchBackups();
  };

  return { backups, loading, fetchBackups, deleteBackup };
}
