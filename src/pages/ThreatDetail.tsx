import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Download, Shield, Clock, Globe, Server, FileText, Terminal } from 'lucide-react';

// Mock threat detail data
const threatDetail = {
  id: 'threat-1',
  severity: 'critical',
  status: 'blocked',
  signature: 'ET SCAN SSH Brute Force Attempt',
  category: 'Intrusion Attempt',
  description: 'Multiple SSH login attempts detected from malicious IP address. Pattern matches known brute force attack behavior.',
  timestamp: new Date(Date.now() - 120000),
  source: {
    ip: '45.33.32.156',
    port: 54321,
    country: 'CN',
    asn: 'AS4134 CHINANET',
    reputation: 'Malicious',
    threatIntel: ['AbuseIPDB', 'Spamhaus', 'Emerging Threats'],
  },
  destination: {
    ip: '203.113.152.45',
    port: 22,
    interface: 'WAN',
    service: 'SSH',
  },
  session: {
    id: 'sess-a1b2c3d4',
    protocol: 'TCP',
    bytesIn: 4521,
    bytesOut: 892,
    packetsIn: 45,
    packetsOut: 12,
    duration: 8.5,
    state: 'CLOSED',
    flags: ['SYN', 'ACK', 'RST'],
  },
  ai: {
    confidence: 98.5,
    reason: 'Pattern matches SSH brute force signature with high frequency login attempts',
    relatedIndicators: [
      'Multiple failed auth attempts (23 in 8 seconds)',
      'Source IP flagged in 3 threat intel feeds',
      'Similar attacks from same ASN in last 24h',
    ],
  },
  timeline: [
    { time: '14:32:15.123', event: 'TCP SYN received', detail: '45.33.32.156:54321 → 203.113.152.45:22' },
    { time: '14:32:15.125', event: 'TCP SYN-ACK sent', detail: '203.113.152.45:22 → 45.33.32.156:54321' },
    { time: '14:32:15.180', event: 'SSH banner exchange', detail: 'Protocol version negotiation' },
    { time: '14:32:15.250', event: 'Auth attempt 1', detail: 'User: root, Method: password' },
    { time: '14:32:15.380', event: 'Auth attempt 2', detail: 'User: admin, Method: password' },
    { time: '14:32:15.520', event: 'Auth attempt 3', detail: 'User: ubuntu, Method: password' },
    { time: '14:32:16.100', event: 'IDS Alert triggered', detail: 'Signature: ET SCAN SSH Brute Force' },
    { time: '14:32:16.102', event: 'Session blocked', detail: 'Action: DROP, Rule: IDS-AUTO-001' },
  ],
  rawLog: `Jan 17 14:32:16 aegis-primary suricata[1234]: [1:2001219:20] ET SCAN Potential SSH Scan [**] 
[Classification: Attempted Information Leak] [Priority: 2] 
{TCP} 45.33.32.156:54321 -> 203.113.152.45:22

Jan 17 14:32:16 aegis-primary kernel: [UFW BLOCK] IN=em0 OUT= MAC=00:1a:2b:3c:4d:5e:00:11:22:33:44:55:08:00 
SRC=45.33.32.156 DST=203.113.152.45 LEN=60 TOS=0x00 PREC=0x00 TTL=49 ID=54321 DF PROTO=TCP SPT=54321 DPT=22 
WINDOW=65535 RES=0x00 SYN URGP=0`,
  pcapAvailable: true,
};

const ThreatDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'session' | 'evidence' | 'timeline' | 'raw'>('overview');
  const threat = threatDetail;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Shield size={14} /> },
    { id: 'session', label: 'Session', icon: <Globe size={14} /> },
    { id: 'evidence', label: 'Evidence', icon: <FileText size={14} /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
    { id: 'raw', label: 'Raw / PCAP', icon: <Terminal size={14} /> },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/threats" className="text-muted-foreground hover:text-foreground">Threat Monitor</Link>
          <ChevronRight size={14} className="text-muted-foreground" />
          <span>{threat.signature}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={cn(
                "tag",
                threat.severity === 'critical' ? 'tag-critical' : 
                threat.severity === 'high' ? 'tag-high' : 'tag-medium'
              )}>
                {threat.severity.toUpperCase()}
              </span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded",
                threat.status === 'blocked' ? 'bg-status-healthy/15 text-status-healthy' : 'bg-status-medium/15 text-status-medium'
              )}>
                {threat.status.toUpperCase()}
              </span>
            </div>
            <h1 className="text-lg font-semibold">{threat.signature}</h1>
            <p className="text-sm text-muted-foreground mt-1">{threat.category} • {formatTime(threat.timestamp)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost">Mark as False Positive</button>
            <button className="btn btn-outline flex items-center gap-1.5">
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors",
                activeTab === tab.id 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-5">
            {/* Left Column */}
            <div className="col-span-8 space-y-5">
              {/* Description */}
              <div className="panel">
                <div className="panel-header">
                  <span>Description</span>
                </div>
                <div className="panel-body">
                  <p className="text-sm">{threat.description}</p>
                </div>
              </div>

              {/* Source & Destination */}
              <div className="grid grid-cols-2 gap-5">
                <div className="panel">
                  <div className="panel-header">
                    <span>Source</span>
                    <span className="tag tag-critical">{threat.source.reputation}</span>
                  </div>
                  <div className="panel-body space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IP Address</span>
                      <span className="font-mono">{threat.source.ip}:{threat.source.port}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Country</span>
                      <span>{threat.source.country}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ASN</span>
                      <span className="text-xs">{threat.source.asn}</span>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Threat Intel Matches</div>
                      <div className="flex flex-wrap gap-1">
                        {threat.source.threatIntel.map((feed) => (
                          <span key={feed} className="text-xs px-1.5 py-0.5 bg-status-critical/10 text-status-critical rounded">
                            {feed}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <span>Destination</span>
                  </div>
                  <div className="panel-body space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IP Address</span>
                      <span className="font-mono">{threat.destination.ip}:{threat.destination.port}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Interface</span>
                      <span>{threat.destination.interface}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service</span>
                      <span>{threat.destination.service}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - AI Analysis */}
            <div className="col-span-4">
              <div className="panel">
                <div className="panel-header">
                  <span>AI Analysis</span>
                </div>
                <div className="panel-body space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${threat.ai.confidence}%` }} />
                      </div>
                      <span className="text-sm font-medium">{threat.ai.confidence}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Reasoning</div>
                    <p className="text-sm">{threat.ai.reason}</p>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Related Indicators</div>
                    <ul className="space-y-2">
                      {threat.ai.relatedIndicators.map((indicator, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'session' && (
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-6">
              <div className="panel">
                <div className="panel-header">
                  <span>Session Details</span>
                  <span className="font-mono text-xs text-muted-foreground">{threat.session.id}</span>
                </div>
                <div className="panel-body space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Protocol</span>
                    <span>{threat.session.protocol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">State</span>
                    <span>{threat.session.state}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{threat.session.duration}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TCP Flags</span>
                    <span className="font-mono text-xs">{threat.session.flags.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-6">
              <div className="panel">
                <div className="panel-header">
                  <span>Traffic Statistics</span>
                </div>
                <div className="panel-body">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Inbound</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bytes</span>
                          <span className="font-mono">{threat.session.bytesIn.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Packets</span>
                          <span className="font-mono">{threat.session.packetsIn}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Outbound</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bytes</span>
                          <span className="font-mono">{threat.session.bytesOut.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Packets</span>
                          <span className="font-mono">{threat.session.packetsOut}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow Visualization */}
            <div className="col-span-12">
              <div className="panel">
                <div className="panel-header">
                  <span>Connection Flow</span>
                </div>
                <div className="panel-body">
                  <div className="flex items-center justify-center gap-8 py-6">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-lg bg-status-critical/10 border border-status-critical/30 flex items-center justify-center mb-2">
                        <Globe size={24} className="text-status-critical" />
                      </div>
                      <div className="text-sm font-medium">Attacker</div>
                      <div className="text-xs font-mono text-muted-foreground">{threat.source.ip}</div>
                      <div className="text-xs text-muted-foreground">{threat.source.country}</div>
                    </div>
                    
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-border relative">
                          <div className="absolute inset-y-0 left-0 w-1/2 bg-status-critical/50" />
                        </div>
                        <div className="text-xs text-muted-foreground px-2 py-1 bg-accent rounded">
                          {threat.session.packetsIn + threat.session.packetsOut} packets
                        </div>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="text-center mt-2">
                        <span className="tag tag-critical">BLOCKED</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-2">
                        <Server size={24} className="text-primary" />
                      </div>
                      <div className="text-sm font-medium">Target</div>
                      <div className="text-xs font-mono text-muted-foreground">{threat.destination.ip}</div>
                      <div className="text-xs text-muted-foreground">{threat.destination.service}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-5">
            <div className="panel">
              <div className="panel-header">
                <span>Attack Evidence</span>
              </div>
              <div className="panel-body space-y-4">
                <div className="p-4 bg-status-critical/5 border border-status-critical/20 rounded">
                  <div className="text-sm font-medium text-status-critical mb-2">Brute Force Pattern Detected</div>
                  <p className="text-sm text-muted-foreground">
                    23 authentication attempts in 8 seconds from same source IP targeting SSH service.
                    Username enumeration detected: root, admin, ubuntu, user, test.
                  </p>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-2">Authentication Attempts</div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Username</th>
                        <th>Method</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['root', 'admin', 'ubuntu', 'user', 'test'].map((user, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs">14:32:15.{250 + i * 130}</td>
                          <td className="font-mono text-sm">{user}</td>
                          <td className="text-xs">password</td>
                          <td><span className="tag tag-critical">FAILED</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-2">Threat Intelligence</div>
                  <div className="grid grid-cols-3 gap-4">
                    {threat.source.threatIntel.map((feed) => (
                      <div key={feed} className="p-3 bg-accent/50 rounded">
                        <div className="text-sm font-medium">{feed}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          IP flagged for malicious activity
                        </div>
                        <div className="text-xs text-status-critical mt-2">High Risk</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="panel">
            <div className="panel-header">
              <span>Event Timeline</span>
            </div>
            <div className="panel-body">
              <div className="relative">
                <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {threat.timeline.map((event, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-[72px] text-xs font-mono text-muted-foreground text-right shrink-0">
                        {event.time.split('.')[0]}
                      </div>
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0 relative z-10",
                        event.event.includes('blocked') || event.event.includes('Alert') 
                          ? "bg-status-critical" 
                          : "bg-border"
                      )} />
                      <div className="flex-1 pb-4">
                        <div className="text-sm font-medium">{event.event}</div>
                        <div className="text-xs text-muted-foreground font-mono">{event.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="space-y-5">
            <div className="panel">
              <div className="panel-header">
                <span>Raw Logs</span>
                <button className="btn btn-ghost text-xs flex items-center gap-1">
                  <Download size={12} />
                  Download
                </button>
              </div>
              <div className="panel-body">
                <pre className="font-mono text-xs bg-background p-4 rounded overflow-x-auto whitespace-pre-wrap">
                  {threat.rawLog}
                </pre>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span>Packet Capture</span>
                {threat.pcapAvailable && (
                  <button className="btn btn-primary text-xs flex items-center gap-1">
                    <Download size={12} />
                    Download PCAP
                  </button>
                )}
              </div>
              <div className="panel-body">
                {threat.pcapAvailable ? (
                  <div className="space-y-3">
                    <div className="text-sm">
                      Packet capture available for this session. Download to analyze with Wireshark.
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">File size: </span>
                        <span>24.5 KB</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Packets: </span>
                        <span>{threat.session.packetsIn + threat.session.packetsOut}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration: </span>
                        <span>{threat.session.duration}s</span>
                      </div>
                    </div>
                    
                    {/* Hex Preview */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Hex Preview (First Packet)</div>
                      <pre className="font-mono text-[10px] bg-background p-3 rounded overflow-x-auto">
{`0000   45 00 00 3c 1c 46 40 00 31 06 a2 64 2d 21 20 9c   E..<.F@.1..d-! .
0010   cb 71 98 2d d4 31 00 16 ab cd 12 34 00 00 00 00   .q.-.1.....4....
0020   a0 02 fa f0 fe 30 00 00 02 04 05 b4 04 02 08 0a   .....0..........
0030   00 9d 1f 1d 00 00 00 00 01 03 03 07               ............`}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Packet capture not available for this session
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default ThreatDetail;
