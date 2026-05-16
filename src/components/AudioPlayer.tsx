import {
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Loader2,
  Rewind,
  FastForward,
  Gauge,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { usePlayer, formatTime } from "@/contexts/PlayerContext";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const AudioPlayer = () => {
  const {
    currentSermon,
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
    playbackSpeed,
    volume,
    isExpanded,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    cyclePlaybackSpeed,
    setVolume,
    setExpanded,
    close,
  } = usePlayer();

  if (!currentSermon) return null;

  const remaining = Math.max(0, duration - currentTime);

  const PlayPauseBtn = ({ size = 18, big = false }: { size?: number; big?: boolean }) => (
    <button
      onClick={togglePlay}
      disabled={isLoading}
      className={`flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 ${
        big ? "h-16 w-16" : "h-10 w-10"
      }`}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {isLoading ? (
        <Loader2 size={big ? 28 : size} className="animate-spin" />
      ) : isPlaying ? (
        <Pause size={big ? 28 : size} />
      ) : (
        <Play size={big ? 28 : size} className="ml-0.5" />
      )}
    </button>
  );

  return (
    <>
      {/* Sticky mini bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/50 bg-card/95 backdrop-blur-md shadow-[0_-8px_32px_-12px_rgba(28,26,23,0.12)] sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[min(640px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:border-stone-200/60 sm:shadow-[var(--shadow-lift)]">
        <div
          className="h-1 w-full bg-secondary cursor-pointer sm:rounded-t-2xl overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            seek(ratio * duration);
          }}
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
          />
        </div>

        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => setExpanded(true)}
        >
          {currentSermon.preacherImage && (
            <img
              src={currentSermon.preacherImage}
              alt=""
              className="h-10 w-10 rounded-md object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {currentSermon.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : (
                currentSermon.preacherName
              )}
            </p>
          </div>

          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={skipBackward}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Rewind 10 seconds"
            >
              <Rewind size={18} />
            </button>
            <PlayPauseBtn />
            <button
              onClick={skipForward}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Skip 30 seconds"
            >
              <FastForward size={18} />
            </button>
            <button
              onClick={() => setExpanded(true)}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Expand player"
            >
              <ChevronUp size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded full-screen / drawer view */}
      <Sheet open={isExpanded} onOpenChange={setExpanded}>
        <SheetContent
          side="bottom"
          className="h-[100dvh] w-full border-0 bg-gradient-to-b from-background via-background to-secondary/40 p-0 sm:max-w-none"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5">
              <button
                onClick={() => setExpanded(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Minimize"
              >
                <ChevronDown size={22} />
              </button>
              <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                Now Playing
              </span>
              <button
                onClick={close}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Close player"
              >
                <X size={20} />
              </button>
            </div>

            {/* Artwork */}
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-6">
              <div className="aspect-square w-full max-w-xs overflow-hidden rounded-3xl bg-secondary shadow-2xl ring-1 ring-border">
                <img
                  src={currentSermon.preacherImage || "/placeholder.svg"}
                  alt={currentSermon.preacherName}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-8 w-full max-w-md text-center">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {currentSermon.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentSermon.preacherName}
                  {currentSermon.theme ? ` · ${currentSermon.theme}` : ""}
                </p>
                {currentSermon.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground/90">
                    {currentSermon.description}
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mx-auto w-full max-w-md px-6 pb-8">
              {/* Scrubber */}
              <Slider
                value={[currentTime]}
                max={duration || 1}
                step={1}
                onValueChange={(v) => seek(v[0])}
                className="mb-2"
              />
              <div className="mb-6 flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(remaining)}</span>
              </div>

              {/* Main controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={skipBackward}
                  className="flex flex-col items-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Rewind 10 seconds"
                >
                  <Rewind size={28} />
                  <span className="mt-0.5 text-[10px] font-medium">10s</span>
                </button>
                <PlayPauseBtn big />
                <button
                  onClick={skipForward}
                  className="flex flex-col items-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Skip 30 seconds"
                >
                  <FastForward size={28} />
                  <span className="mt-0.5 text-[10px] font-medium">30s</span>
                </button>
              </div>

              {/* Secondary controls */}
              <div className="mt-8 flex items-center justify-between gap-4">
                <button
                  onClick={cyclePlaybackSpeed}
                  className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70"
                  aria-label="Change playback speed"
                >
                  <Gauge size={14} />
                  {playbackSpeed}x
                </button>

                <div className="flex flex-1 items-center gap-2">
                  <button
                    onClick={() => setVolume(volume > 0 ? 0 : 1)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Toggle mute"
                  >
                    {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <Slider
                    value={[volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(v) => setVolume(v[0] / 100)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AudioPlayer;
