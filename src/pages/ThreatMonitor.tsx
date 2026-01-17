import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { mockThreats } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Download, ChevronRight } from 'lucide-react';

const ThreatMonitor = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const severities = ['all', 'critical', 'high', 'medium', 'low'];
  
  const filteredThreats = selectedSeverity === 'all' 
    ? mockThreats 
    : mockThreats.filter(t => t.severity === selectedSeverity);

  // Summary counts
  const counts = {
    critical: mockThreats.filter(t => t.severity === 'critical').length,
    high: mockThreats.filter(t => t.severity === 'high').length,
    medium: mockThreats.filter(t => t.severity === 'medium').length,
    low: mockThreats.filter(t => t.severity === 'low').length,
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Threat Monitor</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time threat detection and analysis</p>
          </div>
          <button className="btn btn-outline flex items-center gap-2">
            <Download size={14} />
            <span>Export Log</span>
          </button>
        </div>

        {/* Summary Strip */}
        <div className="summary-strip">
          <div className="summary-item">
            <span className="status-dot-lg status-critical" />
            <span className="summary-count text-status-critical">{counts.critical}</span>
            <span className="summary-label">Critical</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <span className="status-dot-lg status-high" />
            <span className="summary-count text-status-high">{counts.high}</span>
            <span className="summary-label">High</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <span className="status-dot-lg status-medium" />
            <span className="summary-count text-status-medium">{counts.medium}</span>
            <span className="summary-label">Medium</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <span className="status-dot-lg status-low" />
            <span className="summary-count text-status-low">{counts.low}</span>
            <span className="summary-label">Low</span>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">{mockThreats.length} total events</span>
        </div>

        {/* Filter */}
        <div className="action-strip">
          <span className="text-xs text-muted-foreground">Filter:</span>
          <div className="flex items-center gap-1">
            {severities.map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-sm transition-all duration-100 capitalize",
                  selectedSeverity === sev 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {sev === 'all' ? 'All Severities' : sev}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{filteredThreats.length} shown</span>
        </div>

        {/* Table */}
        <div className="section">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-24">Severity</th>
                <th>Signature</th>
                <th>Category</th>
                <th>Source</th>
                <th>Destination</th>
                <th className="w-24">Action</th>
                <th className="w-20">Time</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filteredThreats.map((threat) => (
                <tr key={threat.id}>
                  <td>
                    <span className={cn(
                      "tag",
                      threat.severity === 'critical' ? 'tag-critical' :
                      threat.severity === 'high' ? 'tag-high' :
                      threat.severity === 'medium' ? 'tag-medium' : 'tag-low'
                    )}>
                      {threat.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-medium">{threat.signature}</td>
                  <td className="text-muted-foreground">{threat.category}</td>
                  <td className="mono text-muted-foreground">
                    {threat.sourceIp}:{threat.sourcePort}
                  </td>
                  <td className="mono text-muted-foreground">
                    {threat.destinationIp}:{threat.destinationPort}
                  </td>
                  <td>
                    <span className={cn(
                      "tag",
                      threat.action === 'blocked' ? 'tag-healthy' : 'tag-medium'
                    )}>
                      {threat.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-sm text-muted-foreground">{formatTime(threat.timestamp)}</td>
                  <td>
                    <Link 
                      to={`/threats/${threat.id}`} 
                      className="btn btn-ghost text-primary inline-flex items-center gap-1"
                    >
                      Details
                      <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
};

export default ThreatMonitor;
