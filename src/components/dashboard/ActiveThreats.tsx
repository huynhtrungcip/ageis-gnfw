import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Threat {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  source: string;
  destination: string;
  action: 'blocked' | 'alerted';
  time: string;
  confidence: 'High' | 'Medium' | 'Low';
}

const threats: Threat[] = [
  {
    id: 'threat-1',
    severity: 'critical',
    title: 'SSH Brute Force Attack',
    source: '45.33.32.156',
    destination: 'WAN:22',
    action: 'blocked',
    time: '2m ago',
    confidence: 'High',
  },
  {
    id: 'threat-2',
    severity: 'high',
    title: 'C2 Communication Detected',
    source: '192.168.1.105',
    destination: '185.220.101.45:443',
    action: 'blocked',
    time: '8m ago',
    confidence: 'High',
  },
  {
    id: 'threat-3',
    severity: 'high',
    title: 'SQL Injection Attempt',
    source: '89.248.167.131',
    destination: 'DMZ:80',
    action: 'blocked',
    time: '15m ago',
    confidence: 'Medium',
  },
];

export function ActiveThreats() {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Active Threats</span>
        <Link to="/threats" className="text-xs text-primary hover:underline flex items-center gap-1">
          View All <ChevronRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {threats.map((threat) => (
          <Link 
            key={threat.id} 
            to={`/threats/${threat.id}`}
            className="block px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className={cn(
                  "tag mt-0.5",
                  threat.severity === 'critical' ? 'tag-critical' : 
                  threat.severity === 'high' ? 'tag-high' : 'tag-medium'
                )}>
                  {threat.severity.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{threat.title}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {threat.source} → {threat.destination}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground">{threat.time}</div>
                <div className={cn(
                  "text-xs mt-0.5",
                  threat.action === 'blocked' ? 'text-status-healthy' : 'text-status-medium'
                )}>
                  {threat.action.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-muted-foreground">
                Confidence: <span className="text-foreground">{threat.confidence}</span>
              </span>
              <span className="text-primary hover:underline flex items-center gap-0.5">
                View Details <ChevronRight size={10} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
