import React, { useEffect, useRef, useState } from 'react';
import { getPhotoLibraryBlob } from '../../services/photoLibrary';

interface VideoWallpaperProps {
  mediaId: string;
  audioEnabled: boolean;
  className?: string;
}

export const VideoWallpaper: React.FC<VideoWallpaperProps> = ({
  mediaId,
  audioEnabled,
  className = '',
}) => {
  const [source, setSource] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const loadVideo = async () => {
      try {
        const blob = await getPhotoLibraryBlob(mediaId);
        if (!blob) {
          throw new Error('The selected live wallpaper video is no longer available in Photos.');
        }
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setSource(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (error) {
        console.error('[Wallpaper] Could not load the selected live video:', error);
      }
    };

    setSource(null);
    void loadVideo();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;

    video.muted = !audioEnabled;
    const syncPlayback = () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      void video.play().catch(error => {
        console.warn('[Wallpaper] Video playback could not start:', error);
      });
    };

    document.addEventListener('visibilitychange', syncPlayback);
    video.addEventListener('canplay', syncPlayback);
    syncPlayback();
    return () => {
      document.removeEventListener('visibilitychange', syncPlayback);
      video.removeEventListener('canplay', syncPlayback);
    };
  }, [audioEnabled, source]);

  if (!source) return null;

  return (
    <video
      ref={videoRef}
      key={source}
      src={source}
      loop
      playsInline
      muted={!audioEnabled}
      preload="auto"
      disablePictureInPicture
      aria-label="Live desktop wallpaper"
      onError={() => console.error('[Wallpaper] The selected live wallpaper video could not be decoded.')}
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover [backface-visibility:hidden] [transform:translateZ(0)] ${className}`}
    />
  );
};
