/* Run with the local preview server and Playwright available through NODE_PATH. */
'use strict';

const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.OCEAN_TEST_URL || 'http://127.0.0.1:8765';
const executablePath = process.env.CHROME_EXECUTABLE ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const failures = [];
const runtimeErrors = [];
const securityErrors = [];
const notes = {};

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const ready = page => page.waitForFunction(() =>
    window.Ocean && document.body.classList.contains('ocean-art-ready'));
  const scrollY = page => page.evaluate(() => window.Ocean.scrollElement.scrollTop);

  async function check(name, callback, options = {}) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }, ...options
    });
    const page = await context.newPage();
    page.on('pageerror', error => runtimeErrors.push(`${name}: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error' &&
          /content security policy|refused to (?:load|execute|apply)|violates.*directive/i.test(message.text())) {
        securityErrors.push(`${name}: ${message.text()}`);
      }
    });
    try {
      await callback(page, context);
      console.log(`PASS ${name}`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      console.error(`FAIL ${name}: ${error.message}`);
    } finally {
      await context.close();
    }
  }

  try {
    await check('direct underwater deep link', async page => {
      await page.goto(`${base}/index.html#underwater`);
      await ready(page);
      await page.waitForTimeout(300);
      const state = await page.evaluate(() => ({
        underwater: Ocean.isUnderwater(),
        siteTop: document.querySelector('.site-wrap').getBoundingClientRect().top,
        portTop: Ocean.getViewport().top,
        armed: document.querySelector('.ocean-hero').classList.contains('is-armed')
      }));
      assert.equal(state.underwater, true);
      assert.equal(state.armed, false);
      assert.ok(Math.abs(state.siteTop - state.portTop) <= 2,
        `deep link should align portfolio with viewport, got ${state.siteTop - state.portTop}px`);
    });

    await check('Back and Forward restore reading positions', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-dive-link').click();
      await page.waitForFunction(() => location.hash === '#underwater' &&
        document.querySelector('.site-wrap').getBoundingClientRect().top <= 1);
      // The final fractional animation frame may already round the scroll position
      // to its destination. Let that frame finish before establishing a new position.
      await page.waitForTimeout(150);
      await page.evaluate(() => Ocean.scrollTo(1650));
      await page.waitForTimeout(350);
      const saved = await scrollY(page);
      assert.ok(Math.abs(saved - 1650) <= 2, 'the reading position must be established before testing history');
      await page.goBack();
      await page.waitForTimeout(350);
      assert.ok(await scrollY(page) <= 2, 'Back should restore the surface');
      await page.goForward();
      await page.waitForTimeout(350);
      assert.ok(Math.abs(await scrollY(page) - saved) <= 2,
        `Forward should restore ${saved}px, got ${await scrollY(page)}px`);
      notes.history = { saved };
    });

    await check('portrait and landscape keep the reading anchor', async page => {
      await page.goto(`${base}/index.html#underwater`);
      await ready(page);
      await page.locator('.project-cover').nth(2).waitFor();
      const placeAnchor = () => page.evaluate(() => {
        const anchor = document.querySelectorAll('.project-cover')[2];
        Ocean.scrollTo(Ocean.scrollElement.scrollTop + anchor.getBoundingClientRect().top -
          Ocean.getViewport().top - 100);
      });
      const anchorPosition = () => page.locator('.project-cover').nth(2).evaluate(
        el => el.getBoundingClientRect().top);
      await placeAnchor();
      await page.waitForTimeout(350);
      const portrait = await anchorPosition();
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(500);
      const landscape = await anchorPosition();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      const returned = await anchorPosition();
      notes.orientation = { portrait, landscape, returned };
      assert.ok(Math.abs(landscape - portrait) <= 16,
        `reading anchor shifted ${Math.round(landscape - portrait)}px on rotation`);
      assert.ok(Math.abs(returned - portrait) <= 16,
        `reading anchor shifted ${Math.round(returned - portrait)}px on return`);
    }, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    await check('reduced motion exposes pause after explicit play', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      assert.equal(await page.evaluate(() => Ocean.effectsEnabled()), false);
      assert.equal(await page.locator('.ocean-motion-toggle').isVisible(), false);
      await page.locator('#ocean-play').click();
      await page.waitForTimeout(500);
      assert.equal(await page.locator('.ocean-motion-toggle').isVisible(), true);
      await page.locator('.ocean-motion-toggle').click();
      assert.equal(await page.evaluate(() => Ocean.isPaused()), true);
      await page.waitForTimeout(150);
      const paused = Number(await page.locator('#ocean-score').textContent());
      await page.waitForTimeout(350);
      assert.equal(Number(await page.locator('#ocean-score').textContent()), paused,
        'paused score must remain unchanged');
      await page.locator('#ocean-dive-link').click();
      assert.ok(await scrollY(page) > 800, 'reduced-motion dive remains immediate');
    }, { reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });

    await check('missing artwork leaves ordinary scrolling available', async (page, context) => {
      await context.route('**/mermaid-atlas.webp*', route => route.abort());
      await page.goto(`${base}/index.html`);
      await page.waitForFunction(() => window.Ocean &&
        document.getElementById('ocean-play').hidden);
      assert.equal(await page.locator('.ocean-hero').evaluate(
        el => el.classList.contains('is-armed')), false);
      await page.mouse.move(900, 450);
      await page.mouse.wheel(0, 30);
      await page.waitForTimeout(200);
      assert.ok(await scrollY(page) > 0, 'missing art should bypass the wheel gate');
      await page.locator('#ocean-dive-link').click();
      await page.waitForTimeout(750);
      assert.equal(await page.evaluate(() => Ocean.isUnderwater()), true);
    });

    await check('local file distribution loads without CSP errors', async page => {
      const file = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
      await page.goto(`${file}#underwater`);
      await ready(page);
      assert.equal(await page.evaluate(() => Ocean.isUnderwater()), true);
      assert.equal(await page.evaluate(() => document.querySelector('.ocean-character-layer').width > 0), true);
      await page.waitForTimeout(200);
    });

    await check('representative existing page routes open underwater', async page => {
      for (const route of ['portfolio.html', 'about.html', 'contact.html', 'gallery.html',
        '3d-game-design.html', 'my-favorite-illustrations.html']) {
        await page.goto(`${base}/${route}`);
        await ready(page);
        const state = await page.evaluate(() => ({
          underwater: Ocean.isUnderwater(),
          hero: !!document.querySelector('.ocean-hero'),
          overflow: Ocean.scrollElement.scrollWidth - Ocean.scrollElement.clientWidth,
          text: document.querySelector('.site-wrap').textContent.trim().length
        }));
        assert.equal(state.underwater, true, route);
        assert.equal(state.hero, false, route);
        assert.ok(state.overflow <= 1, `${route} has horizontal overflow`);
        assert.ok(state.text > 100, `${route} should retain its content`);
      }
    });

    if (process.env.OCEAN_MEASURE_CADENCE === '1') {
      await check('desktop preview frame cadence with active ripples', async page => {
        await page.goto(`${base}/index.html#underwater`);
        await ready(page);
        await page.evaluate(() => Ocean.scrollTo(1600));
        await page.waitForTimeout(300);
        const measurement = await page.evaluate(() => new Promise(resolve => {
          const samples = [];
          let previous = 0;
          const start = performance.now();
          function sample(now) {
            if (previous) samples.push(now - previous);
            previous = now;
            const candidates = [...document.querySelectorAll('.project-cover')];
            const panel = candidates.find(el => {
              const r = el.getBoundingClientRect();
              return r.top < innerHeight - 100 && r.bottom > 100;
            });
            if (panel) {
              const r = panel.getBoundingClientRect();
              panel.dispatchEvent(new PointerEvent('pointermove', {
                bubbles: true, pointerType: 'mouse',
                clientX: r.left + r.width * (0.5 + Math.sin(now / 300) * 0.25),
                clientY: Math.max(30, Math.min(innerHeight - 100, r.top + r.height * 0.5))
              }));
            }
            if (now - start < 20000) requestAnimationFrame(sample);
            else {
              const sorted = [...samples].sort((a, b) => a - b);
              resolve({
                elapsed: now - start,
                samples: samples.length,
                meanFrameMs: samples.reduce((a, b) => a + b, 0) / samples.length,
                p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
                maxFrameMs: sorted[sorted.length - 1]
              });
            }
          }
          requestAnimationFrame(sample);
        }));
        notes.desktopPreviewCadence = measurement;
        assert.ok(measurement.samples > 0);
      });
    }

    assert.deepEqual(runtimeErrors, [], 'browser runtime errors');
    assert.deepEqual(securityErrors, [], 'Content Security Policy errors');
    console.log('Observations:', JSON.stringify(notes, null, 2));
    if (failures.length) throw new Error(failures.join('\n'));
    console.log('PASS: navigation, history, resize, accessibility preferences, fallbacks and existing routes.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
