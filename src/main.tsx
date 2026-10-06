import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import { initializeUITheme } from './services/uiTheme';

initializeUITheme();
const MobileShareApp = lazy(() => import('./components/apps/MobileShareApp').then(module => ({ default: module.MobileShareApp })));
const ShareReceiveApp = lazy(() => import('./components/apps/ShareReceiveApp').then(module => ({ default: module.ShareReceiveApp })));
const DesktopApp = lazy(() => import('./App.tsx'));
const app = window.location.pathname === '/mobile-share'
  ? <Suspense fallback={<div className="min-h-screen bg-slate-950" />}><MobileShareApp /></Suspense>
  : window.location.pathname === '/share-receive'
    ? <Suspense fallback={<div className="min-h-screen bg-slate-950" />}><ShareReceiveApp /></Suspense>
  : <Suspense fallback={<div className="min-h-screen bg-slate-950" />}><DesktopApp /></Suspense>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {app}
  </StrictMode>,
);
