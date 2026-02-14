import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CLILine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp: string;
}

const HELP_TEXT = `Available commands:
  help              - Show this help message
  status            - Show system status summary
  interfaces        - List network interfaces
  routes            - Show routing table
  firewall rules    - List active firewall rules
  vpn status        - Show VPN tunnel status
  dns lookup <host> - Perform DNS lookup
  ping <host>       - Simulate ping to host
  uptime            - Show system uptime
  version           - Show firmware version
  cpu               - Show CPU usage
  memory            - Show memory usage
  disk              - Show disk usage
  sessions          - Show active sessions count
  clear             - Clear console
  exit              - Close console`;

const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

function simulateCommand(cmd: string): string {
  const trimmed = cmd.trim().toLowerCase();

  if (trimmed === 'help') return HELP_TEXT;
  if (trimmed === 'clear') return '__CLEAR__';
  if (trimmed === 'exit') return '__EXIT__';

  if (trimmed === 'status') {
    return `System Status: ONLINE
Hostname: AEGIS-PRIMARY
Model: Aegis Firewall v7.4
Serial: FW-2024-AEG-001
Uptime: 30 days, 5 hours, 12 minutes
CPU: 23% | Memory: 61% | Disk: 34%
Active Sessions: 12,847
Threat Level: LOW`;
  }

  if (trimmed === 'interfaces') {
    return `Interface   Status  IP Address        Speed     RX/TX
─────────   ──────  ────────────────  ────────  ──────────
wan1        UP      203.0.113.1/24    1 Gbps    12.4G/8.7G
lan1        UP      192.168.1.1/24    1 Gbps    45.2G/38.1G
lan2        UP      10.0.0.1/24       1 Gbps    3.2G/1.8G
dmz         UP      172.16.0.1/24     1 Gbps    890M/2.1G
wlan0       UP      192.168.10.1/24   300 Mbps  1.2G/980M`;
  }

  if (trimmed === 'routes') {
    return `Destination       Gateway         Interface  Distance  Status
──────────────    ──────────────  ─────────  ────────  ──────
0.0.0.0/0         203.0.113.254   wan1       1         active
192.168.1.0/24    0.0.0.0         lan1       0         connected
10.0.0.0/24       0.0.0.0         lan2       0         connected
172.16.0.0/24     0.0.0.0         dmz        0         connected
10.10.0.0/16      10.0.0.254      lan2       10        active`;
  }

  if (trimmed === 'firewall rules') {
    return `ID   Action  Source          Dest            Service    Hits
──   ──────  ──────────────  ──────────────  ─────────  ────────
1    ACCEPT  lan1            wan1            ALL        1,234,567
2    ACCEPT  lan2            wan1            HTTP/HTTPS 456,789
3    ACCEPT  wan1            dmz:443        HTTPS      89,012
4    DROP    wan1            lan1            ALL        34,567
5    ACCEPT  lan1            lan2            ALL        12,345
Total rules: 47 | Active: 45 | Disabled: 2`;
  }

  if (trimmed === 'vpn status') {
    return `Tunnel          Type    Status  Remote Gateway   Uptime      TX/RX
──────────────  ──────  ──────  ───────────────  ──────────  ──────────
HQ-Branch1      IPsec   UP      10.20.30.1       15d 3h      2.1G/1.8G
HQ-Branch2      IPsec   UP      10.20.40.1       15d 3h      890M/720M
RemoteAccess    SSL     UP      0.0.0.0          N/A         3.4G/5.1G
Site-to-Site    IPsec   DOWN    10.20.50.1       -           0/0`;
  }

  if (trimmed.startsWith('dns lookup ')) {
    const host = trimmed.replace('dns lookup ', '');
    const fakeIP = `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    return `Resolving ${host}...
Name:    ${host}
Address: ${fakeIP}
TTL:     ${Math.floor(Math.random() * 3600)}s
Query time: ${Math.floor(Math.random() * 50) + 1}ms`;
  }

  if (trimmed.startsWith('ping ')) {
    const host = trimmed.replace('ping ', '');
    const ms = () => (Math.random() * 30 + 1).toFixed(1);
    return `PING ${host}: 56 data bytes
64 bytes from ${host}: seq=0 ttl=64 time=${ms()} ms
64 bytes from ${host}: seq=1 ttl=64 time=${ms()} ms
64 bytes from ${host}: seq=2 ttl=64 time=${ms()} ms
64 bytes from ${host}: seq=3 ttl=64 time=${ms()} ms
--- ${host} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss`;
  }

  if (trimmed === 'uptime') return `System uptime: 30 days, 5 hours, 12 minutes, 48 seconds`;
  if (trimmed === 'version') return `Aegis Firewall OS v7.4.2 (build 1234)\nKernel: 5.15.0-aegis\nLast updated: 2026-01-15`;
  if (trimmed === 'cpu') return `CPU Usage: 23%\nCores: 4\nTemperature: 42°C\nLoad Avg: 0.45, 0.38, 0.31`;
  if (trimmed === 'memory') return `Memory: 3.9 GB / 8.0 GB (61%)\nCached: 1.2 GB\nBuffers: 340 MB\nSwap: 0 / 2.0 GB`;
  if (trimmed === 'disk') return `Filesystem  Size   Used  Avail  Use%\n/dev/sda1   120G   41G   79G    34%\n/dev/sda2   500G   180G  320G   36%`;
  if (trimmed === 'sessions') return `Active Sessions: 12,847\nTCP: 11,203 | UDP: 1,544 | ICMP: 100\nPeak today: 15,231`;

  return `Unknown command: "${cmd}". Type "help" for available commands.`;
}

interface CLIConsoleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CLIConsole({ open, onOpenChange }: CLIConsoleProps) {
  const [lines, setLines] = useState<CLILine[]>([
    { type: 'system', text: 'Aegis Firewall CLI Console v7.4.2', timestamp: now() },
    { type: 'system', text: 'Type "help" for available commands.', timestamp: now() },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const ts = now();
    const newLines: CLILine[] = [
      ...lines,
      { type: 'input', text: input, timestamp: ts },
    ];

    const result = simulateCommand(input);

    if (result === '__CLEAR__') {
      setLines([{ type: 'system', text: 'Console cleared.', timestamp: now() }]);
    } else if (result === '__EXIT__') {
      onOpenChange(false);
    } else {
      const isError = result.startsWith('Unknown command');
      newLines.push({ type: isError ? 'error' : 'output', text: result, timestamp: ts });
      setLines(newLines);
    }

    setHistory(prev => [input, ...prev].slice(0, 50));
    setHistoryIndex(-1);
    setInput('');
  }, [input, lines, onOpenChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 bg-[#1a1a2e] border-[#333] overflow-hidden" aria-describedby={undefined}>
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f0f1a] border-b border-[#333]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-[11px] text-gray-400 ml-2 font-mono">aegis-cli — AEGIS-PRIMARY</span>
          </div>
        </div>
        <div ref={scrollRef} className="h-[400px] overflow-y-auto p-3 font-mono text-[12px] leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line.type === 'input' ? (
                <span>
                  <span className="text-green-400">admin@aegis</span>
                  <span className="text-gray-500">:</span>
                  <span className="text-blue-400">~</span>
                  <span className="text-gray-500">$ </span>
                  <span className="text-white">{line.text}</span>
                </span>
              ) : line.type === 'error' ? (
                <span className="text-red-400">{line.text}</span>
              ) : line.type === 'system' ? (
                <span className="text-cyan-400">{line.text}</span>
              ) : (
                <span className="text-gray-300">{line.text}</span>
              )}
            </div>
          ))}
          <form onSubmit={handleSubmit} className="flex items-center mt-1">
            <span className="text-green-400">admin@aegis</span>
            <span className="text-gray-500">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-gray-500">$ </span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white outline-none border-none font-mono text-[12px] ml-1"
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
