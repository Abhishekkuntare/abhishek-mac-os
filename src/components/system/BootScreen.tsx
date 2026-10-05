
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useOS } from '../../context/OSContext';
import { ArloLogo } from './ArloLogo';

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

const PARTICLE_COUNT = 38;

export const BootScreen: React.FC = () => {
  const { isBooting } = useOS();
  const [progress, setProgress] = useState(0);

  /*
   * ---------------------------------------------------------
   * BOOT PROGRESS
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!isBooting) {
      setProgress(0);
      return;
    }

    let interval: number | undefined;

    interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          if (interval) {
            window.clearInterval(interval);
          }

          return 100;
        }

        /*
         * Slightly variable progress makes the startup
         * feel more natural than a completely linear bar.
         */
        const increment =
          current < 40
            ? 2
            : current < 75
              ? 1.5
              : current < 92
                ? 1
                : 0.5;

        return Math.min(current + increment, 100);
      });
    }, 65);

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [isBooting]);

  /*
   * ---------------------------------------------------------
   * BOOT PARTICLES
   * ---------------------------------------------------------
   */
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.5 + 0.6,
        duration: Math.random() * 7 + 6,
        delay: Math.random() * 5,
        driftX: Math.random() * 50 - 25,
        driftY: Math.random() * 50 - 25,
      })),
    []
  );

  if (!isBooting) {
    return null;
  }

  /*
   * ---------------------------------------------------------
   * BOOT STATUS
   * ---------------------------------------------------------
   */
  const bootStatus =
    progress < 20
      ? 'Initializing kernel'
      : progress < 40
        ? 'Loading system services'
        : progress < 60
          ? 'Mounting virtual filesystem'
          : progress < 78
            ? 'Starting desktop environment'
            : progress < 94
              ? 'Preparing workspace'
              : 'Almost ready';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="
        fixed
        inset-0
        z-[110]
        flex
        items-center
        justify-center
        overflow-hidden
        bg-[#020307]
        text-white
        select-none
      "
    >
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="absolute inset-0 overflow-hidden">
        {/* Main atmosphere */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.18, 0.3, 0.18],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            absolute
            left-1/2
            top-1/2
            h-[38rem]
            w-[38rem]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-indigo-600/10
            blur-[120px]
          "
        />

        {/* Cyan atmosphere */}
        <motion.div
          animate={{
            x: [-100, 100, -100],
            y: [60, -60, 60],
            opacity: [0.06, 0.14, 0.06],
          }}
          transition={{
            duration: 12,
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
            bg-cyan-500/10
            blur-[100px]
          "
        />

        {/* Fine grid */}
        <div
          className="
            absolute
            inset-0
            opacity-[0.025]
            [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)]
            [background-size:80px_80px]
          "
        />

        {/* Particles */}
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
              opacity: [0, 0.45, 0],
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
              shadow-[0_0_12px_rgba(255,255,255,0.8)]
            "
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
            }}
          />
        ))}

        {/* Vignette */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.75)_100%)]
          "
        />
      </div>

      {/* =====================================================
          TOP BRAND
      ====================================================== */}

      <motion.div
        initial={{ opacity: 0, y: -25 }}
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
          flex
          items-center
          justify-between
          px-6
          py-6
          sm:px-10
          sm:py-8
        "
      >
        {/* Brand */}
        <div className="flex items-center">
          <ArloLogo className="h-10 w-10 object-contain" />
        </div>

        {/* Version */}
        <div
          className="
            rounded-full
            border
            border-white/[0.07]
            bg-white/[0.035]
            px-3
            py-1.5
            text-[9px]
            uppercase
            tracking-[0.22em]
            text-white/25
            backdrop-blur-xl
          "
        >
          Secure Boot
        </div>
      </motion.div>

      {/* =====================================================
          MAIN STARTUP CORE
      ====================================================== */}

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6">

        {/* ===================================================
            3D LOGO SYSTEM
        ==================================================== */}

        <motion.div
          initial={{
            scale: 0.65,
            opacity: 0,
            rotateX: 25,
          }}
          animate={{
            scale: 1,
            opacity: 1,
            rotateX: 0,
          }}
          transition={{
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            transformPerspective: 1000,
          }}
          className="
            relative
            mb-10
            h-40
            w-40
            sm:h-48
            sm:w-48
          "
        >
          {/* Outer glow */}
          <motion.div
            animate={{
              scale: [0.9, 1.1, 0.9],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="
              absolute
              inset-[-35%]
              rounded-full
              bg-indigo-500/20
              blur-[55px]
            "
          />

          {/* Large orbital ring */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="
              absolute
              inset-[-12px]
              rounded-full
              border
              border-white/[0.07]
            "
          />

          {/* Dashed orbit */}
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="
              absolute
              inset-[-3px]
              rounded-full
              border
              border-dashed
              border-indigo-400/25
            "
          />

          {/* Satellite */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-[-8px]"
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
                shadow-[0_0_18px_rgba(103,232,249,1)]
              "
            />
          </motion.div>

          {/* Logo container */}
          <motion.div
            animate={{
              rotateY: [0, 8, 0, -8, 0],
              rotateX: [0, -4, 0, 4, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              transformPerspective: 800,
            }}
            className="
              absolute
              inset-4
              rounded-[2rem]
              border
              border-white/[0.12]
              bg-gradient-to-br
              from-white/[0.12]
              via-white/[0.035]
              to-indigo-500/[0.08]
              p-[1px]
              shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_25px_80px_rgba(0,0,0,0.5)]
              backdrop-blur-2xl
            "
          >
            <div
              className="
                relative
                flex
                h-full
                w-full
                items-center
                justify-center
                overflow-hidden
                rounded-[1.9rem]
                bg-[#070910]/90
              "
            >
              {/* Shine */}
              <motion.div
                animate={{
                  x: ['-120%', '120%'],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                  ease: 'easeInOut',
                }}
                className="
                  absolute
                  inset-y-0
                  w-1/2
                  rotate-12
                  bg-gradient-to-r
                  from-transparent
                  via-white/[0.08]
                  to-transparent
                  blur-md
                "
              />

              {/* Logo */}
              <svg
                className="
                  relative
                  h-14
                  w-14
                  text-indigo-300
                  drop-shadow-[0_0_20px_rgba(129,140,248,0.7)]
                  sm:h-16
                  sm:w-16
                "
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2L2 22h4.5l2-4.5h7l2 4.5H22L12 2zm0 6l2.3 5.5h-4.6L12 8z" />
              </svg>

              {/* Bottom reflection */}
              <div
                className="
                  absolute
                  bottom-0
                  left-0
                  right-0
                  h-1/3
                  bg-gradient-to-t
                  from-indigo-500/[0.08]
                  to-transparent
                "
              />
            </div>
          </motion.div>
        </motion.div>

        {/* ===================================================
            TITLE
        ==================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.45,
            duration: 0.7,
          }}
          className="mb-8 text-center"
        >
          <ArloLogo
            variant="wordmark"
            className="mx-auto w-[min(64vw,260px)] object-contain"
          />

          <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-white/25">
            Starting your workspace
          </p>
        </motion.div>

        {/* ===================================================
            PROGRESS
        ==================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.65,
            duration: 0.7,
          }}
          className="w-full"
        >
          {/* Progress header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{
                  opacity: [0.35, 1, 0.35],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-cyan-300
                  shadow-[0_0_10px_rgba(103,232,249,0.8)]
                "
              />

              <span className="text-[10px] text-white/35">
                {bootStatus}
              </span>
            </div>

            <span className="font-mono text-[10px] text-white/35">
              {Math.floor(progress)}%
            </span>
          </div>

          {/* Progress track */}
          <div
            className="
              relative
              h-2
              w-full
              overflow-hidden
              rounded-full
              border
              border-white/[0.06]
              bg-white/[0.045]
              p-[1px]
              shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]
            "
          >
            {/* Glow behind progress */}
            <motion.div
              className="
                absolute
                left-0
                top-0
                h-full
                rounded-full
                bg-indigo-500/30
                blur-md
              "
              style={{
                width: `${progress}%`,
              }}
            />

            {/* Actual progress */}
            <motion.div
              className="
                relative
                h-full
                overflow-hidden
                rounded-full
                bg-gradient-to-r
                from-cyan-400
                via-indigo-500
                to-violet-500
              "
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.25,
                ease: 'easeOut',
              }}
            >
              {/* Moving highlight */}
              <motion.div
                animate={{
                  x: ['-100%', '250%'],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="
                  absolute
                  inset-y-0
                  w-1/3
                  bg-gradient-to-r
                  from-transparent
                  via-white/50
                  to-transparent
                  blur-[2px]
                "
              />
            </motion.div>
          </div>

          {/* Boot information */}
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[9px] text-white/15">
              SYSTEM INITIALIZATION
            </span>

            <span className="font-mono text-[9px] text-white/15">
              {progress >= 100 ? 'READY' : 'PLEASE WAIT'}
            </span>
          </div>
        </motion.div>

        {/* ===================================================
            BOTTOM MESSAGE
        ==================================================== */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 1,
            duration: 1,
          }}
          className="
            mt-10
            flex
            items-center
            gap-2
            text-center
          "
        >
          <div
            className="
              h-1
              w-1
              rounded-full
              bg-white/20
            "
          />

        
          <div
            className="
              h-1
              w-1
              rounded-full
              bg-white/20
            "
          />
        </motion.div>
      </div>

      {/* =====================================================
          BOTTOM STATUS
      ====================================================== */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 1.2,
        }}
        className="
          absolute
          bottom-6
          left-1/2
          -translate-x-1/2
          whitespace-nowrap
          text-[8px]
          uppercase
          tracking-[0.3em]
          text-white/10
        "
      >
        ARLO OS • Personal Computing Environment
      </motion.div>
    </motion.div>
  );
};

export default BootScreen;
