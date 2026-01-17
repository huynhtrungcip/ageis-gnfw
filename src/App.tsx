import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ThreatMonitor from "./pages/ThreatMonitor";
import FirewallRules from "./pages/FirewallRules";
import NATConfig from "./pages/NATConfig";
import Interfaces from "./pages/Interfaces";
import AISecurity from "./pages/AISecurity";
import DHCP from "./pages/DHCP";
import VPN from "./pages/VPN";
import SystemMonitoring from "./pages/SystemMonitoring";
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
          <Route path="/firewall/rules" element={<FirewallRules />} />
          <Route path="/firewall/nat" element={<NATConfig />} />
          <Route path="/interfaces" element={<Interfaces />} />
          <Route path="/ai-security" element={<AISecurity />} />
          <Route path="/dhcp" element={<DHCP />} />
          <Route path="/vpn/ipsec" element={<VPN />} />
          <Route path="/vpn/openvpn" element={<VPN />} />
          <Route path="/vpn/wireguard" element={<VPN />} />
          <Route path="/monitoring/traffic" element={<SystemMonitoring />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
