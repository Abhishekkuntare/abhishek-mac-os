import React from 'react';
import logoMark from '../../assets/arlo-logo-mark.png';
import logoWordmark from '../../assets/arlo-wordmark.png';

interface ArloLogoProps {
  variant?: 'mark' | 'wordmark';
  className?: string;
}

export const ArloLogo: React.FC<ArloLogoProps> = ({
  variant = 'mark',
  className = '',
}) => (
  <img
    src={variant === 'wordmark' ? logoWordmark : logoMark}
    alt="ARLO OS"
    className={className}
    draggable={false}
  />
);
