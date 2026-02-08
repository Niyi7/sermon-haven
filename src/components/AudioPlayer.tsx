import { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, StickyNote, X } from "lucide-react";

interface AudioPlayerProps {
  currentSermon: { title: string; preacher: string } | null;
}

const AudioPlayer = ({ currentSermon }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  // Load notes from localStorage when sermon changes
  useEffect(() => {
    if (currentSermon) {
      const key = `sermon-notes-${currentSermon.title}`;
      const savedNotes = localStorage.getItem(key);
      setNotes(savedNotes || "");
    }
  }, [currentSermon?.title]);

  // Save notes to localStorage
  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (currentSermon) {
      const key = `sermon-notes-${currentSermon.title}`;
      localStorage.setItem(key, value);
    }
  };

  if (!currentSermon) return null;

  return (
    <>
      {/* Notes Panel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out ${
          showNotes ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-lg">
          <div className="mx-4 mb-20 rounded-t-2xl border border-b-0 border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-display text-sm font-semibold text-foreground">
                Sermon Notes
              </h3>
              <button
                onClick={() => setShowNotes(false)}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Jot down your thoughts while listening..."
                className="h-32 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Notes are saved automatically to your device.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
        {/* Progress bar */}
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Notes button */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`rounded-full p-2 transition-colors ${
              showNotes
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <StickyNote size={18} />
          </button>

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
          <div className="flex items-center gap-1">
            <button className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground">
              <SkipBack size={18} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground">
              <SkipForward size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioPlayer;
