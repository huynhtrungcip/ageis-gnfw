import { cn } from '@/lib/utils';

interface AegisLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function AegisLogo({ size = 'md', showText = true, className }: AegisLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Modern Shield Logo */}
      <div className={cn("relative", sizeClasses[size])}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Outer Shield Shape */}
          <path
            d="M24 2L6 10V22C6 34.36 13.68 45.64 24 48C34.32 45.64 42 34.36 42 22V10L24 2Z"
            fill="url(#shieldGradient)"
            filter="url(#glow)"
          />

          {/* Inner Shield */}
          <path
            d="M24 6L10 12.5V22.5C10 32.5 16.2 41.5 24 44C31.8 41.5 38 32.5 38 22.5V12.5L24 6Z"
            fill="url(#innerGradient)"
          />

          {/* Center A Letter - Stylized */}
          <path
            d="M24 14L17 32H20.5L21.8 28H26.2L27.5 32H31L24 14ZM22.6 25L24 20.5L25.4 25H22.6Z"
            fill="url(#shieldGradient)"
          />

          {/* Decorative Lines */}
          <path
            d="M14 20H18"
            stroke="#4ade80"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M30 20H34"
            stroke="#4ade80"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M14 26H16"
            stroke="#4ade80"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
          <path
            d="M32 26H34"
            stroke="#4ade80"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Status Dot */}
          <circle
            cx="24"
            cy="38"
            r="2"
            fill="#4ade80"
            className="animate-pulse"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold leading-tight tracking-tight text-white",
            textClasses[size]
          )}>
            Aegis
            <span className="text-emerald-400 ml-0.5">NGFW</span>
          </span>
          {size !== 'sm' && (
            <span className="text-[9px] text-gray-500 font-mono tracking-wider">
              NEXT-GEN FIREWALL
            </span>
          )}
        </div>
      )}
    </div>
  );
}
