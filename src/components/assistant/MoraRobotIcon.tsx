import { cn } from '@/lib/utils';

interface MoraRobotIconProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const sizes = {
  sm: 20,
  md: 24,
  lg: 28,
};

export function MoraRobotIcon({ size = 'md', animate = true, className }: MoraRobotIconProps) {
  const s = sizes[size];

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(animate && 'animate-mora-float', className)}
    >
      {/* Antenna */}
      <line x1="20" y1="2" x2="20" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="2" r="2" fill="currentColor" className={cn(animate && 'animate-mora-glow')} />

      {/* Head circle */}
      <circle cx="20" cy="23" r="15" fill="currentColor" opacity="0.15" />
      <circle cx="20" cy="23" r="15" stroke="currentColor" strokeWidth="2" fill="none" />

      {/* Left eye */}
      <ellipse
        cx="13"
        cy="21"
        rx="3"
        ry="3.5"
        fill="currentColor"
        className={cn(animate && 'animate-mora-blink')}
        style={{ transformOrigin: '13px 21px' }}
      />

      {/* Right eye */}
      <ellipse
        cx="27"
        cy="21"
        rx="3"
        ry="3.5"
        fill="currentColor"
        className={cn(animate && 'animate-mora-blink')}
        style={{ transformOrigin: '27px 21px' }}
      />

      {/* Smile */}
      <path
        d="M14 28 Q20 33 26 28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
