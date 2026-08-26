import type { CSSProperties } from "react";

export const NEUTRAL_PLAYER_ACCENT = "#a5a9ae";

const PLAYER_ACCENT_PATTERN = /^#[0-9a-f]{6}$/i;
const MAX_PLAYER_ACCENT_LIGHTNESS = 0.62;
const LIGHT_ACCENT_THRESHOLD = 0.52;
const PALE_ACCENT_SATURATION_CEILING = 0.36;
const PALE_ACCENT_SATURATION_LIFT = 0.06;

export const isPlayerAccent = (color?: string): color is string =>
  Boolean(color && PLAYER_ACCENT_PATTERN.test(color.trim()));

type HslColor = {
  hue: number;
  saturation: number;
  lightness: number;
};

const hexToHsl = (hex: string): HslColor => {
  const red = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const green = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const chroma = maximum - minimum;
  const lightness = (maximum + minimum) / 2;

  if (chroma === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation = chroma / (1 - Math.abs(2 * lightness - 1));
  let hue: number;

  if (maximum === red) {
    hue = 60 * (((green - blue) / chroma) % 6);
  } else if (maximum === green) {
    hue = 60 * ((blue - red) / chroma + 2);
  } else {
    hue = 60 * ((red - green) / chroma + 4);
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation,
    lightness,
  };
};

const hslToHex = ({ hue, saturation, lightness }: HslColor) => {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const intermediate = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const offset = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    [red, green] = [chroma, intermediate];
  } else if (hue < 120) {
    [red, green] = [intermediate, chroma];
  } else if (hue < 180) {
    [green, blue] = [chroma, intermediate];
  } else if (hue < 240) {
    [green, blue] = [intermediate, chroma];
  } else if (hue < 300) {
    [red, blue] = [intermediate, chroma];
  } else {
    [red, blue] = [chroma, intermediate];
  }

  const channel = (value: number) =>
    Math.round((value + offset) * 255).toString(16).padStart(2, "0");

  return `#${channel(red)}${channel(green)}${channel(blue)}`;
};

const normalizePlayerAccent = (sourceAccent: string) => {
  const hsl = hexToHsl(sourceAccent);
  const saturation = hsl.lightness >= LIGHT_ACCENT_THRESHOLD
    && hsl.saturation < PALE_ACCENT_SATURATION_CEILING
    ? Math.min(
        PALE_ACCENT_SATURATION_CEILING,
        hsl.saturation + PALE_ACCENT_SATURATION_LIFT,
      )
    : hsl.saturation;

  return hslToHex({
    hue: hsl.hue,
    saturation,
    lightness: Math.min(hsl.lightness, MAX_PLAYER_ACCENT_LIGHTNESS),
  });
};

export const resolvePlayerAccent = (...candidates: Array<string | undefined>) => {
  const accent = candidates.find(isPlayerAccent);
  const sourceAccent = accent?.trim().toLowerCase() ?? NEUTRAL_PLAYER_ACCENT;

  return normalizePlayerAccent(sourceAccent);
};

export const withPlayerAccentQuery = (source: string, accent?: string) => {
  const color = encodeURIComponent(resolvePlayerAccent(accent));

  if (/([?&])color=[^&]*/i.test(source)) {
    return source.replace(/([?&])color=[^&]*/i, `$1color=${color}`);
  }

  return `${source}${source.includes("?") ? "&" : "?"}color=${color}`;
};

const accentChannel = (hex: string, start: number) =>
  Number.parseInt(hex.slice(start, start + 2), 16);

const alphaColor = (hex: string, alpha: number) =>
  `rgba(${accentChannel(hex, 1)}, ${accentChannel(hex, 3)}, ${accentChannel(hex, 5)}, ${alpha})`;

export type PlayerAccentStyle = CSSProperties & {
  "--player-accent": string;
  "--player-accent-soft": string;
  "--player-accent-border": string;
  "--player-accent-glow": string;
  "--player-accent-strong-glow": string;
};

export const playerAccentStyle = (...candidates: Array<string | undefined>): PlayerAccentStyle => {
  const accent = resolvePlayerAccent(...candidates);

  return {
    "--player-accent": accent,
    "--player-accent-soft": alphaColor(accent, 0.08),
    "--player-accent-border": alphaColor(accent, 0.44),
    "--player-accent-glow": alphaColor(accent, 0.12),
    "--player-accent-strong-glow": alphaColor(accent, 0.2),
  };
};
