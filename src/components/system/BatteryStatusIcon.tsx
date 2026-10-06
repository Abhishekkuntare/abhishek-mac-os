import React from 'react';
import { motion } from 'motion/react';
import { Plug, Zap } from 'lucide-react';
import type { BatteryIconStyle } from '../../types/desktop';

interface BatteryStatusIconProps {
  level: number;
  charging: boolean;
  plugged: boolean;
  style: BatteryIconStyle;
  className?: string;
}

const getBatteryColor = (level: number) => (
  level <= 15 ? '#fb7185' : level <= 35 ? '#fbbf24' : '#34d399'
);

export const BatteryStatusIcon: React.FC<BatteryStatusIconProps> = ({
  level,
  charging,
  plugged,
  style,
  className = 'h-4 w-4',
}) => {
  const boundedLevel = Math.max(0, Math.min(100, level));
  const fill = getBatteryColor(boundedLevel);

  if (style === 'circle') {
    const circumference = 2 * Math.PI * 8.5;
    return (
      <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-full w-full -rotate-90 overflow-visible">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeOpacity=".23" strokeWidth="2.5" />
          <motion.circle
            cx="12"
            cy="12"
            r="8.5"
            fill="none"
            stroke={fill}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - boundedLevel / 100) }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        </svg>
        {charging && <Zap className="absolute h-[9px] w-[9px] fill-emerald-300 text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,.7)]" />}
        {plugged && !charging && <Plug className="absolute -right-1 -top-1 h-2 w-2 text-sky-300" />}
      </span>
    );
  }

  const rounded = style === 'rounded';
  const strokeRadius = rounded ? 3 : style === 'square' ? 0 : 1.5;
  const width = 18;
  const height = 10;
  const innerWidth = 14;
  const innerHeight = 6;
  const fillWidth = innerWidth * boundedLevel / 100;
  const fillScale = Math.max(0.6, fillWidth) / innerWidth;

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 23 14" className="h-full w-full overflow-visible">
        <rect x="1" y="2" width={width} height={height} rx={strokeRadius} fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeOpacity=".72" strokeWidth="1.2" />
        <rect x="19.7" y="5" width="2.3" height="4" rx={rounded ? 1 : 0} fill="currentColor" fillOpacity=".75" />
        {boundedLevel > 0 && (
          <motion.rect
            x="3"
            y="4"
            width={innerWidth}
            height={innerHeight}
            rx={rounded ? 1.5 : 0}
            fill={fill}
            initial={false}
            animate={{ scaleX: fillScale }}
            style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
      </svg>
      {charging && <Zap className="absolute h-[9px] w-[9px] fill-emerald-200 text-emerald-200 drop-shadow-[0_0_4px_rgba(52,211,153,.75)] animate-pulse" />}
      {plugged && !charging && <Plug className="absolute -right-1 -top-1 h-2 w-2 text-sky-300" />}
    </span>
  );
};
