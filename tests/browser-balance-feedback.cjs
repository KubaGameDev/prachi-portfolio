/* Focused browser checks for distinct player-input and actual-balance feedback.
 * Start the local preview on port 8765, then run:
 * NODE_PATH=/Users/kmole_macbook/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
 * /Users/kmole_macbook/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/browser-balance-feedback.cjs
 * Optional: OCEAN_TEST_URL, CHROME_EXECUTABLE, OCEAN_SCREENSHOTS, OCEAN_TEST_FILTER.
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
const filter = (process.env.OCEAN_TEST_FILTER || '').toLowerCase();
const failures = [], runtimeErrors = [], consoleErrors = [];
const notes = {};

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true });
  const ready = page => page.waitForFunction(() =>
    window.Ocean && typeof Ocean.getBalanceFeedback === 'function' &&
    document.body.classList.contains('ocean-art-ready') &&
    document.body.classList.contains('ocean-balance-art-ready') &&
    document.querySelector('.ocean-hero').classList.contains('is-armed'));
  const twoFrames = page => page.evaluate(() => new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const screenshot = (page, name) =>
    page.screenshot({ path: path.join(output, 'balance-feedback-' + name + '.png') });

  async function snapshot(page) {
    return page.evaluate(() => {
      const track = document.querySelector('#ocean-balance').getBoundingClientRect();
      const actual = document.querySelector('.ocean-balance-marker').getBoundingClientRect();
      const input = document.querySelector('.ocean-input-marker').getBoundingClientRect();
      const percent = rect => ((rect.left + rect.width / 2 - track.left) / track.width) * 100;
      return {
        ...Ocean.getBalanceFeedback(),
        actualPercent: percent(actual),
        inputPercent: percent(input),
        cueText: document.querySelector('#ocean-balance-cue').textContent.trim(),
        score: Number(document.querySelector('#ocean-score').textContent)
      };
    });
  }

  function assertMapped(state, input, label) {
    const clamp = value => Math.max(-1, Math.min(1, value));
    assert.ok(Math.abs(state.input - input) <= 0.02, label + ': applied input is ' + input);
    assert.ok(Math.abs(state.inputPercent - (50 + clamp(input) * 46)) <= 1,
      label + ': input ring renders immediately, got ' + state.inputPercent + '%');
    assert.ok(Math.abs(state.actualPercent - (50 + clamp(state.lean) * 46)) <= 1,
      label + ': gold circle represents current lean, got ' + state.actualPercent + '%');
    assert.ok(['Counter left', 'Counter right', 'Ease off', 'Steady',
      'Keep Flo centered', 'Paused'].includes(state.cueText),
      label + ': a concise correction cue is shown, got ' + state.cueText);
    assert.equal(state.cueText, state.cue, label + ': displayed cue matches the applied feedback');
  }

  async function check(name, callback, options = {}) {
    if (filter && !name.toLowerCase().includes(filter)) return;
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }, ...options
    });
    await context.addInitScript(() => {
      try { sessionStorage.setItem('prachi-ocean-guide-v1', 'seen'); } catch (_) {}
    });
    const page = await context.newPage();
    page.on('pageerror', error => runtimeErrors.push(name + ': ' + error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(name + ': ' + message.text());
    });
    try {
      await page.goto(base + '/index.html');
      await ready(page);
      await callback(page, context);
      console.log('PASS ' + name);
    } catch (error) {
      failures.push(name + ': ' + error.message);
      console.error('FAIL ' + name + ': ' + error.message);
      await screenshot(page, 'failure-' + name.replace(/[^a-z0-9]+/gi, '-').toLowerCase())
        .catch(() => {});
    } finally {
      await context.close();
    }
  }

  try {
    await check('coincident circles remain distinct and explained', async page => {
      await twoFrames(page);
      const initial = await snapshot(page);
      assertMapped(initial, 0, 'neutral');
      assert.ok(Math.abs(initial.actualPercent - initial.inputPercent) <= 1,
        'both circles initially share the center');
      assert.equal(initial.cueText, 'Keep Flo centered');
      const visuals = await page.evaluate(() => {
        const actual = document.querySelector('.ocean-balance-marker');
        const input = document.querySelector('.ocean-input-marker');
        const actualStyle = getComputedStyle(actual), inputStyle = getComputedStyle(input);
        const a = actual.getBoundingClientRect(), b = input.getBoundingClientRect();
        let unclipped = true;
        for (let parent = input.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent), rect = parent.getBoundingClientRect();
          if (/hidden|clip/.test(style.overflowX) &&
              (b.left < rect.left - 1 || b.right > rect.right + 1)) unclipped = false;
          if (/hidden|clip/.test(style.overflowY) &&
              (b.top < rect.top - 1 || b.bottom > rect.bottom + 1)) unclipped = false;
          // The fixed ocean shell escapes the ordinary body's layout box;
          // higher root overflow applies to the viewport, not that body box.
          if (style.position === 'fixed') break;
        }
        return {
          actual: { width: a.width, height: a.height, opacity: actualStyle.opacity,
            background: actualStyle.backgroundColor, visibility: actualStyle.visibility },
          ring: { width: b.width, height: b.height, opacity: inputStyle.opacity,
            border: parseFloat(inputStyle.borderTopWidth), background: inputStyle.backgroundColor,
            color: inputStyle.borderTopColor, visibility: inputStyle.visibility },
          legend: document.querySelector('#ocean-balance-description').textContent.trim(),
          describedBy: document.querySelector('#ocean-balance').getAttribute('aria-describedby') || '',
          unclipped
        };
      });
      assert.ok(visuals.ring.width >= visuals.actual.width + 4 &&
        visuals.ring.height >= visuals.actual.height + 4,
      'a larger aqua ring remains visible around the gold circle');
      assert.ok(visuals.ring.border >= 1 && Number(visuals.ring.opacity) > 0 &&
        Number(visuals.actual.opacity) > 0, 'both circle treatments are visible');
      assert.equal(visuals.ring.visibility, 'visible');
      assert.equal(visuals.actual.visibility, 'visible');
      assert.ok(/transparent|rgba\([^)]*,\s*0\)/.test(visuals.ring.background),
        'the input ring has a transparent center so it cannot obscure gold');
      assert.notEqual(visuals.ring.color, visuals.actual.background,
        'actual balance and applied input use distinguishable colors');
      assert.equal(visuals.unclipped, true, 'the track does not clip either circle');
      assert.ok(visuals.legend.length > 15, 'a visible legend explains the two circles');
      assert.ok(visuals.describedBy.split(/\s+/).includes('ocean-balance-description'),
        'the meter exposes its legend to assistive technology');
      notes.neutral = initial;
      await screenshot(page, 'coincident');
    });

    for (const direction of [-1, 1]) {
      const key = direction < 0 ? 'ArrowLeft' : 'ArrowRight';
      const opposite = direction < 0 ? 'ArrowRight' : 'ArrowLeft';
      const side = direction < 0 ? 'left' : 'right';
      await check('keyboard ' + side + ' input is immediate while lean has inertia', async page => {
        // Focus without moving the mouse: pointer input should remain neutral.
        await page.locator('#surface').focus();
        const initial = await snapshot(page);
        await page.keyboard.down(key);
        await twoFrames(page);
        const immediate = await snapshot(page);
        assertMapped(immediate, direction, side + ' press');
        assert.ok(Math.abs(immediate.lean - initial.lean) < 0.12,
          'gold lean does not teleport to the input ring');
        assert.ok(Math.abs(immediate.actualPercent - immediate.inputPercent) > 25,
          'input and actual balance are visibly separate just after a key press');
        await page.waitForFunction(sign => {
          const state = Ocean.getBalanceFeedback();
          return state.state === 'balancing' && state.lean * sign > 0.16 &&
            state.velocity * sign > 0.2;
        }, direction, { timeout: 1000, polling: 'raf' });
        const leaning = await snapshot(page);
        assertMapped(leaning, direction, side + ' held');
        assert.ok(leaning.score > initial.score, 'the score advances while balancing');
        assert.equal(leaning.cueText, direction > 0 ? 'Counter left' : 'Counter right',
          'the cue asks for correction opposite the outward lean');

        await page.keyboard.up(key);
        await twoFrames(page);
        const released = await snapshot(page);
        assertMapped(released, 0, side + ' release');
        assert.ok(Math.abs(released.lean) > 0.10,
          'releasing recenters the input ring without snapping Flo upright');
        assert.ok(released.velocity * direction > 0,
          'the character retains its momentum on release');

        await page.keyboard.down(opposite);
        await twoFrames(page);
        const correcting = await snapshot(page);
        assertMapped(correcting, -direction, side + ' opposite correction');
        assert.ok(correcting.lean * direction > 0,
          'opposite input starts correction while the gold circle still shows the current lean');
        await page.waitForFunction(sign => Ocean.getBalanceFeedback().velocity * sign < -0.03,
          direction, { timeout: 1300, polling: 'raf' });
        const reversing = await snapshot(page);
        assertMapped(reversing, -direction, side + ' reversed momentum');
        assert.ok(reversing.velocity * direction < 0, 'opposite input reverses the outward velocity');

        await page.keyboard.up(opposite);
        await twoFrames(page);
        assertMapped(await snapshot(page), 0, side + ' correction release');
        notes[side] = { initial, immediate, leaning, released, correcting, reversing };
        await screenshot(page, side + '-correction');
      });
    }

    await check('touch drag shows applied input then returns the ring to center', async (page, context) => {
      const cdp = await context.newCDPSession(page);
      try {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart', touchPoints: [{ x: 195, y: 370 }]
        });
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove', touchPoints: [{ x: 255, y: 370 }]
        });
        await twoFrames(page);
        const right = await snapshot(page);
        assertMapped(right, 0.6, 'touch right');
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove', touchPoints: [{ x: 135, y: 370 }]
        });
        await twoFrames(page);
        assertMapped(await snapshot(page), -0.6, 'touch left');
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await twoFrames(page);
        assertMapped(await snapshot(page), 0, 'touch released');
        assert.equal(await page.evaluate(() => Ocean.scrollElement.scrollTop), 0,
          'horizontal correction does not scroll or dive');
        await screenshot(page, 'touch');

        // An unfinished upward dive gesture suspends game physics. Give the
        // gesture a horizontal component too, proving that unapplied thumb
        // movement is not shown as active correction advice.
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart', touchPoints: [{ x: 195, y: 400 }]
        });
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove', touchPoints: [{ x: 225, y: 340 }]
        });
        await twoFrames(page);
        assertMapped(await snapshot(page), 0, 'upward preview disables correction');
        assert.equal((await snapshot(page)).cueText, 'Keep Flo centered',
          'a partial dive must not advise a correction while physics is held');
        // Scores refresh at 100ms; first allow any pre-preview value to flush.
        await page.waitForTimeout(120);
        const held = await snapshot(page);
        await page.waitForTimeout(220);
        const still = await snapshot(page);
        assert.equal(still.lean, held.lean, 'partial dive preview freezes lean');
        assert.equal(still.velocity, held.velocity, 'partial dive preview freezes velocity');
        assert.equal(still.score, held.score, 'partial dive preview freezes score');
        assertMapped(still, 0, 'held upward preview');
        assert.equal(still.cueText, 'Keep Flo centered');
        await screenshot(page, 'touch-preview');
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForFunction(score =>
          Number(document.querySelector('#ocean-score').textContent) > score,
        still.score, { timeout: 1000 });
        assert.notEqual((await snapshot(page)).cueText, 'Keep Flo centered',
          'correction advice resumes with physics after releasing the preview');
        assert.equal(await page.evaluate(() => Ocean.scrollElement.scrollTop), 0,
          'an unfinished upward gesture remains on the surface');
      } finally {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
          .catch(() => {});
        await cdp.detach();
      }
    }, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    await check('pause holds actual balance and score and resume remains usable', async page => {
      await page.locator('#surface').focus();
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(280);
      await page.keyboard.up('ArrowRight');
      await page.locator('.ocean-motion-toggle').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => Ocean.isPaused());
      await twoFrames(page);
      const frozen = await snapshot(page);
      await page.waitForTimeout(400);
      const still = await snapshot(page);
      assert.equal(still.lean, frozen.lean, 'pause freezes actual lean');
      assert.equal(still.velocity, frozen.velocity, 'pause freezes velocity');
      assert.equal(still.actualPercent, frozen.actualPercent, 'pause freezes the gold marker');
      assert.equal(still.score, frozen.score, 'pause freezes the score');
      assertMapped(still, 0, 'paused neutral input');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !Ocean.isPaused());
      await screenshot(page, 'pause-resume');
    });

    for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
      const label = viewport.width + 'x' + viewport.height;
      await check('feedback HUD and wave do not overlap at ' + label, async page => {
        const samples = [];
        for (let i = 0; i < 5; i++) {
          const geometry = await page.evaluate(() => {
            const hero = document.querySelector('#surface').getBoundingClientRect();
            const hud = document.querySelector('.ocean-hud').getBoundingClientRect();
            const meter = document.querySelector('#ocean-balance').getBoundingClientRect();
            const legend = document.querySelector('#ocean-balance-description').getBoundingClientRect();
            const cue = document.querySelector('#ocean-balance-cue').getBoundingClientRect();
            const wave = Ocean.getSurfGeometry();
            return {
              wave, clearance: meter.top - hero.top - wave.crestY - wave.height,
              withinHero: hud.left >= hero.left - 2 && hud.right <= hero.right + 2 &&
                hud.top >= hero.top - 2 && hud.bottom <= hero.bottom + 2,
              legendWithinHud: legend.left >= hud.left - 1 && legend.right <= hud.right + 1 &&
                legend.top >= hud.top - 1 && legend.bottom <= hud.bottom + 1,
              cueWithinHud: cue.left >= hud.left - 1 && cue.right <= hud.right + 1 &&
                cue.top >= hud.top - 1 && cue.bottom <= hud.bottom + 1
            };
          });
          assert.ok(geometry.clearance > 4, label + ': the full wave stays above the meter');
          assert.ok(Math.abs(geometry.wave.width / geometry.wave.height - 1.6) <= 0.03);
          assert.equal(geometry.withinHero, true, label + ': the expanded HUD fits within the hero');
          assert.equal(geometry.legendWithinHud, true, label + ': legend fits in the HUD');
          assert.equal(geometry.cueWithinHud, true, label + ': cue fits in the HUD');
          samples.push(geometry.clearance);
          await page.waitForTimeout(130);
        }
        await screenshot(page, label + '-initial');
        for (const selector of ['#ocean-play', '#ocean-help', '#ocean-enable-tilt',
          '#ocean-dive-link', '.ocean-motion-toggle']) {
          const locator = page.locator(selector);
          if (!await locator.isVisible()) continue;
          await locator.scrollIntoViewIfNeeded();
          assert.equal(await locator.evaluate(element => {
            const r = element.getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return hit === element || element.contains(hit);
          }), true, label + ': ' + selector + ' remains reachable');
        }
        notes[label] = { minimumClearance: Math.min(...samples) };
        await screenshot(page, label);
      }, { viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    }

    assert.deepEqual(runtimeErrors, [], 'no browser runtime errors');
    assert.deepEqual(consoleErrors, [], 'no console errors');
    console.log('Observations:', JSON.stringify(notes, null, 2));
    console.log('Screenshots: ' + output);
    if (failures.length) throw new Error(failures.join('\n'));
    console.log('PASS: separate balance/input markers, inertial corrections, touch, pause and responsive feedback.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

