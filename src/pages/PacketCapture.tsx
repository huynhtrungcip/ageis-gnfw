import { Shell } from '@/components/layout/Shell';
import { Play, Square, Download, Trash2, RefreshCw, Filter, HardDrive } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CaptureSession {
  id: string;
  name: string;
  interface: string;
  filter: string;
  status: 'running' | 'stopped' | 'completed';
  packets: number;
  size: string;
  startTime: string;
  duration: string;
}

const mockSessions: CaptureSession[] = [
  { id: '1', name: 'WAN Traffic Debug', interface: 'wan1', filter: 'host 8.8.8.8', status: 'running', packets: 15420, size: '12.5 MB', startTime: '2024-01-15 10:30:00', duration: '00:15:32' },
  { id: '2', name: 'Internal DNS', interface: 'internal', filter: 'port 53', status: 'completed', packets: 8540, size: '2.1 MB', startTime: '2024-01-15 09:00:00', duration: '00:30:00' },
  { id: '3', name: 'HTTP Analysis', interface: 'any', filter: 'tcp port 80 or tcp port 443', status: 'stopped', packets: 45230, size: '38.7 MB', startTime: '2024-01-14 14:00:00', duration: '01:00:00' },
];

const PacketCapture = () => {
  const [sessions, setSessions] = useState<CaptureSession[]>(mockSessions);
  const [selectedInterface, setSelectedInterface] = useState('wan1');
  const [captureFilter, setCaptureFilter] = useState('');
  const [captureName, setCaptureName] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive size={18} className="text-primary" />
            <h1 className="text-base font-semibold text-foreground">Packet Capture</h1>
          </div>
          <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* New Capture Form */}
        <div className="border border-border rounded">
          <div className="bg-muted/50 px-3 py-2 border-b border-border">
            <h2 className="text-xs font-semibold text-foreground">Start New Capture</h2>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                <input
                  type="text"
                  value={captureName}
                  onChange={(e) => setCaptureName(e.target.value)}
                  placeholder="Capture name..."
                  className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Interface</label>
                <select
                  value={selectedInterface}
                  onChange={(e) => setSelectedInterface(e.target.value)}
                  className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background"
                >
                  <option value="any">Any</option>
                  <option value="wan1">wan1</option>
                  <option value="wan2">wan2</option>
                  <option value="internal">internal</option>
                  <option value="dmz">dmz</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Filter (BPF)</label>
                <input
                  type="text"
                  value={captureFilter}
                  onChange={(e) => setCaptureFilter(e.target.value)}
                  placeholder="e.g., host 10.0.0.1 and port 80"
                  className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background font-mono"
                />
              </div>
              <div className="flex items-end">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                  <Play size={12} />
                  Start Capture
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Filter size={10} /> Common filters:</span>
              <button className="text-primary hover:underline" onClick={() => setCaptureFilter('host 8.8.8.8')}>host 8.8.8.8</button>
              <button className="text-primary hover:underline" onClick={() => setCaptureFilter('port 53')}>port 53 (DNS)</button>
              <button className="text-primary hover:underline" onClick={() => setCaptureFilter('tcp port 443')}>tcp port 443</button>
              <button className="text-primary hover:underline" onClick={() => setCaptureFilter('icmp')}>icmp</button>
            </div>
          </div>
        </div>

        {/* Capture Sessions */}
        <div className="border border-border rounded overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b border-border">
            <h2 className="text-xs font-semibold text-foreground">Capture Sessions ({sessions.length})</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Interface</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Filter</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Packets</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Size</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Duration</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{session.name}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{session.interface}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-muted-foreground max-w-[150px] truncate">{session.filter || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px]", getStatusBadge(session.status))}>
                      {session.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2">{session.packets.toLocaleString()}</td>
                  <td className="px-3 py-2">{session.size}</td>
                  <td className="px-3 py-2 font-mono">{session.duration}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {session.status === 'running' ? (
                        <button className="p-1 text-red-600 hover:bg-red-100 rounded" title="Stop">
                          <Square size={12} />
                        </button>
                      ) : (
                        <button className="p-1 text-green-600 hover:bg-green-100 rounded" title="Start">
                          <Play size={12} />
                        </button>
                      )}
                      <button className="p-1 text-primary hover:bg-primary/10 rounded" title="Download PCAP">
                        <Download size={12} />
                      </button>
                      <button className="p-1 text-destructive hover:bg-destructive/10 rounded" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
};

export default PacketCapture;
