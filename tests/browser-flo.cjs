/* Flo companion integration checks.
 * Start the local preview on port 8765, then run with the bundled Playwright:
 * NODE_PATH=/Users/kmole_macbook/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
 * /Users/kmole_macbook/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/browser-flo.cjs
 * Override OCEAN_TEST_URL, CHROME_EXECUTABLE or OCEAN_SCREENSHOTS when needed.
 * Use OCEAN_TEST_FILTER=wave to run only the wave/HUD checks.
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.OCEAN_TEST_URL || 'http://127.0.0.1:8765';
const executablePath = process.env.CHROME_EXECUTABLE ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const output = process.env.OCEAN_SCREENSHOTS || '/private/tmp/flo-review';
const filter = process.env.OCEAN_TEST_FILTER || '';
const failures = [];
const runtimeErrors = [];
const canvasErrors = [];
const notes = {};

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true });
  const companion = page => page.evaluate(() => Ocean.getCompanion());
  const ready = page => page.waitForFunction(() =>
    window.Ocean && typeof Ocean.getCompanion === 'function' &&
    document.body.classList.contains('ocean-art-ready') &&
    document.body.classList.contains('ocean-companion-art-ready'));
  const screenshot = (page, name) => page.screenshot({ path: path.join(output, `${name}.png`) });

  async function waterPixels(page) {
    return page.evaluate(() => {
      const canvas = document.querySelector('.ocean-surface-canvas');
      const top = Math.floor(canvas.height * 0.56);
      const height = Math.max(1, Math.floor(canvas.height * 0.38));
      const data = canvas.getContext('2d').getImageData(0, top, canvas.width, height).data;
      const samples = [];
      // Sample only the painted water. Flo and DOM controls use other layers,
      // so they cannot make this check pass while the water remains still.
      for (let row = 0; row < 40; row++) {
        const y = Math.min(height - 1, Math.floor((row + 0.5) / 40 * height));
        for (let column = 0; column < 96; column++) {
          const x = Math.floor(canvas.width * (0.04 + (column + 0.5) / 96 * 0.92));
          const offset = (y * canvas.width + x) * 4;
          samples.push(data[offset], data[offset + 1], data[offset + 2]);
        }
      }
      return {
        width: canvas.width, height: canvas.height,
        time: performance.now(), samples, surf: Ocean.getSurfGeometry()
      };
    });
  }

  function waterDifference(before, after) {
    assert.equal(after.width, before.width, 'water canvas width remains stable');
    assert.equal(after.height, before.height, 'water canvas height remains stable');
    let changed = 0, absoluteDifference = 0;
    for (let i = 0; i < before.samples.length; i += 3) {
      const difference = Math.abs(after.samples[i] - before.samples[i]) +
        Math.abs(after.samples[i + 1] - before.samples[i + 1]) +
        Math.abs(after.samples[i + 2] - before.samples[i + 2]);
      if (difference >= 8) changed++;
      absoluteDifference += difference;
    }
    return {
      elapsedMs: after.time - before.time,
      changedFraction: changed / (before.samples.length / 3),
      meanChannelDifference: absoluteDifference / before.samples.length
    };
  }

  async function check(name, callback, options = {}) {
    if (filter && !name.toLowerCase().includes(filter.toLowerCase())) return;
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }, ...options
    });
    await context.addInitScript(() => {
      try { sessionStorage.setItem('prachi-ocean-guide-v1', 'seen'); } catch (_) {}
    });
    const page = await context.newPage();
    page.on('pageerror', error => runtimeErrors.push(`${name}: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error' && /canvas|drawImage|gradient|rendering context/i.test(message.text())) {
        canvasErrors.push(`${name}: ${message.text()}`);
      }
    });
    try {
      await callback(page, context);
      console.log(`PASS ${name}`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      console.error(`FAIL ${name}: ${error.message}`);
      await screenshot(page, `failure-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`)
        .catch(() => {});
    } finally {
      await context.close();
    }
  }

  async function assertSideLane(page, label) {
    const geometry = await page.evaluate(() => ({
      actor: Ocean.getCompanion(),
      lane: document.querySelector('.ocean-companion').getBoundingClientRect().toJSON(),
      port: Ocean.scrollElement.getBoundingClientRect().toJSON(),
      content: document.querySelector('.site-content').getBoundingClientRect().toJSON(),
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      scrollWidth: Ocean.scrollElement.scrollWidth,
      clientWidth: Ocean.scrollElement.clientWidth,
      bodyWidth: document.body.scrollWidth
    }));
    const { actor, lane, port, content, viewportWidth, viewportHeight } = geometry;
    for (const key of ['x', 'y', 'targetY', 'velocity', 'width']) {
      assert.ok(Number.isFinite(actor[key]), `${label}: ${key} must be finite`);
    }
    assert.ok(actor.width > 0, `${label}: Flo has a drawable width`);
    assert.ok(lane.width > 0 && lane.height > viewportHeight * 0.75,
      `${label}: companion occupies a vertical side lane`);
    assert.ok(content.right <= lane.left + 2,
      `${label}: reading content right ${content.right} must precede lane left ${lane.left}`);
    assert.ok(Math.abs(port.bottom - viewportHeight) <= 2,
      `${label}: underwater content uses the viewport height`);
    assert.ok(actor.x - actor.width / 2 >= lane.left - 2,
      `${label}: Flo's left edge stays in the reserved lane`);
    assert.ok(actor.x + actor.width / 2 <= Math.min(lane.right, viewportWidth) + 2,
      `${label}: Flo's right edge stays on screen`);
    assert.ok(actor.y > 0 && actor.y < viewportHeight,
      `${label}: Flo's center stays within vertical bounds`);
    assert.ok(actor.targetY > 0 && actor.targetY < viewportHeight,
      `${label}: target height stays within vertical bounds`);
    assert.ok(geometry.scrollWidth <= geometry.clientWidth + 1,
      `${label}: reading content has no horizontal overflow`);
    assert.ok(geometry.bodyWidth <= viewportWidth + 1,
      `${label}: document has no horizontal overflow`);
    return geometry;
  }

  async function followMouse(page, label) {
    const viewport = page.viewportSize();
    const mouseX = Math.round(viewport.width * 0.42);
    // Diving/scrolling can legitimately leave Flo settling or following the
    // pointer that clicked the dive link. Establish a quiet perch first.
    await page.bringToFront();
    const arriving = await companion(page);
    await page.mouse.move(mouseX, arriving.y);
    await page.waitForFunction(() => {
      const actor = Ocean.getCompanion();
      return ['resting', 'idle'].includes(actor.state) &&
        Math.abs(actor.velocity) <= 2 && Math.abs(actor.y - actor.targetY) <= 3;
    }, null, { timeout: 5000 });
    const before = await companion(page);
    const targetY = before.y > viewport.height / 2 ? 160 : viewport.height - 160;
    const started = Date.now();
    await page.mouse.move(mouseX, targetY);

    // Poll immediately so a short anticipation pose cannot disappear unnoticed
    // behind a screenshot or a long fixed wait.
    await page.waitForFunction(() => Ocean.getCompanion().state === 'anticipating',
      null, { polling: 'raf', timeout: 180 });
    const anticipation = await companion(page);
    assert.ok(Math.abs(anticipation.y - before.y) <= 8,
      `${label}: hesitation should precede vertical travel`);
    assert.ok(Math.abs(anticipation.targetY - targetY) <= 3,
      `${label}: pointer height establishes the destination`);
    await page.waitForTimeout(240);
    const held = await companion(page);
    assert.equal(held.state, 'anticipating', `${label}: anticipation has a visible hold`);
    assert.ok(Math.abs(held.y - before.y) <= 8,
      `${label}: the visible hesitation is not already a swim`);
    assert.ok(held.anticipation > anticipation.anticipation && held.anticipation < 1,
      `${label}: anticipation progresses while Flo holds her position`);

    await page.waitForFunction(() => Ocean.getCompanion().state === 'swimming',
      null, { polling: 'raf', timeout: 1000 });
    const anticipationMs = Date.now() - started;
    assert.ok(anticipationMs >= 340 && anticipationMs <= 800,
      `${label}: hesitation should be about 440ms, observed ${anticipationMs}ms`);
    await screenshot(page, `${label}-swimming`);
    await page.waitForFunction(() => {
      const actor = Ocean.getCompanion();
      return ['resting', 'idle'].includes(actor.state) &&
        Math.abs(actor.y - actor.targetY) <= 3;
    }, null, { polling: 'raf', timeout: Math.max(1, 5000 - (Date.now() - started)) });
    const rested = await companion(page);
    assert.ok(Math.abs(rested.y - targetY) <= 3,
      `${label}: Flo settles at the requested cursor height`);
    assert.ok(Math.abs(rested.x - before.x) <= 2,
      `${label}: following changes height while preserving the side lane`);
    notes[label] = { anticipationMs, before, rested };
    await screenshot(page, `${label}-resting`);

    const closeY = targetY + (targetY < viewport.height / 2 ? 6 : -6);
    await page.mouse.move(mouseX + 12, closeY);
    await page.waitForTimeout(550);
    const nearby = await companion(page);
    assert.ok(Math.abs(nearby.y - rested.y) <= 12,
      `${label}: small mouse adjustments do not cause a large swim`);
    assert.notEqual(nearby.state, 'swimming',
      `${label}: a nearby cursor keeps a settled companion`);
    await assertSideLane(page, label);
  }

  async function drag(page, context, from, to) {
    const cdp = await context.newCDPSession(page);
    try {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart', touchPoints: [{ x: from[0], y: from[1] }]
      });
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{
            x: from[0] + (to[0] - from[0]) * i / 12,
            y: from[1] + (to[1] - from[1]) * i / 12
          }]
        });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await cdp.detach();
    }
  }

  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
      { width: 844, height: 390 }
    ]) {
      const label = `wave-${viewport.width}x${viewport.height}`;
      await check(`wave and HUD clearance at ${viewport.width}x${viewport.height}`, async page => {
        await page.goto(`${base}/index.html`);
        await ready(page);
        await page.waitForFunction(() =>
          typeof Ocean.getSurfGeometry === 'function' &&
          document.body.classList.contains('ocean-balance-art-ready') &&
          document.querySelector('.ocean-hero').classList.contains('is-armed'));
        const measurements = [];
        // Sample a moving crest as well as the initial layout. Surf geometry is
        // hero-local, while DOM rectangles are viewport-local.
        for (let sample = 0; sample < 6; sample++) {
          const geometry = await page.evaluate(() => {
            const wave = Ocean.getSurfGeometry();
            const hero = document.querySelector('#surface').getBoundingClientRect();
            const meter = document.querySelector('#ocean-balance').getBoundingClientRect();
            return {
              wave,
              meterTop: meter.top - hero.top,
              heroHeight: hero.height,
              canvasWidth: document.querySelector('.ocean-surface-canvas')?.width ||
                document.querySelector('#surface canvas')?.width
            };
          });
          const { wave, meterTop } = geometry;
          for (const key of ['x', 'crestY', 'width', 'height', 'bob']) {
            assert.ok(Number.isFinite(wave[key]), `${label}: wave ${key} must be finite`);
          }
          assert.ok(wave.width > 0 && wave.height > 0, `${label}: wave has drawable dimensions`);
          assert.ok(Math.abs(wave.width / wave.height - 1.6) <= 0.03,
            `${label}: wave ratio must stay near 1.6, got ${wave.width / wave.height}`);
          const clearance = meterTop - (wave.crestY + wave.height);
          assert.ok(clearance > 4,
            `${label}: meter must clear the full wave by >4px, got ${clearance.toFixed(2)}px`);
          assert.ok(geometry.canvasWidth > 0, `${label}: the surface canvas is initialized`);
          measurements.push({ clearance, bob: wave.bob, ratio: wave.width / wave.height });
          await page.waitForTimeout(160);
        }
        await screenshot(page, label);

        const selectors = ['#ocean-play', '#ocean-help', '#ocean-enable-tilt',
          '#ocean-use-touch', '#ocean-recenter', '#ocean-dive-link', '.ocean-motion-toggle'];
        const visibleControls = await page.evaluate(selectors => {
          const hero = document.querySelector('#surface').getBoundingClientRect();
          return selectors.flatMap(selector => {
            const element = document.querySelector(selector);
            const rect = element.getBoundingClientRect();
            if (!rect.width || !rect.height ||
                getComputedStyle(element).visibility === 'hidden') return [];
            return [{
              selector,
              withinHero: rect.left >= hero.left - 2 && rect.top >= hero.top - 2 &&
                rect.right <= hero.right + 2 && rect.bottom <= hero.bottom + 2
            }];
          });
        }, selectors);
        assert.ok(visibleControls.some(control => control.selector === '#ocean-play'),
          `${label}: Play remains visible`);
        for (const control of visibleControls) {
          assert.equal(control.withinHero, true,
            `${label}: ${control.selector} must stay inside the hero`);
          // A short phone can have a hero taller than the physical viewport.
          // Verify its lower controls remain reachable through ordinary scroll.
          await page.locator(control.selector).scrollIntoViewIfNeeded();
          const hit = await page.locator(control.selector).evaluate(element => {
            const rect = element.getBoundingClientRect();
            const target = document.elementFromPoint(
              rect.left + rect.width / 2, rect.top + rect.height / 2);
            return {
              onScreen: rect.left >= -2 && rect.top >= -2 &&
                rect.right <= innerWidth + 2 && rect.bottom <= innerHeight + 2,
              reachable: target === element || element.contains(target)
            };
          });
          assert.equal(hit.onScreen, true, `${label}: ${control.selector} can be brought on screen`);
          assert.equal(hit.reachable, true, `${label}: ${control.selector} must not be covered`);
        }
        await page.locator('.ocean-motion-toggle').click();
        assert.equal(await page.evaluate(() => Ocean.isPaused()), true,
          `${label}: surface Pause remains functional`);
        await page.locator('.ocean-motion-toggle').click();
        assert.equal(await page.evaluate(() => Ocean.isPaused()), false,
          `${label}: surface Resume remains functional`);
        notes[label] = {
          minimumClearance: Math.min(...measurements.map(sample => sample.clearance)),
          ratios: [...new Set(measurements.map(sample => sample.ratio))],
          visibleControls: visibleControls.map(control => control.selector)
        };
      }, {
        viewport,
        ...(viewport.width <= 844 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : {})
      });
    }

    await check('wave surface water moves and freezes on pause', async page => {
      await page.goto(base + '/index.html');
      await ready(page);
      await page.waitForFunction(() => document.body.classList.contains('ocean-balance-art-ready') &&
        document.querySelector('.ocean-hero').classList.contains('is-armed'));
      await page.waitForTimeout(180);
      await screenshot(page, 'surface-water-live-a');
      const before = await waterPixels(page);
      await page.waitForTimeout(300);
      const after = await waterPixels(page);
      await screenshot(page, 'surface-water-live-b');
      const difference = waterDifference(before, after);
      assert.ok(difference.changedFraction >= 0.02,
        'water travel should visibly change at least 2% of sampled water pixels in 300ms, got ' +
        (difference.changedFraction * 100).toFixed(2) + '%');
      assert.ok(difference.meanChannelDifference > 0.25,
        'water travel should produce a visible pixel difference, got ' +
        difference.meanChannelDifference.toFixed(3));
      assert.ok(after.surf.travel > before.surf.travel,
        'the water travel phase advances continuously');

      await page.locator('#ocean-play').focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      const activeBefore = await waterPixels(page);
      await screenshot(page, 'surface-water-active-a');
      await page.waitForTimeout(300);
      const activeAfter = await waterPixels(page);
      await screenshot(page, 'surface-water-active-b');
      const activeDifference = waterDifference(activeBefore, activeAfter);
      assert.ok(activeAfter.surf.speed > after.surf.speed,
        'balancing increases water travel speed over the idle drift');
      assert.ok(activeDifference.changedFraction >= 0.02 &&
        activeDifference.meanChannelDifference > 0.25,
      'balancing keeps the moving water visible');

      await page.locator('.ocean-motion-toggle').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => Ocean.isPaused());
      await page.waitForTimeout(80);
      const frozen = await waterPixels(page);
      await screenshot(page, 'surface-water-paused-a');
      await page.waitForTimeout(300);
      const still = await waterPixels(page);
      await screenshot(page, 'surface-water-paused-b');
      assert.deepEqual(still.samples, frozen.samples, 'Pause freezes every sampled water pixel');
      assert.deepEqual(still.surf, frozen.surf, 'Pause freezes the wave geometry and travel phase');
      notes.surfaceWater = {
        live: difference, paused: waterDifference(frozen, still),
        active: activeDifference,
        beforeSurf: before.surf, afterSurf: after.surf, activeSurf: activeAfter.surf
      };
    });

    await check('wave surface water stays fixed with reduced motion', async page => {
      await page.goto(base + '/index.html');
      await ready(page);
      await page.waitForFunction(() => document.body.classList.contains('ocean-balance-art-ready'));
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => Ocean.effectsEnabled()), false);
      const before = await waterPixels(page);
      await screenshot(page, 'surface-water-reduced-a');
      await page.waitForTimeout(300);
      const after = await waterPixels(page);
      await screenshot(page, 'surface-water-reduced-b');
      assert.deepEqual(after.samples, before.samples,
        'reduced motion holds every sampled water pixel fixed');
      assert.deepEqual(after.surf, before.surf,
        'reduced motion holds the wave geometry and travel phase fixed');
      assert.equal(after.surf.speed, 0, 'reduced motion disables water travel speed');
      assert.equal(after.surf.forwardLean, 0, 'reduced motion disables the forward lean');
      notes.reducedWater = waterDifference(before, after);
    }, { reducedMotion: 'reduce' });

    await check('desktop inner page follows cursor', async page => {
      await page.goto(`${base}/about.html`);
      await ready(page);
      assert.equal(await page.evaluate(() => Ocean.isUnderwater()), true);
      await assertSideLane(page, 'desktop-about');
      await followMouse(page, 'desktop-about');
    });

    await check('home dive reveals the animated companion', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-dive-link').click();
      await page.waitForFunction(() => Ocean.isUnderwater());
      await page.waitForTimeout(700);
      await assertSideLane(page, 'desktop-home-dive');
      await followMouse(page, 'desktop-home-dive');
    });

    await check('narrow mouse viewport retains a side lane', async page => {
      await page.goto(`${base}/about.html`);
      await ready(page);
      await assertSideLane(page, 'narrow-mouse');
      await followMouse(page, 'narrow-mouse');
    }, { viewport: { width: 800, height: 700 } });

    await check('touch scrolling remains available beside Flo', async (page, context) => {
      await page.goto(`${base}/about.html`);
      await ready(page);
      await assertSideLane(page, 'mobile-about');
      const before = await page.evaluate(() => Ocean.scrollElement.scrollTop);
      await drag(page, context, [150, 665], [150, 290]);
      await page.waitForFunction(previous => Ocean.scrollElement.scrollTop > previous + 80,
        before, { timeout: 2000 });
      await assertSideLane(page, 'mobile-about-scrolled');
      await screenshot(page, 'mobile-about-scrolled');

      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-dive-link').click();
      await page.waitForFunction(() => Ocean.isUnderwater());
      await page.waitForTimeout(700);
      const diveTop = await page.evaluate(() => Ocean.scrollElement.scrollTop);
      await drag(page, context, [150, 650], [150, 300]);
      await page.waitForFunction(previous => Ocean.scrollElement.scrollTop > previous + 80,
        diveTop, { timeout: 2000 });
      await assertSideLane(page, 'mobile-home-scrolled');
      await screenshot(page, 'mobile-home-scrolled');
    }, {
      viewport: { width: 390, height: 844 },
      isMobile: true, hasTouch: true, deviceScaleFactor: 1
    });

    await check('pause freezes both movement and drawn frame', async page => {
      await page.goto(`${base}/about.html`);
      await ready(page);
      const initial = await companion(page);
      await page.mouse.move(600, initial.y > 450 ? 160 : 740);
      await page.waitForFunction(() => Ocean.getCompanion().state === 'swimming');
      // Keyboard activation avoids an unrelated mouse move to the toggle.
      await page.locator('.ocean-motion-toggle').focus();
      await page.keyboard.press('Space');
      await page.waitForFunction(() => Ocean.isPaused());
      await page.waitForTimeout(60);
      const frozen = await companion(page);
      await page.mouse.move(500, frozen.y > 450 ? 160 : 740);
      await page.waitForTimeout(650);
      const still = await companion(page);
      assert.ok(Math.abs(still.x - frozen.x) <= 0.05 &&
        Math.abs(still.y - frozen.y) <= 0.05, 'pause freezes the companion root');
      assert.deepEqual(still.frame, frozen.frame, 'pause freezes the drawn frame');
      await screenshot(page, 'paused-companion');
      await page.keyboard.press('Space');
      await page.waitForFunction(() => !Ocean.isPaused());
    });

    await check('reduced motion holds Flo still', async page => {
      await page.goto(`${base}/about.html`);
      await ready(page);
      assert.equal(await page.evaluate(() => Ocean.effectsEnabled()), false);
      const before = await companion(page);
      await page.mouse.move(600, before.y > 450 ? 160 : 740);
      await page.waitForTimeout(900);
      const after = await companion(page);
      assert.ok(Math.abs(after.x - before.x) <= 0.05 &&
        Math.abs(after.y - before.y) <= 0.05, 'reduced motion disables cursor pursuit');
      assert.deepEqual(after.frame, before.frame, 'reduced motion holds one drawn frame');
      await assertSideLane(page, 'reduced-motion');
      await screenshot(page, 'reduced-motion-companion');
    }, { reducedMotion: 'reduce' });

    await check('resize keeps the companion and destination on screen', async page => {
      await page.goto(`${base}/about.html`);
      await ready(page);
      await page.mouse.move(600, 790);
      await page.waitForTimeout(1200);
      for (const viewport of [
        { width: 800, height: 700 },
        { width: 390, height: 844 },
        { width: 844, height: 390 },
        { width: 1440, height: 900 }
      ]) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(550);
        await assertSideLane(page, `resize-${viewport.width}x${viewport.height}`);
        await screenshot(page, `resize-${viewport.width}x${viewport.height}`);
      }
    });

    assert.deepEqual(runtimeErrors, [], 'no browser runtime errors');
    assert.deepEqual(canvasErrors, [], 'no canvas rendering errors');
    console.log('Observations:', JSON.stringify(notes, null, 2));
    console.log(`Screenshots: ${output}`);
    if (failures.length) throw new Error(failures.join('\n'));
    console.log(filter ? `PASS: Flo checks matching "${filter}".` :
      'PASS: wave/HUD clearance, Flo hesitation, swim, rest, side lanes, touch scrolling, pause, reduced motion and resize.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
