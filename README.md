# prachi-portfolio

Static artist portfolio with an illustrated ocean opening and a mermaid balancing game.
All 19 original pages remain ordinary HTML documents.

## Preview

Open `index.html` directly, or serve this folder:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8765`. No build, CDN, account or backend is required.

## Interactions

- Move the mouse or slide a thumb horizontally to balance; Left/Right and A/D work while the game is focused.
- On phones, choose **Enable phone tilt** below the balance meter and allow motion access.
  Hold the phone comfortably while its neutral position calibrates, then tilt gently left or right.
  **Recenter tilt** recalibrates; **Use touch** switches back to thumb controls.
- Small illustrated hints sit inside the scene without pausing play or taking focus. They dissolve
  after eight seconds and can be shown again with **How to play**. Tilt controls remain available
  after the hints disappear. Deep links go directly to the portfolio.
- Flo rides a natural curling wave with the reference's 1.6:1 proportions. Passing foam and
  moving water suggest forward travel; the wave base fades into the sea. The balance meter
  shares her horizontal center and sits below the entire wave, clear of the score and controls.
- A predominantly upward 100px touch gesture dives. Mouse-wheel/trackpad input accumulates 80px before diving.
- “Dive into portfolio,” keyboard scrolling and the scrollbar always provide direct access to the work.
- Falls automatically resurface. The personal best is saved in local storage when available.
- Inner pages open underwater. Flo has a reserved right side lane on desktop and phones.
  With a mouse she glances at small movements, hesitates for 280 ms before a larger pursuit,
  swims vertically to the pointer's height, and settles there. Screen edges are clamped.
  Scrolling gently nudges her without changing her chosen resting height or intercepting touch.
- Eight swim frames, four rest/gaze/blink frames and eight balance/recovery drawings add
  character acting. Root motion runs every display frame; the swim sequence runs at 10–16 fps
  according to swimming speed. Subtle breathing and reusable curved motion lines share a
  3.8-second inhale/hold/exhale/rest cycle. Pause and reduced motion freeze decorative motion.
- Pause motion with the visible button. Reduced-motion preferences stop decorative animation and require explicit Play.

Phone sensors need a secure context and browser support. Use HTTPS when testing on a phone;
an ordinary HTTP LAN preview will retain touch controls. Motion access is requested only after
tapping the enable button. Missing or denied sensor data falls back to touch.
See [MDN’s orientation permission guidance](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).

## Maintenance

`assets/js/ocean-core.js` contains the pure simulation and gesture thresholds.
`assets/js/flo-motion.js` contains the independent companion movement state machine.
`assets/js/ocean.js` owns the canvas scene, input, scroll container, history and shared `window.Ocean` adapter.
`assets/css/ocean.css` is loaded after the original exported styles.
`local.js` and `cursor-trail.js` use the shared adapter for overlays and refraction.

Flo's original reference library remains untouched in the sibling `../Consistency ref/`
folder. [The reference inventory](docs/flo-reference-library.md) records all 134 images,
their hashes, source recommendations and character consistency rules.
Always consult this library when adding new Flo artwork.

Runtime art is in `assets/images/ocean/`. Two new animation sheets supplement the original
fallback/fall/resurface sheets, with about 1.23 MiB of total WebP payload. Original generated
PNGs are retained locally but are not loaded by the website. Source rectangles, contact
registration and horizontal mirroring live in `ocean.js`; the companion remains in its
side lane even if the optional new animation sheets cannot load.
Generation provenance and prompts are in [ART.md](assets/images/ocean/ART.md),
[COMPANION-ANIMATION.md](assets/images/ocean/COMPANION-ANIMATION.md) and
[BALANCE-ANIMATION.md](assets/images/ocean/BALANCE-ANIMATION.md).

## Checks

```sh
node --test tests/ocean-core.test.cjs
node --test tests/flo-motion.test.cjs
```

With Playwright available to Node and a local preview running:

```sh
node tests/browser-smoke.cjs
node tests/browser-navigation.cjs
node tests/browser-inputs.cjs
node tests/browser-flo.cjs
```

Browser scripts accept `CHROME_EXECUTABLE`, `OCEAN_TEST_URL` and (for screenshots)
`OCEAN_SCREENSHOTS`. Their default Chrome executable is the macOS Chrome installation.
They use an isolated headless profile and do not change the user's browser profile.
Touch emulation is useful coverage but does not replace testing physical phones.

The Flo update passed eight motion-controller checks, the new companion browser
suite, the existing smoke and input suites, and wave/control clearance checks at
1440×900, 390×844, 320×568 and 844×390. Measured cursor hesitation was 274–287ms,
arrival matched the selected height, and the balance meter stayed 32–39px below
the wave. Short-screen pause controls scroll with the game rather than covering it.
No Unity compile, import or batchmode checks were used.

Verified on 20 October 2026: all 27 core checks and all three Chrome browser suites pass,
including touch thresholds, keyboard/mouse play, history, resizing, overlays,
reduced motion, missing artwork, no JavaScript and local-file loading.
Tilt checks use synthetic sensor events to verify consent, calibration, filtering,
orientation changes, stale readings and fallback. Actual sensor feel and iOS permission
dialogs still need a physical phone.
An HTML audit confirms all 19 pages retain their original content, 346 images,
24 media/source elements and 350 links.

Firefox and WebKit test runtimes are not installed. Safari WebDriver is unavailable
because its “Allow remote automation” setting is disabled. Safari, Firefox, physical
iOS/Android devices and hardware performance targets still need verification.

