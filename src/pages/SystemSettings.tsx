import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Save,
  Server,
  Clock,
  Globe,
  Bell,
  Shield,
  Users,
  Database,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const SystemSettings = () => {
  const [hostname, setHostname] = useState('NGFW-PRIMARY');
  const [domain, setDomain] = useState('local.lan');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [ntpServer, setNtpServer] = useState('pool.ntp.org');
  const [dnsServers, setDnsServers] = useState('8.8.8.8, 1.1.1.1');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [syslogEnabled, setSyslogEnabled] = useState(true);
  const [syslogServer, setSyslogServer] = useState('192.168.1.100');
  const [webGuiPort, setWebGuiPort] = useState('443');
  const [sshEnabled, setSshEnabled] = useState(true);
  const [sshPort, setSshPort] = useState('22');
  const [sessionTimeout, setSessionTimeout] = useState('30');

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  const handleReboot = () => {
    toast.success('System reboot scheduled');
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">System Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">General system configuration</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReboot}>
              <RefreshCw size={14} />
              Reboot
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSave}>
              <Save size={14} />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="admin">Administration</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <div className="section p-5 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="p-2.5 rounded-lg bg-blue-500/10">
                  <Server size={20} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">System Identity</h2>
                  <p className="text-xs text-muted-foreground">Hostname and domain settings</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input
                    id="hostname"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="section p-5 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="p-2.5 rounded-lg bg-amber-500/10">
                  <Clock size={20} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Time Settings</h2>
                  <p className="text-xs text-muted-foreground">Timezone and NTP configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok (UTC+7)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (UTC+8)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ntp">NTP Server</Label>
                  <Input
                    id="ntp"
                    value={ntpServer}
                    onChange={(e) => setNtpServer(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="section p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10">
                    <Shield size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Auto Update</h2>
                    <p className="text-xs text-muted-foreground">Automatically update signatures and system</p>
                  </div>
                </div>
                <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
              </div>
            </div>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-4">
            <div className="section p-5 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="p-2.5 rounded-lg bg-blue-500/10">
                  <Globe size={20} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">DNS Settings</h2>
                  <p className="text-xs text-muted-foreground">DNS resolver configuration</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dns">DNS Servers</Label>
                <Input
                  id="dns"
                  value={dnsServers}
                  onChange={(e) => setDnsServers(e.target.value)}
                  placeholder="Comma separated DNS servers"
                  className="font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Comma separated list of DNS servers</p>
              </div>
            </div>

            <div className="section p-5 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="p-2.5 rounded-lg bg-purple-500/10">
                  <Database size={20} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Syslog</h2>
                  <p className="text-xs text-muted-foreground">Remote logging configuration</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <Label>Enable Remote Syslog</Label>
                <Switch checked={syslogEnabled} onCheckedChange={setSyslogEnabled} />
              </div>

              {syslogEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="syslog">Syslog Server</Label>
                  <Input
                    id="syslog"
                    value={syslogServer}
                    onChange={(e) => setSyslogServer(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Administration Tab */}
          <TabsContent value="admin" className="space-y-4">
            <div className="section p-5 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="p-2.5 rounded-lg bg-blue-500/10">
                  <Users size={20} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Web Interface</h2>
                  <p className="text-xs text-muted-foreground">WebGUI access settings</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="webport">HTTPS Port</Label>
                  <Input
                    id="webport"
                    value={webGuiPort}
                    onChange={(e) => setWebGuiPort(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="timeout"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="section p-5 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="p-2.5 rounded-lg bg-emerald-500/10">
                  <Settings size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">SSH Access</h2>
                  <p className="text-xs text-muted-foreground">Secure shell configuration</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <Label>Enable SSH</Label>
                <Switch checked={sshEnabled} onCheckedChange={setSshEnabled} />
              </div>

              {sshEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="sshport">SSH Port</Label>
                  <Input
                    id="sshport"
                    value={sshPort}
                    onChange={(e) => setSshPort(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="section p-5 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                <div className="p-2.5 rounded-lg bg-amber-500/10">
                  <Bell size={20} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Alert Notifications</h2>
                  <p className="text-xs text-muted-foreground">Configure email and notification settings</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Critical Security Alerts', enabled: true },
                  { label: 'System Health Warnings', enabled: true },
                  { label: 'Daily Summary Reports', enabled: false },
                  { label: 'Configuration Changes', enabled: true },
                  { label: 'VPN Connection Events', enabled: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <Label>{item.label}</Label>
                    <Switch defaultChecked={item.enabled} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default SystemSettings;
