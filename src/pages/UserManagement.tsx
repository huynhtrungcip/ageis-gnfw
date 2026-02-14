import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { Plus, Pencil, Trash2, Shield, User, Key, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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

const initialUsers: SystemUser[] = [
  {
    id: 'user-1',
    username: 'admin',
    fullName: 'System Administrator',
    email: 'admin@aegis-ngfw.local',
    role: 'admin',
    status: 'active',
    lastLogin: new Date(Date.now() - 300000),
    createdAt: new Date('2024-01-01'),
    permissions: rolePermissions.admin,
    mfaEnabled: true,
    passwordExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    loginAttempts: 0,
  },
  {
    id: 'user-2',
    username: 'netops',
    fullName: 'Network Operations',
    email: 'netops@company.com',
    role: 'operator',
    status: 'active',
    lastLogin: new Date(Date.now() - 3600000),
    createdAt: new Date('2024-02-15'),
    permissions: rolePermissions.operator,
    mfaEnabled: true,
    passwordExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    loginAttempts: 0,
  },
  {
    id: 'user-3',
    username: 'security_audit',
    fullName: 'Security Auditor',
    email: 'audit@company.com',
    role: 'auditor',
    status: 'active',
    lastLogin: new Date(Date.now() - 86400000),
    createdAt: new Date('2024-03-01'),
    permissions: rolePermissions.auditor,
    mfaEnabled: true,
    passwordExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    loginAttempts: 0,
  },
  {
    id: 'user-4',
    username: 'readonly',
    fullName: 'Read Only User',
    email: 'viewer@company.com',
    role: 'viewer',
    status: 'disabled',
    lastLogin: null,
    createdAt: new Date('2024-03-10'),
    permissions: rolePermissions.viewer,
    mfaEnabled: false,
    passwordExpiry: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    loginAttempts: 0,
  },
  {
    id: 'user-5',
    username: 'locked_user',
    fullName: 'Locked Account',
    email: 'locked@company.com',
    role: 'operator',
    status: 'locked',
    lastLogin: new Date(Date.now() - 172800000),
    createdAt: new Date('2024-02-20'),
    permissions: rolePermissions.operator,
    mfaEnabled: false,
    passwordExpiry: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    loginAttempts: 5,
  },
];

const UserManagement = () => {
  const { demoMode } = useDemoMode();
  const [users, setUsers] = useState<SystemUser[]>(demoMode ? initialUsers : []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'viewer' as 'admin' | 'operator' | 'viewer' | 'auditor',
    password: '',
    confirmPassword: '',
    mfaEnabled: false,
  });
  const [newPassword, setNewPassword] = useState({ password: '', confirmPassword: '' });

  const selectedUser = users.find(u => u.id === selectedId);

  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(u => u.role === filterRole);

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'operator': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'viewer': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'auditor': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 size={14} className="text-status-healthy" />;
      case 'disabled': return <XCircle size={14} className="text-muted-foreground" />;
      case 'locked': return <XCircle size={14} className="text-status-critical" />;
      default: return null;
    }
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
      id: `user-${Date.now()}`,
      username: newUser.username,
      fullName: newUser.fullName || newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
      lastLogin: null,
      createdAt: new Date(),
      permissions: rolePermissions[newUser.role],
      mfaEnabled: newUser.mfaEnabled,
      passwordExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      loginAttempts: 0,
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
        ...u,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        permissions: rolePermissions[newUser.role],
        mfaEnabled: newUser.mfaEnabled,
      } : u
    ));
    setEditModalOpen(false);
    toast.success('User updated successfully');
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        if (u.username === 'admin') {
          toast.error('Cannot disable admin account');
          return u;
        }
        const newStatus = u.status === 'active' ? 'disabled' : 'active';
        toast.success(`User ${u.username} is now ${newStatus}`);
        return { ...u, status: newStatus, loginAttempts: newStatus === 'active' ? 0 : u.loginAttempts };
      }
      return u;
    }));
  };

  const handleUnlockUser = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId && u.status === 'locked') {
        toast.success(`User ${u.username} has been unlocked`);
        return { ...u, status: 'active', loginAttempts: 0 };
      }
      return u;
    }));
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.username === 'admin') {
      toast.error('Cannot delete admin account');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (selectedId === userId) setSelectedId(null);
    toast.success('User deleted');
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;
    if (newPassword.password !== newPassword.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setUsers(prev => prev.map(u => 
      u.id === selectedUser.id ? {
        ...u,
        passwordExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      } : u
    ));
    setPasswordModalOpen(false);
    setNewPassword({ password: '', confirmPassword: '' });
    toast.success('Password reset successfully');
  };

  const openEditModal = () => {
    if (!selectedUser) return;
    setNewUser({
      username: selectedUser.username,
      fullName: selectedUser.fullName,
      email: selectedUser.email,
      role: selectedUser.role,
      password: '',
      confirmPassword: '',
      mfaEnabled: selectedUser.mfaEnabled,
    });
    setEditModalOpen(true);
  };

  const counts = {
    active: users.filter(u => u.status === 'active').length,
    disabled: users.filter(u => u.status === 'disabled').length,
    locked: users.filter(u => u.status === 'locked').length,
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage system users, roles and permissions</p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm" className="gap-1.5">
            <Plus size={14} />
            Add User
          </Button>
        </div>

        {/* Summary Strip */}
        <div className="summary-strip">
          <div className="summary-item">
            <CheckCircle2 size={16} className="text-status-healthy" />
            <span className="summary-count text-status-healthy">{counts.active}</span>
            <span className="summary-label">Active</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <XCircle size={16} className="text-muted-foreground" />
            <span className="summary-count text-muted-foreground">{counts.disabled}</span>
            <span className="summary-label">Disabled</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <XCircle size={16} className="text-status-critical" />
            <span className="summary-count text-status-critical">{counts.locked}</span>
            <span className="summary-label">Locked</span>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">{users.length} total users</span>
        </div>

        {/* Filter */}
        <div className="action-strip">
          <span className="text-xs text-muted-foreground">Filter by role:</span>
          <div className="flex items-center gap-1">
            {['all', 'admin', 'operator', 'viewer', 'auditor'].map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-sm transition-all capitalize",
                  filterRole === role 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {role === 'all' ? 'All Roles' : role}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{filteredUsers.length} shown</span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4">
          {/* User List */}
          <div className="col-span-5">
            <div className="section">
              <div className="section-header">
                <span>Users</span>
              </div>
              <div className="divide-y divide-border/40 max-h-[600px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedId(user.id)}
                    className={cn(
                      "px-4 py-3 cursor-pointer transition-all duration-100",
                      selectedId === user.id
                        ? "bg-primary/10 border-l-2 border-l-primary"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User size={14} className="text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.fullName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(user.status)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn("tag border", getRoleColor(user.role))}>
                        {user.role.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Last login: {formatTime(user.lastLogin)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Detail */}
          <div className="col-span-7">
            {selectedUser ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="section">
                  <div className="section-header">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-primary" />
                      <span>User Details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedUser.status === 'locked' && (
                        <button 
                          onClick={() => handleUnlockUser(selectedUser.id)}
                          className="btn btn-primary text-xs"
                        >
                          Unlock Account
                        </button>
                      )}
                      <button 
                        onClick={() => handleToggleStatus(selectedUser.id)}
                        disabled={selectedUser.username === 'admin'}
                        className={cn(
                          "btn text-xs",
                          selectedUser.status === 'active' ? "btn-outline" : "btn-primary"
                        )}
                      >
                        {selectedUser.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={openEditModal} className="btn btn-ghost text-xs">
                        <Pencil size={12} className="mr-1" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        disabled={selectedUser.username === 'admin'}
                        className="btn btn-ghost text-xs text-destructive"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="section-body">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <User size={24} className="text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedUser.fullName}</h3>
                        <div className="text-sm text-muted-foreground">@{selectedUser.username}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("tag border", getRoleColor(selectedUser.role))}>
                            {selectedUser.role.toUpperCase()}
                          </span>
                          <span className={cn(
                            "tag",
                            selectedUser.status === 'active' ? 'tag-healthy' :
                            selectedUser.status === 'locked' ? 'tag-critical' : 'bg-muted text-muted-foreground'
                          )}>
                            {selectedUser.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="info-grid grid-cols-2">
                      <div className="info-item">
                        <div className="info-label">Email</div>
                        <div className="info-value">{selectedUser.email}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Created</div>
                        <div className="info-value">{selectedUser.createdAt.toLocaleDateString()}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Last Login</div>
                        <div className="info-value">{selectedUser.lastLogin?.toLocaleString() || 'Never'}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Login Attempts</div>
                        <div className={cn("info-value", selectedUser.loginAttempts >= 3 && "text-status-critical")}>
                          {selectedUser.loginAttempts} / 5
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="section">
                  <div className="section-header">
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-primary" />
                      <span>Security</span>
                    </div>
                    <button 
                      onClick={() => setPasswordModalOpen(true)}
                      className="btn btn-ghost text-xs"
                    >
                      Reset Password
                    </button>
                  </div>
                  <div className="section-body">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Two-Factor Authentication</span>
                          <span className={cn(
                            "tag",
                            selectedUser.mfaEnabled ? "tag-healthy" : "tag-medium"
                          )}>
                            {selectedUser.mfaEnabled ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Password Expires</span>
                          <span className={cn(
                            "text-sm font-medium",
                            selectedUser.passwordExpiry < new Date() ? "text-status-critical" : "text-foreground"
                          )}>
                            {selectedUser.passwordExpiry.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="section">
                  <div className="section-header">
                    <span>Permissions</span>
                  </div>
                  <div className="section-body">
                    <p className="text-sm text-muted-foreground mb-3">{roleDescriptions[selectedUser.role]}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.permissions.map((perm, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-muted rounded font-mono">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="section">
                <div className="section-body py-16 text-center">
                  <User size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                  <div className="text-muted-foreground">Select a user to view details</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input 
                placeholder="username"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                placeholder="John Doe"
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="user@company.com"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(v: 'admin' | 'operator' | 'viewer' | 'auditor') => setNewUser(prev => ({ ...prev, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">{roleDescriptions[newUser.role]}</p>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input 
                type="password"
                value={newUser.confirmPassword}
                onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Two-Factor Authentication</Label>
              <Switch 
                checked={newUser.mfaEnabled}
                onCheckedChange={(v) => setNewUser(prev => ({ ...prev, mfaEnabled: v }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>Create User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={newUser.username} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(v: 'admin' | 'operator' | 'viewer' | 'auditor') => setNewUser(prev => ({ ...prev, role: v }))}
                disabled={selectedUser?.username === 'admin'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Two-Factor Authentication</Label>
              <Switch 
                checked={newUser.mfaEnabled}
                onCheckedChange={(v) => setNewUser(prev => ({ ...prev, mfaEnabled: v }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleEditUser}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password for {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password"
                value={newPassword.password}
                onChange={(e) => setNewPassword(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input 
                type="password"
                value={newPassword.confirmPassword}
                onChange={(e) => setNewPassword(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters and include uppercase, lowercase, numbers and special characters.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>Cancel</Button>
              <Button onClick={handleResetPassword}>Reset Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default UserManagement;
