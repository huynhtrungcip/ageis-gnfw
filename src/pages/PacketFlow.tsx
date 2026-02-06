import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  ArrowDown, 
  ArrowRight, 
  Shield, 
  Lock, 
  Network, 
  Cpu, 
  Database,
  Eye,
  AlertTriangle,
  Check,
  X,
  Zap,
  Server,
  Globe
} from 'lucide-react';
import { useState } from 'react';

interface FlowStep {
  id: string;
  label: string;
  description: string;
  processor?: 'CPU' | 'NP7' | 'CP9' | 'CP10';
  type: 'process' | 'decision' | 'terminal';
}

const ingressFlow: FlowStep[] = [
  { id: 'packet-in', label: 'Ingressing Packet', description: 'Packet arrives at network interface', type: 'terminal' },
  { id: 'net-iface', label: 'Network Interface', description: 'Physical/Virtual interface receives packet', type: 'process' },
  { id: 'tcpip', label: 'TCP/IP Stack', description: 'Layer 3/4 protocol processing', type: 'process' },
  { id: 'acl', label: 'ACL', description: 'Access Control List check', processor: 'NP7', type: 'process' },
  { id: 'hpe-dos', label: 'HPE DoS Protection', description: 'Host Protection Engine - DDoS mitigation', processor: 'NP7', type: 'process' },
  { id: 'ip-integrity', label: 'IP Integrity Header Checking', description: 'Verify packet header validity', type: 'process' },
  { id: 'ipsec-decrypt', label: 'IPsec VPN Decryption', description: 'Decrypt incoming VPN traffic', processor: 'CP9', type: 'process' },
];

const admissionFlow: FlowStep[] = [
  { id: 'quarantine', label: 'Quarantine', description: 'Check if source/destination is quarantined', type: 'process' },
  { id: 'captive', label: 'Captive Portal Authentication', description: 'User authentication for network access', type: 'process' },
];

const kernelFlow: FlowStep[] = [
  { id: 'dnat', label: 'Destination NAT', description: 'Translate destination IP address', type: 'process' },
  { id: 'routing', label: 'Routing (SD-WAN)', description: 'Determine egress interface and path', type: 'process' },
  { id: 'stateful', label: 'Stateful Inspection', description: 'Layer 3/4 session state verification', type: 'process' },
  { id: 'policy', label: 'Policy Lookup', description: 'Match firewall policy rules', type: 'process' },
  { id: 'session', label: 'Session Management', description: 'Create/update session table entry', type: 'process' },
  { id: 'helpers', label: 'Session Helpers', description: 'Protocol-specific ALG processing', type: 'process' },
  { id: 'auth', label: 'User Authentication', description: 'Verify user identity', type: 'process' },
  { id: 'device-id', label: 'Device Identification', description: 'Identify connecting device', type: 'process' },
];

const utmFlow: FlowStep[] = [
  { id: 'ssl-inspect', label: 'SSL/TLS Inspection', description: 'Decrypt HTTPS for deep inspection', processor: 'CP9', type: 'process' },
  { id: 'ips', label: 'IPS Signatures', description: 'Intrusion Prevention System', processor: 'CP10', type: 'process' },
  { id: 'av', label: 'Antivirus Scan', description: 'Malware detection', processor: 'CP10', type: 'process' },
  { id: 'app-control', label: 'Application Control', description: 'Identify and control applications', type: 'process' },
  { id: 'web-filter', label: 'Web Filtering', description: 'URL/content categorization', type: 'process' },
  { id: 'dlp', label: 'DLP', description: 'Data Loss Prevention', type: 'process' },
];

const egressFlow: FlowStep[] = [
  { id: 'snat', label: 'Source NAT', description: 'Translate source IP address', type: 'process' },
  { id: 'ipsec-encrypt', label: 'IPsec VPN Encryption', description: 'Encrypt outgoing VPN traffic', processor: 'CP9', type: 'process' },
  { id: 'shaping', label: 'Traffic Shaping', description: 'QoS and bandwidth control', type: 'process' },
  { id: 'tcpip-out', label: 'TCP/IP Stack', description: 'Outgoing packet processing', type: 'process' },
  { id: 'net-iface-out', label: 'Network Interface', description: 'Transmit packet', type: 'process' },
  { id: 'packet-out', label: 'Egressing Packet', description: 'Packet exits Aegis NGFW', type: 'terminal' },
];

const PacketFlow = () => {
  const [inspectionMode, setInspectionMode] = useState<'flow' | 'proxy'>('flow');
  const [ngfwMode, setNgfwMode] = useState<'profile' | 'policy'>('profile');
  const [highlightedStep, setHighlightedStep] = useState<string | null>(null);

  const FlowBox = ({ step, showArrow = true }: { step: FlowStep; showArrow?: boolean }) => (
    <div 
      className="relative"
      onMouseEnter={() => setHighlightedStep(step.id)}
      onMouseLeave={() => setHighlightedStep(null)}
    >
      <div className={cn(
        "px-3 py-2 rounded border text-center transition-all cursor-pointer min-w-[140px]",
        step.type === 'terminal' 
          ? "bg-gray-100 border-gray-300 rounded-[20px]"
          : step.type === 'decision'
          ? "bg-yellow-50 border-yellow-300 rotate-45"
          : "bg-white border-gray-300",
        highlightedStep === step.id && "ring-2 ring-green-500 bg-green-50"
      )}>
        <div className={cn(
          "text-[10px] font-medium text-gray-800",
          step.type === 'decision' && "-rotate-45"
        )}>
          {step.label}
        </div>
        {step.processor && (
          <div className="absolute -right-1 -top-1 px-1 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded">
            {step.processor}
          </div>
        )}
      </div>
      {showArrow && (
        <div className="flex justify-center py-1">
          <ArrowDown size={14} className="text-gray-400" />
        </div>
      )}
      {highlightedStep === step.id && (
        <div className="absolute left-full ml-2 top-0 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-lg z-10">
          {step.description}
        </div>
      )}
    </div>
  );

  const FlowColumn = ({ title, steps, icon: Icon, color }: { 
    title: string; 
    steps: FlowStep[]; 
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="flex flex-col items-center">
      <div className={cn("px-3 py-1.5 rounded-t text-white text-xs font-medium flex items-center gap-2", color)}>
        <Icon size={14} />
        {title}
      </div>
      <div className="border border-t-0 border-gray-300 rounded-b p-3 bg-gray-50 min-w-[180px]">
        {steps.map((step, idx) => (
          <FlowBox key={step.id} step={step} showArrow={idx < steps.length - 1} />
        ))}
      </div>
    </div>
  );

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Packet Flow Diagram</h1>
            <p className="text-xs text-gray-500">NGFW inspection path visualization</p>
          </div>
          <div className="flex items-center gap-4">
            {/* NGFW Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">NGFW Mode:</span>
              <div className="forti-toggle-group">
                <button 
                  onClick={() => setNgfwMode('profile')}
                  className={cn("forti-toggle", ngfwMode === 'profile' && "active")}
                >
                  Profile
                </button>
                <button 
                  onClick={() => setNgfwMode('policy')}
                  className={cn("forti-toggle", ngfwMode === 'policy' && "active")}
                >
                  Policy
                </button>
              </div>
            </div>
            {/* Inspection Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Inspection:</span>
              <div className="forti-toggle-group">
                <button 
                  onClick={() => setInspectionMode('flow')}
                  className={cn("forti-toggle", inspectionMode === 'flow' && "active")}
                >
                  Flow-based
                </button>
                <button 
                  onClick={() => setInspectionMode('proxy')}
                  className={cn("forti-toggle", inspectionMode === 'proxy' && "active")}
                >
                  Proxy-based
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Description */}
        <div className="section">
          <div className="section-header">
            <span className="flex items-center gap-2">
              <Eye size={14} />
              Current Configuration
            </span>
          </div>
          <div className="section-body">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">NGFW Mode</div>
                <div className="font-medium text-gray-800">
                  {ngfwMode === 'profile' ? 'Profile Mode' : 'Policy Mode'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {ngfwMode === 'profile' 
                    ? 'Kernel handles stateful inspection and policy matching before UTM/NGFW processing.'
                    : 'Application and URL category used as policy matching criteria.'
                  }
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Inspection Mode</div>
                <div className="font-medium text-gray-800">
                  {inspectionMode === 'flow' ? 'Flow-based (Single Pass)' : 'Proxy-based'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {inspectionMode === 'flow'
                    ? 'Real-time pattern matching using IPS Engine. Lower latency.'
                    : 'Full content reconstruction and inspection. Higher security.'
                  }
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Hardware Acceleration</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">NP7</span>
                  <span className="text-[10px] text-gray-500">Network Processor</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">CP9/CP10</span>
                  <span className="text-[10px] text-gray-500">Content Processor</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Packet Flow Visualization */}
        <div className="section">
          <div className="section-header">
            <span className="flex items-center gap-2">
              <Zap size={14} />
              Packet Flow Path
            </span>
          </div>
          <div className="section-body overflow-x-auto">
            <div className="flex items-start gap-4 min-w-[1000px] p-4">
              {/* Ingress */}
              <FlowColumn 
                title="Ingress Packet Flow" 
                steps={ingressFlow} 
                icon={ArrowDown}
                color="bg-blue-600"
              />
              
              <div className="flex items-center self-center">
                <ArrowRight size={20} className="text-gray-400" />
              </div>

              {/* Admission Control */}
              <FlowColumn 
                title="Admission Control" 
                steps={admissionFlow} 
                icon={Shield}
                color="bg-orange-600"
              />

              <div className="flex items-center self-center">
                <ArrowRight size={20} className="text-gray-400" />
              </div>

              {/* Kernel */}
              <FlowColumn 
                title="Kernel" 
                steps={kernelFlow} 
                icon={Cpu}
                color="bg-gray-700"
              />

              <div className="flex items-center self-center">
                <ArrowRight size={20} className="text-gray-400" />
              </div>

              {/* UTM/NGFW */}
              <div className="flex flex-col items-center">
                <div className="px-3 py-1.5 rounded-t bg-green-600 text-white text-xs font-medium flex items-center gap-2">
                  <Lock size={14} />
                  UTM/NGFW ({inspectionMode === 'flow' ? 'Flow' : 'Proxy'})
                </div>
                <div className="border border-t-0 border-gray-300 rounded-b p-3 bg-green-50 min-w-[180px]">
                  {utmFlow.map((step, idx) => (
                    <FlowBox key={step.id} step={step} showArrow={idx < utmFlow.length - 1} />
                  ))}
                </div>
              </div>

              <div className="flex items-center self-center">
                <ArrowRight size={20} className="text-gray-400" />
              </div>

              {/* Egress */}
              <FlowColumn 
                title="Egress Packet Flow" 
                steps={egressFlow} 
                icon={ArrowDown}
                color="bg-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="section">
          <div className="section-header-neutral">
            <span>Legend</span>
          </div>
          <div className="section-body">
            <div className="flex items-center gap-6 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-6 bg-white border border-gray-300 rounded" />
                <span className="text-gray-600">Process</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-6 bg-gray-100 border border-gray-300 rounded-full" />
                <span className="text-gray-600">Terminal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded">NP7</span>
                <span className="text-gray-600">Network Processor Accelerated</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded">CP9</span>
                <span className="text-gray-600">Content Processor Accelerated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-6 bg-green-50 border-2 border-green-500 rounded" />
                <span className="text-gray-600">Highlighted Step</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Helpers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="section">
            <div className="section-header">
              <span className="flex items-center gap-2">
                <Database size={14} />
                Session Helpers
              </span>
            </div>
            <div className="section-body">
              <div className="grid grid-cols-4 gap-2">
                {['PPTP', 'H323', 'RAS', 'TNS', 'TFTP', 'RTSP', 'FTP', 'MMS', 'PMAP', 'SIP', 'DNS-UDP', 'RSH', 'DCERPC', 'MGCP'].map((helper) => (
                  <div key={helper} className="px-2 py-1 bg-gray-100 rounded text-[10px] font-mono text-center">
                    {helper}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <span className="flex items-center gap-2">
                <Server size={14} />
                Transport Decoders
              </span>
            </div>
            <div className="section-body">
              <div className="grid grid-cols-4 gap-2">
                {['HTTP', 'FTP', 'IMAP', 'POP3', 'IMP2P', 'HTTP/2', 'BT', 'Skype', 'SPDY', 'SMTP', 'DNS', 'SSH'].map((decoder) => (
                  <div key={decoder} className="px-2 py-1 bg-blue-100 rounded text-[10px] font-mono text-center text-blue-700">
                    {decoder}
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

export default PacketFlow;
