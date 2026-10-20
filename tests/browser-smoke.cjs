/* Run against the local preview: NODE_PATH=<playwright packages> node tests/browser-smoke.cjs */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.OCEAN_TEST_URL || 'http://127.0.0.1:8765';
const executablePath = process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const output = process.env.OCEAN_SCREENSHOTS || '/private/tmp';

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  const errors = [];
  const baselineContext = async options => {
    const context = await browser.newContext(options);
    await context.addInitScript(() => {
      try { sessionStorage.setItem('prachi-ocean-guide-v1', 'seen'); } catch (_) {}
    });
    return context;
  };
  const desktop = await baselineContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const y = page => page.evaluate(() => Ocean.scrollElement.scrollTop);
  const ready = page => page.waitForFunction(() => document.body.classList.contains('ocean-art-ready'));
  const armed = page => page.waitForFunction(() => document.querySelector('.ocean-hero').classList.contains('is-armed'));
  await page.goto(base);
  await ready(page);
  await armed(page);
  await page.screenshot({ path: `${output}/ocean-desktop.png` });
  console.log('desktop geometry', await page.evaluate(() => ({
    hero: document.querySelector('.ocean-hero').getBoundingClientRect().toJSON(),
    viewport: Ocean.getViewport(), bodyOverflow: document.body.scrollWidth > innerWidth
  })));
  await page.locator('.ocean-surface-nav a').first().hover();
  await page.mouse.wheel(0, 20);
  await page.waitForTimeout(250);
  assert.equal(await y(page), 0, 'small wheel movement over navigation should stay at surface');
  await page.mouse.move(900, 470);
  await page.mouse.wheel(0, 30);
  await page.waitForTimeout(35);
  assert.equal(await y(page), 0, 'small wheel burst should stay at surface');
  await page.mouse.wheel(0, 55);
  await page.waitForTimeout(950);
  console.log('after wheel', await page.evaluate(() => ({ y:Ocean.scrollElement.scrollTop, armed:document.querySelector('.ocean-hero').className, progress:document.querySelector('#ocean-dive-progress').style.cssText, hash:location.hash, paused:Ocean.isPaused() })));
  assert.ok(await y(page) > 850, 'deliberate wheel burst should dive');
  await page.screenshot({ path: `${output}/ocean-underwater.png` });
  const diveY = await y(page);
  await page.mouse.wheel(0, 150);
  await page.waitForTimeout(220);
  assert.ok(await y(page) > diveY + 50, 'new wheel gesture scrolls normally underwater');
  await page.evaluate(() => Ocean.scrollTo(0));
  await armed(page);
  await page.locator('.ocean-motion-toggle').click();
  assert.equal(await page.evaluate(() => Ocean.isPaused()), true);
  await page.locator('.ocean-motion-toggle').click();
  await armed(page);
  await page.locator('#ocean-play').click();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(3200);
  await page.keyboard.up('ArrowRight');
  assert.ok(Number(await page.locator('#ocean-best').textContent()) > 2, 'a run records a best time');
  await page.locator('#ocean-dive-link').click();
  await page.waitForTimeout(800);
  assert.ok(await y(page) >= 890);

  const mobile = await baselineContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1
  });
  const phone = await mobile.newPage();
  phone.on('pageerror', error => errors.push(error.message));
  await phone.goto(base);
  await ready(phone); await armed(phone);
  await phone.screenshot({ path: `${output}/ocean-mobile.png` });
  const cdp = await mobile.newCDPSession(phone);
  async function drag(from, to) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from[0], y: from[1] }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
        x: from[0] + (to[0] - from[0]) * i / 10,
        y: from[1] + (to[1] - from[1]) * i / 10
      }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await phone.waitForTimeout(250);
  }
  await drag([195, 520], [195, 440]);
  assert.equal(await y(phone), 0, '80px touch should not dive');
  await drag([100, 470], [250, 470]);
  assert.equal(await y(phone), 0, 'horizontal balancing should not dive');
  await drag([195, 520], [195, 414]);
  await phone.waitForTimeout(700);
  assert.ok(await y(phone) > 800, '100px upward touch should dive');
  const geometry = await phone.evaluate(() => ({
    port: Ocean.scrollElement.getBoundingClientRect().toJSON(),
    lane: document.querySelector('.ocean-companion').getBoundingClientRect().toJSON(),
    content: document.querySelector('.site-content').getBoundingClientRect().toJSON(),
    height: innerHeight, clientWidth: Ocean.scrollElement.clientWidth,
    scrollWidth: Ocean.scrollElement.scrollWidth
  }));
  assert.ok(geometry.content.right <= geometry.lane.left + 1, 'content reserves the companion side lane');
  assert.ok(geometry.lane.width >= 72, 'mobile companion lane reserves at least 72px');
  assert.ok(Math.abs(geometry.lane.height - geometry.height) <= 1, 'mobile companion lane uses the viewport height');
  assert.ok(Math.abs(geometry.port.bottom - geometry.height) <= 1, 'mobile reading viewport keeps its full height');
  assert.ok(geometry.scrollWidth <= geometry.clientWidth + 1, 'mobile page has no horizontal overflow');
  await phone.screenshot({ path: `${output}/ocean-mobile-underwater.png` });
  await phone.locator('.js-hamburger').click();
  assert.equal(await phone.evaluate(() => Ocean.isPaused() && Ocean.scrollElement.inert), true);
  await phone.locator('.js-close-responsive-nav').click();
  assert.equal(await phone.evaluate(() => Ocean.isPaused() || Ocean.scrollElement.inert), false);
  await phone.goto(`${base}/my-favorite-illustrations.html`);
  await ready(phone);
  assert.equal(await phone.evaluate(() => Ocean.isUnderwater()), true);
  await phone.locator('.js-grid-item-container,.js-lightbox').first().click();
  assert.equal(await phone.evaluate(() => Ocean.isPaused()), true);
  await phone.locator('.local-lightbox button').click();
  await phone.waitForFunction(() => !Ocean.isPaused());
  assert.equal(await phone.evaluate(() => Ocean.isPaused()), false);

  const reduced = await baselineContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const quiet = await reduced.newPage();
  await quiet.goto(base); await ready(quiet);
  assert.equal(await quiet.evaluate(() => Ocean.effectsEnabled()), false);
  assert.equal(await quiet.locator('.ocean-hero').evaluate(el => el.classList.contains('is-armed')), false);
  await quiet.locator('#ocean-dive-link').click();
  assert.ok(await y(quiet) > 800, 'reduced-motion dive jumps directly');

  const plain = await baselineContext({ javaScriptEnabled: false });
  const nojs = await plain.newPage();
  await nojs.goto(base);
  await nojs.locator('#ocean-dive-link').click();
  // In-page requestAnimationFrame polling cannot run with JavaScript disabled.
  const nojsDeadline = Date.now() + 3000;
  while (await nojs.evaluate(() => scrollY) <= 0 && Date.now() < nojsDeadline) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.ok(await nojs.evaluate(() => scrollY) > 0, 'no-JavaScript anchor remains usable');
  assert.deepEqual(errors, [], 'no browser runtime errors');
  await browser.close();
  console.log('PASS: desktop wheel/game/pause, mobile touch/side-lane/navigation/lightbox, reduced motion, no-JavaScript fallback.');
})().catch(error => { console.error(error); process.exit(1); });
