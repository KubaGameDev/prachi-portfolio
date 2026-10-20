/* Focused inline guidance and device-orientation integration checks.
 * Run with the local preview server and Playwright available through NODE_PATH.
 * Synthetic sensor events verify application handling, not physical sensor quality.
 */
'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.OCEAN_TEST_URL || 'http://127.0.0.1:8765';
const executablePath = process.env.CHROME_EXECUTABLE ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const failures = [], runtimeErrors = [];

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const ready = page => page.waitForFunction(() =>
    window.Ocean && document.body.classList.contains('ocean-art-ready'));
  const armed = page => page.waitForFunction(() =>
    document.querySelector('.ocean-hero').classList.contains('is-armed'));
  const mode = page => page.locator('.ocean-hero').getAttribute('data-input');
  const score = async page => Number(await page.locator('#ocean-score').textContent());

  async function check(name, callback, options = {}) {
    const { permission = 'granted', desktop = false, viewport } = options;
    const context = await browser.newContext(desktop ? {
      viewport: viewport || { width: 1440, height: 900 }
    } : {
      viewport: viewport || { width: 390, height: 844 },
      isMobile: true, hasTouch: true, deviceScaleFactor: 1
    });
    // Deliberately do not seed the guide's sessionStorage flag in this suite.
    await context.addInitScript(result => {
      window.__tiltPermissionCalls = 0;
      window.__tiltPermissionActive = false;
      window.__tiltScreenAngle = 0;
      const OrientationEvent = window.DeviceOrientationEvent;
      if (result === 'unsupported') {
        Object.defineProperty(window, 'DeviceOrientationEvent', {
          configurable: true, value: undefined
        });
      } else if (OrientationEvent && result === 'not-required') {
        Object.defineProperty(OrientationEvent, 'requestPermission', {
          configurable: true, value: undefined
        });
      } else if (OrientationEvent) {
        Object.defineProperty(OrientationEvent, 'requestPermission', {
          configurable: true,
          value: async () => {
            window.__tiltPermissionCalls++;
            window.__tiltPermissionActive = !!navigator.userActivation?.isActive;
            return result;
          }
        });
      }
      if (screen.orientation) {
        Object.defineProperty(screen.orientation, 'angle', {
          configurable: true, get: () => window.__tiltScreenAngle
        });
      }
    }, permission);
    const page = await context.newPage();
    page.on('pageerror', error => runtimeErrors.push(`${name}: ${error.message}`));
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

  async function observeTilt(page) {
    // Observe existing methods without changing their inputs, outputs or timing.
    await page.evaluate(() => {
      const proto = OceanCore.TiltInput.prototype;
      const originalSample = proto.sample, originalRead = proto.read;
      window.__tiltSampleCount = 0;
      window.__lastTiltSample = null;
      window.__lastTiltRead = null;
      proto.sample = function (...args) {
        const result = originalSample.apply(this, args);
        window.__tiltSampleCount++;
        window.__lastTiltSample = result;
        return result;
      };
      proto.read = function (...args) {
        const result = originalRead.apply(this, args);
        window.__lastTiltRead = result;
        return result;
      };
    });
  }

  async function sensor(page, beta, gamma) {
    await page.evaluate(({ beta, gamma }) => {
      const event = new Event('deviceorientation');
      Object.defineProperties(event, {
        beta: { value: beta }, gamma: { value: gamma },
        alpha: { value: 0 }, absolute: { value: false }
      });
      window.dispatchEvent(event);
    }, { beta, gamma });
  }

  async function pulseSensor(page, beta, gamma, count = 8) {
    for (let i = 0; i < count; i++) {
      await page.waitForTimeout(50);
      await sensor(page, beta, gamma);
    }
  }

  async function enableTilt(page, expectedPermissionCalls = 1) {
    await page.locator('#ocean-enable-tilt').click();
    await page.waitForFunction(() => document.querySelector('.ocean-hero').dataset.input === 'tilt');
    assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), expectedPermissionCalls);
    await sensor(page, 0, 0);
    await armed(page);
  }

  async function drag(page, context, from, to) {
    const cdp = await context.newCDPSession(page);
    try {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart', touchPoints: [{ x: from[0], y: from[1] }]
      });
      for (let i = 1; i <= 10; i++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove', touchPoints: [{
            x: from[0] + (to[0] - from[0]) * i / 10,
            y: from[1] + (to[1] - from[1]) * i / 10
          }]
        });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await cdp.detach();
    }
    await page.waitForTimeout(250);
  }

  try {
    await check('inline hint appears once without pausing or stealing focus, then dissolves after eight seconds', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-input-guide').waitFor({ state: 'visible' });
      await armed(page);
      assert.equal(await page.evaluate(() => Ocean.isPaused()), false);
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 0);
      assert.equal(await page.evaluate(() =>
        document.querySelector('#ocean-input-guide').contains(document.activeElement)), false,
      'showing the hint must not move focus into it');
      assert.notEqual(await page.locator('#ocean-input-guide').getAttribute('role'), 'dialog');
      assert.notEqual(await page.locator('#ocean-input-guide').getAttribute('aria-modal'), 'true');
      assert.equal(await page.locator('#ocean-guide-close, #ocean-guide-done').count(), 0);
      assert.equal(await page.locator('#ocean-enable-tilt').isVisible(), false);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('prachi-ocean-guide-v1')), 'seen',
        'the hint is remembered when shown, without requiring a dismissal');
      await page.locator('#surface').focus();
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(80);
      await page.keyboard.up('ArrowRight');
      await page.waitForFunction(() => Number(document.querySelector('#ocean-score').textContent) > 0);
      assert.equal(await page.locator('#ocean-input-guide').isVisible(), true,
        'keyboard gameplay should work while the hint remains visible');
      await page.reload();
      await ready(page);
      assert.equal(await page.locator('#ocean-input-guide').isVisible(), false);
      await armed(page);
      await page.locator('#ocean-play').click();
      await page.waitForFunction(() => Number(document.querySelector('#ocean-score').textContent) > 0);
      const shownAt = await page.evaluate(() => performance.now());
      await page.locator('#ocean-help').click();
      assert.equal(await page.locator('#ocean-input-guide').isVisible(), true);
      assert.equal(await page.locator('#ocean-help').getAttribute('aria-expanded'), 'true');
      assert.equal(await page.evaluate(() => Ocean.isPaused()), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'ocean-help',
        'opening the hint must leave focus on the Help button');
      const running = await score(page);
      await page.waitForTimeout(350);
      assert.ok(await score(page) > running, 'showing help must not freeze a running game');
      await page.waitForFunction(() =>
        document.querySelector('#ocean-input-guide').classList.contains('is-dissolving'),
      null, { timeout: 10000 });
      const fadeStartedAfter = await page.evaluate(start => performance.now() - start, shownAt);
      assert.ok(fadeStartedAfter >= 7800, 'the hint should remain for eight seconds before fading');
      await page.locator('#ocean-input-guide').waitFor({ state: 'hidden', timeout: 2000 });
      assert.equal(await page.locator('#ocean-help').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'ocean-help',
        'automatic fading must preserve focus');
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 0);
    }, { desktop: true });

    await check('mobile tilt controls remain usable after the inline hint disappears', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-input-guide').waitFor({ state: 'visible' });
      await page.locator('#ocean-input-guide').waitFor({ state: 'hidden', timeout: 11000 });
      assert.equal(await page.locator('#ocean-enable-tilt').isVisible(), true);
      assert.equal(await page.locator('#ocean-enable-tilt').isEnabled(), true);
      assert.equal(await page.locator('#ocean-use-touch').isVisible(), false);
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 0);
      await observeTilt(page);
      await enableTilt(page);
      assert.equal(await page.locator('#ocean-input-guide').isVisible(), false,
        'enabling tilt must not reopen a dismissed hint');
      assert.equal(await page.locator('#ocean-use-touch').isVisible(), true);
      assert.equal(await page.locator('#ocean-recenter').isVisible(), true);
      await pulseSensor(page, 0, 30, 4);
      assert.ok(await score(page) > 0);
      await page.locator('#ocean-use-touch').click();
      assert.equal(await mode(page), 'touch');
      assert.equal(await page.locator('#ocean-use-touch').isVisible(), false);
      assert.equal(await page.locator('#ocean-recenter').isVisible(), false);
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 1);
    });

    await check('tilt requires a consent click, calibrates once, then balances to the right', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-input-guide').waitFor({ state: 'visible' });
      await observeTilt(page);
      await sensor(page, 0, 35);
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 0,
        'loading the page and receiving a sensor event must not request permission');
      assert.equal(await mode(page), 'touch');
      assert.equal(await page.locator('#ocean-recenter').isVisible(), false);
      await enableTilt(page);
      assert.equal(await page.evaluate(() => window.__tiltPermissionActive), true,
        'permission must be requested inside a trusted user activation');
      assert.equal(await page.evaluate(() => window.__lastTiltSample.input), 0,
        'the first valid sample must establish a neutral baseline');
      assert.equal(await score(page), 0, 'calibration alone must not start a scored run');
      assert.equal(await page.locator('#ocean-recenter').isVisible(), true);
      await pulseSensor(page, 0, 30);
      assert.ok(await page.evaluate(() => window.__lastTiltSample.input) > 0.8);
      assert.ok(await score(page) > 0, 'tilting beyond the dead zone starts a run');
      assert.ok(Number(await page.locator('#ocean-balance').getAttribute('aria-valuenow')) > 0,
        'right tilt must move the balance meter to the right');
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 1);
    });

    await check('permission denial keeps touch available without repeated prompts', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-enable-tilt').click();
      await page.waitForFunction(() => window.__tiltPermissionCalls === 1);
      await page.locator('#ocean-tilt-feedback').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#ocean-tilt-feedback').getAttribute('role'), 'status');
      assert.equal(await mode(page), 'touch');
      assert.equal(await page.locator('#ocean-use-touch').isVisible(), false);
      await armed(page);
      assert.equal(await page.locator('#ocean-recenter').isVisible(), false);
      await sensor(page, 0, 45);
      assert.equal(await mode(page), 'touch');
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 1);
    }, { permission: 'denied' });

    await check('Android-style tilt enables explicitly without a permission API', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-input-guide').waitFor({ state: 'visible' });
      await observeTilt(page);
      assert.equal(await page.evaluate(() => typeof DeviceOrientationEvent), 'function');
      assert.equal(await page.evaluate(() => typeof DeviceOrientationEvent.requestPermission), 'undefined');
      await sensor(page, 0, 30);
      assert.equal(await page.evaluate(() => window.__tiltSampleCount), 0,
        'sensor listeners must not start before the explicit Enable tap');
      assert.equal(await mode(page), 'touch');
      await enableTilt(page, 0);
      assert.equal(await page.evaluate(() => window.__lastTiltSample.input), 0);
      assert.equal(await score(page), 0);
      await pulseSensor(page, 0, 30);
      assert.ok(await score(page) > 0);
      assert.ok(Number(await page.locator('#ocean-balance').getAttribute('aria-valuenow')) > 0);
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 0,
        'a browser without requestPermission must not fabricate a permission call');
    }, { permission: 'not-required' });

    await check('unsupported orientation disables tilt and leaves touch usable', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-input-guide').waitFor({ state: 'visible' });
      assert.equal(await page.evaluate(() => typeof DeviceOrientationEvent), 'undefined');
      assert.equal(await page.locator('#ocean-enable-tilt').isDisabled(), true);
      assert.equal(await page.locator('#ocean-tilt-feedback').isVisible(), true);
      assert.match(await page.locator('#ocean-tilt-feedback').textContent(), /touch/i);
      assert.equal(await page.locator('#ocean-use-touch').isVisible(), false);
      await armed(page);
      assert.equal(await mode(page), 'touch');
      await page.locator('#ocean-play').click();
      await page.waitForFunction(() => Number(document.querySelector('#ocean-score').textContent) > 0);
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 0);
    }, { permission: 'unsupported' });

    await check('granted permission with no valid data falls back to touch', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await page.locator('#ocean-enable-tilt').click();
      await page.waitForFunction(() => document.querySelector('.ocean-hero').dataset.input === 'tilt');
      await sensor(page, null, null);
      assert.equal(await page.locator('#ocean-input-guide').isVisible(), true,
        'missing sensor values must not be treated as calibration');
      await page.waitForFunction(() => document.querySelector('.ocean-hero').dataset.input === 'touch',
        null, { timeout: 10000 });
      assert.equal(await page.locator('#ocean-tilt-feedback').isVisible(), true);
      assert.equal(await page.locator('#ocean-use-touch').isVisible(), false);
      await armed(page);
      assert.equal(await mode(page), 'touch');
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 1);
    });

    await check('recenter, stale samples and orientation changes remain neutral and recover', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await observeTilt(page);
      await enableTilt(page);
      await pulseSensor(page, 0, 25, 5);
      assert.ok(await page.evaluate(() => window.__lastTiltSample.input) > 0);
      await page.locator('#ocean-recenter').click();
      await sensor(page, 0, 25);
      assert.equal(await page.evaluate(() => window.__lastTiltSample.input), 0,
        'recenter must use the current pose as the new neutral');
      await pulseSensor(page, 0, 45, 4);
      assert.ok(await page.evaluate(() => window.__lastTiltRead) > 0);
      await page.waitForFunction(() => window.__lastTiltRead === 0, null, { timeout: 2000 });
      await page.evaluate(() => {
        window.__tiltScreenAngle = 90;
        screen.orientation?.dispatchEvent(new Event('change'));
        window.dispatchEvent(new Event('orientationchange'));
      });
      await sensor(page, 20, 0);
      assert.equal(await page.evaluate(() => window.__lastTiltSample.input), 0,
        'screen rotation must establish a new neutral sample');
      await pulseSensor(page, 40, 0, 4);
      assert.ok(await page.evaluate(() => window.__lastTiltSample.input) > 0,
        'landscape right tilt must still supply positive correction');
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 1);
    });

    await check('tilt continues through help, suspends for pause and dive, and resumes without new consent', async page => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await observeTilt(page);
      await enableTilt(page);
      await pulseSensor(page, 0, 25, 3);

      await page.locator('#ocean-help').click();
      assert.equal(await page.evaluate(() => Ocean.isPaused()), false);
      const beforeGuide = await page.evaluate(() => window.__tiltSampleCount);
      await sensor(page, 0, 40);
      assert.equal(await page.evaluate(() => window.__tiltSampleCount), beforeGuide + 1,
        'the inline hint must leave the sensor listener active');
      assert.ok(await page.evaluate(() => window.__lastTiltSample.input) > 0,
        'opening the hint must preserve the existing neutral pose');

      await page.locator('.ocean-motion-toggle').click();
      assert.equal(await page.evaluate(() => Ocean.isPaused()), true);
      const beforePause = await page.evaluate(() => window.__tiltSampleCount);
      await sensor(page, 0, 45);
      assert.equal(await page.evaluate(() => window.__tiltSampleCount), beforePause,
        'paused motion must not keep consuming sensor readings');
      await page.locator('.ocean-motion-toggle').click();
      assert.equal(await page.evaluate(() => Ocean.isPaused()), false);
      await sensor(page, 0, -10);
      assert.equal(await page.evaluate(() => window.__lastTiltSample.input), 0,
        'resuming must recalibrate from the next reading');

      await page.locator('#ocean-dive-link').click();
      const beforeDive = await page.evaluate(() => window.__tiltSampleCount);
      await sensor(page, 0, 40);
      assert.equal(await page.evaluate(() => window.__tiltSampleCount), beforeDive,
        'committing a dive must stop sensors before the transition finishes');
      await page.waitForFunction(() => Ocean.isUnderwater());
      await page.waitForTimeout(450);
      await sensor(page, 0, -40);
      assert.equal(await page.evaluate(() => window.__tiltSampleCount), beforeDive,
        'underwater reading must not consume sensor readings');
      assert.equal(await mode(page), 'tilt', 'the chosen input mode should survive a dive');
      await page.evaluate(() => Ocean.scrollTo(0));
      await armed(page);
      await sensor(page, 0, -12);
      assert.equal(await page.evaluate(() => window.__lastTiltSample.input), 0,
        'returning to the surface must use a fresh neutral pose');
      assert.equal(await score(page), 0);
      await pulseSensor(page, 0, 18, 4);
      assert.ok(await score(page) > 0, 'fresh tilt should start a new run after returning');
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 1,
        'guide, pause and surface return must reuse the existing permission');
    });

    await check('default touch works through the inline hint and preserves the firm 100px dive', async (page, context) => {
      await page.goto(`${base}/index.html`);
      await ready(page);
      await armed(page);
      assert.equal(await page.locator('#ocean-input-guide').isVisible(), true);
      assert.equal(await mode(page), 'touch');
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 0);
      await drag(page, context, [195, 520], [195, 440]);
      assert.equal(await page.evaluate(() => Ocean.scrollElement.scrollTop), 0,
        '80px upward drag must remain in the game');
      await drag(page, context, [100, 470], [250, 470]);
      assert.equal(await page.evaluate(() => Ocean.scrollElement.scrollTop), 0,
        'horizontal touch correction must not dive');
      await drag(page, context, [195, 520], [195, 414]);
      await page.waitForFunction(() => Ocean.isUnderwater());
      await page.waitForTimeout(400);
      assert.ok(await page.evaluate(() => Ocean.scrollElement.scrollTop) > 800);
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 0);
    });

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 768, height: 1024 }
    ]) {
      await check(`game controls remain inside the visible surface at ${viewport.width}×${viewport.height}`,
        async page => {
          await page.goto(`${base}/index.html`);
          await ready(page);
          await armed(page);
          async function assertControlBounds() {
            const controls = await page.evaluate(() => {
              const hero = document.querySelector('#surface').getBoundingClientRect();
              const selectors = ['#ocean-balance', '#ocean-play', '#ocean-help',
                '#ocean-enable-tilt', '#ocean-use-touch', '#ocean-recenter', '#ocean-dive-link'];
              return selectors.flatMap(selector => {
                const element = document.querySelector(selector);
                const rect = element.getBoundingClientRect();
                if (!rect.width || !rect.height || getComputedStyle(element).visibility === 'hidden') return [];
                const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
                return [{
                  selector,
                  withinSurface: rect.left >= hero.left - 2 && rect.top >= hero.top - 2 &&
                    rect.right <= hero.right + 2 && rect.bottom <= hero.bottom + 2,
                  withinViewport: rect.left >= -2 && rect.top >= -2 &&
                    rect.right <= innerWidth + 2 && rect.bottom <= innerHeight + 2,
                  reachable: selector === '#ocean-balance' || hit === element || element.contains(hit)
                }];
              });
            });
            for (const control of controls) {
              assert.equal(control.withinSurface, true, `${control.selector} overflows the surface`);
              assert.equal(control.withinViewport, true, `${control.selector} falls outside the viewport`);
              assert.equal(control.reachable, true, `${control.selector} is covered by another element`);
            }
          }
          await assertControlBounds();
          await enableTilt(page);
          // A longer tilt status and extra controls must remain usable after wrapping.
          await page.waitForTimeout(100);
          await assertControlBounds();
        }, { viewport });
    }

    await check('direct underwater and inner-page visits do not open the guide', async page => {
      await page.goto(`${base}/index.html#underwater`);
      await ready(page);
      assert.equal(await page.evaluate(() => Ocean.isUnderwater()), true);
      assert.equal(await page.locator('#ocean-input-guide').isVisible(), false);
      await page.goto(`${base}/about.html`);
      await ready(page);
      assert.equal(await page.locator('#ocean-input-guide').count(), 0);
      assert.equal(await page.evaluate(() => window.__tiltPermissionCalls), 0);
    });

    assert.deepEqual(runtimeErrors, [], 'browser runtime errors');
    if (failures.length) throw new Error(failures.join('\n'));
    console.log('PASS: inline guidance, explicit sensor consent, calibration, fallbacks and mobile touch.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
