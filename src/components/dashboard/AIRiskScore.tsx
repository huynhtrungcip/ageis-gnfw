import { mockAIAnalysis } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function AIRiskScore() {
  const { riskScore, anomaliesDetected, threatsBlocked, predictions, recommendations } = mockAIAnalysis;
  
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'text-severity-critical', bg: 'bg-severity-critical' };
    if (score >= 60) return { label: 'High', color: 'text-severity-high', bg: 'bg-severity-high' };
    if (score >= 40) return { label: 'Medium', color: 'text-severity-medium', bg: 'bg-severity-medium' };
    if (score >= 20) return { label: 'Low', color: 'text-severity-low', bg: 'bg-severity-low' };
    return { label: 'Safe', color: 'text-status-success', bg: 'bg-status-success' };
  };

  const riskLevel = getRiskLevel(riskScore);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="panel gradient-threat">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">AI Security Analysis</h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded animate-pulse-glow">LIVE</span>
        </div>
      </div>
      <div className="panel-body">
        {/* Risk Score Circle */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg width="120" height="120" className="-rotate-90">
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke={`hsl(var(--severity-${riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low'}))`}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-2xl font-bold", riskLevel.color)}>{riskScore}</span>
              <span className="text-[10px] text-muted-foreground">Risk Score</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-card rounded">
            <div className="text-lg font-bold text-status-danger">{anomaliesDetected}</div>
            <div className="text-[10px] text-muted-foreground">Anomalies</div>
          </div>
          <div className="text-center p-2 bg-card rounded">
            <div className="text-lg font-bold text-status-success">{threatsBlocked}</div>
            <div className="text-[10px] text-muted-foreground">Blocked</div>
          </div>
          <div className="text-center p-2 bg-card rounded">
            <div className={cn("text-lg font-bold", riskLevel.color)}>{riskLevel.label}</div>
            <div className="text-[10px] text-muted-foreground">Status</div>
          </div>
        </div>

        {/* Predictions */}
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">AI PREDICTIONS</h4>
          <div className="space-y-2">
            {predictions.map((pred) => (
              <div key={pred.id} className="flex items-center justify-between p-2 bg-card rounded">
                <span className="text-xs">{pred.type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        pred.probability >= 60 ? 'bg-severity-high' : 
                        pred.probability >= 30 ? 'bg-severity-medium' : 'bg-severity-low'
                      )}
                      style={{ width: `${pred.probability}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono w-8">{pred.probability}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">RECOMMENDATIONS</h4>
          <div className="space-y-2">
            {recommendations.slice(0, 2).map((rec) => (
              <div key={rec.id} className="p-2 bg-card rounded border-l-2 border-primary">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] px-1 py-0.5 rounded",
                    rec.priority === 'high' ? 'bg-severity-high/20 text-severity-high' :
                    rec.priority === 'medium' ? 'bg-severity-medium/20 text-severity-medium' :
                    'bg-severity-low/20 text-severity-low'
                  )}>
                    {rec.priority.toUpperCase()}
                  </span>
                  <span className="text-xs font-medium">{rec.title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
