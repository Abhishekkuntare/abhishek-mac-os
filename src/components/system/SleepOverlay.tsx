
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useOS } from '../../context/OSContext';

const PARTICLE_COUNT = 34;

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

export const SleepOverlay: React.FC = () => {
  const { isSleeping, wakeSystem } = useOS();

  const [time, setTime] = useState(new Date());
  const [isPointerMoving, setIsPointerMoving] = useState(false);

  /*
   * ---------------------------------------------------------
   * Clock
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!isSleeping) return;

    const timer = window.setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isSleeping]);

  /*
   * ---------------------------------------------------------
   * Wake system
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!isSleeping) return;

    const handleWake = () => {
      wakeSystem();
    };

    const handleKeyDown = () => {
      wakeSystem();
    };

    const handlePointerDown = () => {
      wakeSystem();
    };

    const handleTouchStart = () => {
      wakeSystem();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isSleeping, wakeSystem]);

  /*
   * ---------------------------------------------------------
   * Mouse / pointer parallax
   * ---------------------------------------------------------
   */
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothX = useSpring(pointerX, {
    stiffness: 80,
    damping: 20,
    mass: 0.5,
  });

  const smoothY = useSpring(pointerY, {
    stiffness: 80,
    damping: 20,
    mass: 0.5,
  });

  const orbRotateX = useTransform(smoothY, [-1, 1], [8, -8]);
  const orbRotateY = useTransform(smoothX, [-1, 1], [-8, 8]);

  const contentX = useTransform(smoothX, [-1, 1], [-10, 10]);
  const contentY = useTransform(smoothY, [-1, 1], [-6, 6]);

  const handlePointerMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;

    pointerX.set(x * 2 - 1);
    pointerY.set(y * 2 - 1);

    if (!isPointerMoving) {
      setIsPointerMoving(true);
    }
  };

  /*
   * ---------------------------------------------------------
   * Stable particles
   * ---------------------------------------------------------
   */
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.8 + 0.7,
        duration: Math.random() * 8 + 7,
        delay: Math.random() * 5,
        driftX: Math.random() * 40 - 20,
        driftY: Math.random() * 40 - 20,
      })),
    []
  );

  if (!isSleeping) {
    return null;
  }

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AnimatePresence>
      <motion.div
        key="sleep-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
        onMouseMove={handlePointerMove}
        className="
          fixed
          inset-0
          z-[120]
          overflow-hidden
          select-none
          cursor-default
          bg-[#030409]
          text-white
        "
        style={{
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        {/* =====================================================
            BACKGROUND
        ====================================================== */}

        <div className="absolute inset-0 overflow-hidden">
          {/* Deep gradient */}
          <div
            className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_50%_45%,rgba(76,110,245,0.14),transparent_28%),radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.10),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.08),transparent_30%)]
            "
          />

          {/* Large atmospheric glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.20, 0.35, 0.20],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="
              absolute
              left-1/2
              top-1/2
              h-[42rem]
              w-[42rem]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-indigo-500/10
              blur-[120px]
            "
          />

          {/* Secondary glow */}
          <motion.div
            animate={{
              x: [-80, 80, -80],
              y: [50, -50, 50],
              opacity: [0.08, 0.18, 0.08],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="
              absolute
              left-1/2
              top-1/2
              h-[28rem]
              w-[28rem]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-cyan-400/10
              blur-[100px]
            "
          />

          {/* =================================================
              PARTICLES
          ================================================== */}

          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
              }}
              animate={{
                x: [0, particle.driftX, 0],
                y: [0, particle.driftY, 0],
                opacity: [0, 0.55, 0],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="
                absolute
                rounded-full
                bg-white
                shadow-[0_0_10px_rgba(255,255,255,0.8)]
              "
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: particle.size,
                height: particle.size,
              }}
            />
          ))}

          {/* Fine grid */}
          <div
            className="
              absolute
              inset-0
              opacity-[0.035]
              [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)]
              [background-size:80px_80px]
            "
          />

          {/* Vignette */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.62)_100%)]
            "
          />
        </div>

        {/* =====================================================
            TOP STATUS BAR
        ====================================================== */}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.7,
          }}
          className="
            absolute
            left-0
            right-0
            top-0
            z-20
            flex
            items-center
            justify-between
            px-6
            py-5
            sm:px-10
            sm:py-7
          "
        >
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="
                relative
                flex
                h-9
                w-9
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                border
                border-white/10
                bg-white/[0.055]
                shadow-[0_8px_30px_rgba(0,0,0,0.25)]
                backdrop-blur-xl
              "
            >
              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-br
                  from-white/15
                  to-transparent
                "
              />

              <span className="relative text-sm font-semibold tracking-tight">
                A
              </span>
            </div>

            <div className="hidden sm:block">
              <div className="text-sm font-medium tracking-wide text-white/85">
                ARLO OS
              </div>

              <div className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                Sleep Mode
              </div>
            </div>
          </div>

          {/* System status */}
          <div
            className="
              flex
              items-center
              gap-2
              rounded-full
              border
              border-white/[0.08]
              bg-white/[0.045]
              px-3
              py-1.5
              backdrop-blur-xl
            "
          >
            <motion.span
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.85, 1, 0.85],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-emerald-400
                shadow-[0_0_10px_rgba(52,211,153,0.8)]
              "
            />

            <span className="text-[10px] font-medium tracking-wider text-white/45">
              SYSTEM SLEEPING
            </span>
          </div>
        </motion.div>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <motion.main
          style={{
            x: contentX,
            y: contentY,
          }}
          className="
            relative
            z-10
            flex
            h-full
            w-full
            flex-col
            items-center
            justify-center
            px-6
          "
        >
          {/* =================================================
              3D ORB
          ================================================== */}

          <motion.div
            style={{
              rotateX: orbRotateX,
              rotateY: orbRotateY,
              transformPerspective: 900,
            }}
            className="
              relative
              mb-10
              h-44
              w-44
              sm:mb-12
              sm:h-56
              sm:w-56
            "
          >
            {/* Outer atmospheric glow */}
            <motion.div
              animate={{
                scale: [0.92, 1.08, 0.92],
                opacity: [0.18, 0.35, 0.18],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="
                absolute
                inset-[-25%]
                rounded-full
                bg-indigo-500/20
                blur-[45px]
              "
            />

            {/* Outer ring */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="
                absolute
                inset-0
                rounded-full
                border
                border-white/[0.08]
              "
            />

            {/* Dashed ring */}
            <motion.div
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 24,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="
                absolute
                inset-3
                rounded-full
                border
                border-dashed
                border-indigo-300/20
              "
            />

            {/* Inner ring */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="
                absolute
                inset-8
                rounded-full
                border
                border-cyan-300/10
              "
            />

            {/* Core */}
            <motion.div
              animate={{
                scale: [1, 1.035, 1],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="
                absolute
                left-1/2
                top-1/2
                flex
                h-28
                w-28
                -translate-x-1/2
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-white/[0.12]
                bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.28),transparent_18%),radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.48),rgba(17,24,39,0.85)_62%,rgba(0,0,0,0.98)_100%)]
                shadow-[inset_0_0_40px_rgba(99,102,241,0.22),0_0_80px_rgba(79,70,229,0.16)]
                backdrop-blur-xl
                sm:h-36
                sm:w-36
              "
            >
              {/* Core light */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="
                  absolute
                  h-3
                  w-3
                  rounded-full
                  bg-white
                  shadow-[0_0_25px_rgba(255,255,255,1),0_0_60px_rgba(129,140,248,0.9)]
                "
              />

              {/* Orb reflection */}
              <div
                className="
                  absolute
                  left-[25%]
                  top-[17%]
                  h-5
                  w-10
                  rotate-[-25deg]
                  rounded-full
                  bg-white/20
                  blur-md
                "
              />
            </motion.div>

            {/* Orbital satellite */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-[-4px]"
            >
              <div
                className="
                  absolute
                  left-1/2
                  top-[-4px]
                  h-2
                  w-2
                  -translate-x-1/2
                  rounded-full
                  bg-cyan-300
                  shadow-[0_0_15px_rgba(103,232,249,1)]
                "
              />
            </motion.div>
          </motion.div>

          {/* =================================================
              CLOCK
          ================================================== */}

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.45,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-center"
          >
            <div
              className="
                bg-gradient-to-b
                from-white
                via-white
                to-white/55
                bg-clip-text
                text-[4.4rem]
                font-extralight
                leading-none
                tracking-[-0.065em]
                text-transparent
                sm:text-[7rem]
              "
            >
              {formattedTime}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="
                mt-4
                text-xs
                font-medium
                uppercase
                tracking-[0.32em]
                text-white/35
                sm:text-sm
              "
            >
              {formattedDate}
            </motion.div>
          </motion.div>

          {/* =================================================
              WAKE CARD
          ================================================== */}

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.8,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              mt-12
              flex
              flex-col
              items-center
              gap-3
            "
          >
            <motion.div
              whileHover={{
                scale: 1.03,
              }}
              className="
                flex
                items-center
                gap-3
                rounded-full
                border
                border-white/[0.09]
                bg-white/[0.045]
                px-5
                py-3
                shadow-[0_15px_50px_rgba(0,0,0,0.25)]
                backdrop-blur-2xl
              "
            >
              {/* Keyboard key */}
              <motion.div
                animate={{
                  y: [0, -2, 0],
                  boxShadow: [
                    '0 0 0 rgba(255,255,255,0)',
                    '0 0 18px rgba(255,255,255,0.08)',
                    '0 0 0 rgba(255,255,255,0)',
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="
                  flex
                  h-7
                  min-w-7
                  items-center
                  justify-center
                  rounded-md
                  border
                  border-white/[0.12]
                  bg-white/[0.06]
                  px-2
                  text-[10px]
                  font-semibold
                  text-white/60
                "
              >
                ⌘
              </motion.div>

              <span className="text-xs text-white/45">
                Press any key or click anywhere to wake
              </span>
            </motion.div>

            <div className="text-[9px] uppercase tracking-[0.3em] text-white/15">
              ARLO OS • Power Nap
            </div>
          </motion.div>
        </motion.main>

        {/* =====================================================
            BOTTOM SYSTEM INDICATORS
        ====================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 1,
            duration: 0.7,
          }}
          className="
            absolute
            bottom-6
            left-1/2
            z-20
            flex
            -translate-x-1/2
            items-center
            gap-2
            rounded-full
            border
            border-white/[0.06]
            bg-black/20
            px-4
            py-2
            backdrop-blur-xl
          "
        >
          <div className="flex items-center gap-1.5">
            <span
              className="
                inline-block
                h-1.5
                w-1.5
                rounded-full
                bg-indigo-400
                shadow-[0_0_8px_rgba(129,140,248,0.8)]
              "
            />

            <span className="text-[9px] uppercase tracking-[0.2em] text-white/25">
              Memory preserved
            </span>
          </div>

          <div className="h-3 w-px bg-white/[0.08]" />

          <div className="text-[9px] uppercase tracking-[0.2em] text-white/20">
            Ready
          </div>
        </motion.div>

        {/* Pointer activity indicator */}
        <AnimatePresence>
          {isPointerMoving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="
                pointer-events-none
                absolute
                inset-0
                bg-white/[0.008]
              "
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default SleepOverlay;
