import React from 'react';

import appStoreIcon from '../../assets/app-icons/appstore.png';
import browserIcon from '../../assets/app-icons/browser.png';
import calculatorIcon from '../../assets/app-icons/calculator.png';
import calendarIcon from '../../assets/app-icons/calender.png';
import cameraIcon from '../../assets/app-icons/camera.png';
import clockIcon from '../../assets/app-icons/clock.png';
import codeStudioIcon from '../../assets/app-icons/codestudio.png';
import documentsIcon from '../../assets/app-icons/documents.png';
import finderIcon from '../../assets/app-icons/finder.png';
import folderIcon from '../../assets/app-icons/folder.png';
import gamesIcon from '../../assets/app-icons/gamecenter.jpg';
import ghostAiIcon from '../../assets/app-icons/ghostai.png';
import mobileIcon from '../../assets/app-icons/iphonemirriong.png';
import nextpadIcon from '../../assets/app-icons/nextpad.png';
import notesIcon from '../../assets/app-icons/notes.png';
import photosIcon from '../../assets/app-icons/photos.png';
import pdfIcon from '../../assets/app-icons/pdf.png';
import remindersIcon from '../../assets/app-icons/reminders.png';
import settingsIcon from '../../assets/app-icons/setting.png';
import terminalIcon from '../../assets/app-icons/terminal.png';
import trashIcon from '../../assets/app-icons/trash.png';
import tvIcon from '../../assets/app-icons/abhishekTV.png';
import weatherIcon from '../../assets/app-icons/weather.png';
import myPcDriveIcon from '../../assets/app-icons/mac-drive.png';

const APP_ICON_ASSETS: Record<string, string> = {
  appstore: appStoreIcon,
  browser: browserIcon,
  calculator: calculatorIcon,
  calendar: calendarIcon,
  camera: cameraIcon,
  clock: clockIcon,
  codestudio: codeStudioIcon,
  folder: folderIcon,
  finder: finderIcon,
  gamecenter: gamesIcon,
  ghostai: ghostAiIcon,
  mobile: mobileIcon,
  nextpad: nextpadIcon,
  notes: notesIcon,
  photos: photosIcon,
  pdf: pdfIcon,
  pcdrive: myPcDriveIcon,
  reminders: remindersIcon,
  settings: settingsIcon,
  terminal: terminalIcon,
  trash: trashIcon,
  tv: tvIcon,
  weather: weatherIcon,
};

export const getAppIconAsset = (appId?: string): string | undefined =>
  appId ? APP_ICON_ASSETS[appId] : undefined;

interface AppIconProps {
  appId?: string;
  assetId?: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}

export const AppIcon: React.FC<AppIconProps> = ({
  appId,
  assetId,
  className,
  style,
  fallback = null,
}) => {
  const resolvedAssetId = assetId ?? appId;
  const source = getAppIconAsset(resolvedAssetId);

  if (!source) return <>{fallback}</>;

  return (
    <img
      src={source}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={`${className ?? ''} ${resolvedAssetId === 'gamecenter' ? 'scale-[0.8]' : ''}`.trim()}
      style={style}
    />
  );
};
