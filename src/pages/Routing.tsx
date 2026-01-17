import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Router, 
  Plus, 
  Pencil, 
  Trash2, 
  Network,
  ArrowRight,
  Globe,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

interface Route {
  id: string;
  destination: string;
  gateway: string;
  interface: string;
  metric: number;
  type: 'static' | 'connected' | 'dynamic';
  enabled: boolean;
  description: string;
}

const mockRoutes: Route[] = [
  { id: 'rt-1', destination: '0.0.0.0/0', gateway: '203.113.152.1', interface: 'WAN', metric: 1, type: 'static', enabled: true, description: 'Default gateway' },
  { id: 'rt-2', destination: '192.168.1.0/24', gateway: '', interface: 'LAN', metric: 0, type: 'connected', enabled: true, description: 'LAN network' },
  { id: 'rt-3', destination: '10.0.0.0/24', gateway: '', interface: 'DMZ', metric: 0, type: 'connected', enabled: true, description: 'DMZ network' },
  { id: 'rt-4', destination: '172.16.0.0/24', gateway: '', interface: 'GUEST', metric: 0, type: 'connected', enabled: true, description: 'Guest network' },
  { id: 'rt-5', destination: '192.168.2.0/24', gateway: '10.10.10.1', interface: 'WAN', metric: 10, type: 'static', enabled: true, description: 'Branch office via VPN' },
  { id: 'rt-6', destination: '10.100.0.0/16', gateway: '192.168.1.254', interface: 'LAN', metric: 20, type: 'static', enabled: false, description: 'Legacy network' },
];

const formSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  gateway: z.string(),
  interface: z.string().min(1, 'Interface is required'),
  metric: z.number().min(0).max(255),
  enabled: z.boolean(),
  description: z.string().max(100),
});

type FormValues = z.infer<typeof formSchema>;

const Routing = () => {
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [filter, setFilter] = useState<'all' | 'static' | 'connected'>('all');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: '',
      gateway: '',
      interface: 'WAN',
      metric: 1,
      enabled: true,
      description: '',
    },
  });

  const filtered = routes.filter(r => filter === 'all' || r.type === filter);
  const interfaces = ['WAN', 'LAN', 'DMZ', 'GUEST'];

  const handleAdd = () => {
    setEditingRoute(null);
    form.reset({
      destination: '',
      gateway: '',
      interface: 'WAN',
      metric: 1,
      enabled: true,
      description: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (route: Route) => {
    if (route.type === 'connected') {
      toast.error('Connected routes cannot be edited');
      return;
    }
    setEditingRoute(route);
    form.reset({
      destination: route.destination,
      gateway: route.gateway,
      interface: route.interface,
      metric: route.metric,
      enabled: route.enabled,
      description: route.description,
    });
    setModalOpen(true);
  };

  const handleDelete = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (route?.type === 'connected') {
      toast.error('Connected routes cannot be deleted');
      return;
    }
    setRoutes(prev => prev.filter(r => r.id !== routeId));
    toast.success('Route deleted');
  };

  const onSubmit = (values: FormValues) => {
    if (editingRoute) {
      setRoutes(prev => prev.map(r =>
        r.id === editingRoute.id ? { ...r, ...values, type: 'static' } : r
      ));
      toast.success('Route updated');
    } else {
      const newRoute: Route = {
        id: `rt-${Date.now()}`,
        destination: values.destination,
        gateway: values.gateway,
        interface: values.interface,
        metric: values.metric,
        enabled: values.enabled,
        description: values.description,
        type: 'static',
      };
      setRoutes(prev => [...prev, newRoute]);
      toast.success('Route created');
    }
    setModalOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'static': return 'text-blue-400 bg-blue-500/10';
      case 'connected': return 'text-emerald-400 bg-emerald-500/10';
      case 'dynamic': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">Routing</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Static routes and routing table</p>
          </div>
          <Button onClick={handleAdd} size="sm" className="gap-1.5">
            <Plus size={14} />
            Add Route
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="section p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Router size={18} className="text-blue-400" />
              </div>
              <div>
                <div className="text-xl font-bold">{routes.filter(r => r.type === 'static').length}</div>
                <div className="text-xs text-muted-foreground">Static Routes</div>
              </div>
            </div>
          </div>
          <div className="section p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Network size={18} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-xl font-bold">{routes.filter(r => r.type === 'connected').length}</div>
                <div className="text-xs text-muted-foreground">Connected Networks</div>
              </div>
            </div>
          </div>
          <div className="section p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Globe size={18} className="text-amber-400" />
              </div>
              <div>
                <div className="text-xl font-bold">{routes.filter(r => r.enabled).length}</div>
                <div className="text-xs text-muted-foreground">Active Routes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="action-strip">
          <div className="flex items-center gap-1">
            {(['all', 'static', 'connected'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-sm transition-all capitalize",
                  filter === type
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {type === 'all' ? 'All Routes' : type}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{filtered.length} routes</span>
        </div>

        {/* Routes Table */}
        <div className="section">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-14">Status</th>
                <th>Destination</th>
                <th>Gateway</th>
                <th>Interface</th>
                <th className="w-20">Metric</th>
                <th className="w-28">Type</th>
                <th>Description</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((route) => (
                <tr key={route.id} className={cn(!route.enabled && "opacity-50")}>
                  <td>
                    <span className={cn(
                      "status-dot-lg",
                      route.enabled ? "status-healthy" : "status-inactive"
                    )} />
                  </td>
                  <td className="font-mono">{route.destination}</td>
                  <td className="font-mono text-muted-foreground">
                    {route.gateway || <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="font-medium">{route.interface}</td>
                  <td className="text-center font-mono text-muted-foreground">{route.metric}</td>
                  <td>
                    <span className={cn("px-2 py-0.5 text-[10px] font-medium rounded capitalize", getTypeColor(route.type))}>
                      {route.type}
                    </span>
                  </td>
                  <td className="text-muted-foreground text-sm">{route.description}</td>
                  <td>
                    {route.type === 'static' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(route)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          <Pencil size={12} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={12} className="text-destructive" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Router size={18} />
              {editingRoute ? 'Edit Route' : 'Add Static Route'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Network</FormLabel>
                    <FormControl>
                      <Input placeholder="192.168.0.0/24" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gateway"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gateway</FormLabel>
                    <FormControl>
                      <Input placeholder="10.0.0.1" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="interface"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interface</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {interfaces.map(iface => (
                            <SelectItem key={iface} value={iface}>{iface}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metric</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={255}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                    <FormLabel>Enabled</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRoute ? 'Save Changes' : 'Create Route'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default Routing;
