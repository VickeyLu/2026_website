# Hero lighting comparison

Local, isolated implementation of the approved quiet-star preview; no production page imports these files.

- `?v=1`: Earth at its original brightness.
- `?v=2`: Earth at 78% brightness, with a feathered atmospheric boundary.
- Both: unchanged headline, 14px regular-weight auxiliary labels, no text halo, lower-contrast horizon, softer stars. Typography keeps the existing font and loads its real 400 weight.
- Bottom picker, keys 1/2 or arrows select versions. R reloads the preview. Preview settings expose Earth brightness and pause for still-frame comparison.

The video stays the original file, duration and motion. A single full-frame GPU pass suppresses small high-frequency star highlights and compresses larger bright stars. This reduces their visible density without replacing the natural sky with isolated lights or generating new stars. The existing per-frame lower-body matte and a softly feathered upper-body protection region preserve the person. No separately copied video crop is composited over the person.

Renderer: existing DOM + SVG + video, with one WebGL color-grading canvas. Video-frame callbacks drive rendering. Original video pause/reduced-motion behavior remains active; poster is graded while video loads. If WebGL is unavailable or lost, the original video remains visible (grading unavailable). This is an intentional prototype fallback, not a pixel-identical alternate renderer.

Color changes are confined to this preview: label white / location 92%-white with halos → `oklch(.82 .007 250 / .9)` without halos; leader line 35%-white → `oklch(.85 0 0 / .22)`; horizon layer strength 100% → 72%. These are intentional secondary-content choices requested by the owner, not a claim of AA text contrast across every video frame.

The two options differ only in Earth brightness, per the user's request. Selection is not a final design decision; neither version has been promoted to the main page. Static AI mockups were mood references, not pixel-exact video edits.
