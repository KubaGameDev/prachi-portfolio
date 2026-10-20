# Flo balance animation source

Created 20 October 2026 using the built-in `image_gen` tool and the `imagegen` and `character-pose-animation` skills.

## Files and preservation

- `flo-balance-atlas-v1.png`: selected unmodified RGBA generation, 1774 × 887 pixels, 1,280,226 bytes.
- `flo-balance-atlas-v1.webp`: WebP format conversion of the same image, quality 92, 422,068 bytes. Alpha is byte-for-byte identical to the PNG.
- All supplied references and the previous `mermaid-atlas.webp` remain unchanged.
- No repainting, background removal, pixel cleanup, crop, or pose synthesis was performed in code.

Primary identity reference:

`prachi-portfolio/assets/images/ocean/mermaid-atlas.webp`

Supporting pose references:

- `Consistency ref/sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_43.png`
- `Consistency ref/sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_51.png`

## Frame contract

The generated canvas is a regular four-column, two-row atlas. Its dimensions differ from the requested 2048 × 1024, so the exact equal-cell width and height are both **443.5 px**. Canvas `drawImage` accepts fractional source rectangles. Use `sx = column * 443.5`, `sy = row * 443.5`, `sw = sh = 443.5`.

Frames are row-major, zero-indexed:

| Frame | Source x | Source y | Pose |
| --- | ---: | ---: | --- |
| 0 | 0 | 0 | Neutral, lowered open arms |
| 1 | 443.5 | 0 | Gentle right lean |
| 2 | 887 | 0 | Stronger right lean, right arm lifted |
| 3 | 1330.5 | 0 | Beginning counterbalance, left arm lifted |
| 4 | 0 | 443.5 | Stronger left chest / right hip counterbalance |
| 5 | 443.5 | 443.5 | Recovery |
| 6 | 887 | 443.5 | Nearly neutral |
| 7 | 1330.5 | 443.5 | Neutral with hair and fin follow-through |

All views are from behind. The tail fin continues screen-right throughout. Each tail has two broad caudal fin lobes. Source scale and anchor have slight generative variation: this is an authored pose sheet rather than an exactly registered DCC bake.

Approximate cell-local tail-to-fin junction anchors, measured visually, for runtime registration:

```js
[
  [225, 343],
  [252, 347],
  [274, 350],
  [257.5, 347],
  [247, 327.5],
  [250.5, 330.5],
  [247, 331.5],
  [242.5, 331.5],
]
```

Draw each chosen cell relative to its junction anchor if a stationary body contact is required. The anchor is the narrow tail/fin junction, not the bottom tip of a moving fin. Keep continuous root motion separate from pose sampling. Start at a 24 fps visual cadence; use intentional neutral holds and faster travel through the lean/counterbalance, with gentle recovery. Gameplay tilt should select/weight poses; a repeating uniform cycle would not represent the player's balance.

Inspection confirmed all eight whole-body silhouettes fit their cells at alpha > 128. Per-cell high-alpha bounds below use rounded integer inspection cells, so they are diagnostic rather than the source extraction contract:

| Frame | Approximate local alpha > 128 bounds, x0/y0/x1/y1 |
| --- | --- |
| 0 | 90 / 26 / 389 / 439 |
| 1 | 55 / 27 / 408 / 437 |
| 2 | 57 / 27 / 435 / 439 |
| 3 | 71 / 26 / 409 / 439 |
| 4 | 84 / 21 / 419 / 422 |
| 5 | 87 / 18 / 413 / 427 |
| 6 | 85 / 17 / 414 / 423 |
| 7 | 95 / 17 / 408 / 427 |

The built-in output retains low-alpha colored fringe/speckles around some silhouettes. These look conspicuous in the tool's black-background image preview, but three empty gutter patches contained only alpha=1/255 nonzero pixels; normal browser alpha compositing should make these effectively invisible. The cleanup iteration improved pose continuity but did not remove these nearly transparent pixels. Assess final appearance against the actual game background. No runtime behavior was verified by this asset task.

## Generation prompt

Built-in tool parameters: `transparent_background: true`; reference images listed above in the same order.

> Use case: stylized-concept.
> Asset type: transparent game animation sprite atlas.
> Create ONE new image containing exactly 8 full-body character poses arranged in a regular 4 columns x 2 rows grid, landscape canvas ideally 2048 x 1024. Cells are identical 512px squares. True transparent alpha background, absolutely no painted or checkerboard background.
> The character is Flo from the supplied references. The first input is the current game's Flo atlas and is the PRIMARY identity reference. The other inputs are supporting references for balancing gesture and the same brand identity. Keep her exact rich warm-brown skin, enormous flowing bright vivid orange hair with a single curled forelock on top, yellow/golden scalloped shell-top straps, pale golden scale-textured mermaid tail, soft cream-yellow caudal fin with delicate orange ribs, charming warm 2D painted storybook style, round chibi-like head-to-body proportions. Do not redesign Flo. We need a cleaner, stable animated continuation of the BACK VIEW Flo in the top row of the primary atlas.
> ALL EIGHT poses must be seen from directly BEHIND (no face, no front/side view, no rotation around her body). Orthographic fixed camera. Same scale in every cell, same head size, stable tail-contact anchor at cell-local coordinate approximately x=256 y=455. Hair and hands can move but all pixels must fit within each cell with at least 30px clear transparent gutter. Pose silhouette approximately 360-400px tall. Keep both hands visible and anatomically coherent, five fingers each. ONE tail tapering into exactly TWO broad separated caudal-fin lobes in each frame, no extra tail or fin lobes. No ocean, water, waves, droplets, board, floor, shadows, accessories, motion lines, labels, numbers, text, grid lines, or borders.
> These are consecutive beats of a smooth balance-and-recovery action, ordered left to right across the top row then the bottom row:
> 1. Back-view neutral: torso upright, arms gently open and lowered diagonally, tail resting down, hair relaxed.
> 2. Gentle screen-right lean of shoulders, elbows lift a little, root tail anchor remains fixed.
> 3. Stronger screen-right lean, right arm reaches out and a little upward, left arm extends for counterbalance, hair lags slightly screen-left.
> 4. Begin counterbalance: hips continue screen-right while shoulders start moving screen-left, arms asymmetrical, forming a gentle reverse S body curve.
> 5. Strongest counterbalance: chest toward screen-left, hips toward screen-right, left arm lifts and right arm reaches lower, hair follows late without changing length or volume.
> 6. Recovery: shoulders centered, hips returning, arms settle, tail fin springs slightly with two lobes.
> 7. Almost neutral, very small overshoot screen-right, hair and fin following through.
> 8. Neutral again matching frame 1 body's scale and silhouette and same tail anchor, arms relaxed, tiny hair and fin follow-through to make a smooth seam.
> Change POSE ONLY; preserve character design, style, colors, body proportions and camera. Do not reproduce the warm opaque backgrounds of the reference images. This is a production sprite sheet with real transparent empty pixels and no touching or overlapping adjacent frames.

First output, retained in the tool's generated-image directory:

`/Users/kmole_macbook/.codex/generated_images/01a15aa2-b6be-79a3-8cac-0b55068c78c5/exec-f12b4b10-04f6-446e-96fe-7297343777bb.png`

## Cleanup prompt

Built-in tool parameters: `transparent_background: true`; first output used as the sole image reference.

> Use case: identity-preserve. Edit this exact 8-frame Flo mermaid sprite atlas. Preserve the beautifully rendered warm brown skin, vivid orange hair and forelock, pale golden tail, painterly finish and exact character proportions. Keep every pose entirely BACK VIEW. Keep exactly 4 columns and 2 rows, same ordering. Maintain 2:1 canvas, ideally 2048x1024, giving 8 equal square cells.
> Make only these technical corrections so it becomes production-ready:
> (1) Remove ALL stray red/orange/yellow speckles and fringe outside the character silhouettes. Every empty pixel must be genuinely fully alpha-transparent. All edges cleanly anti-aliased; no colored halo, no background color, no checkerboard.
> (2) Scale all 8 Flo figures uniformly down by roughly 18% relative to their cells, leaving clear empty transparent margins on every side of each square cell (minimum 45px). Same head size across frames; each character must stay fully inside its cell.
> (3) Lock the tail-to-fin junction to the same cell-local anchor x=250,y=365 in all cells. Main two-lobed fin extends down and SCREEN RIGHT consistently in every frame, including frame 5. Exactly TWO broad fin lobes per tail. Never flip the tail to screen left.
> (4) Smooth the sequence: frames 1 and 8 neutral and visually matching; frames 2,3 lean screen-right; frames 4,5 hips screen-right with chest counterbalancing screen-left; frame 6 recovering; frame 7 close to neutral with relaxed arms lowered like frame 1. No sudden tail direction changes.
> Each row uses identical scale and identical cell-local anchor. Keep fixed orthographic camera. No text, numbering, grid, borders, water, waves, motion marks, floor or shadows. Do not add any new objects or change identity.

Selected raw output:

`/Users/kmole_macbook/.codex/generated_images/01a15aa2-b6be-79a3-8cac-0b55068c78c5/exec-02175d5e-740a-4c58-87d9-fc7ea6b88f22.png`
