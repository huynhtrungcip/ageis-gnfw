import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { mockThreats } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';

const ThreatMonitor = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const severities = ['all', 'critical', 'high', 'medium', 'low'];
  
  const filteredThreats = selectedSeverity === 'all' 
    ? mockThreats 
    : mockThreats.filter(t => t.severity === selectedSeverity);

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  };

  return (
    <Shell>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold">Threat Monitor</h1>
          <button className="btn btn-ghost flex items-center gap-1">
            <Download size={12} />
            <span>Export</span>
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1">
          {severities.map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={cn(
                "px-2 py-1 text-[11px] transition-colors capitalize",
                selectedSeverity === sev 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="section">
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Signature</th>
                <th>Category</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Action</th>
                <th>Time</th>
                <th></th>
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
                      {threat.severity === 'critical' ? 'CRIT' : threat.severity.toUpperCase().slice(0, 4)}
                    </span>
                  </td>
                  <td className="font-medium max-w-[200px] truncate">{threat.signature}</td>
                  <td className="text-muted-foreground">{threat.category}</td>
                  <td className="font-mono text-[11px] text-muted-foreground">
                    {threat.sourceIp}:{threat.sourcePort}
                  </td>
                  <td className="font-mono text-[11px] text-muted-foreground">
                    {threat.destinationIp}:{threat.destinationPort}
                  </td>
                  <td>
                    <span className={cn(
                      "text-[10px]",
                      threat.action === 'blocked' ? 'text-status-healthy' : 'text-status-medium'
                    )}>
                      {threat.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{formatTime(threat.timestamp)}</td>
                  <td>
                    <Link to={`/threats/${threat.id}`} className="text-primary text-[10px] hover:underline">
                      detail
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
