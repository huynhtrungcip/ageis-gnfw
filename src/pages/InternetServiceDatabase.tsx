import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { Search, Globe, RefreshCw, Database, ChevronDown, ChevronRight, Star, Shield, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { exportToJSON } from '@/lib/exportImport';

interface InternetService {
  id: string;
  name: string;
  category: string;
  protocol: string;
  ports: string;
  ipCount: number;
  icon: string;
  isFavorite: boolean;
}

interface ServiceCategory {
  name: string;
  count: number;
  expanded: boolean;
  services: InternetService[];
}

const mockCategories: ServiceCategory[] = [
  {
    name: 'Cloud',
    count: 5,
    expanded: true,
    services: [
      { id: '1', name: 'Amazon.AWS', category: 'Cloud', protocol: 'TCP', ports: '443', ipCount: 2847, icon: '☁️', isFavorite: true },
      { id: '2', name: 'Microsoft.Azure', category: 'Cloud', protocol: 'TCP', ports: '443', ipCount: 1523, icon: '☁️', isFavorite: true },
      { id: '3', name: 'Google.Cloud', category: 'Cloud', protocol: 'TCP', ports: '443', ipCount: 892, icon: '☁️', isFavorite: false },
      { id: '4', name: 'Cloudflare', category: 'Cloud', protocol: 'TCP', ports: '443,80', ipCount: 234, icon: '☁️', isFavorite: false },
      { id: '5', name: 'Alibaba.Cloud', category: 'Cloud', protocol: 'TCP', ports: '443', ipCount: 567, icon: '☁️', isFavorite: false },
    ]
  },
  {
    name: 'General',
    count: 4,
    expanded: true,
    services: [
      { id: '6', name: 'Google.General', category: 'General', protocol: 'TCP', ports: '443,80', ipCount: 3421, icon: '🌐', isFavorite: true },
      { id: '7', name: 'Microsoft.General', category: 'General', protocol: 'TCP', ports: '443,80', ipCount: 2156, icon: '🌐', isFavorite: true },
      { id: '8', name: 'Apple.General', category: 'General', protocol: 'TCP', ports: '443,80', ipCount: 1234, icon: '🌐', isFavorite: false },
      { id: '9', name: 'Facebook.General', category: 'General', protocol: 'TCP', ports: '443', ipCount: 987, icon: '🌐', isFavorite: false },
    ]
  },
  {
    name: 'Security',
    count: 3,
    expanded: false,
    services: [
      { id: '10', name: 'FortiGuard', category: 'Security', protocol: 'TCP', ports: '443,8888', ipCount: 156, icon: '🛡️', isFavorite: true },
      { id: '11', name: 'Symantec', category: 'Security', protocol: 'TCP', ports: '443', ipCount: 89, icon: '🛡️', isFavorite: false },
      { id: '12', name: 'McAfee', category: 'Security', protocol: 'TCP', ports: '443', ipCount: 67, icon: '🛡️', isFavorite: false },
    ]
  },
  {
    name: 'Update',
    count: 3,
    expanded: false,
    services: [
      { id: '13', name: 'Windows.Update', category: 'Update', protocol: 'TCP', ports: '443,80', ipCount: 423, icon: '🔄', isFavorite: true },
      { id: '14', name: 'Apple.Update', category: 'Update', protocol: 'TCP', ports: '443,80', ipCount: 234, icon: '🔄', isFavorite: false },
      { id: '15', name: 'Linux.Update', category: 'Update', protocol: 'TCP', ports: '443,80', ipCount: 189, icon: '🔄', isFavorite: false },
    ]
  },
  {
    name: 'Communication',
    count: 4,
    expanded: false,
    services: [
      { id: '16', name: 'Microsoft.Teams', category: 'Communication', protocol: 'TCP/UDP', ports: '443,3478-3481', ipCount: 345, icon: '💬', isFavorite: true },
      { id: '17', name: 'Zoom', category: 'Communication', protocol: 'TCP/UDP', ports: '443,8801-8802', ipCount: 267, icon: '💬', isFavorite: true },
      { id: '18', name: 'Slack', category: 'Communication', protocol: 'TCP', ports: '443', ipCount: 123, icon: '💬', isFavorite: false },
      { id: '19', name: 'Discord', category: 'Communication', protocol: 'TCP/UDP', ports: '443,50000-65535', ipCount: 89, icon: '💬', isFavorite: false },
    ]
  },
];

const InternetServiceDatabase = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<InternetService | null>(null);

  const toggleCategory = (categoryName: string) => {
    setCategories(prev => prev.map(cat => 
      cat.name === categoryName ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  const toggleFavorite = (serviceId: string) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      services: cat.services.map(svc => 
        svc.id === serviceId ? { ...svc, isFavorite: !svc.isFavorite } : svc
      )
    })));
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    services: cat.services.filter(svc => 
      searchQuery === '' ||
      svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.services.length > 0 || searchQuery === '');

  const totalServices = categories.reduce((a, c) => a + c.services.length, 0);
  const totalIPs = categories.reduce((a, c) => a + c.services.reduce((b, s) => b + s.ipCount, 0), 0);

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn" onClick={() => toast.success('Database refreshed with latest entries')}>
            <RefreshCw className="w-3 h-3" />
            Refresh Database
          </button>
          <button className="forti-toolbar-btn" onClick={() => {
            const allServices = categories.flatMap(c => c.services);
            exportToJSON(allServices, `internet-services-${new Date().toISOString().split('T')[0]}.json`);
            toast.success(`Exported ${allServices.length} services`);
          }}>
            <Download className="w-3 h-3" />
            Export
          </button>
          <div className="forti-toolbar-separator" />
          <div className="text-[11px] text-[#666]">
            <span className="font-medium">{totalServices}</span> services | <span className="font-medium">{totalIPs.toLocaleString()}</span> IP entries
          </div>
          <div className="flex-1" />
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input 
              type="text" 
              placeholder="Search services..." 
              className="w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex gap-4">
          {/* Service List */}
          <div className="flex-1">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Protocol</th>
                  <th>Ports</th>
                  <th className="text-right">IP Entries</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <>
                    <tr 
                      key={`cat-${category.name}`}
                      className="group-header cursor-pointer"
                      onClick={() => toggleCategory(category.name)}
                    >
                      <td colSpan={7} className="py-1 px-2">
                        <div className="flex items-center gap-2">
                          {category.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          <Database size={12} />
                          <span>{category.name}</span>
                          <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                            {category.services.length}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {category.expanded && category.services.map((service) => (
                      <tr 
                        key={service.id}
                        className={cn(selectedService?.id === service.id && "selected")}
                        onClick={() => setSelectedService(service)}
                      >
                        <td className="text-center">
                          <span className="text-sm">{service.icon}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-blue-600" />
                            <span className="text-[11px] font-medium">{service.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200">
                            {service.category}
                          </span>
                        </td>
                        <td className="mono text-[11px]">{service.protocol}</td>
                        <td className="mono text-[11px]">{service.ports}</td>
                        <td className="text-right text-[11px] text-[#666]">{service.ipCount.toLocaleString()}</td>
                        <td>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(service.id); }}
                            className="p-1 hover:bg-[#f0f0f0] rounded"
                          >
                            <Star 
                              size={12} 
                              className={cn(
                                service.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-[#ccc]"
                              )} 
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selectedService && (
            <div className="w-72 bg-[#f8f8f8] border border-[#ddd] p-4 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-[#ddd]">
                <span className="text-2xl">{selectedService.icon}</span>
                <div>
                  <div className="text-[13px] font-semibold">{selectedService.name}</div>
                  <div className="text-[10px] text-[#666]">{selectedService.category}</div>
                </div>
              </div>
              
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#666]">Protocol:</span>
                  <span className="font-medium">{selectedService.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Ports:</span>
                  <span className="font-mono">{selectedService.ports}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">IP Entries:</span>
                  <span className="font-medium">{selectedService.ipCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Status:</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <Shield size={10} />
                    Active
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#ddd]">
                <div className="text-[10px] text-[#666] mb-2">Used in Policies:</div>
                <div className="text-[11px]">
                  {selectedService.isFavorite ? (
                    <span className="text-blue-600">Referenced in firewall policies</span>
                  ) : (
                    <span className="text-[#999]">Not currently in use</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
};

export default InternetServiceDatabase;
