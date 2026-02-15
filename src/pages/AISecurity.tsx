import { Shell } from '@/components/layout/Shell';
import { mockAIAnalysis, mockThreats } from '@/data/mockData';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Brain, ShieldCheck, AlertTriangle, Activity, TrendingUp, 
  Eye, Zap, Target, RefreshCw, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// Generate anomaly trend data
const anomalyTrendData = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  anomalies: Math.floor(Math.random() * 8 + 2),
  blocked: Math.floor(Math.random() * 25 + 10),
  allowed: Math.floor(Math.random() * 5),
}));

// Threat category distribution
const categoryData = [
  { name: 'Intrusion', value: 35, color: '#ef4444' },
  { name: 'Malware', value: 25, color: '#f59e0b' },
  { name: 'Policy Violation', value: 20, color: '#3b82f6' },
  { name: 'SQL Injection', value: 12, color: '#8b5cf6' },
  { name: 'Port Scan', value: 8, color: '#06b6d4' },
];

// AI model performance
const modelPerformanceData = [
  { metric: 'Accuracy', value: 97.3 },
  { metric: 'Precision', value: 95.8 },
  { metric: 'Recall', value: 94.2 },
  { metric: 'F1 Score', value: 95.0 },
];

const AISecurity = () => {
  const { demoMode } = useDemoMode();
  const analysis = demoMode ? mockAIAnalysis : null;
  const threats = demoMode ? mockThreats : [];
  const anomaliesDetected = analysis?.anomaliesDetected ?? 0;
  const threatsBlocked = analysis?.threatsBlocked ?? 0;
  const riskScore = analysis?.riskScore ?? 0;
  const predictions = analysis?.predictions ?? [];
  const recommendations = analysis?.recommendations ?? [];

  const formatTime = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#3b82f6';
    return '#22c55e';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'Elevated';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  return (
    <Shell>
      <div className="space-y-3">
        {/* Page Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <Brain size={14} />
            <span>AI Security Insights</span>
          </div>
          <button className="forti-toolbar-btn">
            <RefreshCw size={11} />
            Refresh Analysis
          </button>
        </div>

        {/* Summary Strip */}
        <div className="summary-strip">
          <div className="summary-item">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: getRiskColor(riskScore) + '20', color: getRiskColor(riskScore) }}>
              <Target size={16} />
            </div>
            <div>
              <div className="summary-count" style={{ color: getRiskColor(riskScore) }}>{riskScore}</div>
              <div className="summary-label">Risk Score</div>
            </div>
          </div>
          <div className="forti-toolbar-separator h-8" />
          <div className="summary-item">
            <AlertTriangle size={16} className="text-orange-600" />
            <div>
              <div className="summary-count text-orange-700">{anomaliesDetected}</div>
              <div className="summary-label">Anomalies (24h)</div>
            </div>
          </div>
          <div className="forti-toolbar-separator h-8" />
          <div className="summary-item">
            <ShieldCheck size={16} className="text-green-600" />
            <div>
              <div className="summary-count text-green-700">{threatsBlocked.toLocaleString()}</div>
              <div className="summary-label">Threats Blocked</div>
            </div>
          </div>
          <div className="forti-toolbar-separator h-8" />
          <div className="summary-item">
            <Eye size={16} className="text-blue-600" />
            <div>
              <div className="summary-count text-blue-700">High</div>
              <div className="summary-label">Detection Level</div>
            </div>
          </div>
          <div className="forti-toolbar-separator h-8" />
          <div className="summary-item">
            <Zap size={16} className="text-purple-600" />
            <div>
              <div className="summary-count text-purple-700">Low</div>
              <div className="summary-label">False Positive Rate</div>
            </div>
          </div>
        </div>

        {/* Row 1: Risk Gauge + Anomaly Trend */}
        <div className="grid grid-cols-12 gap-3">
          {/* Risk Score Gauge */}
          <div className="col-span-4">
            <div className="section h-full">
              <div className="section-header">
                <div className="flex items-center gap-2">
                  <Target size={12} />
                  <span>Overall Risk Assessment</span>
                </div>
              </div>
              <div className="section-body flex flex-col items-center justify-center py-4">
                {/* Circular gauge using SVG */}
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={getRiskColor(riskScore)}
                      strokeWidth="10"
                      strokeDasharray={`${(riskScore / 100) * 314} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: getRiskColor(riskScore) }}>{riskScore}</span>
                    <span className="text-[10px] text-[hsl(var(--forti-text-secondary))]">{getRiskLabel(riskScore)}</span>
                  </div>
                </div>

                {/* Model Performance */}
                <div className="w-full mt-4 space-y-1.5">
                  <div className="text-[10px] font-semibold text-[hsl(var(--forti-text-secondary))] uppercase">AI Model Performance</div>
                  {modelPerformanceData.map(m => (
                    <div key={m.metric}>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="text-[hsl(var(--forti-text))]">{m.metric}</span>
                        <span className="font-medium">{m.value}%</span>
                      </div>
                      <div className="forti-progress">
                        <div className="forti-progress-bar green" style={{ width: `${m.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Anomaly Trend Chart */}
          <div className="col-span-8">
            <div className="section h-full">
              <div className="section-header">
                <div className="flex items-center gap-2">
                  <Activity size={12} />
                  <span>Anomaly Detection Trend (24h)</span>
                </div>
              </div>
              <div className="section-body">
                <ResponsiveContainer width="100%" height={270}>
                  <AreaChart data={anomalyTrendData}>
                    <defs>
                      <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2e9e5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2e9e5e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                    <XAxis dataKey="time" tick={{ fill: '#666', fontSize: 10 }} axisLine={{ stroke: '#ccc' }} />
                    <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={{ stroke: '#ccc' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#2e9e5e" fill="url(#blockedGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="anomalies" name="Anomalies" stroke="#f59e0b" fill="url(#anomalyGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="allowed" name="Allowed (suspicious)" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Threat Categories + Predictions */}
        <div className="grid grid-cols-12 gap-3">
          {/* Threat Category Distribution */}
          <div className="col-span-5">
            <div className="section">
              <div className="section-header">
                <span>Threat Category Distribution</span>
              </div>
              <div className="section-body">
                <div className="grid grid-cols-2 gap-3">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '11px' }} formatter={(v: number) => [`${v}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex flex-col justify-center">
                    {categoryData.map(c => (
                      <div key={c.name} className="flex items-center gap-2 text-[11px]">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-[hsl(var(--forti-text))]">{c.name}</span>
                        <span className="ml-auto font-medium">{c.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Threat Predictions */}
          <div className="col-span-7">
            <div className="section">
              <div className="section-header">
                <div className="flex items-center gap-2">
                  <TrendingUp size={12} />
                  <span>AI Threat Predictions</span>
                </div>
              </div>
              <div className="section-body space-y-2">
                {predictions.map(pred => (
                  <div key={pred.id} className="flex items-center gap-3 p-2 border border-[#ddd] hover:bg-[hsl(var(--forti-row-hover))] transition-colors">
                    <div className={cn(
                      "w-10 h-10 rounded flex items-center justify-center text-[11px] font-bold text-white shrink-0",
                      pred.probability >= 30 ? "bg-orange-500" : "bg-blue-500"
                    )}>
                      {pred.probability}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[hsl(var(--forti-text))]">{pred.type}</span>
                        <span className={cn(
                          "tag",
                          pred.probability >= 30 ? "tag-high" : "tag-low"
                        )}>
                          {pred.probability >= 30 ? 'ELEVATED' : 'NORMAL'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[hsl(var(--forti-text-secondary))] mt-0.5 truncate">{pred.description}</div>
                    </div>
                    <div className="forti-progress w-24 shrink-0">
                      <div
                        className={cn("forti-progress-bar", pred.probability >= 30 ? "orange" : "blue")}
                        style={{ width: `${pred.probability}%` }}
                      />
                    </div>
                  </div>
                ))}
                {predictions.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-[hsl(var(--forti-text-secondary))]">No active predictions</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Detected Anomalies Table + Recommendations */}
        <div className="grid grid-cols-12 gap-3">
          {/* Anomalies Table */}
          <div className="col-span-7">
            <div className="section">
              <div className="section-header">
                <span>Detected Anomalies</span>
                <Link to="/threats" className="text-[10px] text-white/80 hover:text-white flex items-center gap-0.5">
                  View All <ChevronRight size={10} />
                </Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Category</th>
                    <th>Source IP</th>
                    <th>Dest Port</th>
                    <th>AI Confidence</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {threats.slice(0, 5).map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={cn("tag", 
                          t.severity === 'critical' ? 'tag-critical' : 
                          t.severity === 'high' ? 'tag-high' : 
                          t.severity === 'medium' ? 'tag-medium' : 'tag-low'
                        )}>
                          {t.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-[hsl(var(--forti-text))]">{t.category}</td>
                      <td className="mono text-[hsl(var(--forti-text-secondary))]">{t.sourceIp}</td>
                      <td className="mono">{t.destinationPort}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="forti-progress flex-1">
                            <div
                              className={cn("forti-progress-bar", t.aiConfidence >= 90 ? "green" : t.aiConfidence >= 70 ? "orange" : "blue")}
                              style={{ width: `${t.aiConfidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] w-8 text-right font-medium">{t.aiConfidence}%</span>
                        </div>
                      </td>
                      <td className="text-[hsl(var(--forti-text-secondary))]">{formatTime(t.timestamp)}</td>
                      <td>
                        <span className="tag tag-healthy">{t.action.toUpperCase()}</span>
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
              <div className="section-header">
                <span>AI Recommendations</span>
              </div>
              <div className="section-body space-y-0">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-2.5 border-b border-[#eee] last:border-b-0 hover:bg-[hsl(var(--forti-row-hover))] transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "tag",
                        rec.priority === 'high' ? 'tag-critical' : rec.priority === 'medium' ? 'tag-medium' : 'tag-low'
                      )}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--forti-text-secondary))]">{rec.category}</span>
                    </div>
                    <div className="text-[11px] font-medium text-[hsl(var(--forti-text))] mb-0.5">{rec.title}</div>
                    <div className="text-[10px] text-[hsl(var(--forti-text-secondary))]">{rec.description}</div>
                    <button className="mt-1.5 forti-toolbar-btn primary text-[10px]">
                      <Zap size={10} />
                      {rec.action}
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
