import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  Shield, 
  Network, 
  Settings, 
  Save,
  RotateCcw,
  Search,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'core' | 'security' | 'additional';
  dependencies?: string[];
  requiresLicense?: boolean;
}

const initialFeatures: Feature[] = [
  // Core Features
  { id: 'ipv4-policy', name: 'IPv4 Policy', description: 'IPv4 firewall policies', enabled: true, category: 'core' },
  { id: 'ipv6-policy', name: 'IPv6 Policy', description: 'IPv6 firewall policies', enabled: true, category: 'core' },
  { id: 'nat', name: 'NAT', description: 'Network Address Translation', enabled: true, category: 'core' },
  { id: 'routing', name: 'Static Routing', description: 'Static route configuration', enabled: true, category: 'core' },
  { id: 'dhcp', name: 'DHCP Server', description: 'DHCP server for clients', enabled: true, category: 'core' },
  { id: 'dns', name: 'DNS', description: 'DNS forwarding and filtering', enabled: true, category: 'core' },
  { id: 'interfaces', name: 'Interfaces', description: 'Network interface management', enabled: true, category: 'core' },
  { id: 'system', name: 'System', description: 'System configuration', enabled: true, category: 'core' },
  { id: 'admin', name: 'Administrators', description: 'Admin user management', enabled: true, category: 'core' },
  { id: 'logging', name: 'Logging', description: 'System and traffic logging', enabled: true, category: 'core' },
  
  // Security Features
  { id: 'antivirus', name: 'AntiVirus', description: 'Virus and malware scanning', enabled: true, category: 'security', requiresLicense: true },
  { id: 'webfilter', name: 'Web Filter', description: 'URL and content filtering', enabled: true, category: 'security', requiresLicense: true },
  { id: 'ips', name: 'Intrusion Prevention', description: 'IPS signature-based protection', enabled: true, category: 'security', requiresLicense: true },
  { id: 'appcontrol', name: 'Application Control', description: 'Application identification and control', enabled: true, category: 'security', requiresLicense: true },
  { id: 'ssl-inspection', name: 'SSL Inspection', description: 'HTTPS traffic inspection', enabled: true, category: 'security' },
  { id: 'dlp', name: 'Data Loss Prevention', description: 'Prevent sensitive data leakage', enabled: false, category: 'security', requiresLicense: true },
  { id: 'email-filter', name: 'Email Filter', description: 'Email spam and virus filtering', enabled: false, category: 'security', requiresLicense: true },
  { id: 'voip', name: 'VoIP', description: 'Voice over IP protection', enabled: false, category: 'security' },
  { id: 'icap', name: 'ICAP', description: 'External content scanning', enabled: false, category: 'security' },
  { id: 'waf', name: 'Web Application Firewall', description: 'Protect web applications', enabled: false, category: 'security', requiresLicense: true },
  
  // Additional Features
  { id: 'ipsec-vpn', name: 'IPsec VPN', description: 'Site-to-site VPN tunnels', enabled: true, category: 'additional' },
  { id: 'wireguard-vpn', name: 'WireGuard VPN', description: 'Modern VPN protocol', enabled: true, category: 'additional' },
  { id: 'sdwan', name: 'SD-WAN', description: 'Software-defined WAN', enabled: true, category: 'additional', requiresLicense: true },
  { id: 'wifi', name: 'WiFi Controller', description: 'Wireless AP management', enabled: false, category: 'additional' },
  { id: 'switch', name: 'Switch Controller', description: 'Managed switch integration', enabled: false, category: 'additional' },
  { id: 'aegistoken', name: 'Aegis Token', description: 'Two-factor authentication', enabled: true, category: 'additional' },
  { id: 'aegisguard', name: 'Aegis Guard', description: 'Cloud security services', enabled: true, category: 'additional', requiresLicense: true },
  { id: 'explicit-proxy', name: 'Explicit Proxy', description: 'Web proxy server', enabled: false, category: 'additional' },
  { id: 'wan-opt', name: 'WAN Optimization', description: 'Traffic optimization', enabled: false, category: 'additional', requiresLicense: true },
  { id: 'endpoint', name: 'Endpoint Control', description: 'Aegis Client integration', enabled: false, category: 'additional' },
];

const FeatureVisibility = () => {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [search, setSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const toggleFeature = (id: string) => {
    setFeatures(prev => prev.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
    setHasChanges(true);
  };

  const handleSave = () => {
    toast.success('Feature visibility settings saved');
    setHasChanges(false);
  };

  const handleReset = () => {
    setFeatures(initialFeatures);
    setHasChanges(false);
    toast.info('Settings reset to defaults');
  };

  const filterFeatures = (category: Feature['category']) => {
    return features.filter(f => {
      const matchesCategory = f.category === category;
      const matchesSearch = search === '' || 
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const coreFeatures = filterFeatures('core');
  const securityFeatures = filterFeatures('security');
  const additionalFeatures = filterFeatures('additional');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <Network size={14} />;
      case 'security': return <Shield size={14} />;
      case 'additional': return <Settings size={14} />;
      default: return null;
    }
  };

  const FeatureCard = ({ feature }: { feature: Feature }) => (
    <div className="forti-feature-item">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[11px] font-medium",
            !feature.enabled && "text-[#999]"
          )}>
            {feature.name}
          </span>
          {feature.requiresLicense && (
            <span className="px-1 py-0.5 text-[9px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
              LICENSE
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#666] mt-0.5 truncate">
          {feature.description}
        </p>
      </div>
      <FortiToggle
        enabled={feature.enabled}
        onToggle={() => toggleFeature(feature.id)}
        size="sm"
      />
    </div>
  );

  const FeatureColumn = ({ 
    title, 
    category, 
    features: columnFeatures,
    headerColor 
  }: { 
    title: string; 
    category: string;
    features: Feature[];
    headerColor: string;
  }) => (
    <div className="section">
      <div className={cn("section-header", headerColor)}>
        <div className="flex items-center gap-2">
          {getCategoryIcon(category)}
          <span>{title}</span>
        </div>
        <span className="text-[10px] opacity-80">
          {columnFeatures.filter(f => f.enabled).length}/{columnFeatures.length} enabled
        </span>
      </div>
      <div className="section-body space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto">
        {columnFeatures.map(feature => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
        {columnFeatures.length === 0 && (
          <div className="text-center py-8 text-[#999] text-[11px]">
            No features match your search
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* Toolbar */}
        <div className="forti-toolbar">
          <button 
            onClick={handleSave}
            disabled={!hasChanges}
            className={cn(
              "forti-toolbar-btn",
              hasChanges ? "primary" : ""
            )}
          >
            <Save size={12} />
            Apply
          </button>
          <button 
            onClick={handleReset}
            className="forti-toolbar-btn"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <div className="forti-toolbar-separator" />
          <div className="flex-1" />
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input
              type="text"
              placeholder="Search features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 border-l-4 border-l-blue-500 border border-blue-200 mx-4 mt-4">
          <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-[11px] text-blue-800">
            <p className="font-semibold mb-1">Feature Visibility</p>
            <p>
              Enable or disable features to customize the management interface. 
              Disabled features will be hidden from the menu and configuration pages. 
              This does not affect the actual functionality - it only controls visibility in the GUI.
            </p>
          </div>
        </div>

        {/* Feature Columns */}
        <div className="grid grid-cols-3 gap-4 p-4">
          <FeatureColumn 
            title="Core Features" 
            category="core"
            features={coreFeatures}
            headerColor=""
          />
          <FeatureColumn 
            title="Security Features" 
            category="security"
            features={securityFeatures}
            headerColor=""
          />
          <FeatureColumn 
            title="Additional Features" 
            category="additional"
            features={additionalFeatures}
            headerColor=""
          />
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-[11px] text-[#666] px-4 py-2 bg-[#f5f5f5] border-t border-[#ddd]">
          <span>
            Total: {features.filter(f => f.enabled).length} of {features.length} features enabled
          </span>
          {hasChanges && (
            <span className="text-amber-600 font-medium">
              • Unsaved changes
            </span>
          )}
        </div>
      </div>
    </Shell>
  );
};

export default FeatureVisibility;
