'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Companion, constants } = require('../assets/js/flo-motion.js');

function simulate(flo, duration, dt = 1 / 120) {
  for (let elapsed = 0; elapsed < duration - 0.0000001; elapsed += dt) {
    flo.step(Math.min(dt, duration - elapsed));
  }
}

function companion() {
  return new Companion({ minY: 70, maxY: 700, y: 400 });
}

test('small pointer movements look briefly without shifting the resting perch', () => {
  const flo = companion();
  flo.point(425);
  assert.equal(flo.state, 'looking');
  assert.equal(flo.direction, 1);
  simulate(flo, constants.LOOK_SECONDS - constants.FIXED_DT);
  assert.equal(flo.state, 'looking');
  simulate(flo, constants.FIXED_DT * 2);
  assert.equal(flo.state, 'resting');
  assert.equal(flo.y, 400);
  assert.equal(flo.targetY, 400);
  flo.point(427);
  assert.equal(flo.state, 'resting', 'pointer noise must not restart the look');
});

test('Flo hesitates once, swims with bounded speed, then rests at cursor height', () => {
  const flo = companion();
  flo.point(100);
  assert.equal(flo.state, 'anticipating');
  assert.equal(flo.anticipation, 0);
  simulate(flo, constants.HESITATION_SECONDS - constants.FIXED_DT * 2);
  assert.equal(flo.y, 400);
  assert.equal(flo.velocity, 0);
  assert.ok(flo.anticipation > 0.9 && flo.anticipation < 1);
  simulate(flo, constants.FIXED_DT * 4);
  assert.equal(flo.state, 'swimming');
  assert.equal(flo.anticipation, 0);
  assert.ok(flo.y < 400);
  assert.equal(flo.direction, -1);
  assert.ok(flo.energy > 0);
  let settled = false;
  for (let i = 0; i < 600; i++) {
    flo.step(1 / 120);
    assert.ok(Math.abs(flo.velocity) <= constants.MAX_SPEED);
    assert.ok(flo.y >= 100, 'damping prevents overshoot on an uninterrupted swim');
    if (flo.state === 'settling') settled = true;
  }
  assert.equal(settled, true);
  assert.equal(flo.y, 100);
  assert.equal(flo.velocity, 0);
  assert.equal(flo.state, 'resting');
});

test('continuous pointer updates do not restart anticipation or interrupt swimming', () => {
  const flo = companion();
  flo.point(100);
  const updates = Math.ceil((constants.HESITATION_SECONDS + 0.05) * 60);
  for (let i = 0; i < updates; i++) {
    flo.point(100 + i);
    flo.step(1 / 60);
  }
  assert.equal(flo.state, 'swimming');
  flo.point(650);
  assert.equal(flo.state, 'swimming');
  assert.equal(flo.targetY, 650);
  simulate(flo, 5);
  assert.equal(flo.y, 650);
  assert.equal(flo.state, 'resting');
  assert.equal(flo.direction, 1);
});

test('a late reversal keeps the original departure clock and launches toward the latest target', () => {
  const flo = companion();
  flo.point(100);
  const remaining = constants.FIXED_DT * 3;
  simulate(flo, constants.HESITATION_SECONDS - remaining);
  const progress = flo.anticipation;
  const stateTime = flo.stateTime;
  flo.point(650);
  assert.equal(flo.stateTime, stateTime);
  assert.equal(flo.anticipation, progress);
  assert.equal(flo.direction, 1);
  simulate(flo, remaining - constants.FIXED_DT);
  assert.equal(flo.state, 'anticipating');
  assert.equal(flo.y, 400);
  simulate(flo, constants.FIXED_DT * 2);
  assert.equal(flo.state, 'swimming');
  assert.ok(flo.y > 400);
  assert.equal(flo.targetY, 650);
});

test('holding the simulation clock preserves anticipation until the caller resumes', () => {
  const flo = companion();
  flo.point(100);
  simulate(flo, constants.HESITATION_SECONDS / 2);
  const stateTime = flo.stateTime;
  const progress = flo.anticipation;
  // A paused renderer may still repaint or accept a new target, but neither
  // input nor a zero-duration frame consumes the remaining thought beat.
  flo.point(650);
  for (let frame = 0; frame < 120; frame++) flo.step(0);
  assert.equal(flo.state, 'anticipating');
  assert.equal(flo.stateTime, stateTime);
  assert.equal(flo.anticipation, progress);
  assert.equal(flo.y, 400);
  assert.equal(flo.velocity, 0);
  assert.equal(flo.energy, 0);
  simulate(flo, constants.HESITATION_SECONDS - stateTime + constants.FIXED_DT);
  assert.equal(flo.state, 'swimming');
  assert.ok(flo.y > 400);
});

test('a pointer returning nearby during hesitation cancels the departure', () => {
  const flo = companion();
  flo.point(100);
  simulate(flo, constants.HESITATION_SECONDS / 2);
  flo.point(420);
  assert.equal(flo.anticipation, 0);
  simulate(flo, constants.LOOK_SECONDS + constants.FIXED_DT);
  assert.equal(flo.y, 400);
  assert.equal(flo.targetY, 400);
  assert.equal(flo.state, 'resting');
});

test('scroll creates a gentle transient nudge and returns to the same perch', () => {
  const flo = companion();
  flo.scroll(800);
  assert.equal(flo.state, 'settling');
  assert.ok(flo.velocity > 0 && flo.velocity <= 60);
  simulate(flo, 0.1);
  assert.ok(flo.y > 400 && flo.y < 410);
  assert.equal(flo.targetY, 400);
  simulate(flo, 4);
  assert.equal(flo.state, 'resting');
  assert.equal(flo.y, 400);
});

test('bounds keep Flo and targets inside the screen after resize and repeated input', () => {
  const flo = companion();
  flo.point(-2000);
  simulate(flo, 1);
  assert.equal(flo.targetY, 70);
  flo.setBounds(200, 350);
  assert.ok(flo.y >= 200 && flo.y <= 350);
  assert.equal(flo.targetY, 200);
  flo.scroll(-2000);
  simulate(flo, 5);
  assert.equal(flo.y, 200);
  flo.point(2000);
  simulate(flo, 5);
  assert.equal(flo.y, 350);
  flo.setBounds(250, 100);
  assert.equal(flo.y, 250);
  assert.equal(flo.state, 'resting');
});

test('frame-rate changes preserve the trajectory and a long frame is capped', () => {
  const samples = [30, 60, 120, 144].map(hz => {
    const flo = companion();
    flo.point(70);
    simulate(flo, 1, 1 / hz);
    return flo;
  });
  for (const flo of samples) {
    assert.ok(Math.abs(flo.y - samples[0].y) < 1.5);
    assert.ok(Math.abs(flo.velocity - samples[0].velocity) < 3);
  }
  const long = companion();
  const bounded = companion();
  long.point(70);
  bounded.point(70);
  long.step(10000);
  bounded.step(constants.MAX_FRAME_DT);
  assert.equal(long.y, bounded.y);
  assert.equal(long.stateTime, bounded.stateTime);
});

test('the full anticipation hold is respected at each display rate before launch', () => {
  for (const hz of [30, 60, 120, 144]) {
    const flo = companion();
    flo.point(70);
    simulate(flo, constants.HESITATION_SECONDS, 1 / hz);
    assert.equal(flo.state, 'swimming');
    assert.equal(flo.y, 400, `${hz}Hz must not borrow anticipation time for movement`);
    assert.equal(flo.velocity, 0);
    flo.step(constants.FIXED_DT);
    assert.ok(flo.y < 400);
    assert.ok(flo.velocity < 0);
  }
});

test('reset and invalid input leave a finite, stationary, bounded companion', () => {
  const flo = companion();
  flo.point(70);
  simulate(flo, 1);
  flo.reset(5000);
  assert.equal(flo.state, 'resting');
  assert.equal(flo.y, 700);
  assert.equal(flo.velocity, 0);
  assert.equal(flo.energy, 0);
  for (const invalid of [NaN, Infinity, -Infinity, undefined, null, '200']) {
    flo.point(invalid);
    flo.scroll(invalid);
    flo.step(invalid);
  }
  flo.step(-100);
  assert.equal(flo.y, 700);
  assert.equal(flo.targetY, 700);
  assert.equal(flo.stateTime, 0);
});
