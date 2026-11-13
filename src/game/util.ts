export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function mix(n: number) {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 2246822507);
  x = Math.imul(x ^ (x >>> 13), 3266489909);
  return (x ^= x >>> 16) >>> 0;
}

export function unit(seed: number, a = 0, b = 0, c = 0) {
  const h =
    (seed | 0) +
    Math.imul(a | 0, 374761393) +
    Math.imul(b | 0, 668265263) +
    Math.imul(c | 0, 1440673247);
  return mix(h) / 4294967296;
}

export function money(n: number) {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(Math.round(n));
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    const digits = m >= 10 ? 1 : 2;
    return `${sign}£${m.toFixed(digits)}m`;
  }
  if (v >= 10_000) return `${sign}£${Math.round(v / 1000)}k`;
  return `${sign}£${v.toLocaleString("en-GB")}`;
}

export function inkFor(hex: string) {
  const raw = hex.replace("#", "");
  const n = Number.parseInt(raw, 16);
  if (!Number.isFinite(n)) return "#142016";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const y = (r * 299 + g * 587 + b * 114) / 1000;
  return y > 160 ? "#142016" : "#f3f7f4";
}

export function shortName(name: string) {
  const letters = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 3);
  return (letters + "FC").slice(0, 3);
}
