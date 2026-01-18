import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Network, 
  Settings, 
  Save,
  RotateCcw,
  Search,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  { id: 'ssl-vpn', name: 'SSL-VPN', description: 'Remote access VPN', enabled: true, category: 'additional' },
  { id: 'sdwan', name: 'SD-WAN', description: 'Software-defined WAN', enabled: true, category: 'additional', requiresLicense: true },
  { id: 'wifi', name: 'WiFi Controller', description: 'Wireless AP management', enabled: false, category: 'additional' },
  { id: 'switch', name: 'Switch Controller', description: 'Managed switch integration', enabled: false, category: 'additional' },
  { id: 'fortitoken', name: 'FortiToken', description: 'Two-factor authentication', enabled: true, category: 'additional' },
  { id: 'fortiguard', name: 'FortiGuard', description: 'Cloud security services', enabled: true, category: 'additional', requiresLicense: true },
  { id: 'explicit-proxy', name: 'Explicit Proxy', description: 'Web proxy server', enabled: false, category: 'additional' },
  { id: 'wan-opt', name: 'WAN Optimization', description: 'Traffic optimization', enabled: false, category: 'additional', requiresLicense: true },
  { id: 'endpoint', name: 'Endpoint Control', description: 'FortiClient integration', enabled: false, category: 'additional' },
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
      case 'core': return <Network size={16} />;
      case 'security': return <Shield size={16} />;
      case 'additional': return <Settings size={16} />;
      default: return null;
    }
  };

  const FeatureCard = ({ feature }: { feature: Feature }) => (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        feature.enabled 
          ? "bg-white border-border" 
          : "bg-muted/30 border-border/50"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            !feature.enabled && "text-muted-foreground"
          )}>
            {feature.name}
          </span>
          {feature.requiresLicense && (
            <span className="px-1.5 py-0.5 text-[9px] font-medium bg-amber-100 text-amber-700 rounded">
              LICENSE
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {feature.description}
        </p>
      </div>
      <Switch
        checked={feature.enabled}
        onCheckedChange={() => toggleFeature(feature.id)}
        className="ml-3"
      />
    </div>
  );

  const FeatureColumn = ({ 
    title, 
    category, 
    features: columnFeatures,
    color 
  }: { 
    title: string; 
    category: string;
    features: Feature[];
    color: string;
  }) => (
    <div className="section flex flex-col">
      <div className={cn(
        "section-header border-b-2",
        color
      )}>
        <div className="flex items-center gap-2">
          {getCategoryIcon(category)}
          <span className="font-medium">{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {columnFeatures.filter(f => f.enabled).length}/{columnFeatures.length} enabled
        </span>
      </div>
      <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
        {columnFeatures.map(feature => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
        {columnFeatures.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No features match your search
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Shell>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="forti-toolbar">
          <div className="forti-toolbar-left">
            <Button 
              onClick={handleSave}
              disabled={!hasChanges}
              size="sm" 
              className="gap-1.5 bg-[#4caf50] hover:bg-[#43a047]"
            >
              <Save size={14} />
              Apply
            </Button>
            <button 
              onClick={handleReset}
              className="forti-action-btn"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          <div className="forti-toolbar-right">
            <div className="forti-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search features..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Feature Visibility</p>
            <p>
              Enable or disable features to customize the management interface. 
              Disabled features will be hidden from the menu and configuration pages. 
              This does not affect the actual functionality - it only controls visibility in the GUI.
            </p>
          </div>
        </div>

        {/* Feature Columns */}
        <div className="grid grid-cols-3 gap-4">
          <FeatureColumn 
            title="Core Features" 
            category="core"
            features={coreFeatures}
            color="border-b-blue-500"
          />
          <FeatureColumn 
            title="Security Features" 
            category="security"
            features={securityFeatures}
            color="border-b-red-500"
          />
          <FeatureColumn 
            title="Additional Features" 
            category="additional"
            features={additionalFeatures}
            color="border-b-amber-500"
          />
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
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
