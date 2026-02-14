import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { mockThreats } from '@/data/mockData';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { cn } from '@/lib/utils';
import { Download, ChevronRight, RefreshCw, Filter, Search } from 'lucide-react';

const ThreatMonitor = () => {
  const { demoMode } = useDemoMode();
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const threats = demoMode ? mockThreats : [];
  const severities = ['all', 'critical', 'high', 'medium', 'low'];
  
  const filteredThreats = selectedSeverity === 'all' 
    ? threats 
    : threats.filter(t => t.severity === selectedSeverity);

  // Summary counts
  const counts = {
    critical: threats.filter(t => t.severity === 'critical').length,
    high: threats.filter(t => t.severity === 'high').length,
    medium: threats.filter(t => t.severity === 'medium').length,
    low: threats.filter(t => t.severity === 'low').length,
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const handleExport = () => {
    const csv = ['Severity,Signature,Category,Source,Destination,Action,Time']
      .concat(filteredThreats.map(t => 
        `${t.severity},${t.signature},${t.category},${t.sourceIp}:${t.sourcePort},${t.destinationIp}:${t.destinationPort},${t.action},${t.timestamp.toISOString()}`
      )).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threats-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Threat Monitor</span>
            <span className="text-[10px] text-[#888]">Real-time threat detection and analysis</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn" onClick={() => window.location.reload()}>
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={handleExport}>
            <Download size={12} />
            <span>Export Log</span>
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input type="text" placeholder="Search threats..." />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-0 border-x border-[#ddd]">
          <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-r border-[#ddd]">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xl font-bold text-red-600">{counts.critical}</span>
            <span className="text-[11px] text-[#666]">Critical</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-r border-[#ddd]">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xl font-bold text-orange-600">{counts.high}</span>
            <span className="text-[11px] text-[#666]">High</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-r border-[#ddd]">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xl font-bold text-yellow-600">{counts.medium}</span>
            <span className="text-[11px] text-[#666]">Medium</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-white">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xl font-bold text-blue-600">{counts.low}</span>
            <span className="text-[11px] text-[#666]">Low</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f0f0f0] border border-[#ddd] border-t-0">
          <Filter size={12} className="text-[#666]" />
          <span className="text-[11px] text-[#666]">Filter:</span>
          <div className="flex items-center gap-0.5">
            {severities.map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={cn(
                  "px-3 py-1 text-[11px] font-medium border transition-colors capitalize",
                  selectedSeverity === sev 
                    ? "bg-[hsl(142,70%,35%)] text-white border-[hsl(142,75%,28%)]" 
                    : "bg-white text-[#666] border-[#ccc] hover:bg-[#f5f5f5]"
                )}
              >
                {sev === 'all' ? 'All' : sev}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-[11px] text-[#666]">
            Showing {filteredThreats.length} of {threats.length} events
          </span>
        </div>

        {/* Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-20">Severity</th>
              <th>Signature</th>
              <th className="w-24">Category</th>
              <th className="w-36">Source</th>
              <th className="w-36">Destination</th>
              <th className="w-20">Action</th>
              <th className="w-16">Time</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filteredThreats.map((threat) => (
              <tr key={threat.id}>
                <td>
                  <span className={cn(
                    "forti-tag inline-block w-[72px] text-center",
                    threat.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                    threat.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    threat.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                    'bg-blue-100 text-blue-700 border-blue-200'
                  )}>
                    {threat.severity.toUpperCase()}
                  </span>
                </td>
                <td className="font-medium text-[#333]">{threat.signature}</td>
                <td className="text-[#666]">{threat.category}</td>
                <td className="mono text-[#666]">
                  {threat.sourceIp}:{threat.sourcePort}
                </td>
                <td className="mono text-[#666]">
                  {threat.destinationIp}:{threat.destinationPort}
                </td>
                <td>
                  <span className={cn(
                    "forti-tag inline-block w-[72px] text-center",
                    threat.action === 'blocked' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  )}>
                    {threat.action.toUpperCase()}
                  </span>
                </td>
                <td className="text-[#666]">{formatTime(threat.timestamp)}</td>
                <td>
                  <Link 
                    to={`/threats/${threat.id}`} 
                    className="text-[hsl(142,70%,35%)] hover:underline inline-flex items-center gap-0.5"
                  >
                    Details
                    <ChevronRight size={10} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
};

export default ThreatMonitor;
