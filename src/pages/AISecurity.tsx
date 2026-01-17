import { Shell } from '@/components/layout/Shell';
import { mockAIAnalysis, mockThreats } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Cpu, ChevronRight } from 'lucide-react';

const AISecurity = () => {
  const { anomaliesDetected, threatsBlocked, recommendations } = mockAIAnalysis;

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
          <div className="flex items-center gap-3">
            <Cpu size={20} className="text-primary" />
            <div>
              <h1 className="text-lg font-semibold">AI Insights</h1>
              <p className="text-sm text-muted-foreground">Machine learning assisted threat analysis</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="panel">
            <div className="panel-body">
              <div className="text-xs text-muted-foreground mb-1">Anomalies Detected</div>
              <div className="text-2xl font-semibold">{anomaliesDetected}</div>
              <div className="text-xs text-muted-foreground mt-1">Last 24 hours</div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-body">
              <div className="text-xs text-muted-foreground mb-1">Threats Blocked</div>
              <div className="text-2xl font-semibold text-status-healthy">{threatsBlocked}</div>
              <div className="text-xs text-muted-foreground mt-1">AI-assisted decisions</div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-body">
              <div className="text-xs text-muted-foreground mb-1">Detection Rate</div>
              <div className="text-2xl font-semibold">98.5%</div>
              <div className="text-xs text-muted-foreground mt-1">Based on verified threats</div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-body">
              <div className="text-xs text-muted-foreground mb-1">False Positive Rate</div>
              <div className="text-2xl font-semibold">0.3%</div>
              <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Anomaly Detection */}
          <div className="col-span-7">
            <div className="panel">
              <div className="panel-header">
                <span>Detected Anomalies</span>
              </div>
              <div className="divide-y divide-border">
                {mockThreats.slice(0, 4).map((threat) => (
                  <div key={threat.id} className="px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "tag",
                            threat.severity === 'critical' ? 'tag-critical' :
                            threat.severity === 'high' ? 'tag-high' : 'tag-medium'
                          )}>
                            {threat.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium">{threat.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{threat.description}</div>
                        <div className="text-xs font-mono text-muted-foreground mt-1">
                          {threat.sourceIp} → {threat.destinationIp}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-muted-foreground">{formatTime(threat.timestamp)}</div>
                        <div className="text-xs mt-1">
                          Confidence: <span className="text-foreground">{threat.aiConfidence}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                        View Evidence <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="col-span-5">
            <div className="panel">
              <div className="panel-header">
                <span>Recommendations</span>
              </div>
              <div className="panel-body space-y-3">
                {recommendations.map((rec) => (
                  <div 
                    key={rec.id}
                    className={cn(
                      "p-3 rounded border-l-2 bg-accent/30",
                      rec.priority === 'high' ? 'border-status-high' :
                      rec.priority === 'medium' ? 'border-status-medium' : 'border-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[10px] uppercase",
                        rec.priority === 'high' ? 'text-status-high' :
                        rec.priority === 'medium' ? 'text-status-medium' : 'text-muted-foreground'
                      )}>
                        {rec.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">{rec.category}</span>
                    </div>
                    <div className="text-sm font-medium">{rec.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{rec.description}</div>
                    <button className="text-xs text-primary hover:underline mt-2">
                      {rec.action} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default AISecurity;
