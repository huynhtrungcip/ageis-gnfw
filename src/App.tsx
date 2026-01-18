import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ThreatMonitor from "./pages/ThreatMonitor";
import ThreatDetail from "./pages/ThreatDetail";
import Incidents from "./pages/Incidents";
import FirewallRules from "./pages/FirewallRules";
import Aliases from "./pages/Aliases";
import NATConfig from "./pages/NATConfig";
import Interfaces from "./pages/Interfaces";
import AISecurity from "./pages/AISecurity";
import DHCP from "./pages/DHCP";
import VPN from "./pages/VPN";
import SystemLogs from "./pages/SystemLogs";
import SystemMonitoring from "./pages/SystemMonitoring";
import Schedules from "./pages/Schedules";
import ConfigBackup from "./pages/ConfigBackup";
import IDSSettings from "./pages/IDSSettings";
import Routing from "./pages/Routing";
import Reports from "./pages/Reports";
import SystemSettings from "./pages/SystemSettings";
import TrafficAnalysis from "./pages/TrafficAnalysis";
import UserManagement from "./pages/UserManagement";
import PacketFlow from "./pages/PacketFlow";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/threats" element={<ThreatMonitor />} />
          <Route path="/threats/:id" element={<ThreatDetail />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/firewall/rules" element={<FirewallRules />} />
          <Route path="/firewall/aliases" element={<Aliases />} />
          <Route path="/firewall/nat" element={<NATConfig />} />
          <Route path="/firewall/schedules" element={<Schedules />} />
          <Route path="/firewall/services" element={<Aliases />} />
          <Route path="/security/ids" element={<IDSSettings />} />
          <Route path="/security/antivirus" element={<IDSSettings />} />
          <Route path="/security/webfilter" element={<IDSSettings />} />
          <Route path="/security/appcontrol" element={<IDSSettings />} />
          <Route path="/interfaces" element={<Interfaces />} />
          <Route path="/routing" element={<Routing />} />
          <Route path="/dns" element={<Interfaces />} />
          <Route path="/sdwan" element={<Routing />} />
          <Route path="/topology" element={<PacketFlow />} />
          <Route path="/connectors" element={<Interfaces />} />
          <Route path="/ai-security" element={<AISecurity />} />
          <Route path="/insights/behavioral" element={<AISecurity />} />
          <Route path="/insights/recommendations" element={<AISecurity />} />
          <Route path="/insights/trends" element={<AISecurity />} />
          <Route path="/dhcp" element={<DHCP />} />
          <Route path="/vpn/ipsec" element={<VPN />} />
          <Route path="/vpn/ssl" element={<VPN />} />
          <Route path="/vpn/openvpn" element={<VPN />} />
          <Route path="/vpn/wireguard" element={<VPN />} />
          <Route path="/users/groups" element={<UserManagement />} />
          <Route path="/users/ldap" element={<UserManagement />} />
          <Route path="/monitoring/logs" element={<SystemLogs />} />
          <Route path="/monitoring/traffic" element={<TrafficAnalysis />} />
          <Route path="/monitor/ipsec" element={<VPN />} />
          <Route path="/monitor/routing" element={<Routing />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/system/general" element={<SystemSettings />} />
          <Route path="/system/backup" element={<ConfigBackup />} />
          <Route path="/system/users" element={<UserManagement />} />
          <Route path="/system/admins" element={<UserManagement />} />
          <Route path="/system/firmware" element={<SystemSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
