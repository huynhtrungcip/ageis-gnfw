import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  Settings, 
  Key,
  HelpCircle,
  AlertTriangle,
  Terminal,
  Maximize2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function Header() {
  const location = useLocation();
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'critical', message: 'High CPU usage detected', time: '2m ago' },
    { id: 2, type: 'high', message: 'New firmware available', time: '1h ago' },
  ]);

  const handleLogout = () => {
    toast.success('Logged out successfully');
  };

  const handleDismissAlert = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <header className="h-9 flex items-center justify-between px-3" style={{ background: 'linear-gradient(180deg, #2d3e50 0%, #1e2d3d 100%)' }}>
      {/* Left: Device Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#4caf50] rounded flex items-center justify-center">
            <span className="text-[10px] text-white font-bold">FG</span>
          </div>
          <span className="text-white text-xs font-semibold">FortiGate 100E</span>
        </div>
        <span className="text-[10px] text-gray-400 px-2 py-0.5 bg-white/10 rounded">FG100E-DATECH</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* CLI Console */}
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="CLI Console">
          <Terminal size={14} />
        </button>

        {/* Fullscreen */}
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Fullscreen">
          <Maximize2 size={14} />
        </button>

        {/* Help */}
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Help">
          <HelpCircle size={14} />
        </button>

        {/* Alerts */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
              <Bell size={14} />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 border-b border-[#ddd] bg-[#f5f5f5]">
              <span className="text-xs font-semibold text-[#333]">Alert Messages</span>
            </div>
            {alerts.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-500">
                No alerts
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="px-3 py-2 hover:bg-[#fafafa] border-b border-[#eee] last:border-b-0 flex items-start justify-between"
                  >
                    <div className="flex items-start gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full mt-1",
                        alert.type === 'critical' ? "bg-red-500" : "bg-orange-500"
                      )} />
                      <div>
                        <div className="text-[11px] text-[#333]">{alert.message}</div>
                        <div className="text-[10px] text-gray-400">{alert.time}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDismissAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-gray-600 mx-1" />

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/10 rounded transition-colors">
              <div className="w-5 h-5 rounded-full bg-[#4caf50] flex items-center justify-center">
                <User size={10} className="text-white" />
              </div>
              <span className="text-[11px] text-white">admin</span>
              <ChevronDown size={10} className="text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link to="/system/admins" className="flex items-center gap-2 cursor-pointer text-[11px]">
                <User size={12} />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-[11px]">
              <Key size={12} />
              <span>Change Password</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-[11px] text-red-600 focus:text-red-600"
            >
              <LogOut size={12} />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
