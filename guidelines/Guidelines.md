# Fieldbook Design System

**Lock status: frozen.** Do not alter colors, typefaces, border weight, motion behavior, or the Seal motif on any screen. Add new components using only this vocabulary.

---

## Color palette

Eight values. No others — no tints, no gradients, no off-palette neutrals.

| Token | Hex | CSS var | Role |
|---|---|---|---|
| Paper | `#F6F1E7` | `--background` | Page background |
| Surface | `#FCFAF3` | `--card` | Cards, panels, raised surfaces |
| Ink | `#1E1B16` | `--foreground` | All text, borders, icons |
| Muted | `#6B6355` | `--muted-foreground` | Secondary text, captions, placeholders |
| Divider | `#DCD4C2` | `--muted` | Horizontal rules, row borders, hairline dividers |
| Marigold | `#E2A23B` | `--primary` | Primary buttons, CTAs, active states, the Seal fill |
| Verified green | `#2E6B4C` | `--accent` | **Reserved.** Checked-in / verified / approved / live only. Never decorative. |
| Flag red | `#B5432E` | `--destructive` | **Reserved.** Errors, rejections, urgency only. Never decorative. |

**Rules**
- Verified green and flag red are **semantic only** — they may not appear on decorative elements, illustrations, or as hover states.
- No gradient backgrounds, color tints, semi-opaque color overlays, or values outside this table.
- Dark variant: the Organizer "featured" card inverts to `bg-[#1E1B16]` with `text-[#F6F1E7]`, marigold accents, and `text-[#9A9080]` for secondary copy. This is the only approved dark surface.

---

## Typography

Three families, strict role assignments. Never swap roles.

| Family | Role | When to use |
|---|---|---|
| **Fraunces** (serif) | Display / headlines | `h1`–`h3`, section titles, certificate student names, hero copy, card titles |
| **Public Sans** (sans) | UI / body | All body prose, nav links, button text, form labels, descriptions, captions |
| **IBM Plex Mono** (mono) | Data / identity | Timestamps, IDs, codes, counts, column heads, eyebrow labels, badge text |

**Shorthand constants** — copy into every component file:
```tsx
const F = { fontFamily: "'Fraunces', Georgia, serif" } as const;
const M = { fontFamily: "'IBM Plex Mono', 'Courier New', monospace" } as const;
// Public Sans is the CSS body default — no override needed.
```

**Type scale**
- Hero `h1`: `text-5xl lg:text-[3.6rem] font-semibold leading-[1.06] tracking-tight` + `style={F}`
- Section title: `text-3xl font-semibold leading-snug` + `style={F}`
- Card title: `text-lg font-semibold leading-snug` + `style={F}`
- Section eyebrow: `text-[10px] tracking-widest uppercase text-[#6B6355]` + `style={M}`
- ID / timestamp inline: `text-[9px] text-[#6B6355]` + `style={M}`
- Column head: `text-[8px] tracking-widest uppercase text-[#6B6355]` + `style={M}`
- Body default: `text-sm text-[#6B6355] leading-relaxed` — no style override

---

## Surface & borders

Every card and raised panel:
```
bg-[#FCFAF3] border border-[#1E1B16]/20 rounded-[8px]
```

Hairline dividers within a card (between rows, below card headers):
```
border-b border-[#DCD4C2]
```

**Corner radii**
- Cards and panels: `rounded-[8px]` or `rounded-[7px]`
- Buttons: `rounded-[7px]`
- Pills / tags / status badges: `rounded-full`
- Small icon containers: `rounded-[5px]` or `rounded-[6px]`

**Forbidden**
- `shadow-*` of any size or color
- `blur-*`, `backdrop-blur-*`, any `backdrop-filter`
- Glows, rings, colored borders on hover
- `bg-gradient-*` or any CSS gradient

---

## Background texture

Applied once on the root page wrapper only:
```tsx
const dotGrid = {
  backgroundImage: "radial-gradient(circle, rgba(30,27,22,0.09) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
} as const;

<div className="bg-[#F6F1E7] min-h-screen" style={dotGrid}>
```

Opaque `bg-[#FCFAF3]` sections sit above the texture. Do not re-apply the dot-grid inside child elements.

---

## Icons

Lucide icons only.

- `strokeWidth={1.5}` always — never heavier, never filled
- Colors: `text-[#1E1B16]` primary · `text-[#6B6355]` muted · `text-[#E2A23B]` brand · `text-[#2E6B4C]` verified
- Max size `size={18}` inline; `size={24}` in standalone icon containers
- Icon containers: `w-10 h-10 border border-[#DCD4C2] rounded-[6px] flex items-center justify-center`

---

## Motion

**Principle: content fades in and rises 8 px. Nothing bounces, pulses color, or draws attention to itself.**

Standard mount (use on every card, section, list item):
```tsx
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.25, ease: "easeOut" }}
```

Staggered list items:
```tsx
transition={{ duration: 0.3, delay: index * 0.07 }}
```

Panel switches with `AnimatePresence`:
```tsx
// import { AnimatePresence } from "motion/react"
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ duration: 0.25 }}
```

**Forbidden**
- `type: "spring"` except on the Seal (see below)
- `scale` animations except on the Seal
- `rotate` except on the Seal
- Any looping animation except: the Seal stamp-in and the QR scan-line indicator
- `animate-bounce`, `animate-ping`, colored pulse animations

---

## The Seal — canonical implementation

The Seal is the one recurring success motif. It appears when attendance is verified, a certificate is issued, or a credential is confirmed. **Copy this component verbatim into every screen that needs it. Do not alter its geometry, fill color, arc text, or animation.**

```tsx
import { useId } from "react";
import { motion } from "motion/react";

function CertificateSeal({
  size = 88,
  rotate = -8,   // vary ±3° per instance so repeated seals feel hand-placed
  delay = 0.3,
}: {
  size?: number;
  rotate?: number;
  delay?: number;
}) {
  const rawId = useId();
  const uid = "s" + rawId.replace(/[^a-z0-9]/gi, "");
  const r = size / 2;

  const pts = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r - 1 : r - 5.5;
    return `${(r + Math.cos(a) * rad).toFixed(2)},${(r + Math.sin(a) * rad).toFixed(2)}`;
  }).join(" ");

  const arcR = r - 14;
  const topArc = `M ${(r - arcR).toFixed(2)},${r} A ${arcR},${arcR} 0 0,0 ${(r + arcR).toFixed(2)},${r}`;
  const fs = Math.max(4.5, size * 0.061);
  const sw = Math.max(1.5, size * 0.027);

  return (
    <motion.div
      style={{ width: size, height: size, display: "inline-block", flexShrink: 0 }}
      initial={{ scale: 0, rotate: rotate - 22, opacity: 0 }}
      animate={{ scale: 1, rotate, opacity: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 22, delay }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs><path id={uid} d={topArc} /></defs>
        <polygon points={pts} fill="#E2A23B" />
        <circle cx={r} cy={r} r={r - 8}    fill="#E2A23B" />
        <circle cx={r} cy={r} r={r - 10.5} fill="none" stroke="#1E1B16" strokeWidth="0.75" />
        <circle cx={r} cy={r} r={r - 17.5} fill="none" stroke="#1E1B16" strokeWidth="0.75" strokeDasharray="2 1.5" />
        <text fill="#1E1B16" fontSize={fs}
              fontFamily="'IBM Plex Mono',monospace" fontWeight="500" letterSpacing="1.1">
          <textPath href={`#${uid}`} startOffset="50%" textAnchor="middle">
            · FIELDBOOK · VERIFIED ·
          </textPath>
        </text>
        <path
          d={`M${(r-r*.22).toFixed(2)},${(r+r*.04).toFixed(2)} L${(r-r*.03).toFixed(2)},${(r+r*.22).toFixed(2)} L${(r+r*.26).toFixed(2)},${(r-r*.18).toFixed(2)}`}
          stroke="#1E1B16" strokeWidth={sw}
          strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
      </svg>
    </motion.div>
  );
}
```

**Seal rules**
- Size range: 44 px (card footer) → 88 px (certificate body) → 80 px (CTA centrepiece)
- `rotate` must be negative (−6° to −12°), never positive — feels hand-stamped
- `delay` 0.3 s minimum so it arrives after surrounding content settles
- Fill is always `#E2A23B`. Do not change.
- One Seal per verified context. Never stack or duplicate on a single card.
- The Seal is the only element that uses `type: "spring"` in its motion config.

---

## Buttons

**Primary (marigold):**
```
px-6 py-3 bg-[#E2A23B] text-[#1E1B16] text-sm font-semibold
rounded-[7px] border border-[#1E1B16]/15 hover:bg-[#CC8F28] transition-colors
```

**Secondary (outline ink):**
```
px-6 py-3 text-[#1E1B16] text-sm font-medium
border border-[#1E1B16]/25 rounded-[7px] hover:border-[#1E1B16]/50 transition-colors
```

**Destructive:**
```
px-6 py-3 text-[#B5432E] text-sm font-medium
border border-[#B5432E]/40 rounded-[7px] hover:border-[#B5432E] transition-colors
```

**Small icon button:**
```
w-8 h-8 flex items-center justify-center
border border-[#DCD4C2] rounded-[5px] hover:border-[#1E1B16]/30 transition-colors
```

---

## Status & badge patterns

**Verified (green):**
```tsx
<div className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#2E6B4C] rounded-full">
  <span className="w-1 h-1 rounded-full bg-[#2E6B4C]" />
  <span className="text-[7px] text-[#2E6B4C]" style={M}>Verified</span>
</div>
```

**Rejected / error (red):**
```tsx
<div className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#B5432E] rounded-full">
  <span className="w-1 h-1 rounded-full bg-[#B5432E]" />
  <span className="text-[7px] text-[#B5432E]" style={M}>Rejected</span>
</div>
```

**Neutral tag / eyebrow pill:**
```
px-3 py-1 bg-[#FCFAF3] border border-[#DCD4C2] rounded-full
text-[10px] text-[#6B6355] tracking-widest uppercase   (+ style={M})
```

**Live dot (active event indicator):**
```tsx
<span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C]" />
```

**Pending dot:**
```tsx
<span className="w-1.5 h-1.5 rounded-full bg-[#DCD4C2]" />
```

---

## Ledger row pattern

Standard attendance / event list row:
```tsx
<div className="px-4 py-2.5 border-b border-[#DCD4C2] flex items-center justify-between">
  <div className="flex items-center gap-2.5">
    {/* Green dot = verified, divider dot = pending */}
    <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4C] flex-shrink-0" />
    <div>
      <div className="text-xs text-[#1E1B16]">{name}</div>
      <div className="text-[9px] text-[#6B6355]" style={M}>{id}</div>
    </div>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-[9px] text-[#6B6355]" style={M}>{timestamp}</span>
    <Check size={10} className="text-[#2E6B4C]" />
  </div>
</div>
```

Column head row: `border-b border-[#DCD4C2]` · cells use `text-[8px] tracking-widest uppercase text-[#6B6355]` + `style={M}`.

---

## Section layout

```
max-w-6xl mx-auto px-6 py-20
```

Sections alternate: `bg-[#F6F1E7]` (dot-grid shows through) and `bg-[#FCFAF3]` (opaque raised). Always separated by `border-t border-[#DCD4C2]`.

Section header pattern:
```tsx
<p className="text-[10px] tracking-widest uppercase text-[#6B6355] mb-2" style={M}>
  Section Label
</p>
<h2 className="text-3xl font-semibold text-[#1E1B16] leading-snug" style={F}>
  Section Headline
</h2>
```

---

## Certificate card pattern

Any certificate preview uses:
- Top accent bar: `<div className="h-[3px] bg-[#E2A23B]" />`
- Centered header block with Fieldbook wordmark + "Certificate of Participation" in mono caps
- Student name in `text-2xl`–`text-3xl font-semibold` Fraunces
- Event title in `text-base font-semibold` Fraunces
- Signature line: `w-20 border-b border-[#1E1B16]/25 mb-1.5` with name/title in 7–8px mono beneath
- One Seal (size 60–88 px) bottom-right, `rotate` between −7° and −11°
- Certificate ref ID in 7px mono below the Seal
