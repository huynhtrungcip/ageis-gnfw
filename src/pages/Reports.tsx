import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Download, 
  Calendar,
  FileText,
  Clock,
  TrendingUp,
  Shield,
  Network,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Report {
  id: string;
  name: string;
  type: 'security' | 'traffic' | 'system' | 'compliance';
  schedule: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  lastGenerated?: Date;
  size?: string;
  status: 'ready' | 'generating' | 'scheduled';
}

const mockReports: Report[] = [
  { id: 'rpt-1', name: 'Security Summary', type: 'security', schedule: 'daily', lastGenerated: new Date(Date.now() - 3600000), size: '2.4 MB', status: 'ready' },
  { id: 'rpt-2', name: 'Threat Analysis', type: 'security', schedule: 'weekly', lastGenerated: new Date(Date.now() - 86400000), size: '5.1 MB', status: 'ready' },
  { id: 'rpt-3', name: 'Traffic Report', type: 'traffic', schedule: 'daily', lastGenerated: new Date(Date.now() - 7200000), size: '3.8 MB', status: 'ready' },
  { id: 'rpt-4', name: 'Bandwidth Usage', type: 'traffic', schedule: 'monthly', lastGenerated: new Date(Date.now() - 604800000), size: '12.5 MB', status: 'ready' },
  { id: 'rpt-5', name: 'System Health', type: 'system', schedule: 'daily', status: 'generating' },
  { id: 'rpt-6', name: 'Compliance Audit', type: 'compliance', schedule: 'monthly', lastGenerated: new Date(Date.now() - 2592000000), size: '8.2 MB', status: 'ready' },
  { id: 'rpt-7', name: 'Firewall Rules Audit', type: 'compliance', schedule: 'weekly', status: 'scheduled' },
];

const Reports = () => {
  const { demoMode } = useDemoMode();
  const [reports] = useState<Report[]>(demoMode ? mockReports : []);
  const [filter, setFilter] = useState<'all' | 'security' | 'traffic' | 'system' | 'compliance'>('all');
  const [timeRange, setTimeRange] = useState('7d');

  const filtered = reports.filter(r => filter === 'all' || r.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield size={16} />;
      case 'traffic': return <Activity size={16} />;
      case 'system': return <Network size={16} />;
      case 'compliance': return <FileText size={16} />;
      default: return <BarChart3 size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'text-red-400 bg-red-500/10';
      case 'traffic': return 'text-blue-400 bg-blue-500/10';
      case 'system': return 'text-emerald-400 bg-emerald-500/10';
      case 'compliance': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const handleDownload = (report: Report) => {
    if (report.status !== 'ready') {
      toast.error('Report not ready for download');
      return;
    }
    toast.success(`Downloading ${report.name}...`);
  };

  const handleGenerate = (report: Report) => {
    toast.success(`Generating ${report.name}...`);
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">Reports</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Security and system reports</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 h-9">
                <Calendar size={14} className="mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Reports', value: reports.length, icon: BarChart3, color: 'text-blue-400' },
            { label: 'Ready', value: reports.filter(r => r.status === 'ready').length, icon: FileText, color: 'text-emerald-400' },
            { label: 'Generating', value: reports.filter(r => r.status === 'generating').length, icon: Clock, color: 'text-amber-400' },
            { label: 'Scheduled', value: reports.filter(r => r.status === 'scheduled').length, icon: Calendar, color: 'text-purple-400' },
          ].map((stat, idx) => (
            <div key={idx} className="section p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="action-strip">
          <div className="flex items-center gap-1">
            {(['all', 'security', 'traffic', 'system', 'compliance'] as const).map((type) => (
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
                {type === 'all' ? 'All Reports' : type}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{filtered.length} reports</span>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((report) => (
            <div key={report.id} className="section p-4 hover:border-border/80 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", getTypeColor(report.type))}>
                    {getTypeIcon(report.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{report.name}</h3>
                    <p className="text-[10px] text-muted-foreground capitalize">{report.type} Report</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-medium rounded capitalize",
                  report.status === 'ready' ? "text-emerald-400 bg-emerald-500/10" :
                  report.status === 'generating' ? "text-amber-400 bg-amber-500/10" :
                  "text-muted-foreground bg-muted"
                )}>
                  {report.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1 capitalize">
                  <Clock size={12} />
                  {report.schedule}
                </span>
                {report.size && (
                  <span>{report.size}</span>
                )}
              </div>

              {report.lastGenerated && (
                <p className="text-[10px] text-muted-foreground mb-3">
                  Last generated: {report.lastGenerated.toLocaleString()}
                </p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleGenerate(report)}
                  disabled={report.status === 'generating'}
                >
                  <TrendingUp size={12} className="mr-1.5" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleDownload(report)}
                  disabled={report.status !== 'ready'}
                >
                  <Download size={12} className="mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
};

export default Reports;
