import { cn } from '@/lib/utils';

interface AegisLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showVersion?: boolean;
  className?: string;
}

export function AegisLogo({ size = 'md', showText = true, showVersion = false, className }: AegisLogoProps) {
  const iconSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  const subTextSize = {
    sm: 'text-[7px]',
    md: 'text-[8px]',
    lg: 'text-[10px]'
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Icon Mark */}
      <div className={cn(
        "relative rounded-lg flex items-center justify-center shrink-0 shadow-md",
        "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800",
        iconSize[size]
      )}>
        {/* Inner shield "A" */}
        <svg viewBox="0 0 32 32" fill="none" className="w-[65%] h-[65%]">
          <path
            d="M16 3L6 8v7c0 7.73 4.66 14.56 10 17 5.34-2.44 10-9.27 10-17V8L16 3z"
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
          />
          <text
            x="16"
            y="21"
            textAnchor="middle"
            fill="white"
            fontSize="13"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            A
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            "font-extrabold tracking-[0.08em] text-white",
            textSize[size]
          )}>
            AEGIS
          </span>
          <span className={cn(
            "font-semibold tracking-[0.2em] text-emerald-400 mt-px",
            subTextSize[size]
          )}>
            NGFW
          </span>
        </div>
      )}

      {showVersion && (
        <span className="text-[9px] text-emerald-400/80 px-1.5 py-0.5 bg-emerald-500/15 rounded border border-emerald-500/25 font-medium ml-auto">
          v1.0
        </span>
      )}
    </div>
  );
}
