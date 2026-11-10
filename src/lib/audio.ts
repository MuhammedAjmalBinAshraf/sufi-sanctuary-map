export const AUDIO_STORAGE_KEY = "sufi-map:audio";
export const AUDIO_VOLUME = 0.35;

export interface AudioPreferences {
  paused: boolean;
  muted: boolean;
}

export function parseAudioPreferences(raw: unknown): AudioPreferences {
  const value = raw && typeof raw === "object" ? raw as Partial<AudioPreferences> : {};
  return { paused: value.paused === true, muted: value.muted === true };
}