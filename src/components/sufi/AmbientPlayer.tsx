import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import qiraat from "../../../public/qiraat.webm.asset.json";
import { Button } from "@/components/ui/button";
import { AUDIO_STORAGE_KEY, AUDIO_VOLUME, parseAudioPreferences, type AudioPreferences } from "@/lib/audio";
import { useI18n } from "@/lib/i18n";

/** One continuous, browser-only recitation across page navigation. */
export function AmbientPlayer() {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const preferences = useRef<AudioPreferences>({ paused: false, muted: false });
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = audioRef.current;
    if (!audio) return;
    try {
      preferences.current = parseAudioPreferences(JSON.parse(window.localStorage.getItem(AUDIO_STORAGE_KEY) ?? "null"));
    } catch { /* Storage may be unavailable; use soft autoplay defaults. */ }
    audio.volume = AUDIO_VOLUME;
    audio.muted = preferences.current.muted;
    audio.setAttribute("playsinline", "");
    setMuted(audio.muted);
    let active = true;
    let pending = false;

    const stopListening = () => {
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      window.removeEventListener("touchend", onInteraction);
    };
    const start = async () => {
      if (!active || pending || preferences.current.paused) return;
      pending = true;
      try {
        await audio.play();
        if (!active || preferences.current.paused) audio.pause();
        else stopListening();
      } catch { /* Keep the interaction fallback armed when autoplay is blocked. */ }
      finally { pending = false; }
    };
    function onInteraction(event: Event) {
      // The player's own controls handle their intent without racing autoplay.
      if (event.target instanceof Node && panelRef.current?.contains(event.target)) return;
      void start();
    }
    window.addEventListener("pointerdown", onInteraction);
    window.addEventListener("keydown", onInteraction);
    window.addEventListener("touchend", onInteraction);
    void start();
    return () => { active = false; stopListening(); audio.pause(); };
  }, []);

  const save = (patch: Partial<AudioPreferences>) => {
    preferences.current = { ...preferences.current, ...patch };
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(preferences.current)); }
    catch { /* Controls still work when storage is blocked. */ }
  };

  const togglePlayback = async () => {
    if (typeof window === "undefined") return;
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { save({ paused: true }); audio.pause(); return; }
    save({ paused: false });
    setFailed(false);
    if (audio.error) audio.load();
    try { await audio.play(); }
    catch { if (audio.error) setFailed(true); }
  };

  const toggleMute = () => {
    if (typeof window === "undefined") return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    save({ muted: audio.muted });
  };

  return (
    <div ref={panelRef} role="group" aria-label={t("qiraat")} className="fixed start-3 bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-30 flex h-14 max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-[14px] border bg-card/95 px-2 ps-3 shadow-float backdrop-blur md:start-5 md:bottom-5">
      <audio ref={audioRef} src={qiraat.url} loop preload="auto" onPlaying={() => { setPlaying(true); setFailed(false); }} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} />
      <span aria-hidden="true" data-playing={playing && !muted} className="qiraat-wave flex h-5 w-5 shrink-0 items-center justify-center gap-0.5 text-primary">
        <span /><span /><span /><span />
      </span>
      <span className="text-sm font-medium">{t("qiraat")}</span>
      <Button variant="ghost" size="icon" onClick={() => void togglePlayback()} aria-label={t(playing ? "audioPause" : "audioPlay")} title={t(playing ? "audioPause" : "audioPlay")} className="size-10 shrink-0 text-primary">
        {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
      </Button>
      <Button variant="ghost" size="icon" onClick={toggleMute} aria-label={t(muted ? "audioUnmute" : "audioMute")} title={t(muted ? "audioUnmute" : "audioMute")} aria-pressed={muted} className="size-10 shrink-0 text-primary">
        {muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
      </Button>
      {failed && <span role="status" className="absolute start-0 bottom-full mb-2 w-56 rounded-[14px] border bg-card p-3 text-sm text-muted-foreground shadow-float">{t("audioError")}</span>}
    </div>
  );
}