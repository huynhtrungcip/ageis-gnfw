import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockNATRules } from '@/data/mockData';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { NATRule } from '@/types/firewall';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { ChevronDown, Plus, Edit2, Trash2, RefreshCw, Search, ArrowRightLeft, Globe, Network } from 'lucide-react';

import { toast } from 'sonner';

const NATConfig = () => {
  const { demoMode } = useDemoMode();
  const [rules, setRules] = useState<NATRule[]>(demoMode ? mockNATRules : []);
  const [activeTab, setActiveTab] = useState<'port-forward' | 'outbound' | '1:1' | 'npt'>('port-forward');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'port-forward', label: 'Port Forward', count: rules.filter(r => r.type === 'port-forward').length, icon: ArrowRightLeft },
    { id: 'outbound', label: 'Outbound NAT', count: rules.filter(r => r.type === 'outbound').length, icon: Globe },
    { id: '1:1', label: '1:1 NAT', count: rules.filter(r => r.type === '1:1').length, icon: Network },
    { id: 'npt', label: 'NPt (IPv6)', count: rules.filter(r => r.type === 'npt').length, icon: Network },
  ];

  const filteredRules = rules.filter(r => r.type === activeTab);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
          <div className="relative">
            <button 
              className="forti-toolbar-btn primary"
              onClick={() => setShowCreateMenu(!showCreateMenu)}
            >
              <Plus className="w-3 h-3" />
              Create New
              <ChevronDown className="w-3 h-3" />
            </button>
            {showCreateMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#ccc] shadow-lg z-50 min-w-[180px]">
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <ArrowRightLeft className="w-3 h-3" />
                  Port Forward Rule
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  Outbound NAT Rule
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Network className="w-3 h-3" />
                  1:1 NAT Mapping
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Network className="w-3 h-3" />
                  NPt Rule
                </button>
              </div>
            )}
          </div>
          <button 
            className="forti-toolbar-btn" 
            disabled={selectedIds.length !== 1}
            onClick={() => toast.info('Edit functionality - select a rule first')}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button 
            className="forti-toolbar-btn" 
            disabled={selectedIds.length === 0}
            onClick={() => {
              setRules(prev => prev.filter(r => !selectedIds.includes(r.id)));
              toast.success(`Deleted ${selectedIds.length} rule(s)`);
              setSelectedIds([]);
            }}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={() => { setRules(demoMode ? mockNATRules : []); toast.success('Refreshed'); }}>
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input type="text" placeholder="Search..." className="w-40" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeTab === tab.id 
                  ? "bg-white text-[hsl(142,70%,35%)] border-[hsl(142,70%,35%)]" 
                  : "text-[#666] border-transparent hover:text-[#333] hover:bg-[#f0f0f0]"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={cn(
                "px-1.5 py-0.5 text-[10px] rounded",
                activeTab === tab.id ? "bg-[hsl(142,70%,35%)]/20 text-[hsl(142,70%,35%)]" : "bg-[#ddd] text-[#666]"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Port Forward Table */}
        {activeTab === 'port-forward' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Interface</th>
                  <th>Protocol</th>
                  <th>External Port</th>
                  <th>Internal Address</th>
                  <th>Internal Port</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className={cn(!rule.enabled && "opacity-60")}>
                    <td>
                      <input type="checkbox" className="forti-checkbox" />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={rule.enabled} 
                        onToggle={() => toggleRule(rule.id)}
                        size="sm"
                      />
                    </td>
                    <td>
                      <span className="forti-tag bg-blue-100 text-blue-700 border-blue-200">
                        {rule.interface}
                      </span>
                    </td>
                    <td className="mono text-[11px]">{rule.protocol.toUpperCase()}</td>
                    <td className="mono text-[11px]">{rule.externalPort}</td>
                    <td className="mono text-[11px]">{rule.internalAddress}</td>
                    <td className="mono text-[11px]">{rule.internalPort}</td>
                    <td className="text-[11px]">{rule.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Outbound NAT */}
        {activeTab === 'outbound' && (
          <div className="p-4 space-y-4">
            <div className="section">
              <div className="section-header-neutral">
                <span>Outbound NAT Mode</span>
              </div>
              <div className="section-body">
                <div className="grid grid-cols-3 gap-4">
                  {['Automatic', 'Hybrid', 'Manual'].map((mode) => (
                    <label key={mode} className="flex items-start gap-3 p-4 bg-[#f8f8f8] border border-[#ddd] cursor-pointer hover:border-[hsl(142,70%,35%)] transition-colors">
                      <input type="radio" name="nat-mode" defaultChecked={mode === 'Automatic'} className="mt-0.5" />
                      <div>
                        <div className="font-medium text-[11px]">{mode} Outbound NAT</div>
                        <div className="text-[10px] text-[#666] mt-1">
                          {mode === 'Automatic' && 'System automatically creates outbound NAT rules'}
                          {mode === 'Hybrid' && 'Automatic rules plus manual mappings'}
                          {mode === 'Manual' && 'Full manual control over outbound NAT'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Interface</th>
                  <th>Source</th>
                  <th>Source Port</th>
                  <th>Destination</th>
                  <th>NAT Address</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {rules.filter(r => r.type === 'outbound').map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <input type="checkbox" className="forti-checkbox" />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={rule.enabled} 
                        onToggle={() => toggleRule(rule.id)}
                        size="sm"
                      />
                    </td>
                    <td>
                      <span className="forti-tag bg-blue-100 text-blue-700 border-blue-200">
                        {rule.interface}
                      </span>
                    </td>
                    <td className="mono text-[10px]">{rule.internalAddress}</td>
                    <td className="mono text-[10px]">*</td>
                    <td className="mono text-[10px]">*</td>
                    <td className="mono text-[10px]">{rule.externalAddress}</td>
                    <td className="text-[11px]">{rule.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 1:1 NAT */}
        {activeTab === '1:1' && (
          <div className="p-4">
            <div className="section">
              <div className="section-body">
                <div className="flex flex-col items-center justify-center py-12 text-[#666]">
                  <Network className="w-12 h-12 mb-3 opacity-30" />
                  <div className="text-[13px] mb-2">No 1:1 NAT rules configured</div>
                  <div className="text-[11px] text-[#999] mb-4">1:1 NAT maps an external IP to an internal IP</div>
                  <button className="forti-btn forti-btn-primary">
                    <Plus className="w-3 h-3 inline mr-1" />
                    Add 1:1 NAT Rule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NPt */}
        {activeTab === 'npt' && (
          <div className="p-4">
            <div className="section">
              <div className="section-body">
                <div className="flex flex-col items-center justify-center py-12 text-[#666]">
                  <Network className="w-12 h-12 mb-3 opacity-30" />
                  <div className="text-[13px] mb-2">No NPt rules configured</div>
                  <div className="text-[11px] text-[#999] mb-4">Network Prefix Translation for IPv6</div>
                  <button className="forti-btn forti-btn-primary">
                    <Plus className="w-3 h-3 inline mr-1" />
                    Add NPt Rule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default NATConfig;
