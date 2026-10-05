import type { CSSProperties } from 'react';

export type DesktopIconShape = 'square' | 'rounded' | 'circle' | 'diamond' | 'hexagon';

export const DESKTOP_ICON_SHAPE_KEY = 'abhishek_os_desktop_icon_shape_v1';
export const DESKTOP_ICON_SHAPE_EVENT = 'desktop:icon-shape-changed';

export const getDesktopIconShapeStyle = (shape: DesktopIconShape): CSSProperties => {
  let clipPath: string;
  let borderRadius: string | undefined;

  switch (shape) {
    case 'rounded':
      clipPath = 'inset(0 round 30%)';
      borderRadius = '30%';
      break;
    case 'circle':
      clipPath = 'circle(46% at 50% 50%)';
      borderRadius = '50%';
      break;
    case 'diamond':
      clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      break;
    case 'hexagon':
      clipPath = 'polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)';
      break;
    default:
      clipPath = 'inset(0 round 30%)';
      borderRadius = '30%';
  }

  return { clipPath, WebkitClipPath: clipPath, borderRadius };
};

export const isDesktopIconShape = (value: unknown): value is DesktopIconShape =>
  value === 'square' ||
  value === 'rounded' ||
  value === 'circle' ||
  value === 'diamond' ||
  value === 'hexagon';
