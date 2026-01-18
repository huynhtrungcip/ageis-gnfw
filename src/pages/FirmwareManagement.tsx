import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Server,
  FileArchive,
  ArrowUpCircle,
  History
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Current System Info
interface SystemInfo {
  model: string;
  serialNumber: string;
  hostname: string;
  currentFirmware: string;
  buildNumber: string;
  lastUpdated: string;
  licenseStatus: 'valid' | 'expired' | 'expiring';
  licenseExpiry: string;
  uptime: string;
}

const systemInfo: SystemInfo = {
  model: 'Aegis-500F',
  serialNumber: 'FGT500F0000001234',
  hostname: 'AEGIS-NGFW-HQ',
  currentFirmware: '7.4.2',
  buildNumber: '2571',
  lastUpdated: '2024-01-15',
  licenseStatus: 'valid',
  licenseExpiry: '2025-12-31',
  uptime: '45 days 12 hours 34 minutes',
};

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

const availableFirmware: FirmwareVersion[] = [
  { id: 'fw-1', version: '7.4.3', buildNumber: '2620', releaseDate: '2024-02-01', type: 'maintenance', size: '245 MB', releaseNotes: 'Security fixes and performance improvements', recommended: true },
  { id: 'fw-2', version: '7.4.2', buildNumber: '2571', releaseDate: '2024-01-15', type: 'stable', size: '242 MB', releaseNotes: 'Current installed version', recommended: false },
  { id: 'fw-3', version: '7.4.1', buildNumber: '2463', releaseDate: '2023-12-10', type: 'stable', size: '238 MB', releaseNotes: 'SSL-VPN improvements', recommended: false },
  { id: 'fw-4', version: '7.6.0', buildNumber: '3001', releaseDate: '2024-02-15', type: 'feature', size: '280 MB', releaseNotes: 'New AI-powered threat detection', recommended: false },
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

const backupHistory: BackupEntry[] = [
  { id: 'bk-1', filename: 'config_backup_20240201_143022.conf', date: '2024-02-01 14:30:22', size: '2.4 MB', type: 'auto', firmwareVersion: '7.4.2', status: 'success' },
  { id: 'bk-2', filename: 'config_backup_20240125_090015.conf', date: '2024-01-25 09:00:15', size: '2.3 MB', type: 'manual', firmwareVersion: '7.4.2', status: 'success' },
  { id: 'bk-3', filename: 'pre_upgrade_20240115_083045.conf', date: '2024-01-15 08:30:45', size: '2.2 MB', type: 'pre-upgrade', firmwareVersion: '7.4.1', status: 'success' },
  { id: 'bk-4', filename: 'config_backup_20240101_120000.conf', date: '2024-01-01 12:00:00', size: '2.1 MB', type: 'auto', firmwareVersion: '7.4.1', status: 'success' },
];

const FirmwareManagement = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [selectedFirmware, setSelectedFirmware] = useState<string | null>(null);
  const [backupBeforeUpgrade, setBackupBeforeUpgrade] = useState(true);

  const handleUpgrade = () => {
    if (!selectedFirmware) {
      toast.error('Please select a firmware version');
      return;
    }
    toast.success('Firmware upgrade initiated. System will reboot...');
  };

  const handleBackup = () => {
    toast.success('Configuration backup started');
  };

  const handleRestore = (id: string) => {
    toast.success('Configuration restore initiated');
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
          <button className="forti-toolbar-btn">
            <Upload size={12} />
            <span>Upload Firmware</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn">
            <RefreshCw size={12} />
            <span>Check Updates</span>
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
            <span className="text-sm font-bold text-blue-600">{systemInfo.model}</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Shield size={14} className="text-green-600" />
            <span className="text-lg font-bold text-green-600">v{systemInfo.currentFirmware}</span>
            <span className="text-[11px] text-[#666]">Current</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Clock size={14} className="text-purple-600" />
            <span className="text-[11px] text-[#666]">{systemInfo.uptime}</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white">
            {systemInfo.licenseStatus === 'valid' ? (
              <CheckCircle size={14} className="text-green-600" />
            ) : (
              <AlertTriangle size={14} className="text-yellow-600" />
            )}
            <span className="text-[11px] text-[#666]">License: {systemInfo.licenseExpiry}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-[#f0f0f0] border-x border-b border-[#ddd]">
            <TabsList className="bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger 
                value="current" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                System Information
              </TabsTrigger>
              <TabsTrigger 
                value="upgrade" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                Available Firmware
              </TabsTrigger>
              <TabsTrigger 
                value="backup" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
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
                        <td className="widget-value">{systemInfo.model}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Serial Number</td>
                        <td className="widget-value mono">{systemInfo.serialNumber}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Hostname</td>
                        <td className="widget-value">{systemInfo.hostname}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Uptime</td>
                        <td className="widget-value">{systemInfo.uptime}</td>
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
                        <td className="widget-value">v{systemInfo.currentFirmware}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Build Number</td>
                        <td className="widget-value">{systemInfo.buildNumber}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Last Updated</td>
                        <td className="widget-value">{systemInfo.lastUpdated}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">License Status</td>
                        <td className="widget-value">
                          <span className={cn(
                            "forti-tag",
                            systemInfo.licenseStatus === 'valid' ? 'bg-green-100 text-green-700 border-green-200' :
                            systemInfo.licenseStatus === 'expiring' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          )}>
                            {systemInfo.licenseStatus.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="widget-label">License Expiry</td>
                        <td className="widget-value">{systemInfo.licenseExpiry}</td>
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
                </tr>
              </thead>
              <tbody>
                {availableFirmware.map((fw) => (
                  <tr 
                    key={fw.id}
                    onClick={() => setSelectedFirmware(fw.id)}
                    className={cn(
                      "cursor-pointer",
                      selectedFirmware === fw.id && "bg-[#fff8e1]",
                      fw.version === systemInfo.currentFirmware && "bg-green-50"
                    )}
                  >
                    <td>
                      <input 
                        type="radio" 
                        name="firmware"
                        checked={selectedFirmware === fw.id}
                        onChange={() => setSelectedFirmware(fw.id)}
                        disabled={fw.version === systemInfo.currentFirmware}
                        className="forti-checkbox"
                      />
                    </td>
                    <td className="font-medium text-[#333]">
                      v{fw.version}
                      {fw.recommended && (
                        <span className="ml-2 forti-tag bg-blue-100 text-blue-700 border-blue-200">
                          RECOMMENDED
                        </span>
                      )}
                    </td>
                    <td className="mono text-[#666]">{fw.buildNumber}</td>
                    <td className="text-[#666]">{fw.releaseDate}</td>
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
                    <td className="text-[#666]">{fw.size}</td>
                    <td className="text-[#666]">{fw.releaseNotes}</td>
                    <td>
                      {fw.version === systemInfo.currentFirmware ? (
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
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Upgrade Options */}
            <div className="p-4 bg-[#f5f5f5] border-x border-b border-[#ddd]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-[11px]">
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
                  disabled={!selectedFirmware || availableFirmware.find(f => f.id === selectedFirmware)?.version === systemInfo.currentFirmware}
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
                  <th className="w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backupHistory.map((backup) => (
                  <tr key={backup.id}>
                    <td className="font-medium text-[#333] mono text-[10px]">{backup.filename}</td>
                    <td className="text-[#666]">{backup.date}</td>
                    <td className="text-[#666]">{backup.size}</td>
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
                    <td className="text-[#666]">v{backup.firmwareVersion}</td>
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
                        <button className="forti-toolbar-btn text-[10px]" onClick={() => handleRestore(backup.id)}>
                          <History size={10} />
                          Restore
                        </button>
                        <button className="forti-toolbar-btn text-[10px]">
                          <Download size={10} />
                          Download
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
    </Shell>
  );
};

export default FirmwareManagement;
