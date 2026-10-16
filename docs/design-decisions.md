# 2026 Website — Design decisions

Why things are the way they are. The current spec is `DESIGN.md` (the design system); this file is the history behind it: what was decided, when, and what was rejected.

Repo: VickeyLu/2026_website · Working branch: `new-site` (preview: 2026website-git-new-site-lusiming2012-5533.vercel.app) · Live: `main` · Old site (illustrated portrait) backed up on `old-site`.

## Direction
- 黑白克制 + 一个电影感时刻: UI is black/white/grey; color comes only from the space hero and work screenshots.
- **Motif (decided 2026-10-14): the horizon line = her path, left to right.** It draws in the opening, carries three career stops, straightens into the edge of the page on scroll, and comes back straight in About as the chapters line.
- References: Google Labs, Dia (overall style); MotionSites (cinematic feel, used sparingly); Gokul R / Mukundh (motion ideas).
- Typography: one sans family for everything, hierarchy through size and weight (no serif display).
- Font: **Google Sans Flex** (chosen over Inter, 2026-10-12). Large type uses negative tracking: Display −0.02em, H1 −0.018em, H2 −0.01em, H3 −0.005em.
- Companion (decided 2026-10-14): **Google Sans Code 500**, instrument text only (hero stops, places, corner text; the coordinates at the very end), 11–13px uppercase, +0.1–0.12em.
- Layout rules: everything left-aligned to one edge; generous whitespace; one idea per screen.
- Tone (2026-10-14): premium at the top, warm at the end. Warmth comes from her voice and her photo, not from colors or decoration.

## Hero (decided 2026-10-14)
- Title: See systems / Understand people / Ship clarity. Size `clamp(56px, 6.25vw, 80px)`, line-height 1.2 (Vickey's change, 2026-10-13). JS keeps it ≥56px clear of the horizon.
- Three stops on the horizon (desktop only; phones leave them out), always two lines: TRAINED IN / ARCHITECTURE · 6+ YEARS IN / PRODUCT DESIGN · GOOGLE LABS / NOTEBOOKLM. Nothing under her feet.
- Corner text: `37.3861° N · 122.0839° W / NOW · BAY AREA · CALIFORNIA` (bottom-left), `SCROLL / 01 / 05` (bottom-right).
- She sits in front of the line: her lower body is cut from each video frame (`assets/hero/matte.webp`, 151 frames) and redrawn above it.
- Small text on the bright Earth: pure white plus a soft halo hugging each letter; the Earth is never dimmed.
- **No years anywhere on the hero** (Vickey doesn't want age/years to be inferable). The only number is "6+ years in product design".

## Opening (decided 2026-10-14)
- The hero itself is the opening: 4.8s, once per browser session, any input skips it, `?intro` replays it.
- 0–3s, only three things on screen: the horizon drawing; a fixed sentence `FROM DESIGNING SPACES PEOPLE LIVE IN / TO SYSTEMS PEOPLE WORK IN`; under it the place cross-fades ZHENGZHOU, CHINA → SHANGHAI, CHINA → ST. LOUIS, MO → BAY AREA, CA. Stops light up at 1.9 / 2.5 / 2.85s.
- 3.05s the line reaches her feet; dawn 2.9–4.0s; title 3.6–4.5s; corner text last (4.0–4.8s).
- Rejected: years in the counter (age); Marketing as a stop; a "Now · Google Labs" label under her feet; "From architecture to AI" (too narrow — targets include B2B like Samsara); "From design spaces…" (reads as a noun).
- Career facts behind it: architecture school in Zhengzhou → first architecture job in Shanghai → architecture study in St. Louis → Bay Area 2017, two years of marketing design → product design since 2019 → Google Labs · NotebookLM since 2025.

## Page flow (decided 2026-10-14: "order 2", three acts)
One long page; only case studies get their own pages. Nav: Work · About · Resume (all in-page).
1. Opening + Hero (pinned) → horizon straightens into the page edge
2. **Act 1 — the work:** Selected work
3. **Act 2 — the person:** About — "Hi, I'm Vickey." + a one-line rotator (Designer by work. → Builder by instinct. → Curious human everywhere else.; key word ink, rest grey) + one photo; chapters on a straight horizon, "Where the three lines came from": Architecture → see systems · Marketing → understand people · SaaS → ship clarity (through complexity) · AI → design for uncertainty. Line draws with scroll; each chapter lights up. Then Playground — "Path is not always linear." Architecture → Urban design → Marketing, one row of three (phones swipe).
4. **Act 3 — working with me:** How I work (steps labelled SEE SYSTEMS / UNDERSTAND PEOPLE / SHIP CLARITY) → Kind words (same labels) → Still curious? (Email · LinkedIn · Resume; coordinates as a bookend)
- The three lines repeat origin → method → proof right before the invitation to talk.
- Rejected: About at the top (repeats the hero); method + proof before About ("order 1", felt like starting over); separate About page (nobody opens it; maybe later for personal life); life-photo gallery (dropped — one portrait only).

## Tokens
- Paper #F5F4F0 · Surface #FFFFFF · Ink #121212 · Ink 2 #3D3D3A · Muted #7A7873 · Line #E2E0DA · Space #05070B (hero only)
- Retired: navy #071D55, lime #CAFF13, watercolor sky, illustrated self-portrait, regular+bold mixed headings, Inter, the old Playground's cream/purple cards and arrow buttons
- Spacing: 8pt; 8–24 inside components, 48 between, 160 between sections (96 mobile)
- Radius: pill (nav, buttons), 16 (media), 0 (text blocks)

## Motion
- Opening: see above. Always running: swing loop video; a meteor passes behind her every 12–20s.
- Hero → page: scene scales to ~0.95 and dims ~50%; the curved horizon straightens into the page's top edge. She stays in front of the line.
- About chapters: line drawn 1:1 with scroll; no timers.
- **Self-moving content (rule changed 2026-10-14; Vickey: "nobody will click on their own"):** at the time, exactly two things moved on their own —
  - About rotator: one slot, one line at a time, 2.4s per line, rolls up like a wheel, loops. (Tried first and rejected: lines revealed with the scroll; lines stacking up one by one.)
  - Kind words: next set every 10s while on screen, with a thin progress line under the controls.
  - Both pause on hover (Kind words also on focus/touch), stop when off screen, and are off under reduced motion.
- **2026-10-15: the "only two things move on their own" limit was removed** (Vickey). Prompted by the footer face idea (eyes follow the pointer, blink). The two items above still move as described.
- Everywhere else: crossfades (400ms); off under reduced motion. Still never: bouncing, physics UI, parallax text.

## Testimonials — "Kind words" (updated 2026-10-14)
- Three quotes per screen, one per hero line, small ink label above a hairline; muted text with hiring-signal phrases in ink. Two sets, "01 / 02 · Prev · Next"; advance on their own every 10s.
  - Set 1: Jessica Sarceda · Myrinda Grantham · Samuel Jones
  - Set 2: Brayden Chen · Carolyn Fan · Ashwini Kemshetty
- Content rules: real LinkedIn recommendations only; trim with "…"; no avatars, company names or years.
- Left out: Mingfei Bi (easy to restore); Matthew Rubin (lukewarm).

## Cases (decided 2026-10-12)
- Content is built first as Figma decks (interview presentations). Website case pages are short versions derived from the deck. Start with Sense Messaging 2.0.

## Branches (decided 2026-10-15)
- `new-site` went live: `main` was fast-forwarded to it on 2026-10-15; the previous site was saved first as `old-site`.
- Workflow: everything goes to `new-site` first; Vickey checks the preview; then `main` is fast-forwarded to it. Nobody commits to `main` directly.
- Rejected: working directly on `main` (no preview step before going live); a short branch per task (more overhead than needed).
- Deleted: `order-2`, `about-rotator-draft`, `hero-preview` (all merged), `nav-apogee-experiment` (nav prototype + logo concepts, not kept).

## Documentation (2026-10-14)
- `AGENTS.md` = collaboration and implementation rules.
- `DESIGN.md` = current approved design system and implementation state.
- `docs/design-decisions.md` = decisions and history (this file).
- Code stays at the repository root for now; moving it to `src/` would require changing the Vercel root directory at the same time.

## Open items
- Assets from Vickey: one portrait photo; three Playground images (+ links, for now to the old site's project pages); email address for "Email me"
- About → Playground spacing feels a little loose; tune after real images are in
- Project cards: one metric each (Sense NPS +31%; Moka feedback cycle 2–4 weeks → <1 week; NotebookLM 0→1 across 3 surfaces; Broadcast Suppression TBD)
- Mobile pass (the phone nav wraps to two rows)
- Clean up unused files at the repo root (hero-atmosphere.*, hero-bubble.*, *-preview.html, "2026_Portfolio website/")
- Add the hero video scripts (fixloop4.py) and the matte script to the repo
- Figma file still shows the old hero and order; sync when the site settles
