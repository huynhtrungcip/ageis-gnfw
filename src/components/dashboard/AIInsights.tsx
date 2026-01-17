import { cn } from '@/lib/utils';
import { ChevronRight, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Insight {
  id: string;
  type: 'anomaly' | 'recommendation' | 'prediction';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  host?: string;
  confidence?: string;
}

const insights: Insight[] = [
  {
    id: '1',
    type: 'anomaly',
    priority: 'high',
    title: 'Suspicious outbound pattern detected',
    description: 'Beaconing behavior observed - regular intervals to external IP',
    host: '192.168.1.55',
    confidence: 'Medium',
  },
  {
    id: '2',
    type: 'recommendation',
    priority: 'medium',
    title: 'Enable GeoIP blocking',
    description: 'Block traffic from high-risk regions to reduce attack surface',
  },
  {
    id: '3',
    type: 'prediction',
    priority: 'low',
    title: 'Traffic spike expected',
    description: 'Based on patterns, expect 40% increase in traffic between 14:00-16:00',
  },
];

export function AIInsights() {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-primary" />
          <span>AI Insights</span>
        </div>
        <Link to="/ai-security" className="text-xs text-primary hover:underline flex items-center gap-1">
          View All <ChevronRight size={12} />
        </Link>
      </div>
      <div className="panel-body">
        <div className="space-y-3">
          {insights.map((insight) => (
            <div 
              key={insight.id} 
              className={cn(
                "p-3 rounded border-l-2 bg-accent/30",
                insight.priority === 'high' ? 'border-status-high' :
                insight.priority === 'medium' ? 'border-status-medium' : 'border-status-low'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] uppercase font-medium",
                      insight.type === 'anomaly' ? 'text-status-high' :
                      insight.type === 'recommendation' ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {insight.type}
                    </span>
                    {insight.host && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {insight.host}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium">{insight.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{insight.description}</div>
                </div>
                {insight.confidence && (
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground">Confidence</div>
                    <div className="text-xs">{insight.confidence}</div>
                  </div>
                )}
              </div>
              {insight.type === 'anomaly' && (
                <div className="mt-2">
                  <button className="text-xs text-primary hover:underline">Investigate →</button>
                </div>
              )}
              {insight.type === 'recommendation' && (
                <div className="mt-2">
                  <button className="text-xs text-primary hover:underline">Apply →</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
