# Flo companion animation

Created 20 October 2026 using the built-in image generation tool. The user's complete
reference library remains untouched at `../../../../Consistency ref/` (relative to this
directory). See `../../../docs/flo-reference-library.md` for inventory and hashes.

## Source and runtime files

- `source/flo-companion.png`: original selected generation, 1448 × 1086, RGBA.
- `flo-companion.webp`: format conversion, quality 88, alpha quality 100; 364,340 bytes.
- `flo-breathing-lines.svg`: editable original vector curves, drawn for this site.
  The four cream strokes expand and fade gently during inhalation.

The raw image was copied from the built-in tool output
`exec-9de4203e-7fc7-44f5-8966-52400f68cc6b.png`. No pixel cleanup, repainting or
programmatic pose synthesis was used. Low-alpha fringe in image previews is nearly
transparent when composited against the actual ocean.

The sheet has four columns and three rows, with 362 × 362 cells. Read left to right:

| Frames (zero-based) | Use |
| --- | --- |
| 0–7 | Progressive swim stroke and recovery, 1.15–1.85 cycles/second by speed |
| 8 | Relaxed resting pose |
| 9 | Upward glance / anticipation |
| 10 | Downward glance / anticipation |
| 11 | Soft blink |

Movement and visual sampling have separate clocks. The body moves every display frame,
while the drawings advance at their own cadence. Pause freezes both. Mouse movements
below 48px receive a glance; larger movements start a 440ms anticipation beat, then
bounded spring movement. Repeated input while swimming updates the destination without
restarting the anticipation. A nearby glance holds for 620ms, and settling lasts at least
380ms. The final 48% of anticipation has a small counter-motion that releases into
the swim. Eight swim drawings use phase durations of 13%, 11%, 8%, 8%, 11%, 14%,
17% and 18%, giving the fin push less time than the drifting recovery. Scrolling produces a small current that returns to the same
resting height. Reduced motion suppresses decorative travel and breathing.

Breathing is a 3.8-second authored timing curve: inhale 1.2s, hold .15s, exhale 1.8s,
rest .65s. Body expansion is below 1% and registered at the lower body/tail contact.
The lines use this same curve; they do not flash or intercept pointer input.

## Reference inputs

1. `Consistency ref/sprites/swimming/ChatGPT Image 24 Sept 2026, 23_54_43.png`
2. `Consistency ref/sprites/looking/ChatGPT Image 24 Sept 2026, 23_55_11.png`

## Generation prompt

Create a NEW production sprite animation atlas for Flo, the exact little mermaid in the supplied user reference images. Input 1 is swimming identity + movement reference; input 2 is face/hair identity reference. Preserve her mocha-brown skin, very large warm brown eyes, round face and small friendly smile, bright flowing orange hair and single signature curled forelock, yellow golden shell top, simple V golden waistband and single scaled golden fish tail with exactly TWO broad graceful leaf-shaped terminal fin lobes. Match the storybook illustration, proportions, face and warm palette exactly. This is a frame-by-frame website companion animation, NOT a redesign. Output landscape atlas, 4 equal columns x 3 equal rows, EXACTLY 12 separate full-body drawings, true transparent alpha background. Each cell is same size. Each character fully inside its cell with at least 12 percent completely empty gutter on all four sides; no overlaps, no clipped fins or hair. No letters, numbers, text, scenery, water, glow, shadows, background color or grid lines. Flo's head and torso must have exactly the same scale and same center anchor in every cell. She faces LEFT in every frame, three-quarter profile, looking inward toward viewer-left. First TWO rows (8 drawings in reading order): a single subtle continuous swimming cycle, a gentle diagonal upright swimming posture with head higher at LEFT and tail trailing down toward RIGHT; body 30 degrees away from upright; arms relaxed slightly reaching left, hair drifts right. Frame 1 relaxed stroke, 2 tail curling inward, 3 tail compression, 4 broad two-lobed fin push, 5 extension, 6 follow-through, 7 soft recovery, 8 almost exactly frame1 for seamless loop. Small progressive differences only, preserve head/torso position, face identity and overall silhouette in all 8 frames, no rotations/turnarounds. Bottom row FOUR full-body rest/anticipation frames, still facing LEFT with same head scale: 9 relaxed upright hovering looking left toward viewer; 10 same body with gentle upward glance and one hand poised near chest; 11 same with gentle downward glance; 12 same relaxed hover as frame9 but softly blinking, eyelids closed. Hair and tail gently drifting right in every frame. Anatomical accuracy: exactly two arms, two hands, ONE continuous fish body and exactly two caudal fin lobes, no legs or extra fins. Use all space in each cell while respecting transparent gutters. High quality crisp transparent sprites.

## Layout refinement prompt

Refine this exact Flo 12-frame sprite animation sheet for production. Preserve the exact SAME twelve poses, character identity, face, expression, colors, hair curl, body scale, TWO-lobed tail and drawing style. ONLY fix layout and edge cleanliness. Use a 4-column x 3-row grid of equal-size cells, and shrink every figure uniformly until all its hair and fins fit inside the middle 72% of each cell. There must be a WIDE completely transparent EMPTY gutter around all four sides of EVERY cell, no overlap. Each same-scale head at the SAME relative position within its cell. Make the background truly transparent, with NO colored dust, no stray flecks, no glow, no colored fringe, no shadow. Remove the existing tiny stray yellow/red speckles between characters while preserving clean soft antialiasing at actual silhouette edges. Do not add text, lines or anything else. Exactly twelve separate sprites in original reading order, eight swimming frames then resting, up glance, down glance, blink. Do not change character design or anatomy.
