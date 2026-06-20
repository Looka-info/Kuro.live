'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

interface VideoPlayerProps {
  sources: { url: string; quality: string; isM3U8: boolean }[];
  poster?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  fill?: boolean;
  className?: string;
}

export function VideoPlayer({ sources, poster, onProgress, onEnded, fill = false, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentQuality, setCurrentQuality] = useState(sources[0]?.url || '');
  const [showSettings, setShowSettings] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!currentQuality && sources.length > 0) {
      setCurrentQuality(sources[0].url);
    }
    if (currentQuality && !sources.some(source => source.url === currentQuality) && sources.length > 0) {
      setCurrentQuality(sources[0].url);
    }
  }, [sources, currentQuality]);

  useEffect(() => {
    if (!videoRef.current || !currentQuality) return;

    let hls: Hls;

    if (currentQuality.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls({
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferLength: 30,
      });
      hls.loadSource(currentQuality);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Auto play on quality switch if it was already playing
        if (isPlaying) videoRef.current?.play();
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = currentQuality;
    } else {
      videoRef.current.src = currentQuality;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [currentQuality, isPlaying]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('pointerdown', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('pointerdown', handleMouseMove);
      }
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Animate controls
  useEffect(() => {
    if (!controlsRef.current) return;
    if (showControls) {
      gsap.to(controlsRef.current, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', display: 'flex' });
    } else {
      gsap.to(controlsRef.current, { opacity: 0, y: 20, duration: 0.3, ease: 'power2.in', onComplete: () => {
        if (controlsRef.current) controlsRef.current.style.display = 'none';
      }});
    }
  }, [showControls]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) {
      setVolume(1);
      videoRef.current.volume = 1;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress(videoRef.current.currentTime);
    onProgress?.(videoRef.current.currentTime, videoRef.current.duration);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setProgress(val);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 85; // Skip 1:25 OP
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black w-full overflow-hidden group',
        isFullscreen
          ? 'h-screen'
          : fill
            ? 'h-full rounded-xl shadow-lg border border-kuro-border'
            : 'aspect-video rounded-xl shadow-lg border border-kuro-border',
        className,
      )}
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
          togglePlay();
        }
      }}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => { setIsPlaying(false); onEnded?.(); }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Buffering Indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 data-[waiting=true]:opacity-100 transition-opacity">
        <div className="w-12 h-12 border-4 border-kuro-primary border-t-transparent rounded-full animate-spin shadow-red-glow" />
      </div>

      {/* Controls Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-300 pointer-events-none"
        style={{ opacity: showControls ? 1 : 0 }}
      />

      {/* Settings Menu */}
      {showSettings && showControls && (
        <div className="absolute bottom-20 right-2 bg-kuro-surface border border-kuro-border rounded-lg p-2 z-50 w-44 shadow-xl sm:right-4 sm:w-48">
          <p className="text-xs text-kuro-dim px-2 pb-2 mb-2 border-b border-kuro-border">Quality</p>
          {sources.map(s => (
            <button
              key={s.quality}
              onClick={(e) => {
                e.stopPropagation();
                const time = videoRef.current?.currentTime || 0;
                setCurrentQuality(s.url);
                setTimeout(() => {
                  if (videoRef.current) videoRef.current.currentTime = time;
                }, 500);
                setShowSettings(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                currentQuality === s.url ? 'bg-kuro-primary/20 text-kuro-primary font-medium' : 'text-kuro-muted hover:bg-kuro-surface2 hover:text-white'
              )}
            >
              {s.quality}
            </button>
          ))}
        </div>
      )}

      {/* Controls Bar */}
      <div
        ref={controlsRef}
        className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 z-40"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          <span className="text-[10px] text-white font-medium w-8 sm:w-10">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-kuro-surface2 rounded-full appearance-none cursor-pointer accent-kuro-primary"
            style={{
              background: `linear-gradient(to right, #e11d48 ${(progress / duration) * 100}%, #2a2a2a ${(progress / duration) * 100}%)`
            }}
          />
          <span className="text-[10px] text-kuro-dim font-medium w-8 sm:w-10">{formatTime(duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button onClick={togglePlay} className="text-white hover:text-kuro-primary transition-colors focus:outline-none">
              {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
            </button>

            <button onClick={skipForward} className="flex items-center gap-1.5 text-[10px] font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded transition-colors focus:outline-none sm:text-xs sm:px-2.5">
              <SkipForward size={14} /> <span className="hidden xs:inline">Skip OP</span>
            </button>

            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-kuro-primary transition-colors focus:outline-none">
                {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden h-1.5 accent-white transition-all duration-300 sm:block sm:w-0 sm:opacity-0 sm:group-hover/vol:w-20 sm:group-hover/vol:opacity-100"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <button onClick={() => setShowSettings(!showSettings)} className="text-white hover:text-kuro-primary transition-colors focus:outline-none relative">
              <Settings />
            </button>
            <button onClick={toggleFullscreen} className="text-white hover:text-kuro-primary transition-colors focus:outline-none">
              <Maximize />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
