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
import DNSServer from "./pages/DNSServer";
import VPN from "./pages/VPN";
import SystemLogs from "./pages/SystemLogs";
import SystemMonitoring from "./pages/SystemMonitoring";
import Schedules from "./pages/Schedules";
import ConfigBackup from "./pages/ConfigBackup";
import IDSSettings from "./pages/IDSSettings";
import SecurityProfiles from "./pages/SecurityProfiles";
import SSLInspection from "./pages/SSLInspection";
import SDWAN from "./pages/SDWAN";
import Routing from "./pages/Routing";
import Reports from "./pages/Reports";
import SystemSettings from "./pages/SystemSettings";
import TrafficAnalysis from "./pages/TrafficAnalysis";
import UserManagement from "./pages/UserManagement";
import PacketFlow from "./pages/PacketFlow";
import FeatureVisibility from "./pages/FeatureVisibility";
import ApplicationControl from "./pages/ApplicationControl";
import HighAvailability from "./pages/HighAvailability";
import CertificateManagement from "./pages/CertificateManagement";
import LogReport from "./pages/LogReport";
import WiFiController from "./pages/WiFiController";
import FirmwareManagement from "./pages/FirmwareManagement";
import AdminProfiles from "./pages/AdminProfiles";
import NetworkTopology from "./pages/NetworkTopology";
import VirtualIPs from "./pages/VirtualIPs";
import IPPools from "./pages/IPPools";
import TrafficShapers from "./pages/TrafficShapers";
import TrafficShapingPolicy from "./pages/TrafficShapingPolicy";
import WildcardFQDN from "./pages/WildcardFQDN";
import InternetServiceDatabase from "./pages/InternetServiceDatabase";
import Services from "./pages/Services";
import DNSFilter from "./pages/DNSFilter";
import FabricConnectors from "./pages/FabricConnectors";
import LDAPServers from "./pages/LDAPServers";
import SSLVPNConfig from "./pages/SSLVPNConfig";
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
          <Route path="/firewall/wildcard-fqdn" element={<WildcardFQDN />} />
          <Route path="/firewall/internet-service" element={<InternetServiceDatabase />} />
          <Route path="/firewall/nat" element={<NATConfig />} />
          <Route path="/firewall/virtual-ips" element={<VirtualIPs />} />
          <Route path="/firewall/ip-pools" element={<IPPools />} />
          <Route path="/firewall/traffic-shapers" element={<TrafficShapers />} />
          <Route path="/firewall/traffic-shaping-policy" element={<TrafficShapingPolicy />} />
          <Route path="/firewall/schedules" element={<Schedules />} />
          <Route path="/firewall/services" element={<Services />} />
          <Route path="/security/ids" element={<IDSSettings />} />
          <Route path="/security/antivirus" element={<SecurityProfiles />} />
          <Route path="/security/webfilter" element={<SecurityProfiles />} />
          <Route path="/security/dnsfilter" element={<DNSFilter />} />
          <Route path="/security/appcontrol" element={<ApplicationControl />} />
          <Route path="/security/ssl" element={<SSLInspection />} />
          <Route path="/security/ssl" element={<SSLInspection />} />
          <Route path="/sdwan" element={<SDWAN />} />
          <Route path="/interfaces" element={<Interfaces />} />
          <Route path="/routing" element={<Routing />} />
          <Route path="/dns" element={<DNSServer />} />
          <Route path="/topology" element={<NetworkTopology />} />
          <Route path="/packet-flow" element={<PacketFlow />} />
          <Route path="/connectors" element={<FabricConnectors />} />
          <Route path="/ai-security" element={<AISecurity />} />
          <Route path="/insights/behavioral" element={<AISecurity />} />
          <Route path="/insights/recommendations" element={<AISecurity />} />
          <Route path="/insights/trends" element={<AISecurity />} />
          <Route path="/dhcp" element={<DHCP />} />
          <Route path="/vpn/ipsec" element={<VPN />} />
          <Route path="/vpn/ssl" element={<SSLVPNConfig />} />
          <Route path="/vpn/openvpn" element={<VPN />} />
          <Route path="/vpn/wireguard" element={<VPN />} />
          <Route path="/users/groups" element={<UserManagement />} />
          <Route path="/users/ldap" element={<LDAPServers />} />
          <Route path="/monitoring/logs" element={<SystemLogs />} />
          <Route path="/monitoring/traffic" element={<TrafficAnalysis />} />
          <Route path="/monitor/ipsec" element={<VPN />} />
          <Route path="/monitor/routing" element={<Routing />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/logs" element={<LogReport />} />
          <Route path="/system/general" element={<SystemSettings />} />
          <Route path="/system/backup" element={<ConfigBackup />} />
          <Route path="/system/users" element={<UserManagement />} />
          <Route path="/system/admins" element={<AdminProfiles />} />
          <Route path="/system/admin-profiles" element={<AdminProfiles />} />
          <Route path="/system/firmware" element={<FirmwareManagement />} />
          <Route path="/system/feature-visibility" element={<FeatureVisibility />} />
          <Route path="/system/ha" element={<HighAvailability />} />
          <Route path="/system/certificates" element={<CertificateManagement />} />
          <Route path="/wifi" element={<WiFiController />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
