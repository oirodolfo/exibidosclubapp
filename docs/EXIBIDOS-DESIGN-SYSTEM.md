# EXIBIDOS Design System

**Visual language:** Dark-mode-first, neon-accented, joyful, bold, playful, sensual, premium.  
**Vibe:** Nightclub UI × happy arcade × fashion brand.  
**Emotional tone:** Happy, confident, expressive, slightly provocative. Alive, reactive, social — not corporate.

---

## 1. Color System

### Base (surfaces & text)
| Token | Hex | Usage |
|-------|-----|--------|
| `exibidos-bg` | `#0a0a0c` | App background, deepest black |
| `exibidos-surface` | `#141418` | Cards, panels |
| `exibidos-elevated` | `#1c1c22` | Floating elements |
| `exibidos-muted` | `#6b6b7a` | Secondary text, borders |
| `exibidos-ink` | `#f4f4f6` | Primary text |
| `exibidos-ink-soft` | `#b4b4be` | Labels, captions |
| `exibidos-shadow` | `#1a0a1a` | Deep purple shadow (depth) |

### Accent palette (emotional, not decorative)
| Token | Hex | Usage |
|-------|-----|--------|
| `exibidos-lime` | `#b8ff3c` | Primary CTA, success, streaks |
| `exibidos-lime-dim` | `#8acc2e` | Hover/active lime |
| `exibidos-purple` | `#a855f7` | Premium, highlights, links |
| `exibidos-purple-dim` | `#7c3aed` | Purple hover |
| `exibidos-cyan` | `#22d3ee` | Info, freshness, secondary accent |
| `exibidos-magenta` | `#ec4899` | Reactions, love, playful |
| `exibidos-amber` | `#fbbf24` | Badges, warmth, gamification |

### Gradients (preferred over flat)
- **Hero / CTA:** `lime → cyan` or `purple → magenta`
- **Cards / glass:** `surface` with subtle `purple/cyan` edge glow
- **Badges:** single accent with soft gradient overlay

---

## 2. Spacing & Layout

| Token | Value | Usage |
|-------|--------|--------|
| `space-1` | 4px | Tight inline |
| `space-2` | 8px | Default gap |
| `space-3` | 12px | Comfortable gap |
| `space-4` | 16px | Section padding |
| `space-5` | 20px | Card internal |
| `space-6` | 24px | Screen padding |
| `space-8` | 32px | Section separation |
| `space-10` | 40px | Large blocks |

**Layout:** Mobile-first. Max content width **420px** for feed/profile; **560px** for modals/settings. Thumb-friendly tap targets **min 44px**.

---

## 3. Border Radius (chunky, tactile)

| Token | Value | Usage |
|-------|--------|--------|
| `radius-sm` | 10px | Chips, tags |
| `radius-md` | 16px | Inputs, small cards |
| `radius-lg` | 20px | Cards, modals |
| `radius-xl` | 24px | Hero cards |
| `radius-2xl` | 28px | Featured surfaces |
| `radius-full` | 9999px | Pills, avatars |

---

## 4. Shadows & Glow

- **Card float:** `0 8px 32px rgba(0,0,0,0.4)`, optional `0 0 0 1px rgba(168,85,247,0.08)`
- **Neon glow (lime):** `0 0 20px rgba(184,255,60,0.25)`, hover `0 0 32px rgba(184,255,60,0.35)`
- **Neon glow (purple):** `0 0 24px rgba(168,85,247,0.2)`
- **Inner depth:** subtle inset for glassmorphism

---

## 5. Typography

- **Font:** Rounded sans-serif (e.g. **Nunito**, **DM Sans**, or **Plus Jakarta Sans**). Avoid sterile (Inter) or enterprise fonts.
- **Hierarchy:**
  - **Display:** 28–32px, bold, high contrast
  - **H1:** 24px, bold
  - **H2:** 20px, semibold
  - **Body:** 16px, regular
  - **Caption:** 14px, soft color
  - **Overline / label:** 12px, uppercase optional, muted

---

## 6. Components Language

### Cards
- Chunky, rounded (`radius-lg` / `radius-xl`), layered.
- Background: glassmorphism (`bg-white/5`–`bg-white/10`) or solid `surface` with border `border-white/10`.
- Slight float: shadow + optional 1px accent border.
- Padding: generous (`space-5`–`space-6`).

### Buttons
- **Primary:** Pill-shaped (`radius-full`), bold. Lime or gradient (lime → cyan). Hover: glow, slight scale.
- **Secondary:** Pill, outline or soft fill (e.g. white/10). Hover: border/glow.
- **Ghost:** Text + optional icon. Hover: background wash.
- **Danger:** Magenta/red accent, same pill shape.
- Min height **44px**; padding horizontal **20–24px**.

### Chips & tags
- Rounded (`radius-sm` or pill). Colorful: one accent per chip (lime, purple, cyan, magenta). Feel collectible, playful.
- Optional small icon or emoji.

### Avatars
- Rounded-full, soft glow (box-shadow with accent or neutral). Optional expressive frame (gradient border). Personality-first sizing (e.g. 40px default, 56px prominent).

### Icons
- Minimal, rounded stroke. Optional neon stroke on hover/focus. Prefer 24px for actions.

---

## 7. Motion & Interaction

- **Hover:** Glow increase, slight scale (e.g. `scale-[1.02]`), transition 200ms ease-out.
- **Tap:** Soft bounce (e.g. `scale-[0.98]` then spring back). 150ms.
- **Transitions:** Smooth, elastic where appropriate (e.g. `transition-all duration-200 ease-out`).
- **Page / panel:** Slide or fade, 250–300ms. No harsh cuts.
- **Micro-animations:** Streak flames, badge pop, reaction burst — keep them short and delightful.

---

## 8. Key Screens (proposed)

| Screen | Purpose | Key elements |
|--------|--------|---------------|
| **Home / Discover** | Entry, feed preview, CTA | Hero card with gradient; feed teaser; pill CTAs (Login, Join); dark bg + neon accents |
| **Feed** | Main content stream | Chunky cards, glassmorphism, avatars, reactions; FAB or sticky upload (lime glow); pull-to-refresh |
| **Profile** | Identity, stats, content | Large avatar + glow; tabs (Overview, Photos, Badges, Rankings); follow button (pill); grid of content cards |
| **Content detail** | Single photo/post | Full-bleed media; overlay actions (reactions, share); soft back; comments in cards |
| **Actions** | Upload, verify, messages | Modals/sheets with `radius-xl`, glass; primary action = lime pill; steps with progress (gamification) |
| **Messages** | Conversations | Bubbles with glass or accent tint; avatars; input pill at bottom |

---

## 9. UX Principles

- **Mobile-first:** Layout and touch targets optimized for phone.
- **Thumb-friendly:** Primary actions in lower half or FAB.
- **Fast visual feedback:** Every tap has immediate state change (e.g. ripple or scale).
- **Expressive, not neutral:** Every screen has a clear mood (color, illustration, or motion).
- **Accessibility:** Contrast ratios respected; focus rings use accent (e.g. lime or purple); motion optional via `prefers-reduced-motion`.

---

## 10. Absolute Rules

- Do **not** create something generic or “another SaaS dashboard”.
- Do **not** shy away from color; dark mode must feel **joyful**, not serious.
- **EXIBIDOS** should instantly read as: *“This is different.”*

---

## Implementation

- **Tokens:** Tailwind `theme.extend` + CSS custom properties in `globals.css`.
- **Components:** CVA variants for Button, Card, Input, Chip, Avatar; reuse tokens.
- **Motion:** Tailwind `transition-*`, `animate-*`, and custom keyframes in CSS where needed.
