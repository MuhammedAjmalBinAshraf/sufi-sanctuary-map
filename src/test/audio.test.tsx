import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AmbientPlayer } from "@/components/sufi/AmbientPlayer";
import { I18nProvider } from "@/lib/i18n";
import { AUDIO_STORAGE_KEY, AUDIO_VOLUME, parseAudioPreferences } from "@/lib/audio";

describe("ambient recitation", () => {
  let play: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    window.localStorage.clear();
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: false });
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: true });
      this.dispatchEvent(new Event("pause"));
    });
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  const mount = () => render(<I18nProvider><AmbientPlayer /></I18nProvider>);

  it("starts at 35% volume and loops on arrival", async () => {
    const { container } = mount();
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    const audio = container.querySelector("audio");
    expect(audio?.volume).toBe(AUDIO_VOLUME);
    expect(audio?.volume).toBe(0.35);
    expect(audio?.loop).toBe(true);
  });
  it("retries blocked autoplay on the first interaction", async () => {
    play.mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"));
    mount();
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    fireEvent.pointerDown(window);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
  });
  it("remembers pause and does not restart on interaction after refresh", async () => {
    const view = mount();
    fireEvent.click(await view.findByRole("button", { name: "Pause Qira'at" }));
    expect(JSON.parse(window.localStorage.getItem(AUDIO_STORAGE_KEY) ?? "null").paused).toBe(true);
    view.unmount();
    play.mockClear();
    mount();
    fireEvent.pointerDown(window);
    expect(play).not.toHaveBeenCalled();
  });
  it("remembers mute across refreshes and allows unmuting", () => {
    const view = mount();
    fireEvent.click(view.getByRole("button", { name: "Mute Qira'at" }));
    view.unmount();
    const restored = mount();
    expect(restored.container.querySelector("audio")?.muted).toBe(true);
    fireEvent.click(restored.getByRole("button", { name: "Unmute Qira'at" }));
    expect(restored.container.querySelector("audio")?.muted).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(AUDIO_STORAGE_KEY) ?? "null").muted).toBe(false);
  });
  it("ignores malformed preferences", () => {
    expect(parseAudioPreferences({ paused: "yes", muted: 1 })).toEqual({ paused: false, muted: false });
  });
});