import {
  getEmberAnimationPath,
  getEmberIdlePath,
  getMintAnimationPath,
  getMintIdlePath,
  getMochaAnimationPath,
  getMochaIdlePath,
  getPetalAnimationPath,
  getPetalIdlePath,
  getRubyAnimationPath,
  getRubyIdlePath,
  getScoutAnimationPath,
  getScoutIdlePath,
  getSunnyAnimationPath,
  getSunnyIdlePath,
  getVioletAnimationPath,
  getVioletIdlePath,
  type DetectiveId,
  type DetectiveShape,
  type EmberColor,
  type MintColor,
  type MochaColor,
  type PetalColor,
  type RubyColor,
  type ScoutColor,
  type SunnyColor,
  type VioletColor,
} from './detectiveModel';

interface DetectiveAvatarProps {
  shape: DetectiveShape;
  color: string;
  className?: string;
  animated?: boolean;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  detectiveId?: DetectiveId;
  scoutColor?: ScoutColor;
  emberColor?: EmberColor;
  mintColor?: MintColor;
  rubyColor?: RubyColor;
  petalColor?: PetalColor;
  violetColor?: VioletColor;
  sunnyColor?: SunnyColor;
  mochaColor?: MochaColor;
}

const SHAPES: Record<DetectiveShape, string> = {
  circle: 'M50 5a45 45 0 1 0 0 90 45 45 0 0 0 0-90Z',
  square: 'M30 7h40a23 23 0 0 1 23 23v40a23 23 0 0 1-23 23H30A23 23 0 0 1 7 70V30A23 23 0 0 1 30 7Z',
  pill: 'M31 17h38a33 33 0 0 1 0 66H31a33 33 0 0 1 0-66Z',
  triangle: 'M42 10a10 10 0 0 1 17 0l37 64a10 10 0 0 1-9 15H13a10 10 0 0 1-9-15Z',
  gem: 'M50 4 88 24l4 44-42 28L8 68l4-44Z',
  cloud: 'M25 78a19 19 0 1 1 8-36 21 21 0 0 1 40-4 20 20 0 1 1 5 40Z',
  drop: 'M50 5C39 23 16 46 16 66a34 34 0 1 0 68 0C84 46 61 23 50 5Z',
};

export const DetectiveAvatar = ({
  shape,
  color,
  className = '',
  animated = false,
  loading = 'lazy',
  fetchPriority = 'low',
  detectiveId,
  scoutColor = 'blue',
  emberColor = 'orange',
  mintColor = 'green',
  rubyColor = 'red',
  petalColor = 'pink',
  violetColor = 'purple',
  sunnyColor = 'yellow',
  mochaColor = 'orange',
}: DetectiveAvatarProps) => (
  detectiveId === 'scout' || detectiveId === 'ember' || detectiveId === 'mint' || detectiveId === 'ruby' || detectiveId === 'petal' || detectiveId === 'violet' || detectiveId === 'sunny' || detectiveId === 'mocha' ? (
    <img
      src={detectiveId === 'scout'
        ? animated ? getScoutAnimationPath(scoutColor) : getScoutIdlePath(scoutColor)
        : detectiveId === 'ember'
          ? animated ? getEmberAnimationPath(emberColor) : getEmberIdlePath(emberColor)
          : detectiveId === 'mint'
            ? animated ? getMintAnimationPath(mintColor) : getMintIdlePath(mintColor)
            : detectiveId === 'ruby'
              ? animated ? getRubyAnimationPath(rubyColor) : getRubyIdlePath(rubyColor)
              : detectiveId === 'petal'
                ? animated ? getPetalAnimationPath(petalColor) : getPetalIdlePath(petalColor)
                : detectiveId === 'violet'
                  ? animated ? getVioletAnimationPath(violetColor) : getVioletIdlePath(violetColor)
                  : detectiveId === 'sunny'
                    ? animated ? getSunnyAnimationPath(sunnyColor) : getSunnyIdlePath(sunnyColor)
                    : animated ? getMochaAnimationPath(mochaColor) : getMochaIdlePath(mochaColor)}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      className={`detective-scout-image ${className}`}
    />
  ) : (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={className}
      style={{ color }}
    >
      <path d={SHAPES[shape]} fill="currentColor" />
      <g fill="#14202a">
        <rect x="35" y="33" width="8" height="20" rx="4" transform="rotate(-28 39 43)" />
        <rect x="57" y="30" width="8" height="20" rx="4" transform="rotate(-28 61 40)" />
      </g>
    </svg>
  )
);
