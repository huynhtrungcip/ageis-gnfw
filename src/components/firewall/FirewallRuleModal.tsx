import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Clock, Network, Shield } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { FirewallRule } from '@/types/firewall';

// Mock aliases for picker
const mockAliases = [
  { name: 'LAN_NETWORK', value: '192.168.1.0/24', type: 'network' },
  { name: 'DMZ_NETWORK', value: '10.0.0.0/24', type: 'network' },
  { name: 'WEB_SERVERS', value: '192.168.1.10,192.168.1.11', type: 'host' },
  { name: 'DB_SERVERS', value: '192.168.1.20', type: 'host' },
  { name: 'BLOCKED_IPS', value: '45.33.32.0/24', type: 'network' },
  { name: 'DNS_SERVERS', value: '8.8.8.8,1.1.1.1', type: 'host' },
];

const mockSchedules = [
  { name: 'business_hours', label: 'Business Hours', desc: 'Mon-Fri 08:00-18:00' },
  { name: 'after_hours', label: 'After Hours', desc: 'Mon-Fri 18:00-08:00' },
  { name: 'weekends', label: 'Weekends', desc: 'Sat-Sun All Day' },
  { name: 'maintenance', label: 'Maintenance Window', desc: 'Sun 02:00-06:00' },
];

const formSchema = z.object({
  enabled: z.boolean(),
  action: z.enum(['pass', 'block', 'reject']),
  interface: z.string().min(1, 'Interface is required'),
  direction: z.enum(['in', 'out', 'any']),
  protocol: z.enum(['any', 'tcp', 'udp', 'icmp', 'tcp/udp']),
  sourceType: z.enum(['any', 'network', 'address', 'alias']),
  sourceValue: z.string(),
  sourcePort: z.string().optional(),
  destinationType: z.enum(['any', 'network', 'address', 'alias']),
  destinationValue: z.string(),
  destinationPort: z.string().optional(),
  description: z.string().max(200, 'Description too long'),
  logging: z.boolean(),
  schedule: z.string().optional(),
}).refine((data) => {
  if (data.sourceType !== 'any' && !data.sourceValue) {
    return false;
  }
  return true;
}, {
  message: 'Source value is required',
  path: ['sourceValue'],
}).refine((data) => {
  if (data.destinationType !== 'any' && !data.destinationValue) {
    return false;
  }
  return true;
}, {
  message: 'Destination value is required',
  path: ['destinationValue'],
});

type FormValues = z.infer<typeof formSchema>;

interface FirewallRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: FirewallRule | null;
  onSave: (rule: Partial<FirewallRule>) => void;
}

export function FirewallRuleModal({ open, onOpenChange, rule, onSave }: FirewallRuleModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [showAliasPicker, setShowAliasPicker] = useState<'source' | 'destination' | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: true,
      action: 'pass',
      interface: 'LAN',
      direction: 'in',
      protocol: 'any',
      sourceType: 'any',
      sourceValue: '*',
      sourcePort: '',
      destinationType: 'any',
      destinationValue: '*',
      destinationPort: '',
      description: '',
      logging: false,
      schedule: '',
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset({
        enabled: rule.enabled,
        action: rule.action,
        interface: rule.interface,
        direction: rule.direction,
        protocol: rule.protocol,
        sourceType: rule.source.type,
        sourceValue: rule.source.value,
        sourcePort: rule.source.port || '',
        destinationType: rule.destination.type,
        destinationValue: rule.destination.value,
        destinationPort: rule.destination.port || '',
        description: rule.description,
        logging: rule.logging,
        schedule: rule.schedule || '',
      });
    } else {
      form.reset({
        enabled: true,
        action: 'pass',
        interface: 'LAN',
        direction: 'in',
        protocol: 'any',
        sourceType: 'any',
        sourceValue: '*',
        sourcePort: '',
        destinationType: 'any',
        destinationValue: '*',
        destinationPort: '',
        description: '',
        logging: false,
        schedule: '',
      });
    }
  }, [rule, form]);

  const onSubmit = (values: FormValues) => {
    const ruleData: Partial<FirewallRule> = {
      enabled: values.enabled,
      action: values.action,
      interface: values.interface,
      direction: values.direction,
      protocol: values.protocol,
      source: {
        type: values.sourceType,
        value: values.sourceType === 'any' ? '*' : values.sourceValue,
        port: values.sourcePort || undefined,
      },
      destination: {
        type: values.destinationType,
        value: values.destinationType === 'any' ? '*' : values.destinationValue,
        port: values.destinationPort || undefined,
      },
      description: values.description,
      logging: values.logging,
      schedule: values.schedule || undefined,
    };
    onSave(ruleData);
    onOpenChange(false);
  };

  const selectAlias = (alias: typeof mockAliases[0], target: 'source' | 'destination') => {
    if (target === 'source') {
      form.setValue('sourceType', 'alias');
      form.setValue('sourceValue', alias.name);
    } else {
      form.setValue('destinationType', 'alias');
      form.setValue('destinationValue', alias.name);
    }
    setShowAliasPicker(null);
  };

  const protocols = [
    { value: 'any', label: 'Any' },
    { value: 'tcp', label: 'TCP' },
    { value: 'udp', label: 'UDP' },
    { value: 'tcp/udp', label: 'TCP/UDP' },
    { value: 'icmp', label: 'ICMP' },
  ];

  const interfaces = ['WAN', 'LAN', 'DMZ', 'GUEST'];
  const sourceType = form.watch('sourceType');
  const destinationType = form.watch('destinationType');
  const protocol = form.watch('protocol');
  const showPorts = protocol !== 'any' && protocol !== 'icmp';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield size={18} />
            {rule ? 'Edit Firewall Rule' : 'Add Firewall Rule'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Source / Dest</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FormField
                      control={form.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {field.value ? 'Enabled' : 'Disabled'}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <div className="flex gap-1">
                          {['pass', 'block', 'reject'].map((action) => (
                            <button
                              key={action}
                              type="button"
                              onClick={() => field.onChange(action)}
                              className={cn(
                                "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                field.value === action
                                  ? action === 'pass'
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : action === 'block'
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {action.toUpperCase()}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interface"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interface</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select interface" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {interfaces.map((iface) => (
                              <SelectItem key={iface} value={iface}>
                                {iface}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direction</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in">Inbound</SelectItem>
                            <SelectItem value="out">Outbound</SelectItem>
                            <SelectItem value="any">Any</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Protocol Selection */}
                <FormField
                  control={form.control}
                  name="protocol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protocol</FormLabel>
                      <div className="flex gap-1">
                        {protocols.map((proto) => (
                          <button
                            key={proto.value}
                            type="button"
                            onClick={() => field.onChange(proto.value)}
                            className={cn(
                              "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                              field.value === proto.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {proto.label}
                          </button>
                        ))}
                      </div>
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
                        <Textarea
                          placeholder="Enter rule description..."
                          className="resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Source / Destination Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                {/* Source */}
                <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Network size={14} /> Source
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAliasPicker(showAliasPicker === 'source' ? null : 'source')}
                      className="h-7 text-xs"
                    >
                      <Plus size={12} className="mr-1" />
                      Alias
                    </Button>
                  </div>

                  {showAliasPicker === 'source' && (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-background rounded-md border">
                      {mockAliases.map((alias) => (
                        <button
                          key={alias.name}
                          type="button"
                          onClick={() => selectAlias(alias, 'source')}
                          className="text-left p-2 rounded hover:bg-muted transition-colors"
                        >
                          <div className="text-xs font-medium">{alias.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{alias.value}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="sourceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="any">Any</SelectItem>
                              <SelectItem value="network">Network</SelectItem>
                              <SelectItem value="address">Address</SelectItem>
                              <SelectItem value="alias">Alias</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sourceValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Value</FormLabel>
                          <FormControl>
                            <Input
                              className="h-9"
                              placeholder={sourceType === 'any' ? '*' : 'IP or CIDR'}
                              disabled={sourceType === 'any'}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {showPorts && (
                      <FormField
                        control={form.control}
                        name="sourcePort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Port</FormLabel>
                            <FormControl>
                              <Input
                                className="h-9"
                                placeholder="Any"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Network size={14} /> Destination
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAliasPicker(showAliasPicker === 'destination' ? null : 'destination')}
                      className="h-7 text-xs"
                    >
                      <Plus size={12} className="mr-1" />
                      Alias
                    </Button>
                  </div>

                  {showAliasPicker === 'destination' && (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-background rounded-md border">
                      {mockAliases.map((alias) => (
                        <button
                          key={alias.name}
                          type="button"
                          onClick={() => selectAlias(alias, 'destination')}
                          className="text-left p-2 rounded hover:bg-muted transition-colors"
                        >
                          <div className="text-xs font-medium">{alias.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{alias.value}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="destinationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="any">Any</SelectItem>
                              <SelectItem value="network">Network</SelectItem>
                              <SelectItem value="address">Address</SelectItem>
                              <SelectItem value="alias">Alias</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="destinationValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Value</FormLabel>
                          <FormControl>
                            <Input
                              className="h-9"
                              placeholder={destinationType === 'any' ? '*' : 'IP or CIDR'}
                              disabled={destinationType === 'any'}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {showPorts && (
                      <FormField
                        control={form.control}
                        name="destinationPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Port</FormLabel>
                            <FormControl>
                              <Input
                                className="h-9"
                                placeholder="Any"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Options Tab */}
              <TabsContent value="options" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="logging"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Logging</FormLabel>
                        <FormDescription className="text-xs">
                          Log matching traffic to system logs
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Schedule Options */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <h4 className="text-sm font-medium">Schedule</h4>
                  </div>
                  <FormField
                    control={form.control}
                    name="schedule"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => field.onChange('')}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-colors",
                              !field.value
                                ? "border-primary bg-primary/10"
                                : "border-border/50 hover:bg-muted/50"
                            )}
                          >
                            <div className="text-sm font-medium">Always On</div>
                            <div className="text-xs text-muted-foreground">No schedule restriction</div>
                          </button>
                          {mockSchedules.map((schedule) => (
                            <button
                              key={schedule.name}
                              type="button"
                              onClick={() => field.onChange(schedule.name)}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-colors",
                                field.value === schedule.name
                                  ? "border-primary bg-primary/10"
                                  : "border-border/50 hover:bg-muted/50"
                              )}
                            >
                              <div className="text-sm font-medium">{schedule.label}</div>
                              <div className="text-xs text-muted-foreground">{schedule.desc}</div>
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {rule ? 'Save Changes' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
