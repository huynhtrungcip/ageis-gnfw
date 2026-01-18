import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  Server, 
  RefreshCw, 
  Settings, 
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface ClusterMember {
  id: string;
  hostname: string;
  role: 'primary' | 'secondary' | 'standby';
  status: 'active' | 'passive' | 'offline' | 'syncing';
  priority: number;
  serialNumber: string;
  uptime: number;
  cpu: number;
  memory: number;
  sessions: number;
  lastSync: Date;
}

const mockClusterMembers: ClusterMember[] = [
  {
    id: 'node-1',
    hostname: 'AEGIS-NGFW-01',
    role: 'primary',
    status: 'active',
    priority: 200,
    serialNumber: 'FGT60F0000000001',
    uptime: 864000,
    cpu: 23,
    memory: 45,
    sessions: 12458,
    lastSync: new Date(Date.now() - 30000),
  },
  {
    id: 'node-2',
    hostname: 'AEGIS-NGFW-02',
    role: 'secondary',
    status: 'passive',
    priority: 100,
    serialNumber: 'FGT60F0000000002',
    uptime: 864000,
    cpu: 5,
    memory: 32,
    sessions: 0,
    lastSync: new Date(Date.now() - 30000),
  },
];

const HighAvailability = () => {
  const [haEnabled, setHaEnabled] = useState(true);
  const [haMode, setHaMode] = useState<'active-passive' | 'active-active'>('active-passive');
  const [members, setMembers] = useState<ClusterMember[]>(mockClusterMembers);
  const [activeTab, setActiveTab] = useState<'status' | 'settings' | 'history'>('status');
  
  // HA Settings
  const [groupName, setGroupName] = useState('AEGIS-HA-CLUSTER');
  const [groupId, setGroupId] = useState('1');
  const [password, setPassword] = useState('********');
  const [heartbeatInterface, setHeartbeatInterface] = useState('port5');
  const [monitorInterfaces, setMonitorInterfaces] = useState(['port1', 'port2']);
  const [sessionPickup, setSessionPickup] = useState(true);
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [pingServer, setPingServer] = useState('8.8.8.8');

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const formatSyncTime = (date: Date): string => {
    const diff = Date.now() - date.getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  };

  const handleFailover = () => {
    toast.success('Manual failover initiated');
    setMembers(prev => prev.map(m => ({
      ...m,
      role: m.role === 'primary' ? 'secondary' : 'primary',
      status: m.status === 'active' ? 'passive' : 'active',
    })));
  };

  const handleSync = () => {
    toast.success('Configuration sync initiated');
    setMembers(prev => prev.map(m => ({
      ...m,
      lastSync: new Date(),
    })));
  };

  const primaryNode = members.find(m => m.role === 'primary');
  const secondaryNode = members.find(m => m.role === 'secondary');

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
          <button onClick={handleSync} className="forti-toolbar-btn primary">
            <RefreshCw className="w-3 h-3" />
            Synchronize
          </button>
          <button onClick={handleFailover} className="forti-toolbar-btn">
            <ArrowLeftRight className="w-3 h-3" />
            Manual Failover
          </button>
          <div className="forti-toolbar-separator" />
          <div className="flex items-center gap-2 px-2">
            <span className="text-[11px] text-[#666]">HA Mode:</span>
            <FortiToggle enabled={haEnabled} onToggle={() => setHaEnabled(!haEnabled)} size="sm" />
            <span className={cn("text-[11px] font-medium", haEnabled ? "text-green-600" : "text-[#999]")}>
              {haEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex-1" />
        </div>

        {/* HA Status Banner */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 border-b",
          haEnabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
        )}>
          {haEnabled ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <div className={cn("text-[12px] font-semibold", haEnabled ? "text-green-700" : "text-gray-600")}>
              {haEnabled ? 'High Availability Active' : 'High Availability Disabled'}
            </div>
            <div className="text-[10px] text-[#666]">
              {haEnabled 
                ? `Cluster: ${groupName} | Mode: ${haMode === 'active-passive' ? 'Active-Passive' : 'Active-Active'} | Members: ${members.length}`
                : 'Enable HA to configure cluster settings'
              }
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {[
            { id: 'status', label: 'Cluster Status', icon: Activity },
            { id: 'settings', label: 'HA Settings', icon: Settings },
            { id: 'history', label: 'Failover History', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeTab === tab.id 
                  ? "bg-white text-[hsl(142,70%,35%)] border-[hsl(142,70%,35%)]" 
                  : "text-[#666] border-transparent hover:text-[#333] hover:bg-[#f0f0f0]"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cluster Status Tab */}
        {activeTab === 'status' && haEnabled && (
          <div className="p-4 space-y-4">
            {/* Cluster Visualization */}
            <div className="grid grid-cols-2 gap-4">
              {members.map((member) => (
                <div key={member.id} className={cn(
                  "section",
                  member.status === 'active' && "ring-2 ring-green-500"
                )}>
                  <div className={cn(
                    "section-header",
                    member.status === 'active' ? "" : "!bg-gradient-to-b !from-gray-500 !to-gray-600"
                  )}>
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      <span>{member.hostname}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 text-[9px] font-bold rounded",
                      member.status === 'active' ? "bg-white/20" : "bg-white/10"
                    )}>
                      {member.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="section-body">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-[#f5f5f5] border border-[#ddd]">
                        <div className={cn(
                          "text-lg font-bold",
                          member.status === 'active' ? "text-green-600" : "text-[#666]"
                        )}>
                          {member.status === 'active' ? 'ACTIVE' : 'STANDBY'}
                        </div>
                        <div className="text-[10px] text-[#666]">Status</div>
                      </div>
                      <div className="text-center p-3 bg-[#f5f5f5] border border-[#ddd]">
                        <div className="text-lg font-bold">{member.priority}</div>
                        <div className="text-[10px] text-[#666]">Priority</div>
                      </div>
                    </div>

                    <table className="widget-table">
                      <tbody>
                        <tr>
                          <td className="widget-label">Serial Number</td>
                          <td className="widget-value mono text-[10px]">{member.serialNumber}</td>
                        </tr>
                        <tr>
                          <td className="widget-label">Uptime</td>
                          <td className="widget-value">{formatUptime(member.uptime)}</td>
                        </tr>
                        <tr>
                          <td className="widget-label">Last Sync</td>
                          <td className="widget-value">{formatSyncTime(member.lastSync)}</td>
                        </tr>
                        <tr>
                          <td className="widget-label">Sessions</td>
                          <td className="widget-value">{member.sessions.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-4 space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-[#666]">CPU</span>
                          <span>{member.cpu}%</span>
                        </div>
                        <div className="forti-progress">
                          <div 
                            className={cn(
                              "forti-progress-bar",
                              member.cpu > 80 ? "red" : member.cpu > 50 ? "orange" : "green"
                            )}
                            style={{ width: `${member.cpu}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-[#666]">Memory</span>
                          <span>{member.memory}%</span>
                        </div>
                        <div className="forti-progress">
                          <div 
                            className={cn(
                              "forti-progress-bar",
                              member.memory > 80 ? "red" : member.memory > 50 ? "orange" : "blue"
                            )}
                            style={{ width: `${member.memory}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sync Status */}
            <div className="section">
              <div className="section-header-neutral">
                <span>Synchronization Status</span>
              </div>
              <div className="section-body">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Configuration', status: 'synced' },
                    { label: 'Sessions', status: 'synced' },
                    { label: 'Certificates', status: 'synced' },
                    { label: 'Signatures', status: 'synced' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2 bg-[#f8f8f8] border border-[#ddd]">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="text-[11px] font-medium">{item.label}</div>
                        <div className="text-[10px] text-green-600">Synchronized</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HA Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="section">
                <div className="section-header">
                  <span>Cluster Configuration</span>
                </div>
                <div className="section-body space-y-4">
                  <div>
                    <label className="forti-label">HA Mode</label>
                    <select 
                      value={haMode} 
                      onChange={(e) => setHaMode(e.target.value as any)}
                      className="forti-select w-full"
                    >
                      <option value="active-passive">Active-Passive</option>
                      <option value="active-active">Active-Active</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="forti-label">Group Name</label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="forti-input w-full"
                      />
                    </div>
                    <div>
                      <label className="forti-label">Group ID</label>
                      <input
                        type="number"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                        className="forti-input w-full"
                        min="0"
                        max="255"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="forti-label">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="forti-input w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <span>Heartbeat & Monitoring</span>
                </div>
                <div className="section-body space-y-4">
                  <div>
                    <label className="forti-label">Heartbeat Interface</label>
                    <select 
                      value={heartbeatInterface} 
                      onChange={(e) => setHeartbeatInterface(e.target.value)}
                      className="forti-select w-full"
                    >
                      <option value="port5">port5 (Dedicated HA)</option>
                      <option value="port6">port6</option>
                      <option value="port7">port7</option>
                    </select>
                  </div>
                  <div>
                    <label className="forti-label">Monitor Interfaces</label>
                    <div className="space-y-2 mt-2">
                      {['port1', 'port2', 'port3', 'port4'].map((port) => (
                        <label key={port} className="flex items-center gap-2 text-[11px]">
                          <input
                            type="checkbox"
                            checked={monitorInterfaces.includes(port)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMonitorInterfaces([...monitorInterfaces, port]);
                              } else {
                                setMonitorInterfaces(monitorInterfaces.filter(p => p !== port));
                              }
                            }}
                            className="forti-checkbox"
                          />
                          {port}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="forti-label">Ping Server (Health Check)</label>
                    <input
                      type="text"
                      value={pingServer}
                      onChange={(e) => setPingServer(e.target.value)}
                      className="forti-input w-full"
                      placeholder="8.8.8.8"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header-neutral">
                <span>Failover Settings</span>
              </div>
              <div className="section-body space-y-2">
                <div className="forti-feature-item">
                  <div>
                    <div className="text-[11px] font-medium">Session Pickup</div>
                    <div className="text-[10px] text-[#666]">Maintain sessions during failover</div>
                  </div>
                  <FortiToggle enabled={sessionPickup} onToggle={() => setSessionPickup(!sessionPickup)} size="sm" />
                </div>
                <div className="forti-feature-item">
                  <div>
                    <div className="text-[11px] font-medium">Override</div>
                    <div className="text-[10px] text-[#666]">Primary unit resumes control after recovery</div>
                  </div>
                  <FortiToggle enabled={overrideEnabled} onToggle={() => setOverrideEnabled(!overrideEnabled)} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Failover History Tab */}
        {activeTab === 'history' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { time: '2024-01-15 14:32:45', event: 'Failover', from: 'AEGIS-NGFW-01', to: 'AEGIS-NGFW-02', reason: 'Manual', duration: '< 1s' },
                  { time: '2024-01-10 09:15:22', event: 'Failback', from: 'AEGIS-NGFW-02', to: 'AEGIS-NGFW-01', reason: 'Primary Recovered', duration: '< 1s' },
                  { time: '2024-01-10 08:45:11', event: 'Failover', from: 'AEGIS-NGFW-01', to: 'AEGIS-NGFW-02', reason: 'Link Failure (port1)', duration: '< 1s' },
                ].map((event, idx) => (
                  <tr key={idx}>
                    <td className="mono text-[10px]">{event.time}</td>
                    <td>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 border",
                        event.event === 'Failover' ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-blue-100 text-blue-700 border-blue-200"
                      )}>
                        {event.event}
                      </span>
                    </td>
                    <td className="text-[11px]">{event.from}</td>
                    <td className="text-[11px]">{event.to}</td>
                    <td className="text-[11px] text-[#666]">{event.reason}</td>
                    <td className="text-[11px] text-green-600">{event.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Disabled State */}
        {activeTab === 'status' && !haEnabled && (
          <div className="p-8 text-center">
            <Server className="w-16 h-16 mx-auto text-[#ccc] mb-4" />
            <div className="text-[14px] font-medium text-[#666] mb-2">High Availability is Disabled</div>
            <div className="text-[11px] text-[#999] mb-4">Enable HA to configure cluster settings and view status</div>
            <button onClick={() => setHaEnabled(true)} className="forti-btn forti-btn-primary">
              Enable High Availability
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default HighAvailability;
