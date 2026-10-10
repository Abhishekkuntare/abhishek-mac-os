export type NotchCameraCaptureKind = 'photo' | 'video';

export const NOTCH_CAMERA_CAPTURE_REQUEST_EVENT = 'arlo:notch-camera-capture-request';

export interface NotchCameraCaptureRequest {
  kind: NotchCameraCaptureKind;
  durationSeconds?: number;
  resolve: (result: { success: boolean; result: string }) => void;
}

export const requestNotchCameraCapture = (
  kind: NotchCameraCaptureKind,
  durationSeconds?: number,
): Promise<{ success: boolean; result: string }> => new Promise(resolve => {
  let settled = false;
  const finish = (result: { success: boolean; result: string }) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeout);
    resolve(result);
  };
  const timeout = window.setTimeout(() => {
    finish({ success: false, result: 'Camera approval timed out. No capture was made.' });
  }, 60_000);
  window.dispatchEvent(new CustomEvent<NotchCameraCaptureRequest>(NOTCH_CAMERA_CAPTURE_REQUEST_EVENT, {
    detail: { kind, durationSeconds, resolve: finish },
  }));
});
