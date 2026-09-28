/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { OSProvider, useOS } from './context/OSContext';

import { Desktop } from './components/desktop/Desktop';
import { WindowManager } from './components/windows/WindowManager';
import  {MenuBar}  from './components/menubar/MenuBar';
import { Dock } from './components/dock/Dock';

import { ControlCenter } from './components/controlcenter/ControlCenter';
import Spotlight  from './components/spotlight/Spotlight';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { MissionControl } from './components/desktop/MissionControl';

import { BootScreen } from './components/system/BootScreen';
import { LockScreen } from './components/system/LockScreen';
import { SleepOverlay } from './components/system/SleepOverlay';
import { PowerDialog } from './components/system/PowerDialog';
import { AboutModal } from './components/system/AboutModal';
import { QuickLookModal } from './components/system/QuickLookModal';
import { ShutdownScreen } from './components/system/ShutdownScreen';

import { OnboardingModal } from './components/onboarding/OnboardingModal';

function OSWorkspace() {
  const {
    isBooting,
    isLocked,
    isSleeping,
    isShuttingDown,
    hasCompletedSetup,
  } = useOS();

  /**
   * ---------------------------------------------------------
   * 1. BOOT
   * ---------------------------------------------------------
   *
   * Boot has the highest priority.
   * While booting, nothing from the desktop should be rendered.
   */
  if (isBooting) {
    return <BootScreen />;
  }

  /**
   * ---------------------------------------------------------
   * 2. SHUTDOWN
   * ---------------------------------------------------------
   *
   * Shutdown has the next highest priority.
   *
   * IMPORTANT:
   * We intentionally return here instead of rendering
   * ShutdownScreen together with the desktop.
   *
   * This prevents:
   * - SleepOverlay from appearing over shutdown
   * - LockScreen from intercepting clicks
   * - Dock/MenuBar from remaining active
   * - PowerDialog from remaining active
   * - Desktop clicks from waking the system
   *
   * The ShutdownScreen itself controls the transition:
   *
   * Shutdown
   *    ↓
   * System Offline
   *    ↓
   * Click / Key
   *    ↓
   * restartSystem()
   *    ↓
   * BootScreen
   */
  if (isShuttingDown) {
    return <ShutdownScreen />;
  }

  /**
   * ---------------------------------------------------------
   * 3. NORMAL DESKTOP
   * ---------------------------------------------------------
   *
   * Only render the actual desktop when the system is not
   * booting and not shutting down.
   */
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-sans text-slate-100 select-none">
      {/* Desktop Background, Widgets & Desktop Icon Grid */}
      <Desktop />

      {/* Active Application Windows */}
      <WindowManager />

      {/* Top System Menu Bar */}
      <MenuBar />

      {/* Bottom Floating Glass Dock */}
      <Dock />

      {/* System Flyout Panels & Modals */}
      <ControlCenter />

      <Spotlight />

      <NotificationCenter />

      <MissionControl />

      <PowerDialog />

      <AboutModal />

      <QuickLookModal />

      {/* First-time Onboarding Setup Wizard */}
      {!hasCompletedSetup && <OnboardingModal />}

      {/**
       * -------------------------------------------------------
       * SYSTEM POWER STATES
       * -------------------------------------------------------
       *
       * These states are mutually exclusive at the UI level.
       *
       * Sleep gets priority over Lock because the original
       * SleepOverlay is responsible for waking the system.
       *
       * Shutdown is NOT rendered here because it already has
       * a complete early-return above.
       */}

      {isSleeping && <SleepOverlay />}

      {isLocked && !isSleeping && <LockScreen />}
    </div>
  );
}

export default function App() {
  return (
    <OSProvider>
      <OSWorkspace />
    </OSProvider>
  );
}


