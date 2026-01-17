import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockThreats, mockAIAnalysis, mockTrafficStats } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const AISecurity = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const { riskScore, anomaliesDetected, threatsBlocked, predictions, recommendations } = mockAIAnalysis;

  const threatsByCategory = [
    { name: 'Intrusion', value: 35, color: 'hsl(var(--severity-critical))' },
    { name: 'Malware', value: 28, color: 'hsl(var(--severity-high))' },
    { name: 'Policy', value: 20, color: 'hsl(var(--severity-medium))' },
    { name: 'Scan', value: 17, color: 'hsl(var(--severity-low))' },
  ];

  const threatsBySeverity = [
    { severity: 'Critical', count: 12, color: 'bg-severity-critical' },
    { severity: 'High', count: 45, color: 'bg-severity-high' },
    { severity: 'Medium', count: 128, color: 'bg-severity-medium' },
    { severity: 'Low', count: 342, color: 'bg-severity-low' },
  ];

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'text-severity-critical' };
    if (score >= 60) return { label: 'High', color: 'text-severity-high' };
    if (score >= 40) return { label: 'Medium', color: 'text-severity-medium' };
    return { label: 'Low', color: 'text-severity-low' };
  };

  const riskLevel = getRiskLevel(riskScore);

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <Shell>
      <div className="space-y-6 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              AI Security Center
              <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded animate-pulse-glow">LIVE</span>
            </h1>
            <p className="text-sm text-muted-foreground">Machine Learning powered threat detection and analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-card rounded border border-border">
              {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded transition-colors",
                    timeRange === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="btn-primary text-xs">Generate Report</button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="metric-card gradient-threat">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Risk Score</span>
              <span className={cn("text-xs px-1.5 py-0.5 rounded", riskLevel.color, "bg-current/10")}>
                {riskLevel.label}
              </span>
            </div>
            <div className={cn("text-3xl font-bold", riskLevel.color)}>{riskScore}</div>
            <div className="text-[10px] text-muted-foreground mt-1">AI-calculated threat level</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-2">Threats Blocked</div>
            <div className="text-3xl font-bold text-status-success">{threatsBlocked}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Last 24 hours</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-2">Anomalies Detected</div>
            <div className="text-3xl font-bold text-status-warning">{anomaliesDetected}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Requires review</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-2">AI Accuracy</div>
            <div className="text-3xl font-bold text-primary">98.5%</div>
            <div className="text-[10px] text-muted-foreground mt-1">Detection rate</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Threat Timeline */}
          <div className="col-span-8">
            <div className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-medium">Threat Timeline</h3>
              </div>
              <div className="panel-body">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockTrafficStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--severity-critical))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--severity-critical))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="timestamp"
                        tickFormatter={(val) => new Date(val).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="blocked" stroke="hsl(var(--severity-critical))" fillOpacity={1} fill="url(#colorBlocked)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Threat Distribution */}
          <div className="col-span-4">
            <div className="panel h-full">
              <div className="panel-header">
                <h3 className="text-sm font-medium">Threat Categories</h3>
              </div>
              <div className="panel-body flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={threatsByCategory}
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {threatsByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold">{threatsBlocked}</div>
                      <div className="text-[10px] text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 space-y-2">
                  {threatsByCategory.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                      <span className="font-medium">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Recent Threats */}
          <div className="col-span-8">
            <div className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-medium">Recent Threat Events</h3>
                <button className="text-xs text-primary hover:underline">View All</button>
              </div>
              <div className="divide-y divide-border">
                {mockThreats.map((threat) => (
                  <div key={threat.id} className="p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[10px] px-2 py-1 rounded font-medium uppercase",
                          threat.severity === 'critical' ? 'bg-severity-critical text-white' :
                          threat.severity === 'high' ? 'bg-severity-high text-white' :
                          threat.severity === 'medium' ? 'bg-severity-medium text-white' :
                          'bg-severity-low text-white'
                        )}>
                          {threat.severity}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{threat.category}</div>
                          <div className="text-xs text-muted-foreground">{threat.signature}</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatTime(threat.timestamp)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{threat.description}</div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-mono">
                        {threat.sourceIp}:{threat.sourcePort} → {threat.destinationIp}:{threat.destinationPort}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded",
                          threat.action === 'blocked' ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning'
                        )}>
                          {threat.action.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          AI Confidence: <span className="text-primary font-medium">{threat.aiConfidence}%</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="col-span-4 space-y-4">
            {/* Predictions */}
            <div className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-medium">AI Predictions</h3>
              </div>
              <div className="panel-body space-y-3">
                {predictions.map((pred) => (
                  <div key={pred.id} className="p-3 bg-secondary/50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{pred.type}</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium",
                        pred.probability >= 50 ? 'bg-severity-high/20 text-severity-high' :
                        pred.probability >= 25 ? 'bg-severity-medium/20 text-severity-medium' :
                        'bg-severity-low/20 text-severity-low'
                      )}>
                        {pred.probability}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          pred.probability >= 50 ? 'bg-severity-high' :
                          pred.probability >= 25 ? 'bg-severity-medium' : 'bg-severity-low'
                        )}
                        style={{ width: `${pred.probability}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-2">{pred.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-medium">Smart Recommendations</h3>
              </div>
              <div className="panel-body space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-3 bg-secondary/50 rounded border-l-2 border-primary">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-medium",
                        rec.priority === 'high' ? 'bg-severity-high/20 text-severity-high' :
                        rec.priority === 'medium' ? 'bg-severity-medium/20 text-severity-medium' :
                        'bg-severity-low/20 text-severity-low'
                      )}>
                        {rec.priority}
                      </span>
                      <span className="text-xs font-medium">{rec.title}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mb-2">{rec.description}</div>
                    <button className="text-[10px] text-primary hover:underline">{rec.action} →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-medium">By Severity</h3>
              </div>
              <div className="panel-body space-y-2">
                {threatsBySeverity.map((item) => (
                  <div key={item.severity} className="flex items-center gap-3">
                    <span className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="text-xs flex-1">{item.severity}</span>
                    <span className="text-xs font-mono">{item.count}</span>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${(item.count / 527) * 100}%` }} />
                    </div>
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
