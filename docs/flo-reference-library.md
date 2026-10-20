# Flo reference library

Inventory recorded 20 October 2026. The source library is the sibling folder
`../Consistency ref` relative to the `prachi-portfolio` repository. Its absolute
location for this workspace is `/Users/kmole_macbook/Websites/Prachi/Consistency ref`.
The user's original files remain in that folder under their original names.
Do not move, replace, recompress, rename, or overwrite these originals when making
runtime derivatives. This inventory records provenance; it is not a backup.

## Scope and preservation

- Preserve every source file, including alternate designs, repeated images, and
  non-image supporting files. Duplicate hashes are intentional inventory entries.
- Use the root Flo character art and `sprites/` for character design and movement.
  `merch/` is supporting brand material.
- `for slides/` is mixed supporting material. Only file metadata and hashes were
  inventoried; slide photos, receipts, archives and PDFs were not visually reviewed
  or extracted. Do not publish that folder as website assets.
- Produce separately named runtime images under `assets/images/ocean/`, recording
  the source paths, crop rectangles and processing in their provenance document.
  Never silently replace a source with a cutout or generated interpretation.
- A SHA-256 check against the tables below can establish whether an original has
  changed since this inventory. Read image dimensions from headers; do not treat
  the presence of an alpha channel alone as proof of a transparent background.

## Character consistency

Visually reviewed the root character sheets, pose sheets in `sprites/`, and the
two existing ocean WebP atlases. Flo is a warm, curious mermaid with mocha-brown
skin, large brown eyes with expressive eyebrows, a small rounded nose, and a
friendly rounded face. Her abundant orange-red hair has long soft waves and a
recognizable curled forelock. Keep that curl visible when a pose permits it.
Her top is golden and shell-shaped, her waist forms a gold V, and one continuous
golden scaled tail ends in two broad pale-gold fin lobes. Preserve those two
terminal lobes; do not introduce extra ribbon-like fins or leg-like tails.

Use warm painterly shading, clear silhouettes, and soft flowing hair. The
simple outlined sticker sheet is an alternate graphic treatment, not an
animation frame to interleave with the painterly art. The tall turnaround
figures and compact companion figures have different proportions: choose one
proportion family for a clip, and keep head size, torso scale and tail attachment
consistent through its frames. Match the active website artwork when adding
in-betweens. Preserve the face and hair rather than treating every orange-haired
mermaid as interchangeable.

Movement should read as an authored sequence: attention/gaze, a brief hesitation,
tail-driven travel, deceleration, and a settled hold. Hair and fins follow the
body with a slight delay. Keep continuous travel independent of frame selection;
changing animation cadence must not change travel speed. Review consecutive
frames and the loop seam for facial changes, clipped curls, extra fins, and
unintended apparent size changes. A sequence of unrelated poses or a uniform
scale wobble is not a substitute for the supplied acting.

## Recommended source art

All source paths below are relative to `Consistency ref/`. Alpha ranges are
observed 8-bit minimum–maximum values; a maximum of 254 is still usable alpha.

| Use | Source | Dimensions | Transparency | Notes |
| --- | --- | --- | --- | --- |
| Clean standalone swim identity | `ChatGPT Image 10 Oct 2026, 20_13_29.png` | 1536 × 1024 | RGBA, 0–254 | Right-facing, compact full-body swim with long trailing hair. A strong single-pose identity reference. Retain original canvas/padding until intentionally aligned. |
| Full character proportions | `ChatGPT Image 24 Sept 2026, 23_32_03.png` | 1024 × 1536 | RGBA, 0–254 | Tall front three-quarter standing/hovering Flo. Useful identity anchor; proportions differ from the compact swimming sequence. |
| Swimming cycle | `sprites/swimming/ChatGPT Image 24 Sept 2026, 23_54_43.png` | 1672 × 941 | RGBA, 0–255 | Eight right-facing poses in one horizontal band. Head and torso rise/fall with the tail. Hair overlaps/touches neighboring poses; equal-width cropping is unsafe. |
| Dive-to-swim reference | `sprites/swimming/ChatGPT Image 24 Sept 2026, 23_54_53.png` | 1672 × 941 | RGBA, 0–255 | Eight poses across a horizontal band; early poses are nose-down, later poses swim right. Treat as an action transition, not an automatic seamless loop. |
| Alternate dive/swim strip | `sprites/swimming/download (3).png` | 1672 × 941 | RGBA, 0–255 | Similar eight-pose strip. Retained as a separate source; compare with the other strip before choosing frame order. |
| Full-body looking/resting | `sprites/looking/ChatGPT Image 24 Sept 2026, 23_56_13.png` | 1254 × 1254 | RGBA, 0–255 | Nine front/three-quarter poses. Upper row looks upward, middle row sideways/up, lower row downward. Best source for cursor anticipation and settled attention. |
| Face-only gaze | `sprites/looking/ChatGPT Image 24 Sept 2026, 23_55_11.png` | 1254 × 1254 | RGBA, 0–255 | Nine bust portraits for expression/gaze reference; do not replace full-body frames with these. |
| Emotion variations | `sprites/diff moods/ChatGPT Image 24 Sept 2026, 23_59_12.png` | 1254 × 1254 | RGBA, 0–255 | Nine busts for subtle brow/eye acting and hesitation. |
| Calm rest/meditation | `sprites/meditating/ChatGPT Image 25 Sept 2026, 09_40_56-1.png` | 1448 × 1086 | RGB, opaque | Eight seated-tail meditating poses on cream. Good pose reference; not a transparent atlas. |
| Expressive rest/meditation | `sprites/meditating/ChatGPT Image 25 Sept 2026, 09_41_09-2.png` | 1448 × 1086 | RGB, opaque | Eight poses with small expressive accents; some are more startled than calm. |
| Broad resting/action choices | `Flo-website-icons-artistic-v1.png` | 1024 × 1536 | RGBA, 0–254 | Twelve full-body painterly icons in a nominal 3 × 4 layout. Rest, sleepy, curious and swimming choices; tight cell boundaries need review. |
| Sleep/wake study | `sprites/sleeping/ChatGPT Image 25 Sept 2026, 09_33_55.png` | 1536 × 1024 | RGBA, 0–253 | Multiple rows of sleeping/waking, including props and sleep marks. Reference for a long idle, not a ready continuous swimming clip. |
| Neutral balance cycle | `sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_33.png` | 1448 × 1086 | RGB, opaque | Eight poses with waves; gentler arm and torso changes. |
| Loss/recovery balance acting | `sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_43.png` | 1448 × 1086 | RGB, opaque | Eight more expressive balance/recovery poses, useful anticipation and reaction silhouettes. |
| Directional balancing | `sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_51.png` | 1448 × 1086 | RGB, opaque | Eight poses across two rows; hair and arms shift while she rides a wave. |
| Board balance | `sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_56.png` | 1448 × 1086 | RGB, opaque | Eight poses including a surfboard and wave; not interchangeable with a bare-tail balancing atlas. |

## Crop and atlas guidance

Coordinates use `[x, y, width, height]` with a top-left origin. The supplied
reference sheets are visual guides, not all production atlases. Do not infer a
usable sprite merely from a nominal grid:

- Looking and mood sheets: nominal **3 × 3 cells of 418 × 418**. Cell origin is
  `[column × 418, row × 418]`. Some hair/fin tips cross the nominal boundaries;
  inspect the selected cell and its neighbors before exporting. Transparent
  colored edge speckles are visible in these sheets.
- Swimming strips: nominal **8 × 1**, average pitch **209 pixels** across a
  **1672 × 941** canvas. Most art lies around the central horizontal band.
  These are not eight isolated 209-pixel-wide sprites: overlapping hair makes
  automatic equal-width slicing clip silhouettes and include neighboring art.
- Balance, jump, dive and meditation sheets: nominal **4 × 2 cells of 362 × 543**.
  Cream/yellow backgrounds, water, boards and marks are painted into the RGB
  images. Use them as authored timing/pose reference unless a separate cutout
  derivative is deliberately produced and reviewed.
- Artistic website icons: nominal **3 × 4**, column boundaries
  `[0, 341, 683, 1024]`, row boundaries `[0, 384, 768, 1152, 1536]`.
  Several painted silhouettes touch/cross those boundaries. Their differing
  shapes also require a consistent body anchor to avoid hopping.
- Preview contact sheets were temporary local inspection aids. They do not
  replace or modify the source files.

## Existing runtime artwork

Existing generation history and prompts remain in
[`assets/images/ocean/ART.md`](../assets/images/ocean/ART.md).
The two existing atlases are transparent WebP derivatives from an earlier
reference set; the new source library above remains preserved separately.
The following rectangles were observed in `assets/js/ocean.js` at inventory time:

| Pose | Atlas | Source rectangle | Dimensions / alpha |
| --- | --- | --- | --- |
| `balance` | `mermaid-atlas.webp` | `[100, 20, 360, 510]` | Atlas 1536 × 1024, RGBA 0–254 |
| `lean` | `mermaid-atlas.webp` | `[585, 32, 390, 495]` | Same atlas |
| `fall` | `mermaid-atlas.webp` | `[20, 540, 520, 410]` | Same atlas |
| `swim` | `mermaid-atlas.webp` | `[920, 635, 605, 320]` | Same atlas; faces left |
| `catch` | `mermaid-catch-rise.webp` | `[80, 0, 740, 887]` | Atlas 1774 × 887, RGBA 0–255 |
| `rise` | `mermaid-catch-rise.webp` | `[970, 0, 730, 887]` | Same corrected atlas |

The corrected `catch` and `rise` poses supersede the draft cells in the main
atlas. Keep this correction when reusing the existing gameplay set. Check the
current runtime for any subsequent changes to source rectangles.


## Complete image inventory

134 image files, 213,692,511 bytes total. Paths in this table are relative to `Consistency ref/`.

“RGBA” indicates an alpha channel; images may still contain opaque painted backgrounds. Slide and receipt images were inventoried without visual inspection.

| Source path | Dimensions | Mode | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| `ChatGPT Image 10 Oct 2026, 20_13_29.png` | 1536 × 1024 | RGBA | 1,566,797 | `6ec9454d0ce8a8ba7796c5de17883578c1153fcc77e9d24008b0bbc9f01d7215` |
| `ChatGPT Image 24 Sept 2026, 23_05_45 - Copy.png` | 1086 × 1448 | RGB | 2,065,580 | `486dbfe1288699fe088ac75a6bfdd2decbc8e6e6be7c85bff13b3ba7e89f85fd` |
| `ChatGPT Image 24 Sept 2026, 23_05_45 - Copyfa.png` | 1086 × 515 | RGBA | 693,013 | `a342a99c2545fcf7c2530e5bece85ad756fee3b04d00ab56aeb4f5a336ddec82` |
| `ChatGPT Image 24 Sept 2026, 23_05_45.png` | 1086 × 926 | RGBA | 1,671,236 | `1ec5dbff91f4860659a2ce343816524b8e34b72dc4236fc543ee6a287cd39e44` |
| `ChatGPT Image 24 Sept 2026, 23_32_03.png` | 1024 × 1536 | RGBA | 1,814,277 | `449b8ad98044a7e440e46cc3aeadf80984f458e22b57202ac860f08cf380ac34` |
| `ChatGPT Image 24 Sept 2026, 23_37_15.png` | 1448 × 1086 | RGB | 1,606,457 | `aa4273a16168f692b393017940ccb37a8c5083bb3d5170672e988d27aed3c046` |
| `ChatGPT Image 24 Sept 2026, 23_37_29.png` | 1448 × 1086 | RGB | 1,425,441 | `ce65b7edc7c51fa415d7414b027b1f6ebffd25a8e826f9209e4143d9c0060000` |
| `ChatGPT Image 24 Sept 2026, 23_45_09.png` | 1448 × 1086 | RGB | 1,938,672 | `560044d080e6d13597be611d4d76dfd506c540e0770e7265de3fb0edec22013a` |
| `ChatGPT Image 24 Sept 2026, 23_45_26.png` | 1448 × 1086 | RGB | 1,511,485 | `363a4de9cbebd91b3ee54cbf91cabfd5513773e9d8977ee338412b50f4dff4fa` |
| `Flo-simple-icons-sheet-v1.png` | 1024 × 1536 | RGB | 1,696,830 | `5d95df3ef9fc70d6697c9b8d8e19135c1dad56c6f9e5876529ba91fe4a1e0211` |
| `Flo-tier-5-co-creation-concept-v2.png` | 1024 × 1536 | RGB | 2,293,918 | `ccb2ac2564d502b3ddd9f01b5937314ca587b0800cb98eb5701713eaec52cc49` |
| `Flo-tier-5-co-creation-concept.png` | 1024 × 1536 | RGB | 2,272,736 | `2a8ed1d835425ce604904ab261eb4d5f6647d34cc73261c0da3e862301588375` |
| `Flo-website-icons-artistic-v1.png` | 1024 × 1536 | RGBA | 2,397,562 | `db48aaf4293ebe241d71aaa590cf5a498af04bf476baf9eef597b818a5239388` |
| `download (2).png` | 1448 × 1086 | RGB | 1,547,005 | `ad339bd9387470706be9b35d013b6af8fb0545e57c4b71347e5244c6a380f323` |
| `for slides/0BD922AB-9434-4A0E-BA52-110D2A8631E5.PNG` | 1024 × 1536 | RGB | 2,622,685 | `681a50b0a6abbc2e7d6659892c40b8da6765e617ea91122a9f0ab87f170ba047` |
| `for slides/112A4C5E-5933-46D4-B71E-A8A1C8E1622B.PNG` | 1086 × 1448 | RGB | 2,804,811 | `2942d06cee9e245845feb10ac6b5490dfe22077c804c8a63fb918b8152c9f70f` |
| `for slides/1747294259091 (1).jfif` | 480 × 640 | RGB | 62,326 | `f062671557d3073789034d1e846cab3dd13bffd3f3d3e1a8735835bd2a2e3b1e` |
| `for slides/1747294259091.jfif` | 480 × 640 | RGB | 62,326 | `f062671557d3073789034d1e846cab3dd13bffd3f3d3e1a8735835bd2a2e3b1e` |
| `for slides/1747413775189.jfif` | 1280 × 914 | RGB | 142,442 | `33436c78fbc8f201b6c67179cea6354cdbd07ee27367ada497c458f54eabe8e1` |
| `for slides/1A5FE153-12B6-4CDC-A8B5-4C60F3BA8D83.PNG` | 1672 × 941 | RGB | 1,582,814 | `043361e59e8f16d8e535418a3e0e1ee4a0c95ddd348726298196098f09403377` |
| `for slides/1C4B10CA-D268-43A4-874D-4F1393DB1804.PNG` | 1122 × 1402 | RGB | 2,351,102 | `f03d8254a1ff510981202d945b8599235ac2436757fddaf95de7cb0673ab8812` |
| `for slides/2EBDAB91-1ED2-40E1-998D-5610423CC994.PNG` | 1024 × 1536 | RGB | 1,781,253 | `f9cff86d6264721cdd25bc10433aec0bc0ec08375d4d871dafe8191eaefc0dbb` |
| `for slides/38769D9B-C8FF-429E-A6C0-C601E8020380.PNG` | 1223 × 1286 | RGB | 2,780,998 | `0313c023cc8f4e23a0dfbed95d9b502f014e8a024a5d2486d9af925092d42a00` |
| `for slides/60948C08-E95A-476C-9EC2-698A2E857958.PNG` | 1536 × 1024 | RGB | 2,387,019 | `3bacd4261f0660d48a55446ffe2e0e5588f4b7914ba4ac83cf1ef2e94bfb0059` |
| `for slides/6AA9AA10-EAE4-443B-A821-7CFB114607F9.PNG` | 887 × 1774 | RGB | 1,810,227 | `d4f9dbbeb87560c9025a673d2d448c39f40b4a97ebb195ca5ee333f9fb11c8a4` |
| `for slides/6CF0362C-906B-4756-8A53-AD7FCBCAD500.PNG` | 1536 × 1024 | RGB | 2,112,169 | `2f0ca109c5ec34dc99849544c68635e566b6d374715fe65f27214abffc859f71` |
| `for slides/73C03E32-D978-4C44-B1C5-98D88C0C7C89.PNG` | 1536 × 1024 | RGB | 3,004,344 | `fd5413b01fee1fddd980c1106ece07ab7f707f7f4363d2508ac8c810780ece3f` |
| `for slides/7590166D-8F92-4698-BBAB-1FF1105E3C0C (1).PNG` | 1536 × 1024 | RGB | 2,455,175 | `88bcf5d69ae3dabcca35e77130af8bc665c372c8699769521d25d9a0e428c81c` |
| `for slides/7590166D-8F92-4698-BBAB-1FF1105E3C0C.PNG` | 1536 × 1024 | RGB | 2,455,175 | `88bcf5d69ae3dabcca35e77130af8bc665c372c8699769521d25d9a0e428c81c` |
| `for slides/76EAFD32-A792-48AE-9EB1-EB7B8977A98B.PNG` | 1536 × 1024 | RGB | 2,230,761 | `6ba99b754bfa4db9a78f1a8152c42ecd98e72aac1a90d390200ba8cb6f794f11` |
| `for slides/8108C057-1D1E-4EB1-879F-3D3B78B0A311.PNG` | 1254 × 1254 | RGB | 1,074,716 | `464d5f53a78f05bc6d18bd37142ae40be2c3cf83daccdb634bcf055324b630ca` |
| `for slides/8EAB7145-FAF5-4129-8572-44AD72DA0308.PNG` | 1122 × 1402 | RGB | 2,538,382 | `40db15dc8057618f36b6a0b6051424f98b375df263d25026d6dde68e27f8d16b` |
| `for slides/A5DDAD15-D17B-403E-A70B-2A05DC3720DB.PNG` | 1024 × 1536 | RGB | 2,505,497 | `f8346e2e0eb0a337eb880828453ddfdd068effcd1c2c167fbeb1dabe9ddc1414` |
| `for slides/C416EF8D-4606-4849-B4DF-0C25270B08E0 (1).PNG` | 1402 × 1122 | RGB | 2,662,423 | `d9c7370c9b79f2ddc8ce8679e56ee352eef44c37e6f489e0d8204093ffae3d47` |
| `for slides/C416EF8D-4606-4849-B4DF-0C25270B08E0.PNG` | 1402 × 1122 | RGB | 2,662,423 | `d9c7370c9b79f2ddc8ce8679e56ee352eef44c37e6f489e0d8204093ffae3d47` |
| `for slides/C9389B69-3998-415E-962E-DF383A18A7D4.PNG` | 1024 × 1536 | RGB | 2,428,082 | `4b86034037bef72ce76415f8c3ff10601631c7169e16e953482a6cdd4bd2736d` |
| `for slides/CC8B0908-DCA8-4F30-94F2-109CBF324911.PNG` | 1536 × 1024 | RGB | 2,282,657 | `46452520c099ce7136c3d4e6a52be5ffb6806334fe86347058986b5e3963b83f` |
| `for slides/ChatGPT Image 1 Oct 2026, 11_21_36.png` | 1672 × 941 | RGB | 2,272,063 | `7f213e427cf99deaac337fc33ced76695107c6c5fb43d5eb48806e955e33a0da` |
| `for slides/ChatGPT Image 1 Oct 2026, 21_47_31.png` | 753 × 424 | RGB | 361,251 | `4b061d2afc0160164a7ae355550a68c6c93a8ff9e992e7bf4ab4edf88011a39e` |
| `for slides/ChatGPT Image 18 Sept 2026, 16_21_09.jpg` | 1122 × 1402 | RGB | 361,740 | `fbc5e5268eacaa06d455a0dea45d897437f16a2f67fd263b9bf449c688458ad4` |
| `for slides/ChatGPT Image 30 Sept 2026, 15_34_49.png` | 1672 × 941 | RGB | 2,174,974 | `dbea2eb32278407d027497802fedbbb171d7b92d8d9c0a5e0aadc4ef152f1e77` |
| `for slides/ChatGPT Image 30 Sept 2026, 15_35_19.png` | 1672 × 941 | RGB | 2,148,983 | `3fbdc364e478818f9c1b1119d639f0ada2e6810f5cc606cc60f4cf044503a02b` |
| `for slides/ChatGPT Image 30 Sept 2026, 15_35_27.png` | 1672 × 941 | RGB | 1,873,527 | `475ed71eae8591bd1963fae5aa2b3d0b15959b2dc0aa846c3a3a34c1349694c5` |
| `for slides/ChatGPT Image 30 Sept 2026, 15_35_36.png` | 1672 × 941 | RGB | 2,059,688 | `620764f794e104fad5dc2cd0d07935c15951f0724a087e4e24b8a39804741a6e` |
| `for slides/ChatGPT Image 30 Sept 2026, 15_35_42.png` | 1672 × 941 | RGB | 1,910,120 | `256b69571e5b5077499748d45cb7e3e1d8993d0164e88d78b007e5a46b9c943a` |
| `for slides/ChatGPT Image 30 Sept 2026, 16_21_37.png` | 1672 × 941 | RGB | 1,648,686 | `928c818be48b10e5e90d816d34796a51128cb89831574d0b0e4803ba41f1d6b2` |
| `for slides/ChatGPT Image 30 Sept 2026, 16_32_44.png` | 1672 × 941 | RGB | 1,920,399 | `324cc096f831e2f43898ada18319be1367ad58700c8815003d14ecc2fb36b1d0` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_47_59.png` | 1122 × 1402 | RGB | 1,953,046 | `e008e1a3552acab50980bf06ca37afc6c1d04001a9a5e2dd066afd5b1e8ed33e` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_54_28.png` | 1378 × 1141 | RGB | 2,177,550 | `5b6d44c2ff469368f4dcdf1f1cf8568b8bb35acce8a8df36ad5fc5a89f6a4a9c` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_54_51.png` | 1536 × 1024 | RGB | 2,010,594 | `b5333dfaa7e3f27161712b1334cad78651a576c2f066067b5f5a40d82e84a433` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_55_19.png` | 1536 × 1024 | RGB | 1,840,512 | `1513dd147aec90f8cd34ed3b8939d5585fafb039273b6cca69a0108a6e8f2d65` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_55_32.png` | 1536 × 1024 | RGB | 2,353,760 | `e3c500afa8a81f76b2b66dc0f70fbb889478b087ee05c797c043e88a34f2b72b` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_55_55.png` | 1536 × 1024 | RGB | 2,404,149 | `0fb5a8d2c2f55f34ff988ea115ddff4a53191f438d0d539752b5cbf875b9a267` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_56_43.png` | 1536 × 1024 | RGB | 2,241,308 | `000cbf4aed2006bd9ee22709ee472f8b124fa1dfbca461f6a9954edf4fd9b5d7` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_57_28.png` | 1536 × 1024 | RGB | 1,799,292 | `45295447402c8d67420cff30cc43f504b24db1768a8e5c7937a4c473154639f7` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_57_52.png` | 1374 × 1145 | RGB | 2,249,090 | `e5da53bcd21df361bad8bc3c8cdbc0fb263509253c1b74f1e2199f08f8192acf` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_58_20.png` | 1536 × 1024 | RGB | 2,413,210 | `34bb50cd08400719a2c5ca113daf051eb83ff46136af21339e874ace5378939d` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_59_04.png` | 1122 × 1402 | RGB | 2,484,215 | `98f2be951cf8799b7d2257dd2ea53e4f86c015c9358de6193a0ca1ebf8763e3c` |
| `for slides/ChatGPT Image 30 Sept 2026, 20_59_48.png` | 1122 × 1402 | RGB | 1,183,569 | `5483da7cc7c5646583a2b6fc5d3ff52aac2cee8a8709b32cafc085abe4e75a08` |
| `for slides/ChatGPT Image 30 Sept 2026, 21_00_28.png` | 1223 × 1286 | RGB | 2,175,174 | `784236f539f70437a210274a19231c7cc98dd731a8e1cef3fc3035e9b744d13c` |
| `for slides/D647CBE9-FC25-4DF3-90BC-ADC4D5305596.PNG` | 1122 × 1402 | RGB | 3,177,106 | `f68d67aafa1096bbfb06ec1e58880f5635e9353d6b77f126c54c50292ba62cb4` |
| `for slides/DD1FF21B-898D-470A-90E8-A70F1B09F5F8 (1).PNG` | 1536 × 1024 | RGB | 2,273,932 | `f18d19cadbbc9ee9d14f0a6ff9f7d6a4b54713d10a345703d024a65a4f4eb32d` |
| `for slides/DD1FF21B-898D-470A-90E8-A70F1B09F5F8.PNG` | 1536 × 1024 | RGB | 2,273,932 | `f18d19cadbbc9ee9d14f0a6ff9f7d6a4b54713d10a345703d024a65a4f4eb32d` |
| `for slides/F15438EB-2B33-40C2-82A8-EF18879FC0DA.PNG` | 1672 × 941 | RGB | 2,122,360 | `6f81a4f4a4fd71e2336cb02e6641928c759c79d0cce0fa9221cc6b1526db347a` |
| `for slides/F311124F-EA68-479F-BBED-8AEC3C24F2F0.PNG` | 1122 × 1402 | RGB | 2,228,035 | `0287cb2b36126376ef6816e2a22c6cfd87be9b4921a45171b85460d610631dcb` |
| `for slides/F685508B-A717-4458-B199-6E0B4616C855.PNG` | 1122 × 1402 | RGB | 2,139,530 | `268550482af84e4534fead5b904d384f2d40a239390e947c94ff2eb11899384b` |
| `for slides/F7832B50-DAE0-45EC-BE73-7250BD923EF1.PNG` | 1536 × 1024 | RGBA | 2,297,668 | `19bcbc6bc38573766b34d6b7f3f3d42fc12427ef9a26f58bfb2a2ad0c3e41c5f` |
| `for slides/F8DBAADE-2D04-4185-8C89-07EF309CE7A2.PNG` | 1536 × 1024 | RGB | 2,032,806 | `139a13e9f52665050967f535130c5f07277265c19146c30197b1e686c58fe40d` |
| `for slides/IMG_0181.JPG` | 4032 × 3024 | RGB | 2,952,834 | `d94bdb2557d9aec733a6ab3adff5256b3429470deedc704f33e3d0c55eb97008` |
| `for slides/IMG_0193.JPG` | 4032 × 3024 | RGB | 1,851,796 | `d1eac6afc3e51aeeedf82b2137041f748c99b9ceaf5cf968e032c9b68aa27a9d` |
| `for slides/IMG_1946.JPEG` | 4032 × 3024 | RGB | 3,467,548 | `3f82bccb01c191324796456ef5b5603f9fcd4a4246b9a7532017f99defc90736` |
| `for slides/IMG_1970.JPEG` | 4032 × 3024 | RGB | 2,926,656 | `88cd535bd95ce4c74889392e2c2b4d66a381deeaf966d9551d4daffc79f88ef5` |
| `for slides/IMG_2709.JPEG` | 735 × 417 | RGB | 52,275 | `5a342502d7ac4ca511ce65515e12fdd9d77c11319c32712def9f9fb1cbcef181` |
| `for slides/IMG_2880.PNG` | 1170 × 2532 | RGB | 4,729,030 | `4892694bc9202647201974be566f651c7b84e945a169936f9c06440e8408fc9d` |
| `for slides/IMG_3043.jpg` | 1130 × 1532 | RGB | 176,061 | `547c76d8ce01335c364f7255fb176a5f1fc8b6a771d4adf5219497e2b93a9f6c` |
| `for slides/IMG_3044.jpg` | 1121 × 1545 | RGB | 192,923 | `0e25f34e6a04a7bb3f05e09ab6814b8c3355c93688884eaf138940d6e76a3783` |
| `for slides/IMG_3045.jpg` | 1113 × 1544 | RGB | 168,798 | `4b86b7845d842992e09f5288839f743e9d9952980b32f1fdc9af798c26288b26` |
| `for slides/IMG_3059.PNG` | 1170 × 2532 | RGB | 254,572 | `101bff27aedf979dc4d8d0f062465a08a7b71a93cfd878c27af2a18d769b43db` |
| `for slides/IMG_3062.jpg` | 1170 × 2041 | RGB | 196,577 | `e4b50d92b96bfa0d82c7b4dc5e4739f24e863ae93fdebe2f3e16b32b21accafb` |
| `for slides/IMG_3063.PNG` | 1170 × 2532 | RGB | 721,974 | `19d45e97c582caef2ce7416fd3329c464d24248e224fea9c052382a95c7ebb67` |
| `for slides/IMG_5538.JPEG` | 2048 × 2048 | RGB | 617,564 | `3299aaaf3f60748c2d588ef947e31bea3db0f6dc1ba280e81f2261e368c387ac` |
| `for slides/IMG_5802.JPEG` | 5000 × 3000 | RGB | 3,065,339 | `4bbbccf6fc2a0b6682c2045ece54b0ad581744e0b19d51fefc3d04e4450c7c5e` |
| `for slides/IMG_5847.JPEG` | 4096 × 4096 | RGB | 2,336,518 | `19d67e5144ffeec83e153a1bf84d1021f802fecd219d0dcb564ecfe65d47c18d` |
| `for slides/IMG_5870.JPEG` | 2480 × 3508 | RGB | 1,723,834 | `4dd903ac719c725c27481d3c80f05a5adc2f3bde670af3e4650389c88d3877ee` |
| `for slides/IMG_5873.JPEG` | 2480 × 3508 | RGB | 1,874,810 | `e58d412dc42466cd49812c5c0e4bf01b2fc1f680cf6df8702a247b0c5b86b46d` |
| `for slides/IMG_5880.JPEG` | 2480 × 3508 | RGB | 1,882,055 | `d0b912cb5d9c234877c94100e7169375edc8591a2db6e0695ea70b598cf05a0a` |
| `for slides/IMG_5881.JPEG` | 2480 × 3508 | RGB | 1,728,900 | `f212f22f751089f46e3e7d49ece135b2061cb2684da06b93e2cf4b83505d352e` |
| `for slides/IMG_5949.JPEG` | 2048 × 2048 | RGB | 939,517 | `4baeb52873f5f6c16f7da884c398c7868af950b5a607ad8ba59ccebbed1894b3` |
| `for slides/IMG_5953.JPEG` | 1080 × 1350 | RGB | 464,497 | `f8033244aeac2c3f6eba85e568dbc6555b07e2e8293071ee3d46452125f718a7` |
| `for slides/IMG_5965.JPEG` | 2048 × 2048 | RGB | 3,659,442 | `9bc95d815daa9dbdfb3649f74b0fb4c5d29d94ff07891df96dfe4788ee0fba5e` |
| `for slides/IMG_8920.PNG` | 1170 × 2532 | RGB | 1,378,545 | `6c5826c91d9f2d65f4cf42c0037e8373bf0462d811728e4a8c0ae2b26aa7d456` |
| `for slides/att.FM2xcWiGy7pQAJGIrUQ_0cvB_J1w06HGZjWBV3-McxI.JPEG` | 2048 × 2048 | RGB | 120,573 | `14cdb1716886cbba50009188ad443fd1cbc1fc9d70d3a1c6663581577f8c7312` |
| `for slides/att.SbrvzBgSmtiFrputNjovfIe3rwIo5-AMFfK49gAt3cw.JPEG` | 1024 × 1536 | RGB | 107,952 | `bff4a45df98b3d8954f6750220c8b65007e41912e3ec922ef74b673060d5876a` |
| `for slides/att.hzDepAtbc6SQDNaxrNB2tOObLq3jH5UfqRn_yRwpJOw.JPEG` | 604 × 604 | RGB | 40,577 | `8730dea40b5b73a4900cd6b1acd076b4e39b2eade31f951fa919ffc91c2924ec` |
| `for slides/vatreceiptamazon/IMG_3043.jpg` | 1130 × 1532 | RGB | 176,061 | `547c76d8ce01335c364f7255fb176a5f1fc8b6a771d4adf5219497e2b93a9f6c` |
| `for slides/vatreceiptamazon/IMG_3044.jpg` | 1121 × 1545 | RGB | 192,923 | `0e25f34e6a04a7bb3f05e09ab6814b8c3355c93688884eaf138940d6e76a3783` |
| `for slides/vatreceiptamazon/IMG_3045.jpg` | 1113 × 1544 | RGB | 168,798 | `4b86b7845d842992e09f5288839f743e9d9952980b32f1fdc9af798c26288b26` |
| `for slides/vatreceiptamazon/IMG_3046.PNG` | 1170 × 2532 | RGB | 1,273,289 | `484b3614df86458080bb5c6755325a57e1ec1080c8a610e5ace790df9b39d36e` |
| `for slides/vatreceiptamazon/IMG_3047.PNG` | 1170 × 2532 | RGB | 477,368 | `43d6a67ee54a5191ed4741ab6e3a514e4afb4e1d37c9ebaa7b11a6a3bf2b7aea` |
| `for slides/vatreceiptamazon/IMG_3048.PNG` | 1170 × 2532 | RGB | 454,540 | `44a538de4137b810cf7502ef28fec545e53d1245f2cc1f4f5ccc3906f4e7c5c6` |
| `for slides/vatreceiptamazon/IMG_3049.PNG` | 1170 × 2532 | RGB | 468,021 | `0705a8f98138e440fd4c4eb9f35117c0ffc26b90a17189bd3393fe9d45a95b3d` |
| `for slides/vatreceiptamazon/IMG_3050.PNG` | 1170 × 2532 | RGB | 1,010,561 | `db618d6ca28e637b90f43c3803383ec16295856ea9450c35f0715dca3d60bbf3` |
| `for slides/vatreceiptamazon/IMG_3051.PNG` | 1170 × 2532 | RGB | 278,546 | `1c000fa96ab077a1ca14de92fd9edfbaac7bf2103532c0a6064e92a13d606167` |
| `for slides/vatreceipttemu/IMG_3052.PNG` | 1170 × 2532 | RGB | 382,862 | `a5b6513f4c871e02e69a912f497c64d64488803cbca51230abb2a937cbe97dbf` |
| `for slides/vatreceipttemu/IMG_3053.PNG` | 1170 × 2532 | RGB | 695,999 | `42d35cc6a1c224df34285f99bd69de0e21c0776ae68832fc39883ad3aa16d935` |
| `for slides/vatreceipttemu/IMG_3054.PNG` | 1170 × 2532 | RGB | 642,426 | `05b7fe1a2e769462067689da013d64d7676b2a8d0762de54eaa7f9c980c7af2f` |
| `for slides/vatreceipttemu/IMG_3055.PNG` | 1170 × 2532 | RGB | 278,622 | `389f0a08ee46410fef1bf9318a72d7700a2a14a244abbedb9f0636d17d67f2fc` |
| `for slides/vatreceipttemu/IMG_3056.PNG` | 1170 × 2532 | RGB | 395,884 | `1a0ae6af7cc367e93b8dbacd11b28b7efd91760c327759c65bb7bcf46016ee31` |
| `for slides/vatreceipttemu/IMG_3057.PNG` | 1170 × 2532 | RGB | 277,706 | `ac770658018e8b5e5745801f6d1569ee7a8b5aacd5235e99230293f676ddf0b1` |
| `for slides/vatreceipttemu/IMG_3058.PNG` | 1170 × 2532 | RGB | 347,504 | `3bb3a864a7897b0d8889a5179b7b2a3a07a532f3de5627012364ed6d3e5cdd4f` |
| `for slides/vatreceipttemu/IMG_3059.PNG` | 1170 × 2532 | RGB | 254,572 | `101bff27aedf979dc4d8d0f062465a08a7b71a93cfd878c27af2a18d769b43db` |
| `for slides/vatreceipttemu/IMG_3060.PNG` | 1170 × 2532 | RGB | 279,133 | `692f694a6a15842f2692e73b1dc621d2a894bcc825a89148cdb053872213d744` |
| `for slides/vatreceipttemu/IMG_3061.PNG` | 1170 × 2532 | RGB | 343,598 | `cc0f7e9e240691e58d41ee206d3b774f3f4c5856b7164cea4b437f7e5f5e8273` |
| `merch/ChatGPT Image 25 Sept 2026, 09_56_49.png` | 1402 × 1122 | RGB | 2,316,552 | `70e120f231ff8859b34f81c67a998e1243a4c3752a92c1dd5620e2c44700c0cb` |
| `merch/ChatGPT Image 25 Sept 2026, 09_58_29.png` | 1122 × 1402 | RGB | 2,296,784 | `766d8bdfdb3016f3397e2f87c2fcb2a74cfe6b5c9f7f2438428d0f38e957599c` |
| `merch/ChatGPT Image 25 Sept 2026, 10_00_43.png` | 1122 × 1402 | RGB | 2,424,011 | `9f61b9cc774e84fff5d790486aeac1809c05a422856f161f15b2a198e89711fb` |
| `merch/ChatGPT Image 25 Sept 2026, 10_16_50.png` | 1448 × 1086 | RGB | 1,719,439 | `a47eb8914565380d885e48ae6aaec9b8cfda4facb879c015ffbad96c39739dc1` |
| `sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_33.png` | 1448 × 1086 | RGB | 1,530,982 | `4d37d6eb5191fb62e79ab6e1eab1ba04cd3fb6457e98636145337aec68332ddc` |
| `sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_43.png` | 1448 × 1086 | RGB | 1,563,760 | `5b857cb87eafca23e8ed942416278942be570e35c7e5c6ea44c9e29618a00739` |
| `sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_51.png` | 1448 × 1086 | RGB | 1,487,637 | `0c17e009b501c8b6791b10066cfd892ccec6e4aabd67a1e267a0a898c4fa602a` |
| `sprites/balance/ChatGPT Image 25 Sept 2026, 00_09_56.png` | 1448 × 1086 | RGB | 1,789,029 | `18a7733901c1e3af47f2c3698fe5f43f78061c3a76bd6d8bf950030cbda544bd` |
| `sprites/diff moods/ChatGPT Image 24 Sept 2026, 23_59_12.png` | 1254 × 1254 | RGBA | 1,750,814 | `a4a94c3af945d1799a6b8b13f77408abb2405ae07abb0e56ac2055dab860c19f` |
| `sprites/diving/ChatGPT Image 25 Sept 2026, 09_30_24.png` | 1448 × 1086 | RGB | 1,656,710 | `8605a91ac3db3d315b461be175a65d0ffa7a9cb9bcb3bb0dc48c578e034f3b19` |
| `sprites/jump/ChatGPT Image 25 Sept 2026, 09_15_30-1.png` | 1448 × 1086 | RGB | 1,550,525 | `4216b0593dd0d1a3db77fe77d7170084d595d77c744c32be64eb6b861c3671cd` |
| `sprites/jump/ChatGPT Image 25 Sept 2026, 09_15_32-2.png` | 1448 × 1086 | RGB | 1,665,580 | `139333824c9642f21610d990cf329a8a2951f8d4f880ef64acdf4d1b9d10f6c1` |
| `sprites/jump/ChatGPT Image 25 Sept 2026, 09_15_47-3.png` | 1448 × 1086 | RGB | 1,631,773 | `9b97ffb836f063762c47a323433c496b889d3e4ec265956da63dbba4704f0eea` |
| `sprites/looking/ChatGPT Image 24 Sept 2026, 23_55_11.png` | 1254 × 1254 | RGBA | 1,713,860 | `071c1e74da8f0ade9bd75f87819536846ad10bad369cc0d03936259813709d8d` |
| `sprites/looking/ChatGPT Image 24 Sept 2026, 23_56_13.png` | 1254 × 1254 | RGBA | 1,545,726 | `c83aaa46569b0fa0a03c936c986a8c92234ccb3de720e7be3abff46ee873d507` |
| `sprites/meditating/ChatGPT Image 25 Sept 2026, 09_40_56-1.png` | 1448 × 1086 | RGB | 1,453,717 | `b565debace125bba594f109fb37530f75644eb8a302d36bad72a78cc12dc9456` |
| `sprites/meditating/ChatGPT Image 25 Sept 2026, 09_41_09-2.png` | 1448 × 1086 | RGB | 1,532,973 | `b4fdf3f74d140d991c3dd594acc842f545d96b52ba186b9ff5f8c783944fee4c` |
| `sprites/sleeping/ChatGPT Image 25 Sept 2026, 09_33_55.png` | 1536 × 1024 | RGBA | 2,392,211 | `69cc48ed3a7613aa267bf0d07bcca35b9713c9be5be3da1bdf30e8f80d443573` |
| `sprites/swimming/ChatGPT Image 24 Sept 2026, 23_54_43.png` | 1672 × 941 | RGBA | 630,209 | `0b889f73f079430fa5e767d7ea356908d6a72c4714adf3fc2300ad1d6f0ca168` |
| `sprites/swimming/ChatGPT Image 24 Sept 2026, 23_54_53.png` | 1672 × 941 | RGBA | 573,777 | `1cd29257a2cf6a9ac74c7df4f8f25d0deeec9a0c53dfb00c14d251f2d6e3bf6e` |
| `sprites/swimming/download (3).png` | 1672 × 941 | RGBA | 573,777 | `1cd29257a2cf6a9ac74c7df4f8f25d0deeec9a0c53dfb00c14d251f2d6e3bf6e` |

## Other preserved supporting files

8 non-image files. These files were not opened or extracted; only raw-byte hashes and file sizes were recorded.

| Source path | Bytes | SHA-256 |
| --- | ---: | --- |
| `for slides/Print for TEMU 5.pdf` | 124,879 | `f91aff94b65654104fec3d5ec4a4fb2a64b48836a87ff37426f908e47fdefa23` |
| `for slides/Print for TEMU.pdf` | 117,436 | `0fb8fb97d5f4ca3bc96ca04e8cc9d5109930528de03a88f1f256f3c90aa8f1be` |
| `for slides/vatreceiptamazon.zip` | 4,219,458 | `446c23c347759da837fc82a65e9ad3746090a19ef4b39b779943f339d5ad8fb8` |
| `for slides/vatreceipttemu/vat/brown papaer bags.pdf` | 116,902 | `91cac4f3d70aa43eff8db656a7d7b7d67dcda3fb3e50802004eef7ccb02f7fda` |
| `for slides/vatreceipttemu/vat/bubble wrap.pdf` | 124,657 | `a1620263ecc43006da763e1082bc26bf0d45ad819240ef5b0a936815be746c3a` |
| `for slides/vatreceipttemu/vat/easel.pdf` | 107,185 | `0444890dcf63bcd974337e56e24e2ca634c53bbbf14a6f19d592671ccf0c15e8` |
| `for slides/vatreceipttemu/vat/pakaging.pdf` | 238,208 | `2fd331a974dcc28227abcf7d670b2dfd003601d997682f0a61e24820ada60a4f` |
| `for slides/vatreceipttemu.zip` | 3,586,827 | `9419667be64e75b5155d1bffb87f1c0e2cee117ee56f51cfc8bdb61df7980aad` |

## Existing runtime image hashes

| Repository path | Bytes | SHA-256 |
| --- | ---: | --- |
| `assets/images/ocean/mermaid-atlas.webp` | 242,378 | `9bb00aa709b87a5c3db2138f24856cd2c9f13900cf152a2d7983e437b4453284` |
| `assets/images/ocean/mermaid-catch-rise.webp` | 259,928 | `d81c08d449f63caa017cb59402369a6991add4789ff9e7199648f4bcd8c9c7d1` |
