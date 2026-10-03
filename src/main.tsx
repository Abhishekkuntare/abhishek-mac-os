import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import { initializeUITheme } from './services/uiTheme';

initializeUITheme();
const MobileShareApp = lazy(() => import('./components/apps/MobileShareApp').then(module => ({ default: module.MobileShareApp })));
const DesktopApp = lazy(() => import('./App.tsx'));
const app = window.location.pathname === '/mobile-share'
  ? <Suspense fallback={<div className="min-h-screen bg-slate-950" />}><MobileShareApp /></Suspense>
  : <Suspense fallback={<div className="min-h-screen bg-slate-950" />}><DesktopApp /></Suspense>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {app}
  </StrictMode>,
);
