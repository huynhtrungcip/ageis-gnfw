import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
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
import SystemBackup from "./pages/SystemBackup";
import IDSSettings from "./pages/IDSSettings";
import SecurityProfiles from "./pages/SecurityProfiles";
import SSLInspection from "./pages/SSLInspection";
import SDWAN from "./pages/SDWAN";
import Routing from "./pages/Routing";
import StaticRoutes from "./pages/StaticRoutes";
import PolicyRoutes from "./pages/PolicyRoutes";
import RIPConfig from "./pages/RIPConfig";
import OSPFConfig from "./pages/OSPFConfig";
import BGPConfig from "./pages/BGPConfig";
import MulticastConfig from "./pages/MulticastConfig";
import PacketCapture from "./pages/PacketCapture";
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

// Helper to wrap pages with ProtectedRoute
const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected */}
            <Route path="/" element={<P><Index /></P>} />

            {/* Base section routes */}
            <Route path="/firewall" element={<Navigate to="/firewall/rules" replace />} />
            <Route path="/security" element={<Navigate to="/security/ids" replace />} />
            <Route path="/vpn" element={<Navigate to="/vpn/ipsec" replace />} />
            <Route path="/users" element={<Navigate to="/users/groups" replace />} />
            <Route path="/monitoring" element={<Navigate to="/monitoring/traffic" replace />} />
            <Route path="/system" element={<Navigate to="/system/general" replace />} />
            <Route path="/insights" element={<Navigate to="/ai-security" replace />} />

            <Route path="/threats" element={<P><ThreatMonitor /></P>} />
            <Route path="/threats/:id" element={<P><ThreatDetail /></P>} />
            <Route path="/incidents" element={<P><Incidents /></P>} />
            <Route path="/firewall/rules" element={<P><FirewallRules /></P>} />
            <Route path="/firewall/aliases" element={<P><Aliases /></P>} />
            <Route path="/firewall/wildcard-fqdn" element={<P><WildcardFQDN /></P>} />
            <Route path="/firewall/internet-service" element={<P><InternetServiceDatabase /></P>} />
            <Route path="/firewall/nat" element={<P><NATConfig /></P>} />
            <Route path="/firewall/virtual-ips" element={<P><VirtualIPs /></P>} />
            <Route path="/firewall/ip-pools" element={<P><IPPools /></P>} />
            <Route path="/firewall/traffic-shapers" element={<P><TrafficShapers /></P>} />
            <Route path="/firewall/traffic-shaping-policy" element={<P><TrafficShapingPolicy /></P>} />
            <Route path="/firewall/schedules" element={<P><Schedules /></P>} />
            <Route path="/firewall/services" element={<P><Services /></P>} />
            <Route path="/security/ids" element={<P><IDSSettings /></P>} />
            <Route path="/security/antivirus" element={<P><SecurityProfiles /></P>} />
            <Route path="/security/webfilter" element={<P><SecurityProfiles /></P>} />
            <Route path="/security/dnsfilter" element={<P><DNSFilter /></P>} />
            <Route path="/security/appcontrol" element={<P><ApplicationControl /></P>} />
            <Route path="/security/ssl" element={<P><SSLInspection /></P>} />
            <Route path="/sdwan" element={<P><SDWAN /></P>} />
            <Route path="/interfaces" element={<P><Interfaces /></P>} />
            <Route path="/routing" element={<P><Routing /></P>} />
            <Route path="/routing/static" element={<P><StaticRoutes /></P>} />
            <Route path="/routing/policy" element={<P><PolicyRoutes /></P>} />
            <Route path="/routing/rip" element={<P><RIPConfig /></P>} />
            <Route path="/routing/ospf" element={<P><OSPFConfig /></P>} />
            <Route path="/routing/bgp" element={<P><BGPConfig /></P>} />
            <Route path="/routing/multicast" element={<P><MulticastConfig /></P>} />
            <Route path="/packet-capture" element={<P><PacketCapture /></P>} />
            <Route path="/dns" element={<P><DNSServer /></P>} />
            <Route path="/topology" element={<P><NetworkTopology /></P>} />
            <Route path="/packet-flow" element={<P><PacketFlow /></P>} />
            <Route path="/connectors" element={<P><FabricConnectors /></P>} />
            <Route path="/ai-security" element={<P><AISecurity /></P>} />
            <Route path="/insights/behavioral" element={<P><AISecurity /></P>} />
            <Route path="/insights/recommendations" element={<P><AISecurity /></P>} />
            <Route path="/insights/trends" element={<P><AISecurity /></P>} />
            <Route path="/dhcp" element={<P><DHCP /></P>} />
            <Route path="/vpn/ipsec" element={<P><VPN /></P>} />
            <Route path="/vpn/ssl" element={<P><SSLVPNConfig /></P>} />
            <Route path="/vpn/openvpn" element={<P><VPN /></P>} />
            <Route path="/vpn/wireguard" element={<P><VPN /></P>} />
            <Route path="/users/groups" element={<P><UserManagement /></P>} />
            <Route path="/users/ldap" element={<P><LDAPServers /></P>} />
            <Route path="/monitoring/logs" element={<P><SystemLogs /></P>} />
            <Route path="/monitoring/traffic" element={<P><TrafficAnalysis /></P>} />
            <Route path="/monitor/ipsec" element={<P><VPN /></P>} />
            <Route path="/monitor/routing" element={<P><Routing /></P>} />
            <Route path="/reports" element={<P><Reports /></P>} />
            <Route path="/logs" element={<P><LogReport /></P>} />
            <Route path="/system/general" element={<P><SystemSettings /></P>} />
            <Route path="/system/backup" element={<P><ConfigBackup /></P>} />
            <Route path="/system/full-backup" element={<P><SystemBackup /></P>} />
            <Route path="/system/users" element={<P><UserManagement /></P>} />
            <Route path="/system/admins" element={<P><AdminProfiles /></P>} />
            <Route path="/system/admin-profiles" element={<P><AdminProfiles /></P>} />
            <Route path="/system/firmware" element={<P><FirmwareManagement /></P>} />
            <Route path="/system/feature-visibility" element={<P><FeatureVisibility /></P>} />
            <Route path="/system/ha" element={<P><HighAvailability /></P>} />
            <Route path="/system/certificates" element={<P><CertificateManagement /></P>} />
            <Route path="/wifi" element={<P><WiFiController /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
