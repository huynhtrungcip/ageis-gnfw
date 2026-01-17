import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { mockThreats } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { ChevronRight, Filter, Download } from 'lucide-react';

const ThreatMonitor = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const severities = ['all', 'critical', 'high', 'medium', 'low'];
  
  const filteredThreats = selectedSeverity === 'all' 
    ? mockThreats 
    : mockThreats.filter(t => t.severity === selectedSeverity);

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Threat Monitor</h1>
            <p className="text-sm text-muted-foreground">Real-time threat detection and response</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost flex items-center gap-1.5">
              <Filter size={14} />
              <span>Filter</span>
            </button>
            <button className="btn btn-ghost flex items-center gap-1.5">
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1">
          {severities.map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={cn(
                "px-3 py-1.5 text-xs rounded transition-colors capitalize",
                selectedSeverity === sev 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {sev === 'all' ? 'All' : sev}
            </button>
          ))}
        </div>

        {/* Threats Table */}
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Signature</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Protocol</th>
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
                      {threat.severity.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="max-w-xs">
                      <div className="font-medium text-sm truncate">{threat.signature}</div>
                      <div className="text-xs text-muted-foreground">{threat.category}</div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">
                    {threat.sourceIp}:{threat.sourcePort}
                  </td>
                  <td className="font-mono text-xs">
                    {threat.destinationIp}:{threat.destinationPort}
                  </td>
                  <td className="text-xs">{threat.protocol}</td>
                  <td>
                    <span className={cn(
                      "text-xs",
                      threat.action === 'blocked' ? 'text-status-healthy' : 'text-status-medium'
                    )}>
                      {threat.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {formatTime(threat.timestamp)}
                  </td>
                  <td>
                    <Link 
                      to={`/threats/${threat.id}`}
                      className="text-primary hover:underline text-xs flex items-center gap-0.5"
                    >
                      Details <ChevronRight size={12} />
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
