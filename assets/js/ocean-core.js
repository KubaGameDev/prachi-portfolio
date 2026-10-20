(function (root, factory) {
  'use strict';
  var core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  if (root) root.OceanCore = core;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var constants = Object.freeze({
    FIXED_DT: 1 / 120,
    MAX_FRAME_DT: 0.1,
    GRACE_SECONDS: 2,
    DIFFICULTY_SECONDS: 45,
    FALL_LEAN: 1,
    FALL_HOLD_SECONDS: 0.18,
    FALL_SECONDS: 0.65,
    RESURFACE_SECONDS: 1,
    TOUCH_DISTANCE: 100,
    TOUCH_PREVIEW_DISTANCE: 24,
    TOUCH_VERTICAL_RATIO: 1.5,
    WHEEL_DISTANCE: 80,
    WHEEL_GAP_MS: 200,
    WHEEL_VERTICAL_RATIO: 1.2,
    WHEEL_LINE_PX: 16,
    TILT_DEADZONE_DEGREES: 2,
    TILT_RANGE_DEGREES: 18,
    TILT_SMOOTHING_MS: 100,
    TILT_STALE_MS: 500
  });

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function finite(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  /**
   * Select a mirrorable rear-view pose while the game is balancing. Direction
   * follows the lower body's lean; the catch artwork counterleans above the waist.
   * Falling and resurfacing are separate state animations owned by the renderer.
   */
  function getBalancePose(lean, velocity, input) {
    var tilt = finite(lean, 0);
    var speed = finite(velocity, 0);
    var correction = clamp(finite(input, 0), -1, 1);
    var direction = tilt < 0 ? -1 : 1;
    var weight = clamp((Math.abs(tilt) - 0.12) / (0.7 - 0.12), 0, 1);
    if (weight === 0) return { pose: 'balance', direction: direction, weight: 0 };
    var catching = tilt * correction < -0.04 || tilt * speed < -0.06;
    return { pose: catching ? 'catch' : 'lean', direction: direction, weight: weight };
  }

  /**
   * Advise a correction without changing the simulation. Input applies force,
   * so recovery speed matters: release near center, or brake a fast overshoot.
   * The renderer owns cue timing and whether the current game state shows it.
   */
  function getBalanceFeedback(lean, velocity, input) {
    var tilt = finite(lean, 0);
    var speed = finite(velocity, 0);
    var correction = clamp(finite(input, 0), -1, 1);
    var activeInput = Math.abs(correction) > 0.12;
    var predicted = tilt + speed * 0.4;
    var stable = Math.abs(tilt) < 0.16 && Math.abs(speed) < 0.18;
    var recovering = tilt * speed < -0.025;
    var heldCorrection = activeInput && tilt * correction < -0.02;

    if (stable) return activeInput ? 'Ease off' : 'Steady';
    if (recovering && heldCorrection && Math.abs(predicted) < 0.20) return 'Ease off';
    if (Math.abs(predicted) > 0.18) return predicted > 0 ? 'Counter left' : 'Counter right';
    return activeInput ? 'Ease off' : 'Steady';
  }

  /**
   * Screen-relative lateral tilt reconstructed from gravity, rather than raw
   * Euler gamma (which can change branches when a phone is nearly upright).
   * W3C Z-X'-Y'' orientation gives gravity's device components:
   * [-cos(beta)sin(gamma), sin(beta), cos(beta)cos(gamma)].
   * https://www.w3.org/TR/orientation-event/#device-orientation
   * Screen angles are counterclockwise from the device's natural orientation:
   * https://www.w3.org/TR/screen-orientation/#the-current-screen-orientation-type-and-angle
   */
  function TiltInput() {
    this.calibrate();
  }

  TiltInput.prototype.calibrate = function () {
    this.calibrated = false;
    this.neutral = null;
    this.screenAngle = null;
    this.lastSampleTime = null;
    this.input = 0;
  };

  TiltInput.prototype.read = function (nowMs) {
    if (!this.calibrated || !Number.isFinite(nowMs) ||
        nowMs < this.lastSampleTime ||
        nowMs - this.lastSampleTime > constants.TILT_STALE_MS) return 0;
    return this.input;
  };

  TiltInput.prototype.sample = function (beta, gamma, screenAngle, nowMs) {
    // Do not coerce unavailable sensor readings (notably null) into zero degrees,
    // and do not extend the freshness window with missing or out-of-order data.
    if (!Number.isFinite(beta) || !Number.isFinite(gamma) ||
        !Number.isFinite(screenAngle) || !Number.isFinite(nowMs) ||
        (this.lastSampleTime !== null && nowMs < this.lastSampleTime)) {
      return { valid: false, calibrated: this.calibrated, input: this.read(nowMs) };
    }
    var angle = ((screenAngle % 360) + 360) % 360;
    var radians = Math.PI / 180;
    var b = beta * radians;
    var g = gamma * radians;
    var a = angle * radians;
    // Positive means the screen's right edge tilts down: gamma+ in portrait,
    // beta+ at screen angle 90, beta- at 270, and gamma- at 180.
    var lateral = Math.cos(b) * Math.sin(g) * Math.cos(a) + Math.sin(b) * Math.sin(a);
    var roll = Math.asin(clamp(lateral, -1, 1)) / radians;

    if (!this.calibrated || angle !== this.screenAngle) {
      this.neutral = roll;
      this.screenAngle = angle;
      this.lastSampleTime = nowMs;
      this.input = 0;
      this.calibrated = true;
      return { valid: true, calibrated: true, input: 0 };
    }

    var deviation = roll - this.neutral;
    var magnitude = clamp((Math.abs(deviation) - constants.TILT_DEADZONE_DEGREES) /
      (constants.TILT_RANGE_DEGREES - constants.TILT_DEADZONE_DEGREES), 0, 1);
    var target = magnitude === 0 ? 0 : (deviation < 0 ? -magnitude : magnitude);
    var blend = 1 - Math.exp(-(nowMs - this.lastSampleTime) / constants.TILT_SMOOTHING_MS);
    this.input = clamp(this.input + (target - this.input) * blend, -1, 1);
    this.lastSampleTime = nowMs;
    return { valid: true, calibrated: true, input: this.input };
  };

  /**
   * Pure simulation. All durations are seconds; lean and input are normalized.
   * The caller owns rendering, storage and pausing (by not calling step).
   */
  function BalanceGame() {
    this.best = 0;
    this.reset();
  }

  BalanceGame.prototype.reset = function () {
    this.state = 'ready';
    this.elapsed = 0;
    this.lean = 0;
    this.velocity = 0;
    this.stateTime = 0;
    this.overleanTime = 0;
    this.best = Math.max(0, finite(this.best, 0));
  };

  BalanceGame.prototype.start = function () {
    if (this.state !== 'ready') return;
    this.state = 'balancing';
    this.stateTime = 0;
    this.elapsed = 0;
    this.overleanTime = 0;
  };

  BalanceGame.prototype.finalise = function () {
    this.best = Math.max(finite(this.best, 0), this.elapsed);
    this.reset();
  };

  BalanceGame.prototype.step = function (dt, input) {
    var remaining = clamp(finite(dt, 0), 0, constants.MAX_FRAME_DT);
    var correction = clamp(finite(input, 0), -1, 1);
    // Small bounded substeps keep physics consistent across display refresh rates.
    while (remaining > 0.0000001) {
      var step = Math.min(remaining, constants.FIXED_DT);
      this.advance(step, correction);
      remaining -= step;
    }
  };

  BalanceGame.prototype.advance = function (dt, input) {
    if (this.state === 'ready') return;
    this.stateTime += dt;

    if (this.state === 'falling') {
      if (this.stateTime + 0.0000001 >= constants.FALL_SECONDS) {
        this.state = 'resurfacing';
        this.stateTime = 0;
        this.velocity = 0;
      }
      return;
    }

    if (this.state === 'resurfacing') {
      this.lean *= Math.exp(-dt * 5);
      if (this.stateTime + 0.0000001 >= constants.RESURFACE_SECONDS) {
        this.reset();
        this.start();
      }
      return;
    }

    this.elapsed += dt;
    var difficulty = clamp(this.elapsed / constants.DIFFICULTY_SECONDS, 0, 1);
    var time = this.elapsed;
    var wave = (
      Math.sin(time * 1.18) * 0.57 +
      Math.sin(time * 2.07 + 0.8) * 0.27 +
      Math.sin(time * 0.47 + 1.6) * 0.23
    ) * (0.68 + difficulty * 0.65);
    var acceleration = this.lean * (1.05 + difficulty * 0.25) +
      input * 2.8 + wave - this.velocity * 1.65;

    this.velocity = clamp(this.velocity + acceleration * dt, -2.4, 2.4);
    this.lean = clamp(this.lean + this.velocity * dt, -1.8, 1.8);

    if (this.elapsed < constants.GRACE_SECONDS) {
      this.lean = clamp(this.lean, -0.75, 0.75);
      this.overleanTime = 0;
      return;
    }

    if (Math.abs(this.lean) >= constants.FALL_LEAN) {
      this.overleanTime += dt;
    } else {
      this.overleanTime = 0;
    }

    if (this.overleanTime + 0.0000001 >= constants.FALL_HOLD_SECONDS) {
      this.best = Math.max(finite(this.best, 0), this.elapsed);
      this.state = 'falling';
      this.stateTime = 0;
    }
  };

  function TouchIntent() {
    this.cancel();
  }

  TouchIntent.prototype.begin = function (x, y) {
    this.active = true;
    this.committed = false;
    this.startX = finite(x, 0);
    this.startY = finite(y, 0);
  };

  TouchIntent.prototype.move = function (x, y) {
    if (!this.active) return { input: 0, preview: 0, commit: false };
    var dx = finite(x, this.startX) - this.startX;
    var upward = this.startY - finite(y, this.startY);
    var isVertical = upward > 0 && upward >= Math.abs(dx) * constants.TOUCH_VERTICAL_RATIO;
    var preview = isVertical ?
      clamp((upward - constants.TOUCH_PREVIEW_DISTANCE) /
        (constants.TOUCH_DISTANCE - constants.TOUCH_PREVIEW_DISTANCE), 0, 1) : 0;
    var commit = !this.committed && isVertical && upward >= constants.TOUCH_DISTANCE;
    if (commit) this.committed = true;
    return {
      input: clamp(dx / constants.TOUCH_DISTANCE, -1, 1),
      preview: this.committed ? 1 : preview,
      commit: commit
    };
  };

  TouchIntent.prototype.cancel = function () {
    this.active = false;
    this.committed = false;
    this.startX = 0;
    this.startY = 0;
  };

  TouchIntent.prototype.end = TouchIntent.prototype.cancel;

  function WheelIntent() {
    this.reset();
  }

  WheelIntent.prototype.reset = function () {
    this.distance = 0;
    this.lastTime = null;
    this.committed = false;
  };

  WheelIntent.prototype.feed = function (event, now, viewportHeight) {
    event = event || {};
    var timestamp = finite(now, Date.now());
    if (this.lastTime !== null &&
        (timestamp - this.lastTime >= constants.WHEEL_GAP_MS || timestamp < this.lastTime)) {
      this.reset();
    }
    var multiplier = event.deltaMode === 1 ? constants.WHEEL_LINE_PX :
      event.deltaMode === 2 ? Math.max(1, finite(viewportHeight, 800)) : 1;
    var dx = finite(event.deltaX, 0) * multiplier;
    var dy = finite(event.deltaY, 0) * multiplier;
    var qualifies = dy > 0 && dy >= Math.abs(dx) * constants.WHEEL_VERTICAL_RATIO;

    if (dy < 0) this.reset();
    if (!qualifies) return { qualifies: false, commit: false, progress: 0 };

    this.lastTime = timestamp;
    this.distance += dy;
    var commit = !this.committed && this.distance >= constants.WHEEL_DISTANCE;
    if (commit) this.committed = true;
    return {
      qualifies: true,
      commit: commit,
      progress: clamp(this.distance / constants.WHEEL_DISTANCE, 0, 1)
    };
  };

  return {
    BalanceGame: BalanceGame,
    getBalancePose: getBalancePose,
    getBalanceFeedback: getBalanceFeedback,
    TiltInput: TiltInput,
    TouchIntent: TouchIntent,
    WheelIntent: WheelIntent,
    constants: constants
  };
}));
