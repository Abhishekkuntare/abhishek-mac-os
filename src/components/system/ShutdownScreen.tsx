import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Power } from 'lucide-react';
import { useOS } from '../../context/OSContext';

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

const PARTICLE_COUNT = 32;

export const ShutdownScreen: React.FC = () => {
  const {
    isShuttingDown,
    setShowPowerDialog,
    // Add this function to your OSContext if needed.
    // It should switch isShuttingDown -> false
    // and then start booting.
    restartSystem,
  } = useOS();

  const [progress, setProgress] = useState(0);
  const [isOff, setIsOff] = useState(false);
  const [time, setTime] = useState(new Date());

  /*
   * ---------------------------------------------------------
   * CLOCK
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isShuttingDown) return;

    const timer = window.setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isShuttingDown]);

  /*
   * ---------------------------------------------------------
   * SHUTDOWN PROGRESS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isShuttingDown) {
      setProgress(0);
      setIsOff(false);
      return;
    }

    setProgress(0);
    setIsOff(false);

    let interval: number | undefined;

    interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          if (interval) {
            window.clearInterval(interval);
          }

          window.setTimeout(() => {
            setIsOff(true);
          }, 500);

          return 100;
        }

        const increment =
          current < 30
            ? 2.5
            : current < 65
              ? 1.8
              : current < 88
                ? 1.2
                : 0.7;

        return Math.min(current + increment, 100);
      });
    }, 70);

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [isShuttingDown]);

  /*
   * ---------------------------------------------------------
   * PARTICLES
   * ---------------------------------------------------------
   */

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        duration: Math.random() * 8 + 7,
        delay: Math.random() * 5,
        driftX: Math.random() * 40 - 20,
        driftY: Math.random() * 40 - 20,
      })),
    []
  );

  /*
   * ---------------------------------------------------------
   * WAKE / POWER ON
   *
   * When the shutdown screen has completed, clicking or
   * pressing a key starts the system again.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isShuttingDown || !isOff) return;

    const powerOn = () => {
      /*
       * restartSystem() should:
       * 1. clear shutdown state
       * 2. start boot sequence
       */
      restartSystem();
    };

    window.addEventListener('keydown', powerOn);
    window.addEventListener('mousedown', powerOn);
    window.addEventListener('touchstart', powerOn, {
      passive: true,
    });

    return () => {
      window.removeEventListener('keydown', powerOn);
      window.removeEventListener('mousedown', powerOn);
      window.removeEventListener('touchstart', powerOn);
    };
  }, [isShuttingDown, isOff, restartSystem]);

  if (!isShuttingDown) {
    return null;
  }

  const shutdownMessage =
    progress < 25
      ? 'Closing applications'
      : progress < 45
        ? 'Saving your workspace'
        : progress < 65
          ? 'Unmounting virtual filesystem'
          : progress < 82
            ? 'Stopping system services'
            : progress < 98
              ? 'Powering down'
              : 'System offline';

  /*
   * ---------------------------------------------------------
   * OFF STATE
   * ---------------------------------------------------------
   */

  if (isOff) {
    return (
      <AnimatePresence>
        <motion.div
          key="system-off"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="
            fixed
            inset-0
            z-[9999]
            flex
            cursor-pointer
            items-center
            justify-center
            overflow-hidden
            bg-black
            select-none
          "
          onClick={restartSystem}
        >
          {/* Very subtle center glow */}
          <motion.div
            animate={{
              opacity: [0.02, 0.05, 0.02],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="
              absolute
              left-1/2
              top-1/2
              h-72
              w-72
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-indigo-500
              blur-[100px]
            "
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              relative
              z-10
              flex
              flex-col
              items-center
              text-center
            "
          >
            {/* Power icon */}
            <motion.div
              animate={{
                scale: [1, 1.04, 1],
                opacity: [0.55, 0.8, 0.55],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="
                mb-7
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                border
                border-white/[0.08]
                bg-white/[0.025]
                shadow-[0_0_50px_rgba(99,102,241,0.08)]
              "
            >
              <Power className="h-6 w-6 text-white/50" />
            </motion.div>

            <h1
              className="
                text-xl
                font-light
                tracking-[-0.02em]
                text-white/75
              "
            >
              Abhishek OS is off
            </h1>

            <p
              className="
                mt-3
                text-[10px]
                uppercase
                tracking-[0.3em]
                text-white/20
              "
            >
              Click anywhere to power on
            </p>
          </motion.div>

          {/* Bottom status */}
          <div
            className="
              absolute
              bottom-7
              left-1/2
              -translate-x-1/2
              whitespace-nowrap
              font-mono
              text-[8px]
              uppercase
              tracking-[0.3em]
              text-white/[0.12]
            "
          >
            SYSTEM OFFLINE
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  /*
   * ---------------------------------------------------------
   * SHUTDOWN ANIMATION
   * ---------------------------------------------------------
   */

  return (
    <AnimatePresence>
      <motion.div
        key="shutdown-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
        className="
          fixed
          inset-0
          z-[9999]
          flex
          items-center
          justify-center
          overflow-hidden
          bg-[#020307]
          text-white
          select-none
        "
      >
        {/* ===================================================
            BACKGROUND
        ==================================================== */}

        <div className="absolute inset-0 overflow-hidden">
          {/* Main glow */}
          <motion.div
            animate={{
              scale: [1, 0.8, 0.55],
              opacity: [0.22, 0.12, 0],
            }}
            transition={{
              duration: 5,
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
              bg-indigo-600/15
              blur-[120px]
            "
          />

          {/* Secondary cyan glow */}
          <motion.div
            animate={{
              scale: [1, 0.7, 0.3],
              opacity: [0.1, 0.04, 0],
            }}
            transition={{
              duration: 4,
              ease: 'easeInOut',
            }}
            className="
              absolute
              left-1/2
              top-1/2
              h-[25rem]
              w-[25rem]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-cyan-500/10
              blur-[100px]
            "
          />

          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                opacity: 0.35,
              }}
              animate={{
                x: particle.driftX,
                y: particle.driftY,
                opacity: 0,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
              className="
                absolute
                rounded-full
                bg-white
                shadow-[0_0_10px_rgba(255,255,255,0.7)]
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
              absolute
              inset-0
              bg-[radial-gradient(circle_at_center,transparent_15%,rgba(0,0,0,0.8)_100%)]
            "
          />
        </div>

        {/* ===================================================
            TOP BRAND
        ==================================================== */}

        <motion.div
          initial={{ opacity: 1 }}
          animate={{
            opacity: progress > 70 ? 0 : 1,
          }}
          transition={{ duration: 0.8 }}
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
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                bg-white/[0.04]
                text-sm
                font-semibold
                text-white/70
                backdrop-blur-xl
              "
            >
              A
            </div>

            <div>
              <div className="text-sm font-medium text-white/70">
                Abhishek OS
              </div>

              <div className="text-[9px] uppercase tracking-[0.28em] text-white/20">
                Power Down
              </div>
            </div>
          </div>

          <div
            className="
              rounded-full
              border
              border-white/[0.06]
              bg-white/[0.03]
              px-3
              py-1.5
              text-[9px]
              uppercase
              tracking-[0.22em]
              text-white/20
            "
          >
            Shutting Down
          </div>
        </motion.div>

        {/* ===================================================
            MAIN CORE
        ==================================================== */}

        <motion.div
          animate={{
            scale: progress > 85 ? 0.75 : 1,
            opacity: progress > 94 ? 0 : 1,
          }}
          transition={{
            duration: 1.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="
            relative
            z-10
            flex
            w-full
            max-w-md
            flex-col
            items-center
            px-6
          "
        >
          {/* 3D POWER CORE */}
          <div
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
                scale: [1, 0.75, 0.4],
                opacity: [0.3, 0.15, 0],
              }}
              transition={{
                duration: 4,
                ease: 'easeInOut',
              }}
              className="
                absolute
                inset-[-30%]
                rounded-full
                bg-red-500/20
                blur-[55px]
              "
            />

            {/* Orbital ring */}
            <motion.div
              animate={{
                rotate: -360,
                scale: [1, 0.85, 0.7],
                opacity: [1, 0.5, 0],
              }}
              transition={{
                duration: 5,
                ease: 'easeInOut',
              }}
              className="
                absolute
                inset-0
                rounded-full
                border
                border-white/[0.09]
              "
            />

            {/* Inner ring */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 0.8, 0.5],
                opacity: [1, 0.5, 0],
              }}
              transition={{
                duration: 4,
                ease: 'easeInOut',
              }}
              className="
                absolute
                inset-5
                rounded-full
                border
                border-dashed
                border-red-400/20
              "
            />

            {/* Core */}
            <motion.div
              animate={{
                scale: [1, 0.95, 0.72],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 5,
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
                rounded-[2rem]
                border
                border-white/[0.1]
                bg-gradient-to-br
                from-white/[0.08]
                to-red-500/[0.05]
                shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_25px_70px_rgba(0,0,0,0.5)]
                backdrop-blur-2xl
                sm:h-32
                sm:w-32
              "
            >
              <motion.div
                animate={{
                  opacity: [0.8, 0.3, 0],
                  scale: [1, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  ease: 'easeInOut',
                }}
                className="
                  absolute
                  h-16
                  w-16
                  rounded-full
                  bg-red-500/20
                  blur-2xl
                "
              />

              <Power
                className="
                  relative
                  h-9
                  w-9
                  text-white/65
                  drop-shadow-[0_0_18px_rgba(248,113,113,0.45)]
                "
              />
            </motion.div>
          </div>

          {/* Title */}
          <motion.div
            animate={{
              opacity: progress > 80 ? 0.6 : 1,
            }}
            className="mb-8 text-center"
          >
            <h1
              className="
                bg-gradient-to-b
                from-white
                to-white/45
                bg-clip-text
                text-2xl
                font-light
                tracking-[-0.03em]
                text-transparent
                sm:text-3xl
              "
            >
              Shutting Down
            </h1>

            <motion.p
              key={shutdownMessage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                mt-3
                text-[10px]
                uppercase
                tracking-[0.32em]
                text-white/25
              "
            >
              {shutdownMessage}
            </motion.p>
          </motion.div>

          {/* Progress */}
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-[0.25em] text-white/20">
                Power sequence
              </span>

              <span className="font-mono text-[10px] text-white/30">
                {Math.floor(progress)}%
              </span>
            </div>

            <div
              className="
                relative
                h-1.5
                overflow-hidden
                rounded-full
                bg-white/[0.05]
              "
            >
              <motion.div
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  duration: 0.25,
                  ease: 'easeOut',
                }}
                className="
                  relative
                  h-full
                  rounded-full
                  bg-gradient-to-r
                  from-red-400
                  via-orange-400
                  to-white/70
                "
              >
                <motion.div
                  animate={{
                    x: ['-100%', '300%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="
                    absolute
                    inset-y-0
                    w-1/3
                    bg-gradient-to-r
                    from-transparent
                    via-white/70
                    to-transparent
                    blur-[2px]
                  "
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ===================================================
            BOTTOM
        ==================================================== */}

        <motion.div
          animate={{
            opacity: progress > 80 ? 0 : 1,
          }}
          className="
            absolute
            bottom-7
            left-1/2
            -translate-x-1/2
            whitespace-nowrap
            text-[8px]
            uppercase
            tracking-[0.3em]
            text-white/10
          "
        >
          Your workspace is being safely closed
        </motion.div>
      </motion.div>

       </AnimatePresence>
  );
};

export default ShutdownScreen;