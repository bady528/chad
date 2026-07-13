import React, { useRef, useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Volume1, 
  Gauge, 
  Loader2, 
  Flame, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { downloadBlob } from "../utils/audio";

interface AudioPlayerProps {
  combinedBlob: Blob | null;
  combinedUrl: string | null;
  isGeneratingAll: boolean;
  onGenerateAll: () => void;
  segmentsCount: number;
  readySegmentsCount: number;
  totalLength: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  combinedBlob,
  combinedUrl,
  isGeneratingAll,
  onGenerateAll,
  segmentsCount,
  readySegmentsCount,
  totalLength,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Sync state with HTML5 audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, combinedUrl]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [combinedUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !combinedUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    setIsMuted(value === 0);
    if (audioRef.current) {
      audioRef.current.volume = value;
      audioRef.current.muted = value === 0;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  const skipTime = (amount: number) => {
    if (audioRef.current) {
      let newTime = audioRef.current.currentTime + amount;
      if (newTime < 0) newTime = 0;
      if (newTime > duration) newTime = duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleDownload = () => {
    if (combinedBlob) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      downloadBlob(combinedBlob, `Tagalog-TTS-Combined-${timestamp}.wav`);
    }
  };

  // Format time in mm:ss format
  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return "00:00";
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Determine volume icon
  const VolumeIcon = isMuted ? VolumeX : volume < 0.3 ? Volume1 : Volume2;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      {/* Main Trigger & Info Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-100 font-sans tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              Continuous Synthesis Player
            </h2>
            <p className="text-xs text-slate-400 leading-normal">
              Click Generate to synthesize all segments sequentially and merge them into a single track.
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerateAll}
            disabled={isGeneratingAll || segmentsCount === 0}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50 flex items-center justify-center space-x-2 w-full md:w-auto hover:scale-[1.02] active:scale-[0.98]"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating ({readySegmentsCount}/{segmentsCount})...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>Generate Combined Voice</span>
              </>
            )}
          </button>
        </div>

        {/* Progress meters for generation */}
        {segmentsCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-medium">Synthesis Progress</span>
              <span className="font-mono">{readySegmentsCount} of {segmentsCount} parts ready</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${(readySegmentsCount / segmentsCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* HTML5 Hidden Audio Tag */}
      {combinedUrl && (
        <audio
          ref={audioRef}
          src={combinedUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* Main Physical Player Canvas */}
      <div className={`border rounded-xl p-5 ${
        combinedUrl 
          ? "bg-slate-950/80 border-slate-800" 
          : "bg-slate-950/30 border-slate-900/50 opacity-60"
      } transition-all`}>
        {combinedUrl ? (
          <div className="space-y-4">
            {/* Visualizer bars */}
            <div className="flex items-center justify-center space-x-1.5 h-10 w-full px-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((bar) => {
                // Generate a pseudo-random animation delay and height
                const delay = (bar * 0.1).toFixed(1);
                const baseHeight = [12, 24, 32, 16, 40, 20, 8, 36, 14, 28][bar % 10];
                return (
                  <div
                    key={bar}
                    className="w-1 bg-emerald-500/80 rounded-full transition-all duration-300"
                    style={{
                      height: isPlaying ? `${baseHeight}px` : "4px",
                      animation: isPlaying ? `bounceWave 1s ease-in-out infinite alternate` : undefined,
                      animationDelay: `${delay}s`,
                    }}
                  />
                );
              })}
            </div>

            {/* Custom Seek Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg bg-slate-800"
              />
            </div>

            {/* Controls panel */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              {/* Playback speed buttons */}
              <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-850">
                <Gauge className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-mono text-slate-400 mr-1.5">Speed:</span>
                {[0.8, 1.0, 1.2, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPlaybackRate(rate)}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all ${
                      playbackRate === rate
                        ? "bg-emerald-500 text-slate-950 font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Central Trigger Controls */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => skipTime(-10)}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-4 rounded-full transition-all shadow-md shadow-emerald-500/20 hover:scale-105"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-slate-950 fill-slate-950" />
                  ) : (
                    <Play className="w-5 h-5 text-slate-950 fill-slate-950 ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => skipTime(10)}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1 rotate-180"
                  title="Forward 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Volume sliders */}
              <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-850 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <VolumeIcon className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 accent-emerald-500 cursor-pointer h-1 rounded-lg bg-slate-800"
                />
              </div>
            </div>

            {/* Huge 1-click Combined download block */}
            <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-sans flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Single Merged WAV file • 24000Hz PCM Linear</span>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="bg-emerald-950/50 hover:bg-emerald-950 border border-emerald-500/80 text-emerald-300 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                <span>Download Merged Audio (One Click)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <Pause className="w-5 h-5 fill-current" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-400">Combined Audio Offline</p>
              <p className="text-xs text-slate-500 max-w-xs leading-normal">
                {segmentsCount === 0 
                  ? "Type or paste some text in the left panel to begin." 
                  : "Click 'Generate Combined Voice' above to synthesize all parts and enable player controls."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bounce keyframe stylesheet injected inline */}
      <style>{`
        @keyframes bounceWave {
          0% { height: 4px; }
          100% { height: 36px; }
        }
      `}</style>
    </div>
  );
};
