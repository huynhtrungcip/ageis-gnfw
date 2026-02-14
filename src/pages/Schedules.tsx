import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, Clock, Calendar, Sun, Moon } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  usageCount: number;
  created: Date;
}

const mockSchedules: Schedule[] = [
  {
    id: 'sched-1',
    name: 'business_hours',
    description: 'Standard business hours',
    enabled: true,
    days: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '18:00',
    usageCount: 8,
    created: new Date('2024-01-01'),
  },
  {
    id: 'sched-2',
    name: 'after_hours',
    description: 'After work hours',
    enabled: true,
    days: [1, 2, 3, 4, 5],
    startTime: '18:00',
    endTime: '08:00',
    usageCount: 3,
    created: new Date('2024-01-01'),
  },
  {
    id: 'sched-3',
    name: 'weekends',
    description: 'Weekend access',
    enabled: true,
    days: [0, 6],
    startTime: '00:00',
    endTime: '23:59',
    usageCount: 2,
    created: new Date('2024-01-05'),
  },
  {
    id: 'sched-4',
    name: 'maintenance_window',
    description: 'Sunday maintenance window',
    enabled: true,
    days: [0],
    startTime: '02:00',
    endTime: '06:00',
    usageCount: 5,
    created: new Date('2024-01-10'),
  },
  {
    id: 'sched-5',
    name: 'night_shift',
    description: 'Night shift access',
    enabled: false,
    days: [1, 2, 3, 4, 5],
    startTime: '22:00',
    endTime: '06:00',
    usageCount: 0,
    created: new Date('2024-01-15'),
  },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(32, 'Name must be 32 characters or less')
    .regex(/^[a-z][a-z0-9_]*$/, 'Name must be lowercase, start with a letter, and contain only letters, numbers, and underscores'),
  description: z.string().max(100, 'Description too long'),
  enabled: z.boolean(),
  days: z.array(z.number()).min(1, 'Select at least one day'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
});

type FormValues = z.infer<typeof formSchema>;

const Schedules = () => {
  const { demoMode } = useDemoMode();
  const [schedules, setSchedules] = useState<Schedule[]>(demoMode ? mockSchedules : []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      enabled: true,
      days: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
    },
  });

  const handleAdd = () => {
    setEditingSchedule(null);
    form.reset({
      name: '',
      description: '',
      enabled: true,
      days: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
    });
    setModalOpen(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    form.reset({
      name: schedule.name,
      description: schedule.description,
      enabled: schedule.enabled,
      days: schedule.days,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
    setModalOpen(true);
  };

  const handleDelete = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule && schedule.usageCount > 0) {
      toast.error(`Cannot delete: "${schedule.name}" is used in ${schedule.usageCount} rule(s)`);
      return;
    }
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    if (selectedSchedule?.id === scheduleId) {
      setSelectedSchedule(null);
    }
    toast.success('Schedule deleted');
  };

  const onSubmit = (values: FormValues) => {
    if (editingSchedule) {
      setSchedules(prev => prev.map(s =>
        s.id === editingSchedule.id
          ? { ...s, ...values }
          : s
      ));
      toast.success('Schedule updated');
    } else {
      const newSchedule: Schedule = {
        id: `sched-${Date.now()}`,
        name: values.name,
        description: values.description,
        enabled: values.enabled,
        days: values.days,
        startTime: values.startTime,
        endTime: values.endTime,
        usageCount: 0,
        created: new Date(),
      };
      setSchedules(prev => [...prev, newSchedule]);
      toast.success('Schedule created');
    }
    setModalOpen(false);
  };

  const formatDays = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    return days.map(d => DAYS[d]).join(', ');
  };

  const isActiveAt = (schedule: Schedule, day: number, hour: number) => {
    if (!schedule.days.includes(day)) return false;
    
    const start = parseInt(schedule.startTime.split(':')[0]);
    const end = parseInt(schedule.endTime.split(':')[0]);
    
    if (start <= end) {
      return hour >= start && hour < end;
    } else {
      // Overnight schedule
      return hour >= start || hour < end;
    }
  };

  const getActiveHours = (schedule: Schedule) => {
    const start = parseInt(schedule.startTime.split(':')[0]);
    const end = parseInt(schedule.endTime.split(':')[0]);
    
    if (start <= end) {
      return end - start;
    } else {
      return (24 - start) + end;
    }
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">Schedules</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Time-based schedules for firewall rules</p>
          </div>
          <Button onClick={handleAdd} size="sm" className="gap-1.5">
            <Plus size={14} />
            Add Schedule
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Schedules List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="text-xs text-muted-foreground mb-2">{schedules.length} schedules</div>
            
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => setSelectedSchedule(schedule)}
                className={cn(
                  "section p-4 cursor-pointer transition-all",
                  selectedSchedule?.id === schedule.id 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-border/80",
                  !schedule.enabled && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "p-1.5 rounded",
                      schedule.enabled ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted"
                    )}>
                      <Clock size={14} />
                    </span>
                    <div>
                      <h3 className="font-mono text-sm font-medium">{schedule.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{schedule.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDays(schedule.days)}
                  </span>
                  <span className="flex items-center gap-1">
                    {parseInt(schedule.startTime) >= 18 || parseInt(schedule.startTime) < 6 ? (
                      <Moon size={12} />
                    ) : (
                      <Sun size={12} />
                    )}
                    {schedule.startTime} - {schedule.endTime}
                  </span>
                </div>

                {/* Mini week view */}
                <div className="flex gap-0.5 mb-3">
                  {DAYS.map((day, idx) => (
                    <div
                      key={day}
                      className={cn(
                        "flex-1 h-6 rounded-sm flex items-center justify-center text-[9px] font-medium",
                        schedule.days.includes(idx)
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground/50"
                      )}
                    >
                      {day[0]}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                  <span>Used in {schedule.usageCount} rule{schedule.usageCount !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(schedule); }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(schedule.id); }}
                      className={cn(
                        "p-1 rounded transition-colors",
                        schedule.usageCount > 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-destructive/10"
                      )}
                    >
                      <Trash2 size={12} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {schedules.length === 0 && (
              <div className="section p-8 text-center">
                <Clock size={24} className="mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No schedules</p>
              </div>
            )}
          </div>

          {/* Calendar View */}
          <div className="lg:col-span-2 section p-4">
            {selectedSchedule ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      <Clock size={16} className="text-primary" />
                      {selectedSchedule.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">{selectedSchedule.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {getActiveHours(selectedSchedule) * selectedSchedule.days.length}h
                    </div>
                    <div className="text-[10px] text-muted-foreground">active per week</div>
                  </div>
                </div>

                {/* Weekly Calendar Grid */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* Hour headers */}
                    <div className="flex">
                      <div className="w-12 shrink-0" />
                      {HOURS.map(hour => (
                        <div 
                          key={hour} 
                          className="flex-1 text-[9px] text-muted-foreground text-center pb-1"
                        >
                          {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
                        </div>
                      ))}
                    </div>

                    {/* Day rows */}
                    {DAYS.map((day, dayIdx) => (
                      <div key={day} className="flex items-center">
                        <div className={cn(
                          "w-12 shrink-0 text-xs font-medium py-1.5",
                          selectedSchedule.days.includes(dayIdx) ? "text-foreground" : "text-muted-foreground/50"
                        )}>
                          {day}
                        </div>
                        <div className="flex flex-1 gap-px">
                          {HOURS.map(hour => {
                            const active = isActiveAt(selectedSchedule, dayIdx, hour);
                            return (
                              <div
                                key={hour}
                                className={cn(
                                  "flex-1 h-6 rounded-[2px] transition-colors",
                                  active
                                    ? "bg-primary/60"
                                    : selectedSchedule.days.includes(dayIdx)
                                    ? "bg-muted/50"
                                    : "bg-muted/20"
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-primary/60" />
                    <span className="text-muted-foreground">Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-muted/50" />
                    <span className="text-muted-foreground">Inactive</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-muted/20" />
                    <span className="text-muted-foreground">Day excluded</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <Calendar size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Select a schedule to view details</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Click on a schedule from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock size={18} />
              {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
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
                        placeholder="business_hours"
                        className="font-mono"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Lowercase letters, numbers, and underscores only
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

              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days</FormLabel>
                    <div className="flex gap-1">
                      {DAYS.map((day, idx) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const newDays = field.value.includes(idx)
                              ? field.value.filter(d => d !== idx)
                              : [...field.value, idx].sort();
                            field.onChange(newDays);
                          }}
                          className={cn(
                            "flex-1 py-2 text-xs font-medium rounded-md transition-colors",
                            field.value.includes(idx)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => field.onChange([1, 2, 3, 4, 5])}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Weekdays
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange([0, 6])}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Weekends
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange([0, 1, 2, 3, 4, 5, 6])}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Every day
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="space-y-0.5">
                      <FormLabel>Enabled</FormLabel>
                      <FormDescription className="text-[10px]">
                        Schedule is active and can be used in rules
                      </FormDescription>
                    </div>
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
                  {editingSchedule ? 'Save Changes' : 'Create Schedule'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default Schedules;
