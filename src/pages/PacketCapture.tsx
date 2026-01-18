import { Shell } from '@/components/layout/Shell';
import { Play, Square, Download, Trash2, RefreshCw, Filter, HardDrive, Plus, Edit2, Search, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportToJSON, exportToCSV, importFromJSON, createFileInput } from '@/lib/exportImport';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CaptureSession | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    interface: 'wan1',
    filter: '',
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleCreate = () => {
    setEditingSession(null);
    setFormData({ name: '', interface: 'wan1', filter: '' });
    setModalOpen(true);
  };

  const handleEdit = (session: CaptureSession) => {
    setEditingSession(session);
    setFormData({
      name: session.name,
      interface: session.interface,
      filter: session.filter,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Please enter a capture name');
      return;
    }

    if (editingSession) {
      setSessions(sessions.map(s => s.id === editingSession.id ? {
        ...s,
        name: formData.name,
        interface: formData.interface,
        filter: formData.filter,
      } : s));
      toast.success('Capture session updated');
    } else {
      const newSession: CaptureSession = {
        id: Date.now().toString(),
        name: formData.name,
        interface: formData.interface,
        filter: formData.filter,
        status: 'running',
        packets: 0,
        size: '0 B',
        startTime: new Date().toISOString().replace('T', ' ').split('.')[0],
        duration: '00:00:00',
      };
      setSessions([newSession, ...sessions]);
      toast.success('Capture session started');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteSessionId) {
      setSessions(sessions.filter(s => s.id !== deleteSessionId));
      toast.success('Capture session deleted');
      setDeleteSessionId(null);
    }
  };

  const handleToggleStatus = (session: CaptureSession) => {
    setSessions(sessions.map(s => {
      if (s.id === session.id) {
        if (s.status === 'running') {
          return { ...s, status: 'stopped' as const };
        } else {
          return { ...s, status: 'running' as const, startTime: new Date().toISOString().replace('T', ' ').split('.')[0] };
        }
      }
      return s;
    }));
    toast.success(session.status === 'running' ? 'Capture stopped' : 'Capture started');
  };

  const handleDownload = (session: CaptureSession) => {
    toast.success(`Downloading ${session.name}.pcap`);
  };

  const handleExport = (format: 'json' | 'csv') => {
    const filename = `packet-captures-${new Date().toISOString().split('T')[0]}`;
    if (format === 'json') {
      exportToJSON(sessions, `${filename}.json`);
    } else {
      exportToCSV(sessions, `${filename}.csv`);
    }
    toast.success(`Exported ${sessions.length} capture sessions`);
  };

  const handleImport = () => {
    createFileInput('.json', (file) => {
      importFromJSON<CaptureSession>(file, (data) => {
        setSessions([...sessions, ...data.map(s => ({ ...s, id: Date.now().toString() + Math.random() }))]);
        toast.success(`Imported ${data.length} capture sessions`);
      }, (error) => toast.error(error));
    });
  };

  const handleRefresh = () => {
    toast.success('Capture sessions refreshed');
  };

  const filteredSessions = sessions.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.interface.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.filter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn primary" onClick={handleCreate}>
            <Plus className="w-3 h-3" />
            New Capture
          </button>
          <button 
            className="forti-toolbar-btn"
            onClick={() => {
              if (selectedSessions.length === 1) {
                const session = sessions.find(s => s.id === selectedSessions[0]);
                if (session) handleEdit(session);
              }
            }}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button 
            className="forti-toolbar-btn"
            onClick={() => {
              if (selectedSessions.length === 1) {
                setDeleteSessionId(selectedSessions[0]);
              }
            }}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={handleRefresh}>
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <button className="forti-toolbar-btn" onClick={() => handleExport('json')}>
            <Download className="w-3 h-3" />
            Export
          </button>
          <button className="forti-toolbar-btn" onClick={handleImport}>
            <Upload className="w-3 h-3" />
            Import
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input 
              type="text" 
              placeholder="Search captures..." 
              className="w-40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Capture Form */}
        <div className="border-b border-[#ccc] bg-[#f9f9f9] p-4">
          <div className="text-[11px] font-semibold text-[#333] mb-3 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[hsl(142,70%,35%)]" />
            Quick Start Capture
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="forti-label">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Capture name..."
                className="forti-input w-full"
              />
            </div>
            <div>
              <label className="forti-label">Interface</label>
              <select
                value={formData.interface}
                onChange={(e) => setFormData({ ...formData, interface: e.target.value })}
                className="forti-select w-full"
              >
                <option value="any">Any</option>
                <option value="wan1">wan1</option>
                <option value="wan2">wan2</option>
                <option value="internal">internal</option>
                <option value="dmz">dmz</option>
              </select>
            </div>
            <div>
              <label className="forti-label">Filter (BPF)</label>
              <input
                type="text"
                value={formData.filter}
                onChange={(e) => setFormData({ ...formData, filter: e.target.value })}
                placeholder="e.g., host 10.0.0.1 and port 80"
                className="forti-input w-full font-mono"
              />
            </div>
            <div className="flex items-end">
              <button 
                className="forti-toolbar-btn primary w-full justify-center"
                onClick={handleSave}
              >
                <Play className="w-3 h-3" />
                Start Capture
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[10px] text-[#666]">
            <span className="flex items-center gap-1"><Filter className="w-3 h-3" /> Common filters:</span>
            <button className="text-blue-600 hover:underline" onClick={() => setFormData({ ...formData, filter: 'host 8.8.8.8' })}>host 8.8.8.8</button>
            <button className="text-blue-600 hover:underline" onClick={() => setFormData({ ...formData, filter: 'port 53' })}>port 53 (DNS)</button>
            <button className="text-blue-600 hover:underline" onClick={() => setFormData({ ...formData, filter: 'tcp port 443' })}>tcp port 443</button>
            <button className="text-blue-600 hover:underline" onClick={() => setFormData({ ...formData, filter: 'icmp' })}>icmp</button>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="p-4">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">
                  <input 
                    type="checkbox" 
                    className="forti-checkbox"
                    checked={selectedSessions.length === filteredSessions.length && filteredSessions.length > 0}
                    onChange={(e) => setSelectedSessions(e.target.checked ? filteredSessions.map(s => s.id) : [])}
                  />
                </th>
                <th>Name</th>
                <th>Interface</th>
                <th>Filter</th>
                <th>Status</th>
                <th>Packets</th>
                <th>Size</th>
                <th>Duration</th>
                <th className="w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-[#f5f5f5]">
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedSessions.includes(session.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSessions([...selectedSessions, session.id]);
                        } else {
                          setSelectedSessions(selectedSessions.filter(id => id !== session.id));
                        }
                      }}
                    />
                  </td>
                  <td className="text-[11px] font-medium">{session.name}</td>
                  <td>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                      {session.interface}
                    </span>
                  </td>
                  <td className="mono text-[10px] text-[#666] max-w-[150px] truncate">{session.filter || '-'}</td>
                  <td>
                    <span className={cn("text-[10px] px-1.5 py-0.5 border", getStatusBadge(session.status))}>
                      {session.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-[11px]">{session.packets.toLocaleString()}</td>
                  <td className="text-[11px]">{session.size}</td>
                  <td className="mono text-[10px]">{session.duration}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button 
                        className={cn(
                          "p-1 rounded",
                          session.status === 'running' ? "text-red-600 hover:bg-red-100" : "text-green-600 hover:bg-green-100"
                        )}
                        title={session.status === 'running' ? 'Stop' : 'Start'}
                        onClick={() => handleToggleStatus(session)}
                      >
                        {session.status === 'running' ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </button>
                      <button 
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Download PCAP"
                        onClick={() => handleDownload(session)}
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button 
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit"
                        onClick={() => handleEdit(session)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete"
                        onClick={() => setDeleteSessionId(session.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSessions.length === 0 && (
            <div className="text-center py-8 text-[11px] text-[#666]">
              No capture sessions found
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Edit Capture Session' : 'New Capture Session'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="forti-label">Capture Name *</label>
              <input
                type="text"
                className="forti-input w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., WAN Traffic Debug"
              />
            </div>
            <div>
              <label className="forti-label">Interface</label>
              <select
                className="forti-select w-full"
                value={formData.interface}
                onChange={(e) => setFormData({ ...formData, interface: e.target.value })}
              >
                <option value="any">Any</option>
                <option value="wan1">wan1</option>
                <option value="wan2">wan2</option>
                <option value="internal">internal</option>
                <option value="dmz">dmz</option>
                <option value="ssl.root">ssl.root</option>
              </select>
            </div>
            <div>
              <label className="forti-label">BPF Filter</label>
              <input
                type="text"
                className="forti-input w-full font-mono"
                value={formData.filter}
                onChange={(e) => setFormData({ ...formData, filter: e.target.value })}
                placeholder="e.g., host 10.0.0.1 and port 80"
              />
              <div className="text-[10px] text-[#666] mt-1">
                Examples: host 192.168.1.1, port 443, tcp and port 80, icmp
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave}>
                {editingSession ? 'Save Changes' : 'Start Capture'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Capture Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this capture session? The captured data will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default PacketCapture;
