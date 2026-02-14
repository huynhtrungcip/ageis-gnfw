import { useState, useEffect, useCallback } from 'react';
import { db, isApiConfigured } from '@/lib/postgrest';
import { useDemoMode } from '@/contexts/DemoModeContext';

export interface FirmwareInfo {
  id: string;
  hostname: string;
  model: string;
  serial_number: string;
  current_version: string;
  build_number: string;
  kernel_version: string;
  os_version: string;
  uptime_seconds: number;
  last_updated: string | null;
}

const mockInfo: FirmwareInfo = {
  id: '1',
  hostname: 'AEGIS-PRIMARY',
  model: 'Aegis-NGFW',
  serial_number: 'AEGIS-A1B2C3D4E5F6',
  current_version: '2.0.0',
  build_number: '2571',
  kernel_version: '6.8.0-45-generic',
  os_version: 'Ubuntu 24.04.1 LTS',
  uptime_seconds: 2592000,
  last_updated: '2024-01-15',
};

export function useFirmwareInfo() {
  const { demoMode } = useDemoMode();
  const shouldMock = demoMode || !isApiConfigured();
  const [info, setInfo] = useState<FirmwareInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInfo = useCallback(async () => {
    if (shouldMock) {
      setInfo(mockInfo);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await (db.from('firmware_info').select('*').limit(1) as any);
      if (error) throw error;
      setInfo(data?.[0] || mockInfo);
    } catch { setInfo(mockInfo); }
    setLoading(false);
  }, [shouldMock]);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  return { info, loading, fetchInfo };
}
