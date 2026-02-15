import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { Plus, Edit, Trash2, Shield, Users, Key, RefreshCw, Search, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer' | 'auditor';
  status: 'active' | 'disabled' | 'locked';
  lastLogin: Date | null;
  createdAt: Date;
  permissions: string[];
  mfaEnabled: boolean;
  passwordExpiry: Date;
  loginAttempts: number;
}

const rolePermissions = {
  admin: ['all'],
  operator: ['firewall.edit', 'vpn.edit', 'interfaces.edit', 'routing.edit', 'logs.view'],
  viewer: ['firewall.view', 'vpn.view', 'interfaces.view', 'routing.view', 'logs.view', 'dashboard.view'],
  auditor: ['logs.view', 'reports.view', 'audit.view', 'dashboard.view'],
};

const roleDescriptions = {
  admin: 'Full system access with all permissions',
  operator: 'Can configure firewall, VPN, routing and view logs',
  viewer: 'Read-only access to system configuration',
  auditor: 'Access to logs, reports and audit trails only',
};

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  operator: 'bg-blue-100 text-blue-700 border-blue-200',
  viewer: 'bg-green-100 text-green-700 border-green-200',
  auditor: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  disabled: 'bg-gray-100 text-gray-500 border-gray-200',
  locked: 'bg-red-100 text-red-700 border-red-200',
};

const initialUsers: SystemUser[] = [
  {
    id: 'user-1', username: 'admin', fullName: 'System Administrator',
    email: 'admin@aegis-ngfw.local', role: 'admin', status: 'active',
    lastLogin: new Date(Date.now() - 300000), createdAt: new Date('2024-01-01'),
    permissions: rolePermissions.admin, mfaEnabled: true,
    passwordExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), loginAttempts: 0,
  },
  {
    id: 'user-2', username: 'netops', fullName: 'Network Operations',
    email: 'netops@company.com', role: 'operator', status: 'active',
    lastLogin: new Date(Date.now() - 3600000), createdAt: new Date('2024-02-15'),
    permissions: rolePermissions.operator, mfaEnabled: true,
    passwordExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), loginAttempts: 0,
  },
  {
    id: 'user-3', username: 'security_audit', fullName: 'Security Auditor',
    email: 'audit@company.com', role: 'auditor', status: 'active',
    lastLogin: new Date(Date.now() - 86400000), createdAt: new Date('2024-03-01'),
    permissions: rolePermissions.auditor, mfaEnabled: true,
    passwordExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), loginAttempts: 0,
  },
  {
    id: 'user-4', username: 'readonly', fullName: 'Read Only User',
    email: 'viewer@company.com', role: 'viewer', status: 'disabled',
    lastLogin: null, createdAt: new Date('2024-03-10'),
    permissions: rolePermissions.viewer, mfaEnabled: false,
    passwordExpiry: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), loginAttempts: 0,
  },
  {
    id: 'user-5', username: 'locked_user', fullName: 'Locked Account',
    email: 'locked@company.com', role: 'operator', status: 'locked',
    lastLogin: new Date(Date.now() - 172800000), createdAt: new Date('2024-02-20'),
    permissions: rolePermissions.operator, mfaEnabled: false,
    passwordExpiry: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), loginAttempts: 5,
  },
];

const UserManagement = () => {
  const { demoMode } = useDemoMode();
  const [users, setUsers] = useState<SystemUser[]>(demoMode ? initialUsers : []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [newUser, setNewUser] = useState({
    username: '', fullName: '', email: '',
    role: 'viewer' as 'admin' | 'operator' | 'viewer' | 'auditor',
    password: '', confirmPassword: '', mfaEnabled: false,
  });
  const [newPassword, setNewPassword] = useState({ password: '', confirmPassword: '' });

  const selectedUser = users.find(u => u.id === selectedId);

  const filteredUsers = users.filter(u =>
    !searchQuery ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    disabled: users.filter(u => u.status === 'disabled').length,
    locked: users.filter(u => u.status === 'locked').length,
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error('Username, email and password are required');
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (users.some(u => u.username === newUser.username)) {
      toast.error('Username already exists');
      return;
    }
    const user: SystemUser = {
      id: `user-${Date.now()}`, username: newUser.username,
      fullName: newUser.fullName || newUser.username, email: newUser.email,
      role: newUser.role, status: 'active', lastLogin: null, createdAt: new Date(),
      permissions: rolePermissions[newUser.role], mfaEnabled: newUser.mfaEnabled,
      passwordExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), loginAttempts: 0,
    };
    setUsers(prev => [...prev, user]);
    setModalOpen(false);
    setNewUser({ username: '', fullName: '', email: '', role: 'viewer', password: '', confirmPassword: '', mfaEnabled: false });
    toast.success('User created successfully');
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    setUsers(prev => prev.map(u =>
      u.id === selectedUser.id ? {
        ...u, fullName: newUser.fullName, email: newUser.email,
        role: newUser.role, permissions: rolePermissions[newUser.role], mfaEnabled: newUser.mfaEnabled,
      } : u
    ));
    setEditModalOpen(false);
    toast.success('User updated successfully');
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        if (u.username === 'admin') { toast.error('Cannot disable admin account'); return u; }
        const newStatus = u.status === 'active' ? 'disabled' : 'active';
        toast.success(`User ${u.username} is now ${newStatus}`);
        return { ...u, status: newStatus as any, loginAttempts: newStatus === 'active' ? 0 : u.loginAttempts };
      }
      return u;
    }));
  };

  const handleUnlockUser = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId && u.status === 'locked') {
        toast.success(`User ${u.username} has been unlocked`);
        return { ...u, status: 'active' as const, loginAttempts: 0 };
      }
      return u;
    }));
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.username === 'admin') { toast.error('Cannot delete admin account'); return; }
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (selectedId === userId) setSelectedId(null);
    setDeleteConfirm(null);
    toast.success('User deleted');
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;
    if (newPassword.password !== newPassword.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setUsers(prev => prev.map(u =>
      u.id === selectedUser.id ? { ...u, passwordExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } : u
    ));
    setPasswordModalOpen(false);
    setNewPassword({ password: '', confirmPassword: '' });
    toast.success('Password reset successfully');
  };

  const openEditModal = () => {
    if (!selectedUser) { toast.info('Select a user first'); return; }
    setNewUser({
      username: selectedUser.username, fullName: selectedUser.fullName,
      email: selectedUser.email, role: selectedUser.role,
      password: '', confirmPassword: '', mfaEnabled: selectedUser.mfaEnabled,
    });
    setEditModalOpen(true);
  };

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span className="font-semibold">User Management</span>
            <span className="text-[10px] text-[#888]">Local Users & Access Control</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn primary" onClick={() => setModalOpen(true)}>
            <Plus size={12} />
            <span>Create New</span>
          </button>
          <button className="forti-toolbar-btn" onClick={openEditModal}>
            <Edit size={12} />
            <span>Edit</span>
          </button>
          <button
            className="forti-toolbar-btn"
            onClick={() => {
              if (!selectedId) { toast.info('Select a user to delete'); return; }
              const u = users.find(x => x.id === selectedId);
              if (u?.username === 'admin') { toast.error('Cannot delete admin account'); return; }
              setDeleteConfirm(selectedId);
            }}
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={() => toast.success('Data refreshed')}>
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-0 border-x border-[#ddd]">
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Users size={14} className="text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{stats.total}</span>
            <span className="text-[11px] text-[#666]">Total Users</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-lg font-bold text-green-600">{stats.active}</span>
            <span className="text-[11px] text-[#666]">Active</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-lg font-bold text-gray-500">{stats.disabled}</span>
            <span className="text-[11px] text-[#666]">Disabled</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white">
            <Lock size={14} className="text-red-500" />
            <span className="text-lg font-bold text-red-600">{stats.locked}</span>
            <span className="text-[11px] text-[#666]">Locked</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-[#f0f0f0] border-x border-b border-[#ddd]">
            <TabsList className="bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]">
                User List
              </TabsTrigger>
              <TabsTrigger value="roles" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]">
                Role Matrix
              </TabsTrigger>
            </TabsList>
          </div>

          {/* User List Tab */}
          <TabsContent value="users" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>MFA</th>
                  <th>Last Login</th>
                  <th>Password Expires</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-[#999] py-4">No users found</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedId(user.id)}
                    className={cn("cursor-pointer", selectedId === user.id && "bg-[#fff8e1]")}
                  >
                    <td className="text-center">
                      <input
                        type="radio"
                        name="user-select"
                        checked={selectedId === user.id}
                        onChange={() => setSelectedId(user.id)}
                        className="accent-[hsl(142,70%,35%)]"
                      />
                    </td>
                    <td className="font-medium text-[#333]">{user.username}</td>
                    <td className="text-[#555]">{user.fullName}</td>
                    <td className="text-[#666]">{user.email}</td>
                    <td>
                      <span className={cn("forti-tag", roleColors[user.role])}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={cn("forti-tag", statusColors[user.status])}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={cn("text-[11px] font-medium", user.mfaEnabled ? "text-green-600" : "text-[#999]")}>
                        {user.mfaEnabled ? '✓' : '—'}
                      </span>
                    </td>
                    <td className="text-[#666]">{formatTime(user.lastLogin)}</td>
                    <td className={cn("text-[11px]", user.passwordExpiry < new Date() ? "text-red-600 font-semibold" : "text-[#666]")}>
                      {user.passwordExpiry.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Selected User Detail Panel */}
            {selectedUser && (
              <div className="border-x border-b border-[#ddd] bg-white">
                <div className="px-3 py-1.5 bg-[#e8e8e8] border-b border-[#ccc] text-[11px] font-semibold text-[#333] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={12} />
                    <span>User Details — {selectedUser.username}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedUser.status === 'locked' && (
                      <button className="forti-toolbar-btn" onClick={() => handleUnlockUser(selectedUser.id)}>
                        <Unlock size={12} />
                        <span>Unlock</span>
                      </button>
                    )}
                    <button
                      className="forti-toolbar-btn"
                      onClick={() => handleToggleStatus(selectedUser.id)}
                      disabled={selectedUser.username === 'admin'}
                    >
                      {selectedUser.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button className="forti-toolbar-btn" onClick={() => { setPasswordModalOpen(true); }}>
                      <Key size={12} />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-4 gap-x-6 gap-y-2 text-[11px]">
                  <div>
                    <span className="text-[#888] block">Full Name</span>
                    <span className="text-[#333] font-medium">{selectedUser.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[#888] block">Email</span>
                    <span className="text-[#333] font-medium">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="text-[#888] block">Created</span>
                    <span className="text-[#333] font-medium">{selectedUser.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[#888] block">Login Attempts</span>
                    <span className={cn("font-medium", selectedUser.loginAttempts >= 3 ? "text-red-600" : "text-[#333]")}>
                      {selectedUser.loginAttempts} / 5
                    </span>
                  </div>
                  <div>
                    <span className="text-[#888] block">Two-Factor Auth</span>
                    <span className={cn("font-medium", selectedUser.mfaEnabled ? "text-green-600" : "text-orange-500")}>
                      {selectedUser.mfaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#888] block">Password Expires</span>
                    <span className={cn("font-medium", selectedUser.passwordExpiry < new Date() ? "text-red-600" : "text-[#333]")}>
                      {selectedUser.passwordExpiry.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#888] block">Permissions</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedUser.permissions.map((perm, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 text-[10px] bg-[#f0f0f0] border border-[#ddd] text-[#555] font-mono">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Role Matrix Tab */}
          <TabsContent value="roles" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th className="text-center w-24">Admin</th>
                  <th className="text-center w-24">Operator</th>
                  <th className="text-center w-24">Viewer</th>
                  <th className="text-center w-24">Auditor</th>
                  <th className="text-center w-16">MFA</th>
                  <th className="text-center w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium text-[#333]">{user.username}</td>
                    <td className="text-[#555]">{user.fullName}</td>
                    {(['admin', 'operator', 'viewer', 'auditor'] as const).map(role => (
                      <td key={role} className="text-center">
                        {user.role === role ? (
                          <span className="text-green-600 font-bold">●</span>
                        ) : (
                          <span className="text-gray-300">○</span>
                        )}
                      </td>
                    ))}
                    <td className="text-center">
                      <FortiToggle enabled={user.mfaEnabled} size="sm" />
                    </td>
                    <td className="text-center">
                      <span className={cn("forti-tag", statusColors[user.status])}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Role Descriptions */}
            <div className="border-x border-b border-[#ddd] bg-white p-3">
              <div className="text-[11px] font-semibold text-[#333] mb-2">Role Descriptions</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {Object.entries(roleDescriptions).map(([role, desc]) => (
                  <div key={role} className="flex items-start gap-2 p-2 bg-[#fafafa] border border-[#eee]">
                    <span className={cn("forti-tag mt-0.5", roleColors[role])}>{role.toUpperCase()}</span>
                    <span className="text-[#666]">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-[11px]">
            <div className="space-y-1">
              <Label className="text-[11px]">Username</Label>
              <Input className="h-7 text-[11px]" placeholder="username"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Full Name</Label>
              <Input className="h-7 text-[11px]" placeholder="John Doe"
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Email</Label>
              <Input className="h-7 text-[11px]" type="email" placeholder="user@company.com"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Role</Label>
              <Select value={newUser.role} onValueChange={(v: any) => setNewUser(prev => ({ ...prev, role: v }))}>
                <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-[#999]">{roleDescriptions[newUser.role]}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Password</Label>
              <Input className="h-7 text-[11px]" type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Confirm Password</Label>
              <Input className="h-7 text-[11px]" type="password"
                value={newUser.confirmPassword}
                onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="text-[11px]">Require Two-Factor Authentication</Label>
              <FortiToggle enabled={newUser.mfaEnabled} onToggle={() => setNewUser(prev => ({ ...prev, mfaEnabled: !prev.mfaEnabled }))} size="sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eee]">
              <button className="forti-toolbar-btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="forti-toolbar-btn primary" onClick={handleAddUser}>Create User</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-[11px]">
            <div className="space-y-1">
              <Label className="text-[11px]">Username</Label>
              <Input className="h-7 text-[11px] bg-[#f5f5f5]" value={newUser.username} disabled />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Full Name</Label>
              <Input className="h-7 text-[11px]" value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Email</Label>
              <Input className="h-7 text-[11px]" type="email" value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Role</Label>
              <Select value={newUser.role} onValueChange={(v: any) => setNewUser(prev => ({ ...prev, role: v }))}
                disabled={selectedUser?.username === 'admin'}
              >
                <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="text-[11px]">Two-Factor Authentication</Label>
              <FortiToggle enabled={newUser.mfaEnabled} onToggle={() => setNewUser(prev => ({ ...prev, mfaEnabled: !prev.mfaEnabled }))} size="sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eee]">
              <button className="forti-toolbar-btn" onClick={() => setEditModalOpen(false)}>Cancel</button>
              <button className="forti-toolbar-btn primary" onClick={handleEditUser}>Save Changes</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Reset Password — {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-[11px]">
            <div className="space-y-1">
              <Label className="text-[11px]">New Password</Label>
              <Input className="h-7 text-[11px]" type="password"
                value={newPassword.password}
                onChange={(e) => setNewPassword(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Confirm Password</Label>
              <Input className="h-7 text-[11px]" type="password"
                value={newPassword.confirmPassword}
                onChange={(e) => setNewPassword(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
            <p className="text-[10px] text-[#999]">Password must be at least 8 characters with uppercase, lowercase, numbers and special characters.</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eee]">
              <button className="forti-toolbar-btn" onClick={() => setPasswordModalOpen(false)}>Cancel</button>
              <button className="forti-toolbar-btn primary" onClick={handleResetPassword}>Reset Password</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-[11px]">
              Are you sure you want to delete user "{users.find(u => u.id === deleteConfirm)?.username}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 text-[11px]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-7 text-[11px] bg-red-600 hover:bg-red-700" onClick={() => deleteConfirm && handleDeleteUser(deleteConfirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default UserManagement;
