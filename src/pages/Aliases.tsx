import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, Search, Network, Server, Hash } from 'lucide-react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

interface Alias {
  id: string;
  name: string;
  type: 'host' | 'network' | 'port';
  values: string[];
  description: string;
  usageCount: number;
  created: Date;
  updated: Date;
}

const mockAliases: Alias[] = [
  {
    id: 'alias-1',
    name: 'LAN_NETWORK',
    type: 'network',
    values: ['192.168.1.0/24'],
    description: 'Internal LAN network segment',
    usageCount: 12,
    created: new Date('2024-01-01'),
    updated: new Date('2024-01-15'),
  },
  {
    id: 'alias-2',
    name: 'DMZ_NETWORK',
    type: 'network',
    values: ['10.0.0.0/24'],
    description: 'DMZ network for public services',
    usageCount: 8,
    created: new Date('2024-01-01'),
    updated: new Date('2024-01-10'),
  },
  {
    id: 'alias-3',
    name: 'WEB_SERVERS',
    type: 'host',
    values: ['192.168.1.10', '192.168.1.11', '192.168.1.12'],
    description: 'Production web server cluster',
    usageCount: 5,
    created: new Date('2024-01-05'),
    updated: new Date('2024-01-20'),
  },
  {
    id: 'alias-4',
    name: 'DB_SERVERS',
    type: 'host',
    values: ['192.168.1.20', '192.168.1.21'],
    description: 'Database server pool',
    usageCount: 4,
    created: new Date('2024-01-05'),
    updated: new Date('2024-01-18'),
  },
  {
    id: 'alias-5',
    name: 'BLOCKED_IPS',
    type: 'host',
    values: ['45.33.32.156', '89.248.167.131', '91.121.160.168'],
    description: 'Known malicious IP addresses',
    usageCount: 3,
    created: new Date('2024-01-10'),
    updated: new Date('2024-01-25'),
  },
  {
    id: 'alias-6',
    name: 'DNS_SERVERS',
    type: 'host',
    values: ['8.8.8.8', '8.8.4.4', '1.1.1.1'],
    description: 'Public DNS servers',
    usageCount: 2,
    created: new Date('2024-01-01'),
    updated: new Date('2024-01-01'),
  },
  {
    id: 'alias-7',
    name: 'WEB_PORTS',
    type: 'port',
    values: ['80', '443', '8080', '8443'],
    description: 'Common web service ports',
    usageCount: 15,
    created: new Date('2024-01-01'),
    updated: new Date('2024-01-01'),
  },
  {
    id: 'alias-8',
    name: 'MAIL_PORTS',
    type: 'port',
    values: ['25', '465', '587', '993', '995'],
    description: 'Email service ports (SMTP, IMAP, POP3)',
    usageCount: 6,
    created: new Date('2024-01-02'),
    updated: new Date('2024-01-02'),
  },
];

const formSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(32, 'Name must be 32 characters or less')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Name must be uppercase, start with a letter, and contain only letters, numbers, and underscores'),
  type: z.enum(['host', 'network', 'port']),
  values: z.string().min(1, 'At least one value is required'),
  description: z.string().max(200, 'Description too long'),
});

type FormValues = z.infer<typeof formSchema>;

const Aliases = () => {
  const [aliases, setAliases] = useState<Alias[]>(mockAliases);
  const [filter, setFilter] = useState<'all' | 'host' | 'network' | 'port'>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlias, setEditingAlias] = useState<Alias | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'host',
      values: '',
      description: '',
    },
  });

  const filtered = aliases.filter(a => {
    const matchesType = filter === 'all' || a.type === filter;
    const matchesSearch = search === '' || 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.values.some(v => v.includes(search));
    return matchesType && matchesSearch;
  });

  const typeStats = {
    all: aliases.length,
    host: aliases.filter(a => a.type === 'host').length,
    network: aliases.filter(a => a.type === 'network').length,
    port: aliases.filter(a => a.type === 'port').length,
  };

  const handleAdd = () => {
    setEditingAlias(null);
    form.reset({
      name: '',
      type: 'host',
      values: '',
      description: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (alias: Alias) => {
    setEditingAlias(alias);
    form.reset({
      name: alias.name,
      type: alias.type,
      values: alias.values.join('\n'),
      description: alias.description,
    });
    setModalOpen(true);
  };

  const handleDelete = (aliasId: string) => {
    const alias = aliases.find(a => a.id === aliasId);
    if (alias && alias.usageCount > 0) {
      toast.error(`Cannot delete: "${alias.name}" is used in ${alias.usageCount} rule(s)`);
      return;
    }
    setAliases(prev => prev.filter(a => a.id !== aliasId));
    toast.success('Alias deleted');
  };

  const onSubmit = (values: FormValues) => {
    const valuesArray = values.values
      .split(/[\n,]/)
      .map(v => v.trim())
      .filter(v => v !== '');

    if (editingAlias) {
      setAliases(prev => prev.map(a => 
        a.id === editingAlias.id 
          ? { ...a, name: values.name, type: values.type, values: valuesArray, description: values.description, updated: new Date() }
          : a
      ));
      toast.success('Alias updated');
    } else {
      const newAlias: Alias = {
        id: `alias-${Date.now()}`,
        name: values.name,
        type: values.type,
        values: valuesArray,
        description: values.description,
        usageCount: 0,
        created: new Date(),
        updated: new Date(),
      };
      setAliases(prev => [...prev, newAlias]);
      toast.success('Alias created');
    }
    setModalOpen(false);
  };

  const getTypeIcon = (type: Alias['type']) => {
    switch (type) {
      case 'host': return <Server size={14} />;
      case 'network': return <Network size={14} />;
      case 'port': return <Hash size={14} />;
    }
  };

  const getTypeColor = (type: Alias['type']) => {
    switch (type) {
      case 'host': return 'text-blue-400 bg-blue-500/10';
      case 'network': return 'text-emerald-400 bg-emerald-500/10';
      case 'port': return 'text-amber-400 bg-amber-500/10';
    }
  };

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'host': return '192.168.1.10\n192.168.1.11\n10.0.0.5';
      case 'network': return '192.168.1.0/24\n10.0.0.0/8';
      case 'port': return '80\n443\n8080-8090';
      default: return '';
    }
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">Aliases</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage IP, network, and port aliases for firewall rules</p>
          </div>
          <Button onClick={handleAdd} size="sm" className="gap-1.5">
            <Plus size={14} />
            Add Alias
          </Button>
        </div>

        {/* Stats Strip */}
        <div className="action-strip">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search aliases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-background border border-input rounded-md w-56 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1 ml-4">
            {(['all', 'host', 'network', 'port'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-sm transition-all flex items-center gap-1.5",
                  filter === type 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {type === 'all' ? 'All' : (
                  <>
                    {getTypeIcon(type)}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </>
                )}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  filter === type ? "bg-primary-foreground/20" : "bg-muted"
                )}>
                  {typeStats[type]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{filtered.length} aliases</span>
        </div>

        {/* Aliases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((alias) => (
            <div
              key={alias.id}
              className="section p-4 hover:border-border/80 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("p-1.5 rounded", getTypeColor(alias.type))}>
                    {getTypeIcon(alias.type)}
                  </span>
                  <div>
                    <h3 className="font-mono text-sm font-medium">{alias.name}</h3>
                    <p className="text-[10px] text-muted-foreground capitalize">{alias.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(alias)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Edit alias"
                  >
                    <Pencil size={12} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(alias.id)}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      alias.usageCount > 0 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover:bg-destructive/10"
                    )}
                    title={alias.usageCount > 0 ? `In use by ${alias.usageCount} rules` : "Delete alias"}
                  >
                    <Trash2 size={12} className="text-destructive" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{alias.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {alias.values.slice(0, 4).map((value, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-[10px] font-mono bg-muted rounded">
                    {value}
                  </span>
                ))}
                {alias.values.length > 4 && (
                  <span className="px-2 py-0.5 text-[10px] text-muted-foreground bg-muted rounded">
                    +{alias.values.length - 4} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                <span>Used in {alias.usageCount} rule{alias.usageCount !== 1 ? 's' : ''}</span>
                <span>Updated {alias.updated.toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="section p-12 text-center">
            <Network size={32} className="mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No aliases found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {search ? 'Try a different search term' : 'Create your first alias to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network size={18} />
              {editingAlias ? 'Edit Alias' : 'Add Alias'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="LAN_SERVERS"
                        className="font-mono uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Uppercase letters, numbers, and underscores only
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {(['host', 'network', 'port'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => field.onChange(type)}
                          className={cn(
                            "flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors",
                            field.value === type
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:bg-muted/50"
                          )}
                        >
                          <span className={getTypeColor(type)}>
                            {getTypeIcon(type)}
                          </span>
                          <span className="text-sm capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="values"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Values</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={getPlaceholder(form.watch('type'))}
                        className="font-mono text-sm h-28 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      One value per line, or comma-separated
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAlias ? 'Save Changes' : 'Create Alias'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default Aliases;
