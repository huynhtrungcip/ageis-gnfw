import { cn } from '@/lib/utils';

interface AegisLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function AegisLogo({ size = 'md', showText = true, className }: AegisLogoProps) {
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
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div className="flex flex-col leading-none">
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
    </div>
  );
}
