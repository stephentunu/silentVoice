import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(185 85% 55%)" />
            <stop offset="100%" stopColor="hsl(160 70% 50%)" />
          </linearGradient>
          <linearGradient id="logoGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(270 60% 60%)" />
            <stop offset="100%" stopColor="hsl(185 85% 55%)" />
          </linearGradient>
          <linearGradient id="logoGradient3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(185 85% 55%)" />
            <stop offset="50%" stopColor="hsl(270 60% 60%)" />
            <stop offset="100%" stopColor="hsl(160 70% 50%)" />
          </linearGradient>
        </defs>
        
        {/* Background circle with glow effect */}
        <circle cx="24" cy="24" r="22" fill="url(#logoGradient3)" opacity="0.15" />
        
        {/* Main speech bubble - larger */}
        <path
          d="M12 10C12 8.89543 12.8954 8 14 8H34C35.1046 8 36 8.89543 36 10V24C36 25.1046 35.1046 26 34 26H20L14 32V26H14C12.8954 26 12 25.1046 12 24V10Z"
          fill="url(#logoGradient1)"
        />
        
        {/* Secondary speech bubble - smaller, overlapping */}
        <path
          d="M20 18C20 16.8954 20.8954 16 22 16H38C39.1046 16 40 16.8954 40 18V30C40 31.1046 39.1046 32 38 32H36V38L30 32H22C20.8954 32 20 31.1046 20 30V18Z"
          fill="url(#logoGradient2)"
          opacity="0.9"
        />
        
        {/* Dots representing anonymous users */}
        <circle cx="19" cy="16" r="2" fill="white" opacity="0.9" />
        <circle cx="25" cy="16" r="2" fill="white" opacity="0.9" />
        <circle cx="31" cy="16" r="2" fill="white" opacity="0.9" />
        
        {/* Question mark in secondary bubble */}
        <text
          x="30"
          y="27"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          ?
        </text>
      </svg>
      
      {showText && (
        <span className={cn('font-bold', text)}>
          <span className="text-foreground">Silent</span>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Voice</span>
        </span>
      )}
    </div>
  );
}
