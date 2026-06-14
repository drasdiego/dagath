import sharp from "sharp";

const cache = new Map<string, string | null>();

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function conditionColor(r: number, g: number, b: number): string {
  const [h, rawS, rawL] = rgbToHsl(r, g, b);
  const s = Math.min(Math.max(rawS, 0.35), 0.6);
  const l = Math.min(Math.max(rawL, 0.24), 0.44);
  const [nr, ng, nb] = hslToRgb(h, s, l);
  return "#" + [nr, ng, nb].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export const artColorService = {
  async getDominant(artUrl: string | null): Promise<string | null> {
    if (!artUrl) return null;
    if (cache.has(artUrl)) return cache.get(artUrl) ?? null;

    try {
      const response = await fetch(artUrl);
      if (!response.ok) {
        cache.set(artUrl, null);
        return null;
      }
      const buffer = Buffer.from(await response.arrayBuffer());

      const { data, info } = await sharp(buffer)
        .flatten({ background: { r: 0, g: 0, b: 0 } })
        .resize(48, 48, { fit: "inside" })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const channels = info.channels;
      let best: { score: number; r: number; g: number; b: number } | null = null;
      let fallback: { sat: number; r: number; g: number; b: number } | null = null;

      for (let i = 0; i < data.length; i += channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const [, s, l] = rgbToHsl(r, g, b);

        if (l < 0.08 || l > 0.92) continue;

        const score = s * (1 - Math.abs(l - 0.5) * 0.6);
        if (!best || score > best.score) {
          best = { score, r, g, b };
        }
        if (!fallback || s > fallback.sat) {
          fallback = { sat: s, r, g, b };
        }
      }

      const pick = best ?? fallback;
      if (!pick) {
        cache.set(artUrl, null);
        return null;
      }

      const color = conditionColor(pick.r, pick.g, pick.b);
      cache.set(artUrl, color);
      return color;
    } catch {
      cache.set(artUrl, null);
      return null;
    }
  },
};