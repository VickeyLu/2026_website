# Vickey Lu — 2026 Portfolio Design System

The working spec for this site. Any tool (Claude, Codex, a person) should read this before changing the UI.
Values below are the ones in the code (`styles.css`, `hero-space.css`, `selected-work.css`, `testimonial.css`).

---

## 1. Principles

1. **Black and white, plus one cinematic moment.** The UI is ink on paper. Color only comes from the space hero and from real work screenshots. Nothing else gets an accent color.
2. **One idea per screen.** Each section fills roughly one viewport and says one thing.
3. **Everything left-aligned to one edge.** Text, labels, controls and the nav all start on the same gutter line. No centered text blocks.
4. **Generous whitespace.** When in doubt, add space instead of a divider, card or box.
5. **Perception over explanation.** The reader scans; hierarchy comes from size, weight and grey vs ink, not from decoration.
6. **Restraint.** No prop-like metaphors (hanging cards, tilted cards, color blobs). The hero is the only "moment".

---

## 2. Color

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F5F4F0` | Page background |
| `--ink` | `#121212` | Primary text, headings, highlighted words, buttons |
| `--ink-2` | `#3D3D3A` | Body copy, descriptions |
| `--muted` | `#7A7873` | Labels, roles, secondary text, de-emphasized quote text |
| `--line-color` | `#E2E0DA` | Hairlines |
| `--soft` | `#E6E4DE` | Empty media placeholders |
| `--drawing` | `#2A2A28` | Line illustrations (How I work) |
| `--space` | `#05070B` | Hero background only |
| `--on-space` | `#F5F4F0` | Text on the hero |
| `--on-space-muted` | `#A9B0BC` | Secondary text on the hero |

Rules
- Selection: ink background, paper text.
- Never introduce a brand accent. Retired: navy `#071D55`, lime `#CAFF13`.
- Emphasis inside text = switch from `--muted` to `--ink` at the **same weight** (see Kind words). Do not bold for emphasis.

---

## 3. Typography

One family for everything: **Google Sans Flex** (Google Fonts, variable; loaded as `wght@300..700`). Fallback: `"Helvetica Neue", Arial, sans-serif`. No serif, no second display face. No true italic exists; avoid italics.

| Role | Size | Weight | Tracking | Where |
|---|---|---|---|---|
| Hero title | `clamp(40px, 4.8vw, 80px)` | 400 | −0.02em | Hero three lines |
| Display | `clamp(44px, 5.6vw, 80px)` | 400 | −0.02em | "Hi, I'm Vickey." |
| Section heading (H2) | `clamp(36px, 4vw, 56px)` | 400 | −0.018em | How I work, Selected work |
| Lede | `clamp(20px, 1.7vw, 26px)` | 400 | — | About summary (ink-2, max 34ch) |
| Quote | `clamp(20px, 1.6vw, 26px)` | 400 | −0.01em | Kind words (line-height 1.3) |
| Project title | 28px | 500 | — | Selected work |
| H3 | 24px | 500 | −0.005em | How I work steps |
| Body | 16px | 400 | — | Descriptions (ink-2, line-height 1.6, max 32–44ch) |
| Small | 15px | 400–500 | — | Nav links (500), company line, roles, controls |
| Label / eyebrow | 12px | 500 | +0.08em, UPPERCASE | Section eyebrows, fact labels, quote facets |
| Number | 13px | 400 | +0.04em, tabular | Step and project indexes |

Rules
- Headings use `text-wrap: balance`; running text uses `text-wrap: pretty`.
- Large type always gets negative tracking; uppercase labels always get +0.08em.
- Digits that line up use `font-variant-numeric: tabular-nums`.
- Keep running text near 32–44ch; never full-width paragraphs.

---

## 4. Space and layout

| Token | Value |
|---|---|
| `--gutter` | `clamp(24px, 6vw, 112px)` — the one left edge for everything |
| `--section-space` | `clamp(112px, 16vh, 168px)` — vertical padding per section |

- Base unit 8px. Inside components 8–24px; between groups ~48px; between sections = `--section-space`.
- Sections are `min-height: 100svh` and vertically centered when they hold one idea.
- Use flex/grid `gap`, not margins between siblings.
- Breakpoints: 900px (multi-column → one column), 760px portrait (hero mobile framing).

Radius: pill for nav and buttons, 16px for media, 0 for text blocks. Cards and shadows are not part of the system.

---

## 5. Components

**Nav**
- Fixed, full width, padded to `--gutter`. Logo left, links right (Work, About, Playground, Resume).
- Over the hero: pure white text, 15px / 500; hover → `rgba(255,255,255,.55)`; logo inverted. No underline.
- After scrolling: light pill (`rgba(245,244,240,.86)`, hairline border), ink text, hover → muted.

**Eyebrow** — 12px / 500 / +0.08em uppercase, muted. Sits above a section's main line.

**Facts row (About)** — 4 columns of label (eyebrow style) + value (16px). 2 columns under 900px.

**Steps (How I work)** — 3 columns: line drawing (max 280px, stroke 2.2, `--drawing`), index number, H3, description.

**Project row (Selected work)** — 32/68 split, gap `clamp(48px, 6vw, 112px)`. Left: index, title (28/500), company (15, muted), description (16, ink-2). Right: media (radius 16). Hover label on media: black pill, paper text.

**Quote set (Kind words)**
- Three columns, one per hero line. Each column: hairline on top, facet label (12px ink uppercase), quote, name (15/500 ink) + role (14, muted).
- Quote text is muted; only hiring-signal phrases are ink, same weight.
- Sets of three, paged with text controls. Stacks to one column under 900px.

**Text controls** — `01 / 02 · Prev · Next`. Counter tabular, current number ink, rest muted. Buttons are plain text 15/500 ink, hover muted. No arrows-in-circles, no dots.

---

## 6. Motion

- **Hero opening (once):** dark → dawn over ~3.5s, faint horizon halo; seamless swing loop video (figure at 74% across on desktop, 66% on mobile); a small meteor passes behind her every 12–20s.
- **Hero UI entrance:** logo at 0ms, nav at 100ms, then the three title lines at 300/380/460ms. Nav uses 700ms; title lines use 800ms with an 18px rise. All use `cubic-bezier(.16, 1, .3, 1)`. Reduced motion shows the finished state immediately.
- **Hero → page (B4):** the hero stays pinned while a straight-edged paper section slides up over it. The scene scales to ~0.95 and dims ~50%; a faint blue-white light line rides the section's top edge and fades out. About one screen of scroll.
- **Everywhere else:** crossfades ~400–450ms; line-by-line reveals 600ms with 80ms stagger. One easing family.
- **Never:** autoplaying carousels, bouncing, swinging/physics UI, parallax on text.
- Everything respects `prefers-reduced-motion` (video paused, no fades).

---

## 7. Content rules

- **Hero:** only the three lines — See systems / Understand people / Ship clarity. Name and credentials go on the next screen.
- **Kind words:** real LinkedIn recommendations only, never reworded. Keep the key words, trim with "…", merge two points from one person when it helps. No avatars, no company names, no years. Lukewarm recommendations are left out.
- **Copy voice:** plain, specific, first person. Numbers over adjectives.
- **Cases:** the full story lives in Figma decks (for interviews); the website shows a short version.

---

## 8. Page flow

1. Loading (to be designed; proposal: the hero opening itself, 3–4s, skippable, once per visit)
2. Hero (pinned) → B4 transition
3. About — "Hi, I'm Vickey." + summary + four facts
4. How I work — three steps
5. Selected work — four projects
6. Kind words — two sets of three quotes
7. Contact / footer (to be built)

---

## 9. Files

| File | What it owns |
|---|---|
| `styles.css` | Tokens, base type, nav, About, How I work |
| `hero-space.css` / `hero-space.js` | Hero scene framing, dawn, meteor, B4 transition, nav-on-dark |
| `selected-work.css` / `selected-work.js` | Project rows, media, hover label |
| `testimonial.css` / `testimonial.js` | Kind words quote sets and paging |
| `nav.js` | Scrolled state of the nav |
| `assets/hero/` | `swing-loop.mp4`, `poster.webp`, `occ.png` (meteor occlusion mask), `og.jpg` |
