import { cn } from '@/lib/utils';

interface AegisLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showVersion?: boolean;
  className?: string;
}

export function AegisLogo({ size = 'md', showText = true, showVersion = false, className }: AegisLogoProps) {
  const textSize = {
    sm: 'text-[13px]',
    md: 'text-[15px]',
    lg: 'text-xl'
  };

  const subSize = {
    sm: 'text-[7px]',
    md: 'text-[8px]',
    lg: 'text-[10px]'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex flex-col leading-none select-none">
        <span className={cn(
          "font-extrabold tracking-[0.12em] text-white",
          textSize[size]
        )}>
          AEGIS
        </span>
        {showText && (
          <span className={cn(
            "font-semibold tracking-[0.25em] text-emerald-400 mt-px",
            subSize[size]
          )}>
            NGFW
          </span>
        )}
      </div>

      {showVersion && (
        <span className="text-[9px] text-emerald-400/80 px-1.5 py-0.5 bg-emerald-500/15 rounded border border-emerald-500/25 font-medium ml-auto">
          v1.0
        </span>
      )}
    </div>
  );
}
