import { Shell } from '@/components/layout/Shell';
import { Plus, Edit2, Trash2, RefreshCw, Search, Network, ArrowRight, Copy, Download, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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

interface StaticRoute {
  id: string;
  destination: string;
  gateway: string;
  interface: string;
  distance: number;
  priority: number;
  status: 'enabled' | 'disabled';
  comment: string;
}

const mockRoutes: StaticRoute[] = [
  { id: '1', destination: '0.0.0.0/0', gateway: '192.168.1.1', interface: 'wan1', distance: 10, priority: 0, status: 'enabled', comment: 'Default Gateway' },
  { id: '2', destination: '10.0.0.0/8', gateway: '192.168.100.1', interface: 'internal', distance: 10, priority: 0, status: 'enabled', comment: 'Internal Network' },
  { id: '3', destination: '172.16.0.0/12', gateway: '192.168.100.254', interface: 'dmz', distance: 10, priority: 0, status: 'enabled', comment: 'DMZ Route' },
  { id: '4', destination: '192.168.50.0/24', gateway: '192.168.1.254', interface: 'wan2', distance: 20, priority: 5, status: 'disabled', comment: 'Backup Route' },
];

const interfaces = ['wan1', 'wan2', 'internal', 'dmz', 'port1', 'port2', 'port3', 'port4'];

const StaticRoutes = () => {
  const { demoMode } = useDemoMode();
  const [routes, setRoutes] = useState<StaticRoute[]>(demoMode ? mockRoutes : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<StaticRoute | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<StaticRoute>>({
    destination: '',
    gateway: '',
    interface: 'wan1',
    distance: 10,
    priority: 0,
    status: 'enabled',
    comment: '',
  });

  const toggleRoute = (id: string) => {
    setRoutes(prev => prev.map(r => 
      r.id === id ? { ...r, status: r.status === 'enabled' ? 'disabled' : 'enabled' } : r
    ));
    toast.success('Route status updated');
  };

  const handleCreate = () => {
    setEditingRoute(null);
    setFormData({
      destination: '',
      gateway: '',
      interface: 'wan1',
      distance: 10,
      priority: 0,
      status: 'enabled',
      comment: '',
    });
    setShowModal(true);
  };

  const handleEdit = (route: StaticRoute) => {
    setEditingRoute(route);
    setFormData(route);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.destination || !formData.gateway) {
      toast.error('Destination and Gateway are required');
      return;
    }

    if (editingRoute) {
      setRoutes(prev => prev.map(r => 
        r.id === editingRoute.id ? { ...r, ...formData } as StaticRoute : r
      ));
      toast.success('Route updated successfully');
    } else {
      const newRoute: StaticRoute = {
        id: Date.now().toString(),
        ...formData as StaticRoute,
      };
      setRoutes(prev => [...prev, newRoute]);
      toast.success('Route created successfully');
    }
    setShowModal(false);
  };

  const handleDeleteConfirm = (id: string) => {
    setRouteToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (routeToDelete) {
      setRoutes(prev => prev.filter(r => r.id !== routeToDelete));
      setSelectedIds(prev => prev.filter(id => id !== routeToDelete));
      toast.success('Route deleted successfully');
    }
    setDeleteConfirmOpen(false);
    setRouteToDelete(null);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('Select routes to delete');
      return;
    }
    setRoutes(prev => prev.filter(r => !selectedIds.includes(r.id)));
    setSelectedIds([]);
    toast.success(`${selectedIds.length} routes deleted`);
  };

  const handleClone = (route: StaticRoute) => {
    const cloned: StaticRoute = {
      ...route,
      id: Date.now().toString(),
      comment: `${route.comment} (Copy)`,
    };
    setRoutes(prev => [...prev, cloned]);
    toast.success('Route cloned');
  };

  const handleExport = () => {
    const data = JSON.stringify(routes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'static_routes.json';
    a.click();
    toast.success('Routes exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            setRoutes(prev => [...prev, ...data]);
            toast.success('Routes imported');
          } catch {
            toast.error('Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRoutes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRoutes.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredRoutes = routes.filter(r => 
    r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.gateway.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.interface.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn primary" onClick={handleCreate}>
            <Plus className="w-3 h-3" />
            Create New
          </button>
          <button 
            className="forti-toolbar-btn" 
            onClick={() => selectedIds.length === 1 ? handleEdit(routes.find(r => r.id === selectedIds[0])!) : toast.error('Select one route to edit')}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button 
            className="forti-toolbar-btn" 
            onClick={() => selectedIds.length === 1 ? handleClone(routes.find(r => r.id === selectedIds[0])!) : toast.error('Select one route to clone')}
          >
            <Copy className="w-3 h-3" />
            Clone
          </button>
          <button className="forti-toolbar-btn text-red-600" onClick={handleBulkDelete}>
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={handleExport}>
            <Download className="w-3 h-3" />
            Export
          </button>
          <button className="forti-toolbar-btn" onClick={handleImport}>
            <Upload className="w-3 h-3" />
            Import
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={() => toast.success('Routes refreshed')}>
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input 
              type="text" 
              placeholder="Search routes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
            />
          </div>
        </div>

        {/* Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8">
                <input 
                  type="checkbox" 
                  className="forti-checkbox"
                  checked={selectedIds.length === filteredRoutes.length && filteredRoutes.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="w-16">Status</th>
              <th>Destination</th>
              <th>Gateway</th>
              <th>Interface</th>
              <th>Distance</th>
              <th>Priority</th>
              <th>Comment</th>
              <th className="w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((route) => (
              <tr 
                key={route.id} 
                className={cn(
                  selectedIds.includes(route.id) && "selected",
                  route.status === 'disabled' && "opacity-60"
                )}
              >
                <td>
                  <input 
                    type="checkbox" 
                    className="forti-checkbox"
                    checked={selectedIds.includes(route.id)}
                    onChange={() => toggleSelect(route.id)}
                  />
                </td>
                <td>
                  <FortiToggle 
                    enabled={route.status === 'enabled'} 
                    onToggle={() => toggleRoute(route.id)}
                    size="sm"
                  />
                </td>
                <td className="mono text-[#111] font-medium">{route.destination}</td>
                <td className="mono text-[#111]">
                  <span className="flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-[#666]" />
                    {route.gateway}
                  </span>
                </td>
                <td>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                    {route.interface}
                  </span>
                </td>
                <td className="text-[#333]">{route.distance}</td>
                <td className="text-[#333]">{route.priority}</td>
                <td className="text-[#333]">{route.comment}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button 
                      className="p-1 hover:bg-[#f0f0f0]" 
                      onClick={() => handleEdit(route)}
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3 text-[#666]" />
                    </button>
                    <button 
                      className="p-1 hover:bg-[#f0f0f0]" 
                      onClick={() => handleDeleteConfirm(route.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#f5f5f5] border border-t-0 border-[#ddd] text-[11px] text-[#333]">
          <span>Total: {routes.length} routes</span>
          <span>Showing {filteredRoutes.length} of {routes.length}</span>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#ccc] shadow-xl w-[500px]">
            <div className="forti-modal-header flex items-center justify-between">
              <span>{editingRoute ? 'Edit Static Route' : 'Create Static Route'}</span>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="forti-modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">Destination *</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="0.0.0.0/0"
                    value={formData.destination || ''}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  />
                </div>
                <div>
                  <label className="forti-label">Gateway *</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="192.168.1.1"
                    value={formData.gateway || ''}
                    onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">Interface</label>
                  <select
                    className="forti-select w-full"
                    value={formData.interface || 'wan1'}
                    onChange={(e) => setFormData({ ...formData, interface: e.target.value })}
                  >
                    {interfaces.map(iface => (
                      <option key={iface} value={iface}>{iface}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="forti-label">Status</label>
                  <select
                    className="forti-select w-full"
                    value={formData.status || 'enabled'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'enabled' | 'disabled' })}
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">Administrative Distance</label>
                  <input
                    type="number"
                    className="forti-input w-full"
                    value={formData.distance || 10}
                    onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="forti-label">Priority</label>
                  <input
                    type="number"
                    className="forti-input w-full"
                    value={formData.priority || 0}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="forti-label">Comment</label>
                <input
                  type="text"
                  className="forti-input w-full"
                  placeholder="Description"
                  value={formData.comment || ''}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                />
              </div>
            </div>
            <div className="forti-modal-footer">
              <button className="forti-btn forti-btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="forti-btn forti-btn-primary" onClick={handleSave}>
                {editingRoute ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this static route? This action cannot be undone.
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

export default StaticRoutes;