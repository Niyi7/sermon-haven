import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlayerSermon {
  id: string;
  title: string;
  preacherName: string;
  preacherId?: string;
  theme?: string;
  description?: string | null;
  telegramFileId?: string | null;
  preacherImage?: string | null;
}

export const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

interface PlayerContextValue {
  currentSermon: PlayerSermon | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  duration: number;
  currentTime: number;
  playbackSpeed: PlaybackSpeed;
  volume: number;
  isExpanded: boolean;
  playSermon: (sermon: PlayerSermon) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  cyclePlaybackSpeed: () => void;
  setPlaybackSpeed: (s: PlaybackSpeed) => void;
  setVolume: (v: number) => void;
  setExpanded: (e: boolean) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }

  const [currentSermon, setCurrentSermon] = useState<PlayerSermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState<PlaybackSpeed>(1);
  const [volume, setVolumeState] = useState(1);
  const [isExpanded, setExpanded] = useState(false);
  const fetchedFileIdRef = useRef<string | null>(null);

  // Attach audio listeners once
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onError = () => {
      setError("Could not load audio");
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Media Session API for lock-screen / background controls (iOS/Android)
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentSermon) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSermon.title,
      artist: currentSermon.preacherName,
      album: currentSermon.theme || "Sermon Library",
      artwork: currentSermon.preacherImage
        ? [{ src: currentSermon.preacherImage, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });
    navigator.mediaSession.setActionHandler("play", () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekforward", () => skipForward());
    navigator.mediaSession.setActionHandler("seekbackward", () => skipBackward());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSermon]);

  const loadAndPlay = useCallback(async (sermon: PlayerSermon) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!sermon.telegramFileId) {
      setError("No audio file available");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "get-audio-link",
        { body: { telegram_file_id: sermon.telegramFileId } }
      );
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      audio.src = data.url;
      audio.playbackRate = playbackSpeed;
      audio.volume = volume;
      fetchedFileIdRef.current = sermon.telegramFileId;
      await audio.play();
    } catch (e) {
      console.error(e);
      setError("Could not load audio");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [playbackSpeed, volume]);

  const playSermon = useCallback((sermon: PlayerSermon) => {
    const audio = audioRef.current;
    if (!audio) return;
    // Same sermon → just toggle resume
    if (currentSermon?.id === sermon.id && fetchedFileIdRef.current) {
      audio.play();
      return;
    }
    setCurrentSermon(sermon);
    setCurrentTime(0);
    setDuration(0);
    loadAndPlay(sermon);
  }, [currentSermon, loadAndPlay]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentSermon) return;
    if (isPlaying) {
      audio.pause();
    } else if (fetchedFileIdRef.current) {
      audio.play();
    } else {
      loadAndPlay(currentSermon);
    }
  }, [currentSermon, isPlaying, loadAndPlay]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
    setCurrentTime(audio.currentTime);
  }, []);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    seek(audio.currentTime + 30);
  }, [seek]);

  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    seek(audio.currentTime - 10);
  }, [seek]);

  const setPlaybackSpeed = useCallback((s: PlaybackSpeed) => {
    setPlaybackSpeedState(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }, []);

  const cyclePlaybackSpeed = useCallback(() => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    setPlaybackSpeed(next);
  }, [playbackSpeed, setPlaybackSpeed]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    fetchedFileIdRef.current = null;
    setCurrentSermon(null);
    setIsPlaying(false);
    setExpanded(false);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSermon,
        isPlaying,
        isLoading,
        error,
        duration,
        currentTime,
        playbackSpeed,
        volume,
        isExpanded,
        playSermon,
        togglePlay,
        seek,
        skipForward,
        skipBackward,
        cyclePlaybackSpeed,
        setPlaybackSpeed,
        setVolume,
        setExpanded,
        close,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
};

export const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};
