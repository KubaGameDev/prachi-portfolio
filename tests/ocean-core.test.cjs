'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BalanceGame, getBalancePose, TouchIntent, WheelIntent, constants } = require('../assets/js/ocean-core.js');

function simulate(game, duration, input = 0, dt = 1 / 120) {
  const frames = Math.round(duration / dt);
  for (let i = 0; i < frames; i++) {
    game.step(dt, typeof input === 'function' ? input(game) : input);
  }
}

test('idle is safe and a run begins only when explicitly started', () => {
  const game = new BalanceGame();
  simulate(game, 10, 1);
  assert.equal(game.state, 'ready');
  assert.equal(game.elapsed, 0);
  assert.equal(game.lean, 0);
  game.start();
  game.step(1 / 60, 1);
  assert.equal(game.state, 'balancing');
  assert.ok(game.elapsed > 0);
  assert.ok(game.lean > 0);
});

test('the first two seconds provide grace even with a held extreme correction', () => {
  const game = new BalanceGame();
  game.start();
  simulate(game, 1.99, 1);
  assert.equal(game.state, 'balancing');
  assert.ok(game.elapsed < constants.GRACE_SECONDS);
  assert.ok(Math.abs(game.lean) <= 0.75);
  assert.equal(game.overleanTime, 0);
});

test('sustained excessive lean falls, freezes the score and automatically resurfaces', () => {
  const game = new BalanceGame();
  game.start();
  for (let i = 0; i < 1200 && game.state === 'balancing'; i++) game.step(1 / 120, 1);
  assert.equal(game.state, 'falling');
  assert.ok(game.elapsed > 2);
  assert.ok(game.overleanTime >= constants.FALL_HOLD_SECONDS - 0.000001);
  const score = game.elapsed;
  assert.equal(game.best, score);
  simulate(game, 0.65);
  assert.equal(game.state, 'resurfacing');
  assert.equal(game.elapsed, score);
  simulate(game, 1);
  assert.equal(game.state, 'balancing');
  assert.equal(game.elapsed, 0);
  assert.equal(game.lean, 0);
  assert.equal(game.best, score);
  simulate(game, 1.9, -1);
  assert.equal(game.state, 'balancing');
});

test('a brief overshoot can be recovered without triggering a fall', () => {
  const game = new BalanceGame();
  game.start();
  game.elapsed = 3;
  game.lean = 1.01;
  game.step(0.08, -1);
  assert.equal(game.state, 'balancing');
  assert.ok(game.overleanTime > 0);
  game.lean = 0.85;
  game.step(1 / 120, -1);
  assert.equal(game.overleanTime, 0);
  assert.equal(game.state, 'balancing');
});

test('finalising during a run or fall saves the best and returns to a safe idle', () => {
  const game = new BalanceGame();
  game.start();
  simulate(game, 1);
  const score = game.elapsed;
  game.finalise();
  assert.equal(game.state, 'ready');
  assert.equal(game.elapsed, 0);
  assert.equal(game.best, score);
  game.start();
  simulate(game, 0.5);
  game.finalise();
  assert.equal(game.best, score);
  game.state = 'falling';
  game.elapsed = 5;
  game.finalise();
  assert.equal(game.state, 'ready');
  assert.equal(game.best, 5);
});

test('fixed simulation behaves consistently at common rendering frequencies', () => {
  const game60 = new BalanceGame();
  const game120 = new BalanceGame();
  game60.start();
  game120.start();
  simulate(game60, 3, -0.05, 1 / 60);
  simulate(game120, 3, -0.05, 1 / 120);
  assert.ok(Math.abs(game60.lean - game120.lean) < 0.000001);
  assert.ok(Math.abs(game60.elapsed - game120.elapsed) < 0.000001);
});

test('physics stays finite when input or elapsed time is invalid', () => {
  const game = new BalanceGame();
  game.start();
  game.step(NaN, Infinity);
  game.step(-1, -Infinity);
  assert.equal(game.elapsed, 0);
  game.step(10000, 10000);
  assert.ok(game.elapsed <= constants.MAX_FRAME_DT + 0.000001);
  assert.ok(Number.isFinite(game.lean));
  assert.ok(Number.isFinite(game.velocity));
});

test('touch previews after 24px; 80px stays in the game and 100px commits once', () => {
  const touch = new TouchIntent();
  touch.begin(100, 300);
  assert.equal(touch.move(100, 280).preview, 0);
  assert.ok(touch.move(100, 275).preview > 0);
  const short = touch.move(100, 220);
  assert.equal(short.commit, false);
  assert.ok(short.preview > 0 && short.preview < 1);
  assert.equal(touch.move(100, 200).commit, true);
  assert.equal(touch.move(100, 150).commit, false);
  assert.equal(touch.committed, true);
});

test('touch requires upward dominance and horizontal movement balances without diving', () => {
  const touch = new TouchIntent();
  touch.begin(200, 300);
  assert.deepEqual(touch.move(300, 300), { input: 1, preview: 0, commit: false });
  assert.equal(touch.move(300, 200).commit, false);
  assert.equal(touch.move(300, 150).commit, true);
  touch.begin(200, 300);
  assert.deepEqual(touch.move(0, 400), { input: -1, preview: 0, commit: false });
});

test('touch cancellation clears a preview or committed gesture before another begins', () => {
  const touch = new TouchIntent();
  touch.begin(0, 200);
  touch.move(0, 120);
  touch.cancel();
  assert.deepEqual(touch.move(0, 0), { input: 0, preview: 0, commit: false });
  touch.begin(0, 200);
  assert.equal(touch.move(0, 100).commit, true);
  touch.end();
  assert.equal(touch.active, false);
  assert.equal(touch.committed, false);
  touch.begin(0, 200);
  assert.equal(touch.move(0, 100).commit, true);
});

test('wheel accumulates a deliberate burst and commits only once', () => {
  const wheel = new WheelIntent();
  assert.equal(wheel.feed({ deltaY: 30 }, 0, 800).commit, false);
  assert.equal(wheel.feed({ deltaY: 49 }, 50, 800).commit, false);
  assert.equal(wheel.feed({ deltaY: 1 }, 100, 800).commit, true);
  assert.equal(wheel.feed({ deltaY: 80 }, 150, 800).commit, false);
});

test('wheel accumulation resets on inactivity or reversal', () => {
  const wheel = new WheelIntent();
  wheel.feed({ deltaY: 60 }, 0, 800);
  assert.equal(wheel.feed({ deltaY: 30 }, 200, 800).commit, false);
  assert.equal(wheel.distance, 30);
  assert.equal(wheel.feed({ deltaY: -1 }, 250, 800).qualifies, false);
  assert.equal(wheel.feed({ deltaY: 70 }, 300, 800).commit, false);
  assert.equal(wheel.feed({ deltaY: 10 }, 350, 800).commit, true);
  assert.equal(wheel.feed({ deltaY: 80 }, 550, 800).commit, true);
});

test('wheel normalizes line/page units and rejects horizontal gestures', () => {
  const wheel = new WheelIntent();
  assert.equal(wheel.feed({ deltaX: 80, deltaY: 20 }, 0, 800).qualifies, false);
  assert.equal(wheel.feed({ deltaY: 4, deltaMode: 1 }, 10, 800).commit, false);
  assert.equal(wheel.feed({ deltaY: 1, deltaMode: 1 }, 20, 800).commit, true);
  wheel.reset();
  assert.equal(wheel.feed({ deltaY: 0.1, deltaMode: 2 }, 0, 800).commit, true);
  wheel.reset();
  assert.equal(wheel.feed({ deltaX: 50, deltaY: 60 }, 0, 800).qualifies, true);
});

test('balance poses remain neutral near the center even during strong correction', () => {
  assert.deepEqual(getBalancePose(0, 0, 0), { pose: 'balance', direction: 1, weight: 0 });
  assert.deepEqual(getBalancePose(0.12, -1, -1), { pose: 'balance', direction: 1, weight: 0 });
  assert.deepEqual(getBalancePose(-0.12, 1, 1), { pose: 'balance', direction: -1, weight: 0 });
});

test('losing balance selects a mirrorable lean pose on either side', () => {
  const right = getBalancePose(0.41, 0.2, 0);
  const left = getBalancePose(-0.41, -0.2, 0);
  assert.equal(right.pose, 'lean');
  assert.equal(right.direction, 1);
  assert.ok(Math.abs(right.weight - 0.5) < 0.000001);
  assert.equal(left.pose, 'lean');
  assert.equal(left.direction, -1);
  assert.equal(left.weight, right.weight);
  assert.equal(getBalancePose(0.7, 0, 0).weight, 1);
  assert.equal(getBalancePose(-1.8, 0, 0).weight, 1);
});

test('opposing input catches balance while input into the fall keeps the lean pose', () => {
  assert.equal(getBalancePose(0.5, 0.3, -0.2).pose, 'catch');
  assert.equal(getBalancePose(-0.5, -0.3, 0.2).pose, 'catch');
  assert.equal(getBalancePose(0.5, 0.3, 0.2).pose, 'lean');
  assert.equal(getBalancePose(-0.5, -0.3, -0.2).pose, 'lean');
  assert.equal(getBalancePose(0.5, 0, -0.08).pose, 'lean',
    'the correction must exceed the catching threshold');
});

test('recovering angular velocity selects catch even without opposing player input', () => {
  assert.equal(getBalancePose(0.5, -0.2, 0).pose, 'catch');
  assert.equal(getBalancePose(-0.5, 0.2, 0).pose, 'catch');
  assert.equal(getBalancePose(0.5, -0.2, 0.4).pose, 'catch',
    'physical recovery still shows the catching pose if the player changes direction');
  assert.equal(getBalancePose(0.5, -0.12, 0).pose, 'lean',
    'the recovery speed must exceed the catching threshold');
});

test('invalid pose input falls back to a safe centered pose', () => {
  assert.deepEqual(getBalancePose(NaN, Infinity, undefined),
    { pose: 'balance', direction: 1, weight: 0 });
});
