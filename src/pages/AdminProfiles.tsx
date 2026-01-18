import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Users,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Shield,
  Key,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  Copy
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { toast } from 'sonner';

// Admin Profile Interface
interface AdminProfile {
  id: string;
  name: string;
  description: string;
  scope: 'super_admin' | 'read_write' | 'read_only' | 'custom';
  users: number;
  permissions: {
    dashboard: boolean;
    network: boolean;
    firewall: boolean;
    vpn: boolean;
    security: boolean;
    users: boolean;
    system: boolean;
    logs: boolean;
  };
  createdAt: string;
  isDefault: boolean;
}

const mockProfiles: AdminProfile[] = [
  { 
    id: 'prof-1', 
    name: 'super_admin', 
    description: 'Full administrative access to all features', 
    scope: 'super_admin', 
    users: 2,
    permissions: { dashboard: true, network: true, firewall: true, vpn: true, security: true, users: true, system: true, logs: true },
    createdAt: '2024-01-01',
    isDefault: true
  },
  { 
    id: 'prof-2', 
    name: 'network_admin', 
    description: 'Network configuration and monitoring', 
    scope: 'custom', 
    users: 3,
    permissions: { dashboard: true, network: true, firewall: true, vpn: true, security: false, users: false, system: false, logs: true },
    createdAt: '2024-01-05',
    isDefault: false
  },
  { 
    id: 'prof-3', 
    name: 'security_analyst', 
    description: 'Security monitoring and threat analysis', 
    scope: 'custom', 
    users: 4,
    permissions: { dashboard: true, network: false, firewall: false, vpn: false, security: true, users: false, system: false, logs: true },
    createdAt: '2024-01-10',
    isDefault: false
  },
  { 
    id: 'prof-4', 
    name: 'read_only', 
    description: 'View-only access for auditors', 
    scope: 'read_only', 
    users: 5,
    permissions: { dashboard: true, network: false, firewall: false, vpn: false, security: false, users: false, system: false, logs: true },
    createdAt: '2024-01-15',
    isDefault: true
  },
];

// Audit Log Interface
interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: 'login' | 'logout' | 'config_change' | 'policy_change' | 'user_create' | 'user_delete' | 'failed_login';
  resource: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failed';
}

const mockAuditLogs: AuditLog[] = [
  { id: 'log-1', timestamp: new Date(Date.now() - 300000), user: 'admin', action: 'config_change', resource: 'Firewall Rule #12', details: 'Modified source address', ipAddress: '192.168.1.100', status: 'success' },
  { id: 'log-2', timestamp: new Date(Date.now() - 600000), user: 'john.doe', action: 'login', resource: 'Web UI', details: 'Successful login', ipAddress: '10.0.0.50', status: 'success' },
  { id: 'log-3', timestamp: new Date(Date.now() - 900000), user: 'unknown', action: 'failed_login', resource: 'Web UI', details: 'Invalid credentials (3 attempts)', ipAddress: '203.0.113.45', status: 'failed' },
  { id: 'log-4', timestamp: new Date(Date.now() - 1200000), user: 'admin', action: 'policy_change', resource: 'IPS Profile', details: 'Enabled Log4j signature', ipAddress: '192.168.1.100', status: 'success' },
  { id: 'log-5', timestamp: new Date(Date.now() - 1800000), user: 'jane.smith', action: 'user_create', resource: 'User Management', details: 'Created user: guest_user', ipAddress: '192.168.1.105', status: 'success' },
  { id: 'log-6', timestamp: new Date(Date.now() - 3600000), user: 'admin', action: 'logout', resource: 'Web UI', details: 'Session ended', ipAddress: '192.168.1.100', status: 'success' },
  { id: 'log-7', timestamp: new Date(Date.now() - 7200000), user: 'network_admin', action: 'config_change', resource: 'Interface port1', details: 'Changed IP address', ipAddress: '192.168.1.110', status: 'success' },
];

// Permission categories
const permissionCategories = [
  { key: 'dashboard', label: 'Dashboard', icon: Eye },
  { key: 'network', label: 'Network', icon: Settings },
  { key: 'firewall', label: 'Firewall', icon: Shield },
  { key: 'vpn', label: 'VPN', icon: Key },
  { key: 'security', label: 'Security Profiles', icon: Shield },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'system', label: 'System', icon: Settings },
  { key: 'logs', label: 'Logs & Reports', icon: FileText },
];

const AdminProfiles = () => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [profiles] = useState<AdminProfile[]>(mockProfiles);
  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  // Stats
  const stats = {
    totalProfiles: profiles.length,
    totalUsers: profiles.reduce((a, p) => a + p.users, 0),
    customProfiles: profiles.filter(p => p.scope === 'custom').length,
    recentLogs: auditLogs.filter(l => l.timestamp.getTime() > Date.now() - 86400000).length,
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'bg-green-100 text-green-700 border-green-200';
      case 'logout': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'config_change': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'policy_change': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'user_create': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'user_delete': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'failed_login': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'super_admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'read_write': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'read_only': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'custom': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <Shield size={14} />
            <span className="font-semibold">Admin Profiles</span>
            <span className="text-[10px] text-[#888]">Role-Based Access Control</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn primary">
            <Plus size={12} />
            <span>Create New</span>
          </button>
          <button className="forti-toolbar-btn">
            <Edit size={12} />
            <span>Edit</span>
          </button>
          <button className="forti-toolbar-btn">
            <Copy size={12} />
            <span>Clone</span>
          </button>
          <button className="forti-toolbar-btn">
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn">
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-0 border-x border-[#ddd]">
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Shield size={14} className="text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{stats.totalProfiles}</span>
            <span className="text-[11px] text-[#666]">Profiles</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Users size={14} className="text-green-600" />
            <span className="text-lg font-bold text-green-600">{stats.totalUsers}</span>
            <span className="text-[11px] text-[#666]">Administrators</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Settings size={14} className="text-purple-600" />
            <span className="text-lg font-bold text-purple-600">{stats.customProfiles}</span>
            <span className="text-[11px] text-[#666]">Custom Profiles</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white">
            <Clock size={14} className="text-orange-600" />
            <span className="text-lg font-bold text-orange-600">{stats.recentLogs}</span>
            <span className="text-[11px] text-[#666]">Events (24h)</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-[#f0f0f0] border-x border-b border-[#ddd]">
            <TabsList className="bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger 
                value="profiles" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                Admin Profiles
              </TabsTrigger>
              <TabsTrigger 
                value="permissions" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                Permissions Matrix
              </TabsTrigger>
              <TabsTrigger 
                value="audit" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                Audit Logs
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Profile Name</th>
                  <th>Description</th>
                  <th>Scope</th>
                  <th className="w-16">Users</th>
                  <th>Created</th>
                  <th className="w-20">Default</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr 
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    className={cn("cursor-pointer", selectedProfile === profile.id && "bg-[#fff8e1]")}
                  >
                    <td className="font-medium text-[#333]">{profile.name}</td>
                    <td className="text-[#666]">{profile.description}</td>
                    <td>
                      <span className={cn("forti-tag", getScopeColor(profile.scope))}>
                        {profile.scope.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-center text-[#666]">{profile.users}</td>
                    <td className="text-[#666]">{profile.createdAt}</td>
                    <td className="text-center">
                      {profile.isDefault ? (
                        <CheckCircle size={14} className="text-green-600 mx-auto" />
                      ) : (
                        <XCircle size={14} className="text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Edit size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Copy size={12} className="text-[#666]" />
                        </button>
                        <button 
                          className="p-1 hover:bg-[#f0f0f0]"
                          disabled={profile.isDefault}
                        >
                          <Trash2 size={12} className={profile.isDefault ? "text-gray-300" : "text-red-500"} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* Permissions Matrix Tab */}
          <TabsContent value="permissions" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Profile</th>
                  {permissionCategories.map(cat => (
                    <th key={cat.key} className="text-center w-24">{cat.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="font-medium text-[#333]">
                      <div className="flex items-center gap-2">
                        <Shield size={12} className="text-[#666]" />
                        {profile.name}
                      </div>
                    </td>
                    {permissionCategories.map(cat => (
                      <td key={cat.key} className="text-center">
                        <FortiToggle 
                          enabled={profile.permissions[cat.key as keyof typeof profile.permissions]}
                          onChange={() => toast.info('Edit profile to modify permissions')}
                          size="sm"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-28">Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th className="w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-[#666]">{formatTime(log.timestamp)}</td>
                    <td className="font-medium text-[#333]">{log.user}</td>
                    <td>
                      <span className={cn("forti-tag", getActionColor(log.action))}>
                        {log.action.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-[#666]">{log.resource}</td>
                    <td className="text-[#666]">{log.details}</td>
                    <td className="mono text-[#666]">{log.ipAddress}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        log.status === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                      )}>
                        {log.status.toUpperCase()}
                      </span>
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

export default AdminProfiles;
