import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Power,
  RefreshCw,
  Moon,
  X,
  LockKeyhole,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

export const PowerDialog: React.FC = () => {
  const {
    showPowerDialog,
    setShowPowerDialog,
    restartSystem,
    sleepSystem,
    lockSystem,
    shutdownSystem,
  } = useOS();

  if (!showPowerDialog) return null;

  const closeDialog = () => {
    setShowPowerDialog(false);
  };

  const handleSleep = () => {
    try {
      sound?.click?.();
    } catch {
      // Sound is optional; don't block the action.
    }

    closeDialog();
    sleepSystem();
  };

  const handleRestart = () => {
    try {
      sound?.click?.();
    } catch {
      // Sound is optional; don't block the action.
    }

    closeDialog();
    restartSystem();
  };

  const handleShutdown = () => {
    try {
      sound?.click?.();
    } catch {
      // Sound is optional; don't block the action.
    }

    closeDialog();
    shutdownSystem();
  };

  const handleLock = () => {
    try {
      sound?.click?.();
    } catch {
      // Sound is optional; don't block the action.
    }

    closeDialog();
    lockSystem();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={closeDialog}
        className="
          fixed
          inset-0
          z-[100]
          flex
          items-center
          justify-center
          overflow-hidden
          bg-black/65
          p-4
          backdrop-blur-xl
          select-none
        "
      >
        {/* =====================================================
            AMBIENT BACKGROUND
        ====================================================== */}

        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.06, 0.13, 0.06],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-[34rem]
            w-[34rem]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-indigo-500
            blur-[130px]
          "
        />

        <motion.div
          animate={{
            x: [-80, 80, -80],
            y: [50, -50, 50],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-[25rem]
            w-[25rem]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-cyan-500
            blur-[110px]
          "
        />

        {/* =====================================================
            POWER PANEL
        ====================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.88,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.94,
            y: 10,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          onClick={(event) => event.stopPropagation()}
          className="
            relative
            w-full
            max-w-md
            overflow-hidden
            rounded-[2rem]
            border
            border-white/[0.12]
            bg-[#090b11]/95
            p-6
            text-white
            shadow-[0_40px_120px_rgba(0,0,0,0.7)]
            backdrop-blur-3xl
            sm:p-7
          "
        >
          {/* Top glass reflection */}
          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              h-36
              bg-gradient-to-b
              from-white/[0.065]
              to-transparent
            "
          />

          {/* Subtle border glow */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              rounded-[2rem]
              ring-1
              ring-inset
              ring-white/[0.025]
            "
          />

          {/* =================================================
              CLOSE BUTTON
          ================================================== */}

          <motion.button
            type="button"
            whileHover={{
              scale: 1.08,
              rotate: 3,
            }}
            whileTap={{
              scale: 0.92,
            }}
            onClick={closeDialog}
            aria-label="Close power menu"
            className="
              absolute
              right-4
              top-4
              z-20
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              border
              border-white/[0.07]
              bg-white/[0.035]
              text-white/35
              transition-colors
              duration-200
              hover:bg-white/[0.09]
              hover:text-white
            "
          >
            <X className="h-4 w-4" />
          </motion.button>

          {/* =================================================
              HEADER
          ================================================== */}

          <div className="relative text-center">
            <motion.div
              initial={{
                scale: 0.75,
                opacity: 0,
                rotate: -8,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              transition={{
                delay: 0.1,
                type: 'spring',
                stiffness: 250,
                damping: 16,
              }}
              className="
                relative
                mx-auto
                mb-5
                flex
                h-[4.5rem]
                w-[4.5rem]
                items-center
                justify-center
                rounded-[1.4rem]
                border
                border-red-400/15
                bg-gradient-to-br
                from-red-500/15
                via-red-500/[0.07]
                to-orange-500/[0.03]
                shadow-[0_20px_60px_rgba(239,68,68,0.12)]
              "
            >
              {/* Icon glow */}
              <motion.div
                animate={{
                  scale: [0.85, 1.1, 0.85],
                  opacity: [0.15, 0.3, 0.15],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="
                  absolute
                  inset-0
                  rounded-[1.4rem]
                  bg-red-500/20
                  blur-xl
                "
              />

              <Power
                className="
                  relative
                  h-7
                  w-7
                  text-red-400
                  drop-shadow-[0_0_14px_rgba(248,113,113,0.55)]
                "
              />
            </motion.div>

            <h3
              className="
                text-xl
                font-semibold
                tracking-[-0.02em]
                text-white/90
              "
            >
              Power
            </h3>

            <p
              className="
                mx-auto
                mt-2
                max-w-xs
                text-xs
                leading-relaxed
                text-white/35
              "
            >
              Choose an action for your Abhishek OS session.
            </p>
          </div>

          {/* =================================================
              POWER ACTIONS
          ================================================== */}

          <div className="relative mt-7 grid grid-cols-2 gap-3">
            {/* Sleep */}
            <PowerAction
              icon={<Moon className="h-5 w-5" />}
              title="Sleep"
              description="Pause your session"
              iconClass="text-indigo-300"
              glowClass="bg-indigo-500/10"
              onClick={handleSleep}
            />

            {/* Restart */}
            <PowerAction
              icon={<RefreshCw className="h-5 w-5" />}
              title="Restart"
              description="Restart the system"
              iconClass="text-amber-300"
              glowClass="bg-amber-500/10"
              onClick={handleRestart}
            />

            {/* Lock */}
            <PowerAction
              icon={<LockKeyhole className="h-5 w-5" />}
              title="Lock"
              description="Secure your session"
              iconClass="text-cyan-300"
              glowClass="bg-cyan-500/10"
              onClick={handleLock}
            />

            {/* Shutdown */}
            <PowerAction
              icon={<Power className="h-5 w-5" />}
              title="Shut Down"
              description="Power off Abhishek OS"
              iconClass="text-red-300"
              glowClass="bg-red-500/10"
              danger
              onClick={handleShutdown}
            />
          </div>

          {/* =================================================
              CANCEL
          ================================================== */}

          <motion.button
            type="button"
            whileHover={{
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.98,
            }}
            onClick={closeDialog}
            className="
              relative
              mt-5
              w-full
              rounded-xl
              border
              border-white/[0.07]
              bg-white/[0.035]
              py-3
              text-xs
              font-medium
              text-white/45
              transition-all
              duration-200
              hover:border-white/[0.11]
              hover:bg-white/[0.07]
              hover:text-white/75
            "
          >
            Cancel
          </motion.button>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="relative mt-5 text-center">
            <span
              className="
                text-[8px]
                uppercase
                tracking-[0.3em]
                text-white/[0.14]
              "
            >
              Abhishek OS • Power Management
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ===========================================================
   POWER ACTION COMPONENT
=========================================================== */

interface PowerActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconClass: string;
  glowClass: string;
  danger?: boolean;
  onClick: () => void;
}

const PowerAction: React.FC<PowerActionProps> = ({
  icon,
  title,
  description,
  iconClass,
  glowClass,
  danger = false,
  onClick,
}) => {
  return (
    <motion.button
      type="button"
      whileHover={{
        y: -3,
        scale: 1.015,
      }}
      whileTap={{
        scale: 0.97,
      }}
      onClick={onClick}
      className={`
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        p-4
        text-left
        transition-all
        duration-300
        ${
          danger
            ? `
              border-red-500/15
              bg-red-500/[0.035]
              hover:border-red-500/30
              hover:bg-red-500/[0.075]
            `
            : `
              border-white/[0.07]
              bg-white/[0.035]
              hover:border-white/[0.13]
              hover:bg-white/[0.07]
            `
        }
      `}
    >
      {/* Hover glow */}
      <div
        className={`
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-28
          w-28
          rounded-full
          ${glowClass}
          opacity-0
          blur-2xl
          transition-opacity
          duration-300
          group-hover:opacity-100
        `}
      />

      {/* Top shine */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-12
          bg-gradient-to-b
          from-white/[0.035]
          to-transparent
        "
      />

      {/* Icon */}
      <div
        className={`
          relative
          mb-4
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-white/[0.07]
          bg-white/[0.04]
          ${iconClass}
          transition-transform
          duration-300
          group-hover:scale-110
        `}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="relative">
        <div className="text-xs font-semibold text-white/80">
          {title}
        </div>

        <div className="mt-1 text-[9px] leading-relaxed text-white/25">
          {description}
        </div>
      </div>
    </motion.button>
  );
};

export default PowerDialog;
