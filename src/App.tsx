/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OSProvider, useOS } from './context/OSContext';
import { Desktop } from './components/desktop/Desktop';
import { WindowManager } from './components/windows/WindowManager';
import { MenuBar } from './components/menubar/MenuBar';
import { Dock } from './components/dock/Dock';
import { ControlCenter } from './components/controlcenter/ControlCenter';
import { Spotlight } from './components/spotlight/Spotlight';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { MissionControl } from './components/desktop/MissionControl';
import { BootScreen } from './components/system/BootScreen';
import { LockScreen } from './components/system/LockScreen';
import { SleepOverlay } from './components/system/SleepOverlay';
import { PowerDialog } from './components/system/PowerDialog';
import { AboutModal } from './components/system/AboutModal';
import { QuickLookModal } from './components/system/QuickLookModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';

function OSWorkspace() {
  const { isBooting, isLocked, isSleeping, hasCompletedSetup } = useOS();

  if (isBooting) {
    return <BootScreen />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-black text-slate-100 font-sans">
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

      {/* System Power States: Sleep & Lock */}
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
