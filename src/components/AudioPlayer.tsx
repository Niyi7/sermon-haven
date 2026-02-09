import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, StickyNote, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AudioPlayerProps {
  currentSermon: {
    title: string;
    preacher: string;
    telegramFileId?: string | null;
  } | null;
}

const AudioPlayer = ({ currentSermon }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Load notes from localStorage when sermon changes
  useEffect(() => {
    if (currentSermon) {
      const key = `sermon-notes-${currentSermon.title}`;
      const savedNotes = localStorage.getItem(key);
      setNotes(savedNotes || "");
    }
  }, [currentSermon?.title]);

  // Reset state when sermon changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setAudioUrl(null);
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [currentSermon?.title]);

  // Update progress bar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const fetchAudioUrl = async (fileId: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-audio-link", {
        body: { telegram_file_id: fileId },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      return data.url;
    } catch (err: any) {
      console.error("Failed to fetch audio URL:", err);
      setError("Could not load audio");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // If we already have a URL, just play
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Fetch URL from Telegram
    if (!currentSermon?.telegramFileId) {
      setError("No audio file available");
      return;
    }

    const url = await fetchAudioUrl(currentSermon.telegramFileId);
    if (url) {
      setAudioUrl(url);
      // Wait for next tick so the audio element src updates
      setTimeout(() => {
        audioRef.current?.play();
        setIsPlaying(true);
      }, 100);
    }
  };

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
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl || undefined} preload="auto" />

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
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : (
                currentSermon.preacher
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground">
              <SkipBack size={18} />
            </button>
            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} className="ml-0.5" />
              )}
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
