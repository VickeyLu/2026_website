# Vickey Lu — 2026 Portfolio Design System

The working spec for this site. Any tool (Claude, Codex, a person) should read this before changing the UI.
Values below are the ones in the code (`styles.css`, `hero-space.css`, `selected-work.css`, `testimonial.css`).

---

## 1. Principles

1. **Black and white, plus one cinematic moment.** The UI is ink on paper. Color only comes from the space hero and from real work screenshots. Nothing else gets an accent color.
   - **The motif is the horizon line: her path, left to right.** It draws in the opening, carries the career stops, and straightens into the edge of the page when you scroll.
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

One exception, on the hero only: **Google Sans Code** 500 for the small instrument text (stops, places, corner text). 11–13px, uppercase, +0.1–0.12em. Never used elsewhere.

| Role | Size | Weight | Tracking | Where |
|---|---|---|---|---|
| Hero title | `clamp(56px, 6.25vw, 80px)`, line-height 1.2 | 400 | −0.02em | Hero three lines (phone: `clamp(32px, 8.8vw, 40px)`) |
| Hero instrument text | 11px (places 13px) | 500 Google Sans Code | +0.1–0.12em, UPPERCASE | Stops, opening sentence, places, corners |
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

**Hero layers** (bottom to top, all in one scene box so they scale together): video → night (black, opening only) → horizon line + stop dots → her lower body (cut from each video frame with `assets/hero/matte.webp`, so she sits in front of the line) → stop labels. Above the scene: vignette, grain, title, opening text, corner text.
- **Stops** (desktop only; phones leave them out): `TRAINED IN / ARCHITECTURE`, `6+ YEARS IN / PRODUCT DESIGN`, `GOOGLE LABS / NOTEBOOKLM`. Always two lines, centered under a small tick. Nothing is drawn under her feet.
- **Corner text** (bottom-left / bottom-right, on the gutter): `37.3861° N · 122.0839° W / NOW · BAY AREA · CALIFORNIA` and `SCROLL / 01 / 05`.
- **Small text on the bright Earth:** pure white plus a halo that hugs each letter (`drop-shadow` 1px + 4px, `text-shadow` 1/4/10px in `#05070B`). Never a box or a dimmed band — the Earth stays untouched.
- **Title placement:** a little above center, but always at least 56px clear of the horizon (JS measures it).

**Text controls** — `01 / 02 · Prev · Next`. Counter tabular, current number ink, rest muted. Buttons are plain text 15/500 ink, hover muted. No arrows-in-circles, no dots.

---

## 6. Motion

- **Hero opening (once per browser session; any input skips it; `?intro` replays it), 4.8s:**
  | Time | What happens |
  |---|---|
  | 0–0.7s | Black. The sentence fades in at the bottom center: `FROM DESIGNING SPACES PEOPLE LIVE IN / TO SYSTEMS PEOPLE WORK IN` |
  | 0.5–3.05s | The horizon draws left to right. The place under the sentence cross-fades: `ZHENGZHOU, CHINA` (0.5s) → `SHANGHAI, CHINA` (1.1s) → `ST. LOUIS, MO` (1.7s) → `BAY AREA, CA` (2.3s). No years. |
  | 1.9 / 2.5 / 2.85s | The three stops light up as the line reaches them. |
  | 3.05s | The line reaches her feet; the sentence and place fade out. |
  | 2.9–4.0s | Dawn (night fades). |
  | 3.6–4.5s | The title rises in (18px). |
  | 4.0–4.8s | Corner text arrives last. |
- Always running: seamless swing loop video (figure at 74% across on desktop, 66% on phones); a small meteor passes behind her every 12–20s.
- **Hero → page:** the hero stays pinned while the paper page slides up over it. The scene scales to ~0.95 and dims ~50%; stops and corners fade in the first 18%; the curved horizon straightens into the page's top edge and fades out by ~95%. Her body stays in front of the line throughout. About one screen of scroll.
- **Everywhere else:** crossfades ~400–450ms; line-by-line reveals 600ms with 80ms stagger. One easing family.
- **Never:** autoplaying carousels, bouncing, swinging/physics UI, parallax on text.
- Everything respects `prefers-reduced-motion` (video paused, no fades).

---

## 7. Content rules

- **Hero:** the three lines — See systems / Understand people / Ship clarity — plus the three stops and the corner text. Name and the full story go on the next screen.
- **No years anywhere on the hero.** Places tell the journey; the only number is "6+ years in product design".
- **Kind words:** real LinkedIn recommendations only, never reworded. Keep the key words, trim with "…", merge two points from one person when it helps. No avatars, no company names, no years. Lukewarm recommendations are left out.
- **Copy voice:** plain, specific, first person. Numbers over adjectives.
- **Cases:** the full story lives in Figma decks (for interviews); the website shows a short version.

---

## 8. Page flow

One long page; only case studies get their own pages. Nav: Work · About · Resume (all in-page).

1. Opening (the hero itself, 4.8s, once per session, skippable)
2. Hero (pinned) → the horizon straightens into the page edge
3. **Act 1 — the work.** Selected work.
4. **Act 2 — the person.** About — "Hi, I'm Vickey." / Designer by work. Builder by instinct. Curious human everywhere else. + one photo; then the chapters on a straight horizon ("Where the three lines came from"): Architecture → see systems, Marketing → understand people, SaaS → ship clarity, AI → design for uncertainty. The line draws with the scroll; each chapter lights up as it is reached.
5. Playground — "Path is not always linear." Architecture → Urban design → Marketing, one row of three (phones: swipe).
6. **Act 3 — working with me.** How I work — each step carries the hero line it serves (SEE SYSTEMS / UNDERSTAND PEOPLE / SHIP CLARITY).
7. Kind words — others' voice, same three labels.
8. Still curious? — Email · LinkedIn · Resume, then the hero's corner text once more as a bookend.

The three lines repeat in order: origin (chapters) → method (How I work) → proof (Kind words), right before the invitation to talk.
The temperature rises down the page: cinematic at the top, the person at the end. No life-photo gallery for now; a separate About page can come later.

## 9. Files

| File | What it owns |
|---|---|
| `styles.css` | Tokens, base type, nav, About, How I work |
| `hero-space.css` / `hero-space.js` | Hero framing, opening timeline, horizon + stops, figure layer, corner text, meteor, scroll transition, nav-on-dark |
| `selected-work.css` / `selected-work.js` | Project rows, media, hover label |
| `testimonial.css` / `testimonial.js` | Kind words quote sets and paging |
| `about.css` / `about.js` | About, chapters horizon, Playground, Contact |
| `nav.js` | Scrolled state of the nav |
| `assets/hero/` | `swing-loop.mp4`, `poster.webp`, `matte.webp` (her lower body per video frame, 16×10 sprite), `occ.png` (meteor occlusion mask), `og.jpg` |
