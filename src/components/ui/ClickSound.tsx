import { useEffect, useRef } from "react";

const clickableSelector = [
  "button",
  "a",
  "[role='button']",
  ".mapboxgl-marker",
  ".mapboxgl-canvas",
].join(",");

export function ClickSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/sounds/ui-click.wav");
    audio.preload = "auto";
    audio.volume = 0.18;
    audioRef.current = audio;

    function playClickSound(event: PointerEvent) {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const clickable = target.closest(clickableSelector);
      if (!clickable) return;

      const sound = audioRef.current;
      if (!sound) return;
      sound.currentTime = 0;
      void sound.play().catch(() => {});
    }

    document.addEventListener("pointerdown", playClickSound, { capture: true });
    return () => document.removeEventListener("pointerdown", playClickSound, { capture: true });
  }, []);

  return null;
}
