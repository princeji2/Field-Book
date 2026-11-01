// scripts/generate-icons.mjs
// One-shot PWA icon generator. Run with: node scripts/generate-icons.mjs
//
// Reproduces the Fieldbook CertificateSeal geometry (see src/app/shared.tsx)
// as a standalone SVG, rasterizes it with @resvg/resvg-js, and writes the
// PWA icon set into public/. The arc text from the on-screen component is
// intentionally omitted: it relies on IBM Plex Mono being loaded in the DOM
// and would be illegible at icon sizes. The tick-ring, disc, inner rings and
// check mark are preserved so the mark stays recognisable.
//
// Palette is locked to the Fieldbook design system:
//   seal fill  #E2A23B (marigold)
//   ink        #1E1B16
//   background #F6F1E7 (paper)

import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "..", "public");

const PAPER = "#F6F1E7";
const MARIGOLD = "#E2A23B";
const INK = "#1E1B16";

/**
 * Builds the seal as an SVG group centred in a `box`-sized viewBox, with the
 * seal diameter = `sealSize`. Geometry mirrors CertificateSeal in shared.tsx
 * (tick polygon, filled disc, two inner stroke circles, check path), scaled
 * to the requested seal size. rotate is applied so it reads hand-stamped.
 */
function sealGroup(box, sealSize, rotate = -8) {
  const r = sealSize / 2;
  const cx = box / 2;
  const cy = box / 2;

  const pts = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r - 1 : r - 5.5;
    return `${(r + Math.cos(a) * rad).toFixed(2)},${(r + Math.sin(a) * rad).toFixed(2)}`;
  }).join(" ");

  const sw = Math.max(1.5, sealSize * 0.027);
  // check mark, same relative coords as the component
  const check = `M${(r - r * 0.22).toFixed(2)},${(r + r * 0.04).toFixed(2)} ` +
                `L${(r - r * 0.03).toFixed(2)},${(r + r * 0.22).toFixed(2)} ` +
                `L${(r + r * 0.26).toFixed(2)},${(r - r * 0.18).toFixed(2)}`;

  // Stroke widths on the inner rings scale with the seal (component uses 0.75
  // at size 88 -> ~0.0085 * size).
  const ringSw = Math.max(0.75, sealSize * 0.0085);
  const dash = `${sealSize * 0.0227} ${sealSize * 0.017}`;

  return `
  <g transform="translate(${(cx - r).toFixed(2)},${(cy - r).toFixed(2)}) rotate(${rotate} ${r} ${r})">
    <polygon points="${pts}" fill="${MARIGOLD}" />
    <circle cx="${r}" cy="${r}" r="${(r - sealSize * 0.09).toFixed(2)}" fill="${MARIGOLD}" />
    <circle cx="${r}" cy="${r}" r="${(r - sealSize * 0.119).toFixed(2)}" fill="none" stroke="${INK}" stroke-width="${ringSw.toFixed(2)}" />
    <circle cx="${r}" cy="${r}" r="${(r - sealSize * 0.199).toFixed(2)}" fill="none" stroke="${INK}" stroke-width="${ringSw.toFixed(2)}" stroke-dasharray="${dash}" />
    <path d="${check}" stroke="${INK}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>`;
}

/**
 * Full square icon SVG. `sealFraction` controls how much of the square the
 * seal occupies — smaller for maskable so nothing is clipped inside the
 * platform safe zone (~80% safe area, so seal <= ~66% keeps it well inside).
 */
function iconSvg(px, { transparentBg = false, sealFraction = 0.72 } = {}) {
  const sealSize = Math.round(px * sealFraction);
  const bg = transparentBg
    ? ""
    : `<rect width="${px}" height="${px}" fill="${PAPER}" />`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
  ${bg}
  ${sealGroup(px, sealSize)}
</svg>`;
}

function rasterize(svg, px) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: px } });
  return resvg.render().asPng();
}

function write(name, svg, px) {
  const png = rasterize(svg, px);
  writeFileSync(resolve(PUBLIC, name), png);
  console.log(`  wrote public/${name} (${px}x${px}, ${png.length} bytes)`);
}

console.log("Generating Fieldbook PWA icons ->");

// Standard any-purpose icons: seal on solid paper background.
write("pwa-192x192.png", iconSvg(192, { sealFraction: 0.78 }), 192);
write("pwa-512x512.png", iconSvg(512, { sealFraction: 0.78 }), 512);

// Maskable: more padding so the platform mask never clips the seal.
write("pwa-maskable-512x512.png", iconSvg(512, { sealFraction: 0.62 }), 512);

// Apple touch icon (iOS applies its own rounded mask; keep a little padding).
write("apple-touch-icon.png", iconSvg(180, { sealFraction: 0.74 }), 180);

// Favicons.
write("favicon-32x32.png", iconSvg(32, { sealFraction: 0.84 }), 32);
write("favicon-16x16.png", iconSvg(16, { sealFraction: 0.86 }), 16);

console.log("Done.");
