import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  HardDrive, Download, Upload, RefreshCw, Search, CheckCircle,
  AlertTriangle, Clock, Shield, Server, FileArchive, ArrowUpCircle,
  History, Trash2, X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFirmwareInfo } from '@/hooks/useFirmwareInfo';
import { formatUptime } from '@/lib/formatters';

// Available Firmware
interface FirmwareVersion {
  id: string;
  version: string;
  buildNumber: string;
  releaseDate: string;
  type: 'stable' | 'feature' | 'maintenance';
  size: string;
  releaseNotes: string;
  recommended: boolean;
}

const initialFirmware: FirmwareVersion[] = [
  { id: 'fw-1', version: '2.1.0', buildNumber: '2620', releaseDate: '2024-02-01', type: 'maintenance', size: '245 MB', releaseNotes: 'Security fixes and performance improvements', recommended: true },
  { id: 'fw-2', version: '2.0.0', buildNumber: '2571', releaseDate: '2024-01-15', type: 'stable', size: '242 MB', releaseNotes: 'Current installed version', recommended: false },
  { id: 'fw-3', version: '1.9.0', buildNumber: '2463', releaseDate: '2023-12-10', type: 'stable', size: '238 MB', releaseNotes: 'VPN and routing improvements', recommended: false },
  { id: 'fw-4', version: '2.2.0', buildNumber: '3001', releaseDate: '2024-02-15', type: 'feature', size: '280 MB', releaseNotes: 'New AI-powered threat detection', recommended: false },
];

// Backup History
interface BackupEntry {
  id: string;
  filename: string;
  date: string;
  size: string;
  type: 'auto' | 'manual' | 'pre-upgrade';
  firmwareVersion: string;
  status: 'success' | 'failed';
}

const initialBackups: BackupEntry[] = [
  { id: 'bk-1', filename: 'config_backup_20240201_143022.conf', date: '2024-02-01 14:30:22', size: '2.4 MB', type: 'auto', firmwareVersion: '2.0.0', status: 'success' },
  { id: 'bk-2', filename: 'config_backup_20240125_090015.conf', date: '2024-01-25 09:00:15', size: '2.3 MB', type: 'manual', firmwareVersion: '2.0.0', status: 'success' },
  { id: 'bk-3', filename: 'pre_upgrade_20240115_083045.conf', date: '2024-01-15 08:30:45', size: '2.2 MB', type: 'pre-upgrade', firmwareVersion: '1.9.0', status: 'success' },
  { id: 'bk-4', filename: 'config_backup_20240101_120000.conf', date: '2024-01-01 12:00:00', size: '2.1 MB', type: 'auto', firmwareVersion: '1.9.0', status: 'success' },
];



const FirmwareManagement = () => {
  const { info: firmwareInfo, loading: fwLoading, fetchInfo } = useFirmwareInfo();
  const [activeTab, setActiveTab] = useState('current');
  const [selectedFirmware, setSelectedFirmware] = useState<string | null>(null);
  const [backupBeforeUpgrade, setBackupBeforeUpgrade] = useState(true);
  const [firmware, setFirmware] = useState<FirmwareVersion[]>(initialFirmware);
  const [backups, setBackups] = useState<BackupEntry[]>(initialBackups);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'firmware' | 'backup'; id: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<string | null>(null);

  const currentVersion = firmwareInfo?.current_version || '2.0.0';
  const currentBuild = firmwareInfo?.build_number || '2571';
  const currentHostname = firmwareInfo?.hostname || 'AEGIS-PRIMARY';
  const currentModel = firmwareInfo?.model || 'Aegis-NGFW';
  const currentSerial = firmwareInfo?.serial_number || 'AEGIS-A1B2C3D4E5F6';
  const currentUptime = firmwareInfo?.uptime_seconds ? formatUptime(firmwareInfo.uptime_seconds) : '0 days';
  const currentKernel = firmwareInfo?.kernel_version || '';
  const currentOS = firmwareInfo?.os_version || '';
  const lastUpdated = firmwareInfo?.last_updated || 'N/A';

  const handleUpgrade = () => {
    if (!selectedFirmware) { toast.error('Please select a firmware version'); return; }
    const fw = firmware.find(f => f.id === selectedFirmware);
    if (fw?.version === currentVersion) { toast.error('Selected version is already installed'); return; }
    toast.success(`Firmware upgrade to v${fw?.version} initiated. System will reboot...`);
  };

  const handleBackup = () => {
    const newBackup: BackupEntry = {
      id: `bk-${Date.now()}`,
      filename: `config_backup_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.conf`,
      date: new Date().toLocaleString(),
      size: '2.4 MB',
      type: 'manual',
      firmwareVersion: currentVersion,
      status: 'success',
    };
    setBackups(prev => [newBackup, ...prev]);
    toast.success('Configuration backup created successfully');
  };

  const handleRestoreConfirm = (id: string) => {
    setBackupToRestore(id);
    setRestoreConfirmOpen(true);
  };

  const handleRestore = () => {
    if (backupToRestore) {
      const backup = backups.find(b => b.id === backupToRestore);
      toast.success(`Restoring configuration from ${backup?.filename}...`);
    }
    setRestoreConfirmOpen(false);
    setBackupToRestore(null);
  };

  const handleDeleteConfirm = (type: 'firmware' | 'backup', id: string) => {
    setItemToDelete({ type, id });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'firmware') {
        setFirmware(prev => prev.filter(f => f.id !== itemToDelete.id));
        toast.success('Firmware version removed');
      } else {
        setBackups(prev => prev.filter(b => b.id !== itemToDelete.id));
        toast.success('Backup deleted');
      }
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleDownloadBackup = (backup: BackupEntry) => {
    toast.success(`Downloading ${backup.filename}...`);
  };

  const handleExportAll = () => {
    const data = { firmware, backups, firmwareInfo };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firmware_management_export.json';
    a.click();
    toast.success('Firmware data exported');
  };

  const handleCheckUpdates = () => {
    toast.success('Checking for firmware updates...');
    setTimeout(() => {
      toast.success('System is up to date');
    }, 2000);
  };

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <HardDrive size={14} />
            <span className="font-semibold">Firmware Management</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn primary" onClick={handleBackup}>
            <FileArchive size={12} />
            <span>Backup Now</span>
          </button>
          <button className="forti-toolbar-btn" onClick={() => setShowUploadModal(true)}>
            <Upload size={12} />
            <span>Upload Firmware</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={handleCheckUpdates}>
            <RefreshCw size={12} />
            <span>Check Updates</span>
          </button>
          <button className="forti-toolbar-btn" onClick={handleExportAll}>
            <Download size={12} />
            <span>Export</span>
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input type="text" placeholder="Search..." />
          </div>
        </div>

        {/* System Info Bar */}
        <div className="flex items-center gap-0 border-x border-[#ddd]">
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Server size={14} className="text-blue-600" />
            <span className="text-sm font-bold text-blue-600">{currentModel}</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Shield size={14} className="text-green-600" />
            <span className="text-lg font-bold text-green-600">v{currentVersion}</span>
            <span className="text-[11px] text-[#333]">Current</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Clock size={14} className="text-purple-600" />
            <span className="text-[11px] text-[#333]">{currentUptime}</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white">
            <CheckCircle size={14} className="text-green-600" />
            <span className="text-[11px] text-[#333]">System Active</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-[#f0f0f0] border-x border-b border-[#ddd]">
            <TabsList className="bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger 
                value="current" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px] text-[#333] data-[state=active]:text-[hsl(142,70%,35%)]"
              >
                System Information
              </TabsTrigger>
              <TabsTrigger 
                value="upgrade" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px] text-[#333] data-[state=active]:text-[hsl(142,70%,35%)]"
              >
                Available Firmware
              </TabsTrigger>
              <TabsTrigger 
                value="backup" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px] text-[#333] data-[state=active]:text-[hsl(142,70%,35%)]"
              >
                Backup & Restore
              </TabsTrigger>
            </TabsList>
          </div>

          {/* System Info Tab */}
          <TabsContent value="current" className="mt-0 bg-white border-x border-b border-[#ddd]">
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="section">
                <div className="section-header">
                  <span>Device Information</span>
                </div>
                <div className="p-3">
                  <table className="widget-table">
                    <tbody>
                      <tr>
                        <td className="widget-label">Model</td>
                        <td className="widget-value text-[#111]">{currentModel}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Serial Number</td>
                        <td className="widget-value mono text-[#111]">{currentSerial}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Hostname</td>
                        <td className="widget-value text-[#111]">{currentHostname}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Uptime</td>
                        <td className="widget-value text-[#111]">{currentUptime}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <span>Firmware Information</span>
                </div>
                <div className="p-3">
                  <table className="widget-table">
                    <tbody>
                      <tr>
                        <td className="widget-label">Current Version</td>
                        <td className="widget-value text-[#111]">v{currentVersion}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Build Number</td>
                        <td className="widget-value text-[#111]">{currentBuild}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Kernel Version</td>
                        <td className="widget-value text-[#111]">{currentKernel}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">OS Version</td>
                        <td className="widget-value text-[#111]">{currentOS}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Last Updated</td>
                        <td className="widget-value text-[#111]">{lastUpdated}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Available Firmware Tab */}
          <TabsContent value="upgrade" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10"></th>
                  <th>Version</th>
                  <th>Build</th>
                  <th>Release Date</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Release Notes</th>
                  <th className="w-24">Status</th>
                  <th className="w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {firmware.map((fw) => (
                  <tr 
                    key={fw.id}
                    onClick={() => setSelectedFirmware(fw.id)}
                    className={cn(
                      "cursor-pointer",
                      selectedFirmware === fw.id && "bg-[#fff8e1]",
                      fw.version === currentVersion && "bg-green-50"
                    )}
                  >
                    <td>
                      <input 
                        type="radio" 
                        name="firmware"
                        checked={selectedFirmware === fw.id}
                        onChange={() => setSelectedFirmware(fw.id)}
                        disabled={fw.version === currentVersion}
                        className="forti-checkbox"
                      />
                    </td>
                    <td className="font-medium text-[#111]">
                      v{fw.version}
                      {fw.recommended && (
                        <span className="ml-2 forti-tag bg-blue-100 text-blue-700 border-blue-200">
                          RECOMMENDED
                        </span>
                      )}
                    </td>
                    <td className="mono text-[#333]">{fw.buildNumber}</td>
                    <td className="text-[#333]">{fw.releaseDate}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        fw.type === 'stable' ? 'bg-green-100 text-green-700 border-green-200' :
                        fw.type === 'feature' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      )}>
                        {fw.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-[#333]">{fw.size}</td>
                    <td className="text-[#333]">{fw.releaseNotes}</td>
                    <td>
                      {fw.version === currentVersion ? (
                        <span className="forti-tag bg-green-100 text-green-700 border-green-200">
                          INSTALLED
                        </span>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFirmware(fw.id);
                          }}
                          className="text-[hsl(142,70%,35%)] hover:underline text-[11px]"
                        >
                          Select
                        </button>
                      )}
                    </td>
                    <td>
                      {fw.version !== currentVersion && (
                        <button 
                          className="p-1 hover:bg-[#f0f0f0]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfirm('firmware', fw.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Upgrade Options */}
            <div className="p-4 bg-[#f5f5f5] border-x border-b border-[#ddd]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-[11px] text-[#333]">
                    <input 
                      type="checkbox" 
                      checked={backupBeforeUpgrade}
                      onChange={(e) => setBackupBeforeUpgrade(e.target.checked)}
                      className="forti-checkbox"
                    />
                    Backup configuration before upgrade
                  </label>
                </div>
                <button 
                  onClick={handleUpgrade}
                  disabled={!selectedFirmware || firmware.find(f => f.id === selectedFirmware)?.version === currentVersion}
                  className="forti-btn forti-btn-primary flex items-center gap-2"
                >
                  <ArrowUpCircle size={14} />
                  Upgrade Firmware
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Date</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Firmware Version</th>
                  <th>Status</th>
                  <th className="w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="font-medium text-[#111] mono text-[10px]">{backup.filename}</td>
                    <td className="text-[#333]">{backup.date}</td>
                    <td className="text-[#333]">{backup.size}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        backup.type === 'pre-upgrade' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        backup.type === 'auto' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      )}>
                        {backup.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-[#333]">v{backup.firmwareVersion}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        backup.status === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                      )}>
                        {backup.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button 
                          className="forti-toolbar-btn text-[10px]" 
                          onClick={() => handleRestoreConfirm(backup.id)}
                        >
                          <History size={10} />
                          Restore
                        </button>
                        <button 
                          className="forti-toolbar-btn text-[10px]"
                          onClick={() => handleDownloadBackup(backup)}
                        >
                          <Download size={10} />
                          Download
                        </button>
                        <button 
                          className="p-1 hover:bg-[#f0f0f0]"
                          onClick={() => handleDeleteConfirm('backup', backup.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Firmware Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#ccc] shadow-xl w-[500px]">
            <div className="forti-modal-header flex items-center justify-between">
              <span>Upload Firmware</span>
              <button onClick={() => setShowUploadModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="forti-modal-body space-y-4">
              <div className="border-2 border-dashed border-[#ccc] p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-[#999] mb-4" />
                <div className="text-[11px] text-[#333] mb-2">Drag and drop firmware file here</div>
                <div className="text-[10px] text-[#666] mb-4">or</div>
                <button 
                  className="forti-btn forti-btn-secondary"
                  onClick={() => {
                    toast.success('File browser opened');
                  }}
                >
                  Browse Files
                </button>
              </div>
              <div className="text-[10px] text-[#666]">
                Supported formats: .bin, .img, .gz
              </div>
            </div>
            <div className="forti-modal-footer">
              <button className="forti-btn forti-btn-secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button className="forti-btn forti-btn-primary" onClick={() => {
                toast.success('Firmware uploaded successfully');
                setShowUploadModal(false);
              }}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === 'firmware' ? 'Firmware' : 'Backup'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {itemToDelete?.type === 'firmware' ? 'firmware version' : 'backup'}? This action cannot be undone.
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

      {/* Restore Confirmation */}
      <AlertDialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this configuration? Current settings will be overwritten. The system may restart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-orange-600 hover:bg-orange-700">
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default FirmwareManagement;
