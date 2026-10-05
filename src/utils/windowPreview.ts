import type { WindowState } from '../types/desktop';

const windowPreviewCache = new Map<string, string>();

export const captureWindowPreview = async (appWindow: WindowState): Promise<void> => {
  if (!window.electronAPI?.captureWindowPreview) return;

  const target = Array.from(
    document.querySelectorAll<HTMLElement>('[data-window-id]'),
  ).find(element => element.dataset.windowId === appWindow.id);
  if (!target) return;

  const bounds = target.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return;

  try {
    const snapshot = await window.electronAPI.captureWindowPreview({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
    windowPreviewCache.set(appWindow.id, snapshot);
  } catch (error) {
    console.error(`Could not capture the ${appWindow.title} window preview:`, error);
  }
};

export const captureWindowPreviews = async (windows: WindowState[]): Promise<void> => {
  await Promise.all(
    windows
      .filter(appWindow => !appWindow.isMinimized)
      .map(captureWindowPreview),
  );
};

export const getWindowPreview = (windowId: string): string | undefined =>
  windowPreviewCache.get(windowId);

export const removeWindowPreview = (windowId: string): void => {
  windowPreviewCache.delete(windowId);
};
