import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";

interface AudioPlayerProps {
  currentSermon: { title: string; preacher: string } | null;
}

const AudioPlayer = ({ currentSermon }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);

  if (!currentSermon) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
      {/* Progress bar */}
      <div className="h-1 w-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {currentSermon.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {currentSermon.preacher}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground">
            <SkipBack size={18} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground">
            <SkipForward size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
