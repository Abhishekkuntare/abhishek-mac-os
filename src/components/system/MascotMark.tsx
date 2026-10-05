import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useOS } from '../../context/OSContext';

export const MASCOT_FAMILY_NAMES = [
  'Blue Original',
  'Sketch Nose',
  'Scribble Buddy',
  'Little Ghost',
  'Retro Robot',
  'Sleepy Eyes',
  'Wild Hair',
  'Block Head',
  'Curious Bug',
  'Portrait',
  'Doodle Hair',
  'Star Sprite',
  'Bunny Pal',
  'Fox Scout',
  'Cloud Puff',
  'Cactus Buddy',
  'Moon Cat',
  'Tiny Dragon',
  'Ocean Friend',
  'Forest Owl',
  'Pixel Pal',
  'Little Dino',
  'Sunshine',
] as const;

export const MASCOT_VARIATIONS = [
  'Happy',
  'Excited',
  'Calm',
  'Surprised',
  'Angry',
  'Sad',
  'Sleepy',
  'Silly',
  'Confident',
  'Curious',
] as const;

export const MASCOT_STYLE_COUNT =
  MASCOT_FAMILY_NAMES.length * MASCOT_VARIATIONS.length;

interface MascotMarkProps {
  className?: string;
  interactive?: boolean;
  styleId?: number;
  color?: string;
  showTileBackground?: boolean;
  hairStyle?: 'soft' | 'spiky' | 'curly' | 'none';
  accessory?: 'none' | 'glasses' | 'headphones' | 'crown';
}

const clampStyleId = (styleId: number) =>
  Number.isInteger(styleId)
    ? Math.max(0, Math.min(MASCOT_STYLE_COUNT - 1, styleId))
    : 0;

export const MascotMark: React.FC<MascotMarkProps> = ({
  className = '',
  interactive = true,
  styleId,
  color,
  showTileBackground = true,
  hairStyle,
  accessory = 'none',
}) => {
  const { settings } = useOS();
  const mascotRef = useRef<SVGSVGElement | null>(null);
  const rawGazeX = useMotionValue(0);
  const rawGazeY = useMotionValue(0);
  const gazeXSpring = useSpring(rawGazeX, { stiffness: 420, damping: 28, mass: 0.35 });
  const gazeYSpring = useSpring(rawGazeY, { stiffness: 420, damping: 28, mass: 0.35 });
  const [isHovered, setIsHovered] = useState(false);
  const [isSurprised, setIsSurprised] = useState(false);
  const surpriseTimerRef = useRef<number | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const gazeX = shouldReduceMotion ? rawGazeX : gazeXSpring;
  const gazeY = shouldReduceMotion ? rawGazeY : gazeYSpring;
  const id = useId().replace(/:/g, '');
  const activeStyleId = clampStyleId(styleId ?? settings.mascotStyle);
  const familyIndex = Math.floor(activeStyleId / MASCOT_VARIATIONS.length);
  const variationIndex = activeStyleId % MASCOT_VARIATIONS.length;
  const mood = MASCOT_VARIATIONS[variationIndex].toLowerCase();
  const faceColor = color ?? settings.mascotColor;
  const isSurprisedExpression = isSurprised || mood === 'surprised';
  const expression = isSurprisedExpression
    ? 'mascot-is-surprised'
    : isHovered
      ? 'mascot-is-hovered'
      : '';

  useEffect(() => {
    if (!interactive) return;

    const followPointer = (event: PointerEvent) => {
      pointerPositionRef.current = { x: event.clientX, y: event.clientY };
      if (pointerFrameRef.current !== null) return;

      pointerFrameRef.current = window.requestAnimationFrame(() => {
        pointerFrameRef.current = null;
        const pointer = pointerPositionRef.current;
        const bounds = mascotRef.current?.getBoundingClientRect();
        if (!pointer || !bounds) return;

        const horizontalPosition = Math.max(
          -1,
          Math.min(
            1,
            (pointer.x - (bounds.left + bounds.width / 2)) /
              Math.max(window.innerWidth * 0.38, bounds.width),
          ),
        );
        const verticalPosition = Math.max(
          -1,
          Math.min(
            1,
            (pointer.y - (bounds.top + bounds.height / 2)) /
              Math.max(window.innerHeight * 0.38, bounds.height),
          ),
        );

        rawGazeX.set(horizontalPosition * 2.6);
        rawGazeY.set(verticalPosition * (verticalPosition > 0 ? 9 : 5.5));
      });
    };

    window.addEventListener('pointermove', followPointer, { passive: true });
    return () => {
      window.removeEventListener('pointermove', followPointer);
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
      if (surpriseTimerRef.current !== null) {
        window.clearTimeout(surpriseTimerRef.current);
      }
    };
  }, [interactive, rawGazeX, rawGazeY]);

  const handlePointerDown = () => {
    if (!interactive) return;
    setIsSurprised(true);
    if (surpriseTimerRef.current !== null) {
      window.clearTimeout(surpriseTimerRef.current);
    }
    surpriseTimerRef.current = window.setTimeout(() => {
      setIsSurprised(false);
      surpriseTimerRef.current = null;
    }, 1100);
  };

  const renderEyes = () => {
    switch (variationIndex) {
      case 1:
        return <><circle cx="47" cy="49" r="6" fill="#153A5B" /><circle cx="81" cy="49" r="6" fill="#153A5B" /></>;
      case 2:
        return <><path d="m47 39 8 16H39l8-16Zm34 0 8 16H73l8-16Z" fill="#153A5B" /></>;
      case 3:
        return <><path d="M40 48q7-9 14 0" fill="none" stroke="#153A5B" strokeWidth="5" strokeLinecap="round" /><path d="M74 48q7-9 14 0" fill="none" stroke="#153A5B" strokeWidth="5" strokeLinecap="round" /></>;
      case 4:
        return <><path d="m39 40 17 5M73 45l17-5" stroke="#153A5B" strokeWidth="4" strokeLinecap="round" /><rect x="44" y="46" width="7" height="14" rx="3.5" fill="#153A5B" /><rect x="77" y="46" width="7" height="14" rx="3.5" fill="#153A5B" /></>;
      case 5:
        return <><path d="m47 37 2.8 7.2L57 47l-7.2 2.8L47 57l-2.8-7.2L37 47l7.2-2.8L47 37Zm34 0 2.8 7.2L91 47l-7.2 2.8L81 57l-2.8-7.2L71 47l7.2-2.8L81 37Z" fill="#153A5B" /></>;
      case 6:
        return <><rect x="41" y="40" width="12" height="19" rx="3" fill="#153A5B" /><rect x="75" y="40" width="12" height="19" rx="3" fill="#153A5B" /></>;
      case 7:
        return <><path d="M42 49q5-8 10 0v8q-5 7-10 0v-8Zm34 0q5-8 10 0v8q-5 7-10 0v-8Z" fill="#153A5B" /></>;
      case 8:
        return <><path d="M47 38c-12 5-3 20 0 20s12-15 0-20Zm34 0c-12 5-3 20 0 20s12-15 0-20Z" fill="#153A5B" /></>;
      case 9:
        return <><rect x="42" y="39" width="9" height="19" rx="4.5" fill="#153A5B" /><path d="M75 49q7-9 14 0" fill="none" stroke="#153A5B" strokeWidth="5" strokeLinecap="round" /></>;
      default:
        return <><rect x="43" y="39" width="8" height="19" rx="4" fill="#153A5B" /><rect x="77" y="39" width="8" height="19" rx="4" fill="#153A5B" /><path d="M45 42v4M79 42v4" stroke="#FFFFFF" strokeOpacity="0.48" strokeWidth="1.5" strokeLinecap="round" /></>;
    }
  };

  const renderReferenceArt = () => {
    const expression = mood === 'sleepy'
      ? 'flat'
      : mood === 'sad' || mood === 'angry'
        ? 'frown'
        : mood === 'silly'
          ? 'tongue'
          : mood === 'confident'
            ? 'smirk'
            : mood === 'surprised' || mood === 'curious'
              ? 'oh'
              : mood === 'excited'
                ? 'happy'
              : mood === 'calm'
                ? 'flat'
                : 'smile';

    return (
      <>
        {showTileBackground && (
          <rect
            width="128"
            height="128"
            rx="23"
            fill={`color-mix(in srgb, ${faceColor} ${familyIndex === 1 ? 36 : 22}%, #fffaf0)`}
          />
        )}
        {familyIndex === 1 && (
          <g fill="none" stroke="#17120f" strokeLinecap="round" strokeLinejoin="round">
            <path d="M53 37c-2-12-1-17 3-18 7 4 14 11 20 19" strokeWidth="5" />
            <path d="m61 48-13 48c7-8 11-8 15-1l1-8" strokeWidth="6" />
            <path d="M56 107h17" strokeWidth="3" />
          </g>
        )}
        {familyIndex === 2 && (
          <g fill="none" stroke={`color-mix(in srgb, ${faceColor} 48%, #db79c3)`} strokeWidth="3" strokeLinecap="round">
            <path d="M28 39c-20-18 30-24 65-13 30 9-24 19-61 15-39-4-9 22 59 10 49-9 49 10-7 16-70 8-65 24 11 17 55-5 43 13-20 13-57 0-53 17 9 16" />
            <path d="M38 52 25 99m66-47 13 47M48 101v17m34-17v17" stroke="#161116" />
            <path d="m47 26 8-7 9 8 9-8 8 8" stroke="#161116" />
          </g>
        )}
        {familyIndex === 3 && (
          <g stroke="#151515" strokeWidth="3" strokeLinejoin="round">
            <path d="M39 83V47c0-22 11-34 25-34s25 12 25 34v36l-7-4-8 5-10-5-9 5-8-5-8 5Z" fill={`color-mix(in srgb, ${faceColor} 38%, white)`} />
            <ellipse cx="64" cy="94" rx="23" ry="4" fill={`color-mix(in srgb, ${faceColor} 25%, #b94b5a)`} stroke="none" />
          </g>
        )}
        {familyIndex === 4 && (
          <g stroke="#101010" strokeWidth="4" strokeLinejoin="round">
            <path d="M60 11h9v10h-9zM29 34q0-8 9-8h52q9 0 9 8v43q0 9-9 9H38q-9 0-9-9Z" fill={`color-mix(in srgb, ${faceColor} 38%, #f7fffa)`} />
            <path d="M42 87v15h-9v8h19v-8h-2V87m30 0v15h-2v8h19v-8h-9V87" fill={`color-mix(in srgb, ${faceColor} 88%, #24c8b8)`} />
            <rect x="22" y="86" width="12" height="15" rx="2" fill="#111" />
            <rect x="94" y="86" width="12" height="15" rx="2" fill="#111" />
          </g>
        )}
        {familyIndex === 5 && (
          <g fill="none" stroke="#15110f" strokeWidth="5" strokeLinecap="round">
            <path d="M19 46q25-20 43 0-5 23-25 18-17-5-18-18Zm47 0q19-20 43 0-1 13-18 18-20 5-25-18Z" stroke={`color-mix(in srgb, ${faceColor} 70%, #15110f)`} />
            <path d="M54 95h20" />
          </g>
        )}
        {familyIndex === 6 && (
          <g stroke="#171313" strokeWidth="3" strokeLinejoin="round">
            <path d="M29 56c-17-5-13-20-2-21-13-13 4-22 15-14-5-17 13-23 22-9 9-14 26-8 22 7 18-8 26 9 13 19 17 3 12 19-3 21-5 29-22 43-44 43S33 87 29 56Z" fill="#201819" />
            <path d="M37 50q27-15 54 0v38q-12 15-27 15T37 88Z" fill={`color-mix(in srgb, ${faceColor} 48%, #ffe4cd)`} />
            <path d="M62 104v11" />
          </g>
        )}
        {familyIndex === 7 && (
          <g stroke="#292522" strokeWidth="3" strokeLinejoin="round">
            <path d="M31 33h66v61H31zM31 47c-17-10-25 1-21 10 3 8 10 8 21 3m66-13c17-10 25 1 21 10-3 8-10 8-21 3M50 94v11l-12 9h52l-12-9V94" fill={`color-mix(in srgb, ${faceColor} 82%, #ff895f)`} />
            <circle cx="51" cy="58" r="8" fill="#fff" />
            <circle cx="77" cy="58" r="8" fill="#fff" />
            <path d="M64 94v-5" />
          </g>
        )}
        {familyIndex === 8 && (
          <g stroke="#171717" strokeWidth="4" strokeLinejoin="round">
            <path d="M42 68q-13 7-8 25l4 11q2 6 9 3h35q7 3 9-3l4-11q5-18-8-25Z" fill={`color-mix(in srgb, ${faceColor} 72%, #a2b89b)`} />
            <ellipse cx="49" cy="48" rx="28" ry="25" fill="#fff" />
            <ellipse cx="83" cy="49" rx="20" ry="22" fill="#fff" />
            <path d="M52 107v8m19-8v8" strokeLinecap="round" />
          </g>
        )}
        {familyIndex === 9 && (
          <g stroke="#171313" strokeWidth="3" strokeLinejoin="round">
            <path d="M29 83c-16-26-3-61 19-69 28-12 60 3 61 37 1 22-7 49-22 57-21 12-46 0-58-25Z" fill={`color-mix(in srgb, ${faceColor} 42%, #fff0dc)`} />
            <path d="M31 66C14 35 30 9 59 9c29-1 50 20 50 51-8-5-12-14-15-24-16 14-38 18-61 18l-1 36c-10-4-16-12-17-24Z" fill="#211b1b" />
            <path d="M33 60q17-12 30 0m8-2q13-12 25-1" fill="none" />
            <path d="M63 84q5 5 10 0" fill="none" strokeLinecap="round" />
          </g>
        )}
        {familyIndex === 10 && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M34 51c-22-21 31-25 54-15 27 11-17 18-46 15-34-4-19 20 29 11 49-9 39 11-11 16-49 5-54 18 8 15 40-2 32 14 4 16" stroke={`color-mix(in srgb, ${faceColor} 48%, #212121)`} strokeWidth="6" />
            <path d="M42 68v9m43-9v9m-31 11h20" stroke="#151515" strokeWidth="3" />
          </g>
        )}
        {familyIndex >= 11 && (
          <g stroke="#182133" strokeWidth="3" strokeLinejoin="round">
            <path
              d={[
              'M30 48 40 22l17 12 7-18 9 18 18-12 10 26v34q0 25-32 25T30 82Z',
              'M36 48 31 15q-1-8 7-3l26 25 26-25q8-5 7 3l-5 33v35q0 26-28 26T36 83Z',
              'M30 48 32 18l27 17q6-2 12 0l27-17 2 30v34q0 27-35 27T30 82Z',
              'M22 64q-2-33 27-37 8-26 31-10 34-6 33 31 18 10 3 30-5 28-39 27-48 6-55-22-18-5 0-19Z',
              'M38 35q-7-20 5-23 16 3 17 22 21-24 31-10 5 13-8 24v43q-20 20-41 0Z',
              'M36 48q-17-14-7-25 12-11 30 8 8-4 16 0 18-19 29-8 9 12-9 25v36q-7 25-29 25T38 84Z',
              'M34 48q-17-20-6-26 15-7 30 17 7-2 14 0 14-23 28-16 12 9-6 27v34q-8 19-30 19T34 84Z',
              'M34 49q-17-20-6-26 15-7 30 17 7-2 14 0 14-23 28-16 12 9-6 27v35q-8 19-30 19T34 85Z',
              'M31 47q-8-28 3-30 10-2 19 15 11-7 22 0 9-17 19-15 11 2 3 30v38q-2 25-33 25T31 85Z',
              'M31 45q0-15 15-15h36q15 0 15 15v39q0 20-20 20H51Q31 104 31 84Z',
              'M31 48q-3-29 14-34l7 13q9-5 20 0l7-13q18 5 18 34v37q0 26-33 26T31 85Z',
              'M27 53q0-38 37-38t37 38v29q0 26-37 26T27 82Z',
              ][familyIndex - 11]}
              fill={`color-mix(in srgb, ${faceColor} ${familyIndex === 14 ? 38 : 52}%, ${['#fff2a8', '#fff0f6', '#ffe0aa', 'white', '#a8dc87', '#e6d6ff', '#9be8ef', '#9be8ef', '#d7c4a5', '#d1ebff', '#9ee2b5', '#ffe792'][familyIndex - 11]})`}
            />
            {familyIndex === 11 && <path d="m48 25 5 9m29-9-5 9" fill="none" stroke="#fff3b0" strokeWidth="5" />}
            {familyIndex === 12 && <path d="M37 19q11 4 15 22m39-22q-11 4-15 22" fill="none" stroke="#f1a0bc" strokeWidth="5" />}
            {familyIndex === 13 && <path d="M33 24 55 38m40-14L73 38" fill="none" stroke="#d97642" strokeWidth="5" />}
            {familyIndex === 15 && <path d="M32 37 22 32m74 5 10-5" fill="none" stroke="#51426f" strokeWidth="4" />}
            {familyIndex === 17 && <path d="M43 101q-7 11-16 4m57 0q9 8 16-3" fill="none" stroke="#42aeb8" strokeWidth="4" strokeLinecap="round" />}
            {familyIndex === 18 && <path d="M29 48h70" fill="none" stroke="#8f7656" strokeWidth="4" />}
            {familyIndex === 19 && <path d="M39 43h50v45H39Zm10 24 8 7-8 7m19 0h11" fill="none" stroke="#175a92" strokeWidth="4" strokeLinecap="round" />}
            {familyIndex === 20 && <path d="m31 48-12-6 7 25 8-5m63-14 12-6-7 25-8-5m-43 8h2m22 0h2" fill={`color-mix(in srgb, ${faceColor} 36%, #4c9e73)`} stroke="#296a55" strokeWidth="2" />}
            {familyIndex === 21 && <path d="m49 22 5 10m25-10-5 10m-33 25h4m36 0h4" fill="none" stroke="#557d43" strokeWidth="4" strokeLinecap="round" />}
            <motion.g
              className="mascot-pupils"
              style={interactive ? { x: gazeX, y: gazeY } : undefined}
            >
              <g className="mascot-blink">{renderEyes()}</g>
            </motion.g>
          </g>
        )}
        {[1, 2, 4, 6, 9, 10].includes(familyIndex) && (
          <motion.g
            className="mascot-pupils"
            style={interactive ? { x: gazeX, y: gazeY } : undefined}
          >
            <g className="mascot-blink" transform={familyIndex === 6 ? 'translate(0 12)' : undefined}>{renderEyes()}</g>
          </motion.g>
        )}
        {familyIndex === 3 && (
          <motion.g
            className="mascot-pupils"
            style={interactive ? { x: gazeX, y: gazeY } : undefined}
          >
            <g className="mascot-blink">
              <ellipse cx="51" cy="49" rx="8" ry="5" fill="#171717" />
              <ellipse cx="77" cy="49" rx="8" ry="5" fill="#171717" />
              <ellipse cx="64" cy="63" rx="3" ry="2" fill="#171717" />
            </g>
          </motion.g>
        )}
        {familyIndex === 5 && (
          <motion.g
            className="mascot-pupils"
            style={interactive ? { x: gazeX, y: gazeY } : undefined}
          >
            <g className="mascot-blink">
              <path d="M43 51q5-7 10 0v5q-5 5-10 0v-5Zm34 0q5-7 10 0v5q-5 5-10 0v-5Z" fill="#15110f" />
            </g>
          </motion.g>
        )}
        {familyIndex === 7 && (
          <motion.g
            className="mascot-pupils"
            style={interactive ? { x: gazeX, y: gazeY } : undefined}
          >
            <g className="mascot-blink">
                <circle cx="51" cy="58" r="3.5" fill="#171717" />
              <circle cx="77" cy="58" r="3.5" fill="#171717" />
            </g>
          </motion.g>
        )}
        {familyIndex === 8 && (
          <motion.g
            className="mascot-pupils"
            style={interactive ? { x: gazeX, y: gazeY } : undefined}
          >
            <g className="mascot-blink">
              <ellipse cx="48" cy="49" rx="7" ry="8" fill="#111" />
              <ellipse cx="82" cy="49" rx="6" ry="7" fill="#111" />
            </g>
          </motion.g>
        )}
        {familyIndex === 1 && <path d="m50 35 13 49" stroke="#17120f" strokeWidth="5" strokeLinecap="round" />}
        {familyIndex === 2 && <path d="m46 32 7-8 8 8 8-8 8 8" fill="none" stroke="#171313" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
        <g className={`mascot-mouth mascot-mouth-${expression}`}>
          {expression === 'oh' ? (
            <ellipse cx="64" cy="83" rx="8" ry="10" fill="#151515" />
          ) : expression === 'tongue' ? (
            <><path d="M48 78q16 16 32 0v8q-16 13-32 0Z" fill="#171313" /><path d="M59 89q5-7 10 0v5h-10Z" fill="#ff829d" /></>
          ) : expression === 'frown' ? (
            <path d="M49 88q15-18 30 0" fill="none" stroke="#171313" strokeWidth="4" strokeLinecap="round" />
          ) : expression === 'flat' ? (
            <path d="M54 84h20" fill="none" stroke="#171313" strokeWidth="4" strokeLinecap="round" />
          ) : expression === 'smirk' ? (
            <path d="M53 84q12 3 23-6" fill="none" stroke="#171313" strokeWidth="4" strokeLinecap="round" />
          ) : (
            <path d="M51 79q13 13 27-1" fill="none" stroke="#171313" strokeWidth="4" strokeLinecap="round" />
          )}
        </g>
      </>
    );
  };

  return (
    <svg
      ref={mascotRef}
      className={`mascot-mark ${expression} ${className}`}
      onPointerEnter={interactive ? () => setIsHovered(true) : undefined}
      onPointerLeave={interactive ? () => setIsHovered(false) : undefined}
      onPointerDown={interactive ? handlePointerDown : undefined}
      data-mood={mood}
      data-clicked={isSurprised ? 'true' : undefined}
      viewBox="0 0 128 128"
      role="img"
      aria-label={`ARLO OS ${mood} ${MASCOT_FAMILY_NAMES[familyIndex]} mascot`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-shell`} x1="18" y1="8" x2="108" y2="122" gradientUnits="userSpaceOnUse">
          <stop stopColor={`color-mix(in srgb, ${faceColor} 55%, white)`} />
          <stop offset="0.48" stopColor={faceColor} />
          <stop offset="1" stopColor={`color-mix(in srgb, ${faceColor} 62%, #071a55)`} />
        </linearGradient>
        <linearGradient id={`${id}-face`} x1="38" y1="22" x2="80" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor={`color-mix(in srgb, ${faceColor} 28%, white)`} />
          <stop offset="0.52" stopColor={`color-mix(in srgb, ${faceColor} 55%, white)`} />
          <stop offset="1" stopColor={`color-mix(in srgb, ${faceColor} 42%, #638bd0)`} />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="64" y1="5" x2="64" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {familyIndex === 0 ? (
        <>
          {showTileBackground ? (
            <>
              <rect x="6" y="5" width="116" height="116" rx="29" fill={`url(#${id}-shell)`} />
              <rect x="9" y="8" width="110" height="110" rx="26" fill="none" stroke="#FFFFFF" strokeOpacity="0.24" strokeWidth="2" />
              <rect x="17" y="16" width="94" height="94" rx="23" fill={`url(#${id}-face)`} />
              <path d="M20 37C20 25.954 28.954 17 40 17h48c11.046 0 20 8.954 20 20v14H20V37Z" fill={`url(#${id}-gloss)`} />
              <rect x="18" y="17" width="92" height="92" rx="22" fill="none" stroke="#E8F8FF" strokeOpacity="0.38" strokeWidth="2" />
            </>
          ) : (
            <path
              d="M64 10c-26 0-45 18-46 44-1 29 15 55 46 64 31-9 47-35 46-64-1-26-20-44-46-44Z"
              fill={`url(#${id}-face)`}
            />
          )}
          <motion.g
            className="mascot-pupils"
            style={interactive ? { x: gazeX, y: gazeY } : undefined}
          >
            <g className="mascot-blink">{renderEyes()}</g>
          </motion.g>
          <ellipse className="mascot-cheek mascot-cheek-left" cx="34" cy="72" rx="7" ry="3.5" fill="#FF8FA3" />
          <ellipse className="mascot-cheek mascot-cheek-right" cx="94" cy="72" rx="7" ry="3.5" fill="#FF8FA3" />
          <path className="mascot-mouth mascot-mouth-smile" d="M44 76c4.1 5.2 10.2 8 17.8 8 8.5 0 15.3-3.6 19.2-10" fill="none" stroke="#153A5B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path className="mascot-mouth mascot-mouth-happy" d="M42 73c4.4 11 12 17 22 17 9.2 0 17-5.5 22-16" fill="none" stroke="#153A5B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path className="mascot-mouth mascot-mouth-frown" d="M44 86c5-8 11-11 20-11 8 0 14 3 20 10" fill="none" stroke="#153A5B" strokeWidth="5" strokeLinecap="round" />
          <path className="mascot-mouth mascot-mouth-flat" d="M48 82h32" fill="none" stroke="#153A5B" strokeWidth="5" strokeLinecap="round" />
          <path className="mascot-mouth mascot-mouth-smirk" d="M48 82c12 1 20 0 31-8" fill="none" stroke="#153A5B" strokeWidth="5" strokeLinecap="round" />
          <g className="mascot-mouth mascot-mouth-oh"><ellipse cx="64" cy="81" rx="10" ry="13" fill="#153A5B" /><ellipse cx="64" cy="86" rx="4.5" ry="3" fill="#FF8FA3" /></g>
          <g className="mascot-mouth mascot-mouth-tongue"><path d="M43 76c4 6 11 9 21 9s17-3 21-9v8c0 10-8 16-21 16S43 94 43 84v-8Z" fill="#153A5B" /><path d="M58 96c0-6 2-9 6-9s6 3 6 9" fill="#FF8FA3" /></g>
          <path className="mascot-mouth mascot-mouth-zigzag" d="m46 80 9-5 8 9 9-9 10 5" fill="none" stroke="#153A5B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M47 98c5.1 2.1 10.7 3.2 16.8 3.2 7.5 0 14.2-1.7 20.2-4.8" fill="none" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <motion.g
          className="mascot-reference-art"
          animate={interactive ? { y: isHovered ? -1.5 : 0 } : { y: 0 }}
          transition={shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 360, damping: 26 }}
        >
          {renderReferenceArt()}
        </motion.g>
      )}
      {hairStyle && hairStyle !== 'none' && (
        hairStyle === 'curly' ? (
          <g fill="#302238" stroke="#171313" strokeWidth="2">
            <circle cx="45" cy="23" r="9" /><circle cx="59" cy="17" r="10" />
            <circle cx="74" cy="18" r="10" /><circle cx="86" cy="25" r="8" />
          </g>
        ) : (
          <path
            d={hairStyle === 'spiky'
              ? 'M37 32 35 15l16 11 9-18 8 18 19-12-5 19Z'
              : 'M37 32q4-18 26-19 22 0 29 19-15-8-27-8-13 0-28 8Z'}
            fill={hairStyle === 'soft' ? '#302238' : '#26232a'}
            stroke="#171313"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )
      )}
      {accessory === 'glasses' && (
        <g fill="none" stroke="#182133" strokeWidth="3">
          <rect x="34" y="42" width="25" height="19" rx="7" />
          <rect x="69" y="42" width="25" height="19" rx="7" />
          <path d="M59 50h10m-35-1-6-2m66 3 6-2" />
        </g>
      )}
      {accessory === 'headphones' && (
        <g fill="none" stroke="#272542" strokeWidth="6">
          <path d="M28 54V45a36 36 0 0 1 72 0v9" />
          <rect x="23" y="49" width="12" height="24" rx="6" fill="#7065a3" />
          <rect x="93" y="49" width="12" height="24" rx="6" fill="#7065a3" />
        </g>
      )}
      {accessory === 'crown' && (
        <path d="m40 27 4-15 16 12 5-17 7 17 16-12 3 15Z" fill="#ffd166" stroke="#a97621" strokeWidth="2.5" strokeLinejoin="round" />
      )}
    </svg>
  );
};
