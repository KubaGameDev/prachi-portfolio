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
- A predominantly upward 100px touch gesture dives. Mouse-wheel/trackpad input accumulates 80px before diving.
- “Dive into portfolio,” keyboard scrolling and the scrollbar always provide direct access to the work.
- Falls automatically resurface. The personal best is saved in local storage when available.
- Inner pages open underwater. A reserved side lane or mobile bottom dock holds the companion without covering content.
- Pause motion with the visible button. Reduced-motion preferences stop decorative animation and require explicit Play.

## Maintenance

`assets/js/ocean-core.js` contains the pure simulation and gesture thresholds.
`assets/js/ocean.js` owns the canvas scene, input, scroll container, history and shared `window.Ocean` adapter.
`assets/css/ocean.css` is loaded after the original exported styles.
`local.js` and `cursor-trail.js` use the shared adapter for overlays and refraction.

Flo's character artwork, recreated from the supplied reference sheets, is in `assets/images/ocean/`.
The six selected poses cover neutral balance, losing balance, counterbalancing, falling,
resurfacing and swimming. Every rendered tail ends in two fin lobes; directional poses
mirror for left and right. Source rectangles and body-scale alignment live in `ocean.js`.
The two local WebP sheets total approximately 491 KiB.
Generation provenance and the exact prompt are recorded in `assets/images/ocean/ART.md`.

## Checks

```sh
node --test tests/ocean-core.test.cjs
```

With Playwright available to Node and a local preview running:

```sh
node tests/browser-smoke.cjs
node tests/browser-navigation.cjs
```

Browser scripts accept `CHROME_EXECUTABLE`, `OCEAN_TEST_URL` and (for screenshots)
`OCEAN_SCREENSHOTS`. Their default Chrome executable is the macOS Chrome installation.
They use an isolated headless profile and do not change the user's browser profile.
Touch emulation is useful coverage but does not replace testing physical phones.

Verified on 20 October 2026: all 18 core checks and both Chrome browser suites pass,
including touch thresholds, keyboard/mouse play, history, resizing, overlays,
reduced motion, missing artwork, no JavaScript and local-file loading.
An HTML audit confirms all 19 pages retain their original content, 346 images,
24 media/source elements and 350 links.

Firefox and WebKit test runtimes are not installed. Safari WebDriver is unavailable
because its “Allow remote automation” setting is disabled. Safari, Firefox, physical
iOS/Android devices and hardware performance targets still need verification.

