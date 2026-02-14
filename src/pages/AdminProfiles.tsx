import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Users, Plus, RefreshCw, Search, Edit, Trash2, Shield, Key, Eye,
  Clock, CheckCircle, XCircle, FileText, Settings, Copy
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'super_admin' | 'admin' | 'operator' | 'auditor';

// Fetch all admins: profiles joined with their roles
async function fetchAdminUsers() {
  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('user_id, role, created_at');
  if (rolesErr) throw rolesErr;

  const userIds = [...new Set(roles?.map(r => r.user_id) ?? [])];
  if (userIds.length === 0) return [];

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', userIds);
  if (profErr) throw profErr;

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

  const userMapTyped = new Map<string, { profile: any; roles: AppRole[]; createdAt: string }>();
  for (const r of roles ?? []) {
    if (!userMapTyped.has(r.user_id)) {
      userMapTyped.set(r.user_id, {
        profile: profileMap.get(r.user_id),
        roles: [],
        createdAt: r.created_at,
      });
    }
    userMapTyped.get(r.user_id)!.roles.push(r.role as AppRole);
  }
  return Array.from(userMapTyped.values());
}

async function fetchAuditLogs(limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700 border-red-200',
  admin: 'bg-orange-100 text-orange-700 border-orange-200',
  operator: 'bg-blue-100 text-blue-700 border-blue-200',
  auditor: 'bg-gray-100 text-gray-600 border-gray-200',
};

const actionColors: Record<string, string> = {
  login: 'bg-green-100 text-green-700 border-green-200',
  logout: 'bg-gray-100 text-gray-600 border-gray-200',
  config_change: 'bg-blue-100 text-blue-700 border-blue-200',
  policy_change: 'bg-purple-100 text-purple-700 border-purple-200',
  user_create: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  user_delete: 'bg-orange-100 text-orange-700 border-orange-200',
  failed_login: 'bg-red-100 text-red-700 border-red-200',
};

const AdminProfiles = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { isAdminOrSuper } = useAuth();
  const queryClient = useQueryClient();

  const { data: adminUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
  });

  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => fetchAuditLogs(50),
  });

  const filteredUsers = adminUsers.filter(u =>
    !searchQuery || 
    u.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.roles.some(r => r.includes(searchQuery.toLowerCase()))
  );

  const filteredLogs = auditLogs.filter(l =>
    !searchQuery ||
    l.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.resource_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalUsers: adminUsers.length,
    superAdmins: adminUsers.filter(u => u.roles.includes('super_admin')).length,
    admins: adminUsers.filter(u => u.roles.includes('admin')).length,
    recentLogs: auditLogs.filter(l => new Date(l.created_at).getTime() > Date.now() - 86400000).length,
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    toast.success('Đã làm mới dữ liệu');
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
          {isAdminOrSuper && (
            <>
              <button className="forti-toolbar-btn primary" onClick={() => toast.info('Tạo user mới qua trang User Management')}>
                <Plus size={12} />
                <span>Create New</span>
              </button>
              <button className="forti-toolbar-btn" onClick={() => toast.info('Chọn user để chỉnh sửa')}>
                <Edit size={12} />
                <span>Edit</span>
              </button>
              <div className="forti-toolbar-separator" />
            </>
          )}
          <button className="forti-toolbar-btn" onClick={handleRefresh}>
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
            <Users size={14} className="text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{stats.totalUsers}</span>
            <span className="text-[11px] text-[#666]">Administrators</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Shield size={14} className="text-red-600" />
            <span className="text-lg font-bold text-red-600">{stats.superAdmins}</span>
            <span className="text-[11px] text-[#666]">Super Admins</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Key size={14} className="text-orange-600" />
            <span className="text-lg font-bold text-orange-600">{stats.admins}</span>
            <span className="text-[11px] text-[#666]">Admins</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white">
            <Clock size={14} className="text-purple-600" />
            <span className="text-lg font-bold text-purple-600">{stats.recentLogs}</span>
            <span className="text-[11px] text-[#666]">Events (24h)</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-[#f0f0f0] border-x border-b border-[#ddd]">
            <TabsList className="bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]">
                Admin Users
              </TabsTrigger>
              <TabsTrigger value="roles" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]">
                Role Matrix
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]">
                Audit Logs
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Admin Users Tab */}
          <TabsContent value="users" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={4} className="text-center text-[#999] py-4">Loading...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-[#999] py-4">No administrators found</td></tr>
                ) : filteredUsers.map((u) => (
                  <tr
                    key={u.profile?.user_id}
                    onClick={() => setSelectedUser(u.profile?.user_id ?? null)}
                    className={cn("cursor-pointer", selectedUser === u.profile?.user_id && "bg-[#fff8e1]")}
                  >
                    <td className="font-medium text-[#333]">{u.profile?.full_name || '—'}</td>
                    <td className="text-[#666]">{u.profile?.email || '—'}</td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {u.roles.map(role => (
                          <span key={role} className={cn("forti-tag", roleColors[role] || 'bg-gray-100 text-gray-600 border-gray-200')}>
                            {role.toUpperCase().replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-[#666]">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* Role Matrix Tab */}
          <TabsContent value="roles" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="text-center w-24">Super Admin</th>
                  <th className="text-center w-24">Admin</th>
                  <th className="text-center w-24">Operator</th>
                  <th className="text-center w-24">Auditor</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={5} className="text-center text-[#999] py-4">Loading...</td></tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u.profile?.user_id}>
                    <td className="font-medium text-[#333]">
                      <div className="flex items-center gap-2">
                        <Shield size={12} className="text-[#666]" />
                        {u.profile?.full_name || u.profile?.email || '—'}
                      </div>
                    </td>
                    {(['super_admin', 'admin', 'operator', 'auditor'] as AppRole[]).map(role => (
                      <td key={role} className="text-center">
                        {u.roles.includes(role) ? (
                          <CheckCircle size={14} className="text-green-600 mx-auto" />
                        ) : (
                          <XCircle size={14} className="text-gray-300 mx-auto" />
                        )}
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
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr><td colSpan={5} className="text-center text-[#999] py-4">Loading...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-[#999] py-4">No audit logs found</td></tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-[#666]">{formatTime(log.created_at)}</td>
                    <td>
                      <span className={cn("forti-tag", actionColors[log.action] || 'bg-gray-100 text-gray-600 border-gray-200')}>
                        {log.action.toUpperCase().replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-[#666]">{log.resource_type}</td>
                    <td className="text-[#666]">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details) || '—'}</td>
                    <td className="mono text-[#666]">{log.ip_address || '—'}</td>
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
