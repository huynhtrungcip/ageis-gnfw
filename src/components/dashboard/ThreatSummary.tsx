import { mockThreats, mockAIAnalysis } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function ThreatSummary() {
  const recentThreats = mockThreats.slice(0, 5);
  
  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-severity-critical/20 text-severity-critical border-l-2 border-severity-critical';
      case 'high': return 'bg-severity-high/20 text-severity-high border-l-2 border-severity-high';
      case 'medium': return 'bg-severity-medium/20 text-severity-medium border-l-2 border-severity-medium';
      case 'low': return 'bg-severity-low/20 text-severity-low border-l-2 border-severity-low';
      default: return 'bg-severity-info/20 text-severity-info border-l-2 border-severity-info';
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Recent Threats</h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">AI Powered</span>
        </div>
        <span className="text-xs text-muted-foreground">{mockAIAnalysis.threatsBlocked} blocked today</span>
      </div>
      <div className="divide-y divide-border">
        {recentThreats.map((threat) => (
          <div key={threat.id} className={cn("p-3 hover:bg-secondary/30 transition-colors", getSeverityClass(threat.severity))}>
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded uppercase font-medium",
                  threat.severity === 'critical' ? 'bg-severity-critical text-white' :
                  threat.severity === 'high' ? 'bg-severity-high text-white' :
                  threat.severity === 'medium' ? 'bg-severity-medium text-white' :
                  'bg-severity-low text-white'
                )}>
                  {threat.severity}
                </span>
                <span className="text-xs font-medium">{threat.category}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{formatTime(threat.timestamp)}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-2 line-clamp-1">{threat.description}</div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="font-mono">
                {threat.sourceIp} → {threat.destinationIp}:{threat.destinationPort}
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-1.5 py-0.5 rounded",
                  threat.action === 'blocked' ? 'bg-status-danger/20 text-status-danger' : 'bg-status-warning/20 text-status-warning'
                )}>
                  {threat.action.toUpperCase()}
                </span>
                <span className="text-muted-foreground">
                  AI: {threat.aiConfidence}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <button className="btn-secondary w-full text-xs py-2">View All Threats</button>
      </div>
    </div>
  );
}
