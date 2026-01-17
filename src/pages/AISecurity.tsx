import { Shell } from '@/components/layout/Shell';
import { mockAIAnalysis, mockThreats } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const AISecurity = () => {
  const { anomaliesDetected, threatsBlocked, recommendations } = mockAIAnalysis;

  const formatTime = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
  };

  return (
    <Shell>
      <div className="space-y-3">
        <h1 className="text-sm font-semibold">Insights</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px bg-border">
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">Anomalies</div>
            <div className="text-sm font-semibold">{anomaliesDetected}</div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">Blocked</div>
            <div className="text-sm font-semibold text-status-healthy">{threatsBlocked}</div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">Detection</div>
            <div className="text-sm font-semibold">High</div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">False Positive</div>
            <div className="text-sm font-semibold">Low</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          {/* Anomalies */}
          <div className="col-span-7">
            <div className="section">
              <div className="section-header">Detected Anomalies</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Category</th>
                    <th>Source</th>
                    <th>Confidence</th>
                    <th>Time</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {mockThreats.slice(0, 4).map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={cn("tag", t.severity === 'critical' ? 'tag-critical' : t.severity === 'high' ? 'tag-high' : 'tag-medium')}>
                          {t.severity === 'critical' ? 'CRIT' : t.severity.toUpperCase().slice(0, 4)}
                        </span>
                      </td>
                      <td>{t.category}</td>
                      <td className="font-mono text-[11px] text-muted-foreground">{t.sourceIp}</td>
                      <td>{t.aiConfidence >= 90 ? 'High' : t.aiConfidence >= 70 ? 'Med' : 'Low'}</td>
                      <td className="text-muted-foreground">{formatTime(t.timestamp)}</td>
                      <td>
                        <Link to={`/threats/${t.id}`} className="text-primary text-[10px] hover:underline">detail</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div className="col-span-5">
            <div className="section">
              <div className="section-header">Recommendations</div>
              {recommendations.map((rec) => (
                <div key={rec.id} className="list-row">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "text-[9px] uppercase",
                      rec.priority === 'high' ? 'text-status-high' : rec.priority === 'medium' ? 'text-status-medium' : 'text-muted-foreground'
                    )}>
                      {rec.priority}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{rec.category}</span>
                  </div>
                  <div className="text-xs">{rec.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{rec.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default AISecurity;
