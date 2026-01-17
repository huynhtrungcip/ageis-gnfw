import { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Download, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  AlertCircle,
  Bug
} from 'lucide-react';

// Log types
interface LogEntry {
  id: string;
  timestamp: Date;
  severity: 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug';
  facility: string;
  interface: string;
  source: string;
  message: string;
  process?: string;
}

// Generate mock logs
const generateMockLogs = (): LogEntry[] => {
  const facilities = ['firewall', 'system', 'dhcp', 'vpn', 'auth', 'kernel', 'web'];
  const interfaces = ['WAN', 'LAN', 'DMZ', 'GUEST', 'System'];
  const severities: LogEntry['severity'][] = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];
  
  const messages = [
    { sev: 'info', msg: 'Connection established from {ip}', facility: 'firewall' },
    { sev: 'warning', msg: 'High CPU usage detected: {pct}%', facility: 'system' },
    { sev: 'error', msg: 'Failed login attempt for user admin from {ip}', facility: 'auth' },
    { sev: 'info', msg: 'DHCP lease assigned: {ip} to {mac}', facility: 'dhcp' },
    { sev: 'notice', msg: 'Firewall rule matched: PASS tcp {ip}:443', facility: 'firewall' },
    { sev: 'warning', msg: 'VPN tunnel rekeying in progress', facility: 'vpn' },
    { sev: 'critical', msg: 'Disk usage exceeded 90% on /var/log', facility: 'system' },
    { sev: 'info', msg: 'Interface {iface} link status: UP', facility: 'kernel' },
    { sev: 'error', msg: 'SSL certificate verification failed for {host}', facility: 'web' },
    { sev: 'debug', msg: 'Packet inspection completed: {count} packets processed', facility: 'firewall' },
    { sev: 'alert', msg: 'Brute force attack detected from {ip}', facility: 'auth' },
    { sev: 'info', msg: 'Configuration saved by admin', facility: 'system' },
    { sev: 'warning', msg: 'Memory usage at 78%', facility: 'system' },
    { sev: 'notice', msg: 'New device connected: {mac}', facility: 'dhcp' },
    { sev: 'info', msg: 'VPN client connected: user@{ip}', facility: 'vpn' },
    { sev: 'error', msg: 'DNS resolution failed for {host}', facility: 'system' },
    { sev: 'info', msg: 'Firewall rule matched: BLOCK tcp {ip}:22', facility: 'firewall' },
    { sev: 'warning', msg: 'Interface {iface} experiencing packet loss', facility: 'kernel' },
    { sev: 'info', msg: 'System backup completed successfully', facility: 'system' },
    { sev: 'notice', msg: 'GeoIP database updated', facility: 'firewall' },
  ];

  const randomIp = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const randomMac = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');

  return Array.from({ length: 500 }, (_, i) => {
    const template = messages[Math.floor(Math.random() * messages.length)];
    const iface = interfaces[Math.floor(Math.random() * interfaces.length)];
    
    let message = template.msg
      .replace('{ip}', randomIp())
      .replace('{mac}', randomMac())
      .replace('{pct}', String(Math.floor(Math.random() * 30 + 70)))
      .replace('{host}', ['api.example.com', 'cdn.service.io', 'update.vendor.net'][Math.floor(Math.random() * 3)])
      .replace('{iface}', iface)
      .replace('{count}', String(Math.floor(Math.random() * 10000)));

    return {
      id: `log-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7), // Last 7 days
      severity: template.sev as LogEntry['severity'],
      facility: template.facility,
      interface: iface,
      source: iface === 'System' ? 'localhost' : randomIp(),
      message,
      process: template.facility,
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const mockLogs = generateMockLogs();

const SystemLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedInterface, setSelectedInterface] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 25;

  const severities = ['all', 'emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];
  const interfaces = ['all', 'WAN', 'LAN', 'DMZ', 'GUEST', 'System'];
  const timeRanges = [
    { value: '1h', label: 'Last 1 Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: 'all', label: 'All Time' },
  ];

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = [...mockLogs];

    // Time range filter
    const now = Date.now();
    const timeMs: Record<string, number> = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000,
    };
    if (selectedTimeRange !== 'all' && timeMs[selectedTimeRange]) {
      filtered = filtered.filter(log => now - log.timestamp.getTime() <= timeMs[selectedTimeRange]);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(log => log.severity === selectedSeverity);
    }

    // Interface filter
    if (selectedInterface !== 'all') {
      filtered = filtered.filter(log => log.interface === selectedInterface);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query) ||
        log.facility.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedSeverity, selectedInterface, selectedTimeRange]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  // Summary counts
  const counts = useMemo(() => ({
    critical: filteredLogs.filter(l => ['emergency', 'alert', 'critical'].includes(l.severity)).length,
    error: filteredLogs.filter(l => l.severity === 'error').length,
    warning: filteredLogs.filter(l => l.severity === 'warning').length,
    info: filteredLogs.filter(l => ['notice', 'info', 'debug'].includes(l.severity)).length,
  }), [filteredLogs]);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'emergency':
      case 'alert':
      case 'critical':
        return <AlertCircle size={12} />;
      case 'error':
        return <AlertTriangle size={12} />;
      case 'warning':
        return <AlertTriangle size={12} />;
      case 'debug':
        return <Bug size={12} />;
      default:
        return <Info size={12} />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'emergency':
      case 'alert':
      case 'critical':
        return 'tag-critical';
      case 'error':
        return 'tag-high';
      case 'warning':
        return 'tag-medium';
      case 'notice':
      case 'info':
        return 'tag-low';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">System Logs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time system and security event logs</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost flex items-center gap-2">
              <RefreshCw size={14} />
              Refresh
            </button>
            <button className="btn btn-outline flex items-center gap-2">
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="summary-strip">
          <div className="summary-item">
            <AlertCircle size={16} className="text-status-critical" />
            <span className="summary-count text-status-critical">{counts.critical}</span>
            <span className="summary-label">Critical</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <AlertTriangle size={16} className="text-status-high" />
            <span className="summary-count text-status-high">{counts.error}</span>
            <span className="summary-label">Errors</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <AlertTriangle size={16} className="text-status-medium" />
            <span className="summary-count text-status-medium">{counts.warning}</span>
            <span className="summary-label">Warnings</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <Info size={16} className="text-status-low" />
            <span className="summary-count text-status-low">{counts.info}</span>
            <span className="summary-label">Info</span>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">{filteredLogs.length} entries</span>
        </div>

        {/* Filters */}
        <div className="action-strip flex-wrap gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-1.5 text-sm bg-background border border-border rounded-sm w-72 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Time Range */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Time:</span>
            <select
              value={selectedTimeRange}
              onChange={(e) => { setSelectedTimeRange(e.target.value); setCurrentPage(1); }}
              className="px-2 py-1.5 text-xs bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {timeRanges.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Severity */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }}
              className="px-2 py-1.5 text-xs bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              {severities.map(s => (
                <option key={s} value={s} className="capitalize">{s === 'all' ? 'All Severities' : s}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Interface */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Interface:</span>
            <select
              value={selectedInterface}
              onChange={(e) => { setSelectedInterface(e.target.value); setCurrentPage(1); }}
              className="px-2 py-1.5 text-xs bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {interfaces.map(i => (
                <option key={i} value={i}>{i === 'all' ? 'All Interfaces' : i}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="section">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-40">Timestamp</th>
                <th className="w-24">Severity</th>
                <th className="w-20">Interface</th>
                <th className="w-20">Facility</th>
                <th className="w-32">Source</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr key={log.id}>
                  <td className="mono text-muted-foreground text-xs">{formatTime(log.timestamp)}</td>
                  <td>
                    <span className={cn("tag inline-flex items-center gap-1", getSeverityClass(log.severity))}>
                      {getSeverityIcon(log.severity)}
                      {log.severity.toUpperCase().slice(0, 4)}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{log.interface}</td>
                  <td className="text-muted-foreground">{log.facility}</td>
                  <td className="mono text-xs text-muted-foreground">{log.source}</td>
                  <td className="max-w-md truncate">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * logsPerPage + 1} - {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                "btn btn-outline flex items-center gap-1",
                currentPage === 1 && "opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 text-xs rounded-sm transition-all",
                      currentPage === page
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "btn btn-outline flex items-center gap-1",
                currentPage === totalPages && "opacity-50 cursor-not-allowed"
              )}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default SystemLogs;
