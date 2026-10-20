# Flo artwork provenance

Recreated with the built-in image-generation tool on 20 October 2026 from the user's supplied Flo reference sheets in the repository's sibling `mermaid assets` folder.

Reference sheets:
- `WhatsApp Image 2026-10-20 at 15.35.52 (2).jpeg`
- `WhatsApp Image 2026-10-20 at 15.35.26 (3).jpeg`

The character retains the supplied storybook appearance: mocha skin, orange-red wavy hair with a curled forelock, golden shell top and a continuous golden fish tail. Every rendered pose uses exactly two terminal fin lobes.

## Runtime files

- `mermaid-atlas.webp`: 1536 × 1024, 242,378 bytes. Supplies neutral, losing balance, falling and swimming. Its draft catch and rise cells are unused.
- `mermaid-catch-rise.webp`: 1774 × 887, 259,928 bytes. Supplies the corrected counterbalancing and resurfacing drawings.
- Total new first-view image payload: **502,306 bytes** (about 491 KiB).
- Both are WebP encodings at quality 88 / alpha quality 100, with original dimensions and alpha preserved.
- Source rectangles, body-scale alignment and horizontal mirroring are implemented in `assets/js/ocean.js`. No runtime fetch, CDN, model or backend is used.
- Only the four selected cells of the first sheet and the two replacement drawings are rendered. This excludes the rejected multi-lobed resurfacing draft.
- Original portfolio artwork is unchanged.

The raw generated files are retained under the Codex generated-images directory for this task:
- `exec-ee21dcc0-49a5-43d2-8709-8ef8aac92856.png` — main sheet
- `exec-aeb5d56f-84fe-4435-8ace-e818f6f6bf6e.png` — corrected pair

## Six-pose generation prompt

Create a NEW production animation sprite atlas for Flo, using the supplied reference sheets for her EXACT character design and painterly storybook style. Wide landscape atlas, 1536x1024 aspect ratio, EXACTLY SIX full-body poses in a regular grid of THREE equal columns and TWO equal rows, with transparent padding of at least 7% inside every cell. Genuine transparent background. No text, no labels, no water, no shadows, no scenery. All characters fully inside their own cells. Identity: warm mocha brown skin, round expressive face with large warm brown eyes, abundant bright orange-red hair with her signature single curling forelock, golden shell top, simple gold V waist band, one continuous golden scaled fish tail. CRITICAL ANATOMY IN EVERY SINGLE POSE: ONE tapered fish body ending in ONE terminal caudal fin with EXACTLY TWO broad flowing leaf-shaped lobes joined at the same narrow tail tip. Only two lobes, no third or fourth trailing lobe, no extra side fins, no additional gold ribbons, no spiky branched fan. Keep the identical two-lobed fin design across all six poses, including swimming and resurfacing. Both fin lobes should follow the same overall flow direction rather than looking like two different tails. Use clear silhouette, warm yellow-gold scales, pale golden fins, soft illustrated shading. Camera behind her for all four gameplay poses. Directional gameplay poses must be mirrorable; the losing/falling direction is RIGHT in this atlas.
TOP LEFT cell: NEUTRAL BALANCE, straight-on BACK VIEW, shoulders level, torso upright, arms sideways, single tail curved gently beneath her as a support, exactly two fin lobes.
TOP MIDDLE cell: LOSING BALANCE TO THE RIGHT, BACK VIEW, hips, torso and head all tip right, right arm lower and left arm raised instinctively; continuous tail and exactly two fin lobes.
TOP RIGHT cell: CATCHING HERSELF, BACK VIEW, clearly counterbalanced S-shaped posture: hips and lower tail shift and lean RIGHT toward the falling side, while torso, shoulders, head and both arms reach LEFT in the opposite direction. This must clearly differ from simply leaning: lower body right, upper body left. Exactly two tail fin lobes.
BOTTOM LEFT cell: ACTUALLY FALLING TO THE RIGHT, REAR THREE-QUARTER VIEW, torso and head tipping strongly DOWN AND RIGHT, arms reaching toward water that is not drawn, hips follow, tail lifted back toward upper-left, exactly two fin lobes. Entire character inside the cell. She is tumbling into the water, not standing or sitting.
BOTTOM MIDDLE cell: RESURFACING, three-quarter rear view, upright rising pose, arms slightly raised, a glimpse of her friendly face, continuous curved gold tail below, exactly two fin lobes.
BOTTOM RIGHT cell: SWIMMING LEFT, horizontal side view, head and arms leading left, body and orange hair flowing right, a streamlined continuous golden tail trailing right ending in exactly two broad fin lobes aligned together. Compact horizontal silhouette suitable for a small companion dock.
Match identity and proportions across all six cells. Reference image1 is the character design source; image2 provides the back-view silhouette; image3 shows the four-pose style already used but its multi-lobed tails are INCORRECT and must be simplified to exactly two lobes as instructed. Do not reproduce any text, reference-sheet panels or backgrounds.

## Sheet refinement prompt

Edit this exact six-pose sprite atlas into a production-ready transparent sprite sheet. Preserve Flo's identity, face, mocha skin, vibrant orange-red hair and curled forelock, gold clothing, painterly storybook illustration, and most importantly the same SINGLE continuous fish body with EXACTLY TWO broad caudal fin lobes on EVERY sprite. Absolutely no extra third or fourth lobe, no separate leg-like tails, no pelvic fins, no gold ribbons.

Keep the same 3 columns by 2 rows pose order: neutral straight rear; losing balance toward viewer-right; catching balance with hips/lower tail leaning viewer-right while chest, head and shoulders visibly counterbend viewer-left; actual sideways fall toward viewer-right; resurfacing; horizontal swimming left. Keep every directional action mirrorable.

CRITICAL PRODUCTION FIX: the current sprites nearly touch between rows. Re-layout them as SIX SEPARATE FIGURES inside six equal rectangular grid cells on a wide 3:2 sheet. SHRINK EACH FIGURE enough to leave AT LEAST 40 pixels of completely transparent empty padding INSIDE EACH CELL on all four sides. Keep neutral, losing and catching same scale, tail support point on the same row baseline. NO artwork from one cell crosses another cell or its empty gutter. All hair curls and all fin tips fully visible, no cropping. Each figure isolated with a hard 40px transparent gutter. NO painted or blurry background, NO glow, NO halo, NO shadows, NO text, NO cell borders. Real alpha transparency.
For catching (top right), strengthen the counterbalance: tail base and hips at right, shoulders and head at left, visible curved S gesture, arms reaching left. Do not change the exact two-lobed fin anatomy.

## Final catching and resurfacing correction prompt

Create TWO new isolated full-body game sprites of Flo using the provided atlas ONLY as the character identity and painting-style reference. Wide landscape transparent image, two equally sized side-by-side cells, each figure fits entirely inside its half with generous 10% empty padding. Do not reproduce the six-pose sheet. Exactly TWO figures total. Original painterly storybook mermaid, mocha-brown skin, big expressive brown eyes, very abundant orange-red wavy hair with curled forelock, gold shell top, gold V waist, scaled golden fish body.

LEFT FIGURE — STRONG COUNTERBALANCE, REAR VIEW: she is catching herself from falling to the RIGHT. Her hips are displaced FAR RIGHT of the central support point. Her chest, shoulders and head are displaced FAR LEFT of her hips and LEFT of the central support point. Both arms extend to the LEFT. Make her spinal/body silhouette an exaggerated S-shaped counterweight gesture, head and shoulders left, hips right, lower tail returning to the central support. Hair must sweep LEFT with the shoulders, not obscure this clear opposite lean. She must NOT lean head and hips in the same direction. This is visibly distinct from merely tilting the whole character.

RIGHT FIGURE — RESURFACING: three-quarter rear view rising upright, one hand slightly raised, face looking cheerfully over the shoulder. Golden tail below curves smoothly to the left.

CRITICAL ANATOMY for BOTH: one single continuous fish body narrows into ONE tail tip. Attached to that tip is a simple V-shaped caudal fin with EXACTLY TWO wide graceful leaf-shaped lobes. Each lobe has ONE smooth outer edge and ONE pointed terminal tip. Count exactly TWO external tips total. NO scalloped edges, NO additional points along either lobe, NO third middle lobe, NO auxiliary side fins, NO ribbons, NO split fish bodies. Think ordinary two-fluked fish tail rendered in flowing gold leaf shapes. The resurfacing reference had an erroneous third fin lobe: DO NOT copy that mistake.

True transparent alpha background; no halo, no colored glow, no scenery, no water, no shadows, no text, no labels. Crisp readable silhouettes and all fingertips, hair curls and two fin tips visible.
