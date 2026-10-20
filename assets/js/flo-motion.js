(function (root, factory) {
  'use strict';
  var motion = factory();
  if (typeof module === 'object' && module.exports) module.exports = motion;
  if (root) root.FloMotion = motion;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var constants = Object.freeze({
    FIXED_DT: 1 / 120,
    MAX_FRAME_DT: 0.1,
    HESITATION_SECONDS: 0.28,
    LOOK_SECONDS: 0.48,
    SETTLE_SECONDS: 0.28,
    FOLLOW_DISTANCE: 48,
    LOOK_DISTANCE: 4,
    SPRING: 25,
    DAMPING: 10,
    MAX_ACCELERATION: 1400,
    MAX_SPEED: 420,
    REST_DISTANCE: 0.5,
    REST_SPEED: 2
  });

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function finite(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  /**
   * A viewport-space companion: positions are pixels and durations are seconds.
   * The caller owns the side lane, artwork, reduced motion and pausing (by not
   * calling step). Small pointer changes only produce a look; larger changes
   * start one anticipation beat, followed by a continuously retargetable swim.
   *
   * States: resting, looking, anticipating, swimming, settling.
   * direction: -1 is up, +1 is down. energy is a smoothed 0..1 swim intensity.
   */
  function Companion(options) {
    options = options || {};
    this.minY = finite(options.minY, 0);
    this.maxY = Math.max(this.minY, finite(options.maxY, 800));
    this.reset(finite(options.y, (this.minY + this.maxY) / 2));
  }

  Companion.prototype.reset = function (y) {
    this.y = clamp(finite(y, (this.minY + this.maxY) / 2), this.minY, this.maxY);
    this.targetY = this.y;
    this.pointerY = this.y;
    this.velocity = 0;
    this.direction = -1;
    this.energy = 0;
    this.state = 'resting';
    this.stateTime = 0;
    this._anchorY = this.y;
  };

  Companion.prototype.setBounds = function (minimum, maximum) {
    this.minY = finite(minimum, this.minY);
    this.maxY = Math.max(this.minY, finite(maximum, this.maxY));
    this.y = clamp(this.y, this.minY, this.maxY);
    this.targetY = clamp(this.targetY, this.minY, this.maxY);
    this.pointerY = clamp(this.pointerY, this.minY, this.maxY);
    this._anchorY = clamp(this._anchorY, this.minY, this.maxY);
    this._contain();
    if (this.minY === this.maxY) this.reset(this.minY);
  };

  Companion.prototype._changeState = function (state) {
    if (this.state === state) return;
    this.state = state;
    this.stateTime = 0;
  };

  Companion.prototype.point = function (y) {
    if (!Number.isFinite(y)) return;
    var nextY = clamp(y, this.minY, this.maxY);
    var pointerDelta = nextY - this.pointerY;
    this.pointerY = nextY;
    var distance = nextY - this.y;

    if (this.state === 'swimming' || this.state === 'settling') {
      // Retarget immediately in motion; a busy pointer must never keep Flo
      // waiting indefinitely or insert a fresh hesitation mid-stroke.
      this.targetY = nextY;
      if (Math.abs(distance) > constants.FOLLOW_DISTANCE) this._changeState('swimming');
      return;
    }

    if (this.state === 'anticipating') {
      if (Math.abs(distance) <= constants.FOLLOW_DISTANCE) {
        this.targetY = this._anchorY;
        this._changeState('looking');
      } else {
        this.targetY = nextY;
        this.direction = distance < 0 ? -1 : 1;
      }
      return;
    }

    if (Math.abs(distance) > constants.FOLLOW_DISTANCE) {
      this._anchorY = this.targetY;
      this.targetY = nextY;
      this.direction = distance < 0 ? -1 : 1;
      this._changeState('anticipating');
    } else if (Math.abs(pointerDelta) >= constants.LOOK_DISTANCE) {
      if (Math.abs(distance) >= constants.LOOK_DISTANCE) this.direction = distance < 0 ? -1 : 1;
      this._changeState('looking');
      this.stateTime = 0;
    }
  };

  Companion.prototype.scroll = function (delta) {
    if (!Number.isFinite(delta) || delta === 0) return;
    // A passing current briefly nudges Flo without moving her chosen perch.
    var impulse = clamp(delta * 0.12, -28, 28);
    var limit = this.state === 'swimming' ? constants.MAX_SPEED : 60;
    this.velocity = clamp(this.velocity + impulse, -limit, limit);
    this._contain();
    if (this.state === 'resting' || this.state === 'looking') this._changeState('settling');
  };

  Companion.prototype._contain = function () {
    this.y = clamp(this.y, this.minY, this.maxY);
    if ((this.y <= this.minY && this.velocity < 0) ||
        (this.y >= this.maxY && this.velocity > 0)) this.velocity = 0;
  };

  Companion.prototype.step = function (dt) {
    var remaining = clamp(finite(dt, 0), 0, constants.MAX_FRAME_DT);
    // Bounded substeps keep acceleration and damping consistent at common
    // display rates, and prevent a resumed/hidden tab from making Flo jump.
    while (remaining > 0.0000001) {
      var step = Math.min(remaining, constants.FIXED_DT);
      this._advance(step);
      remaining -= step;
    }
  };

  Companion.prototype._advance = function (dt) {
    this.stateTime += dt;
    if (this.state === 'anticipating' &&
        this.stateTime + 0.0000001 >= constants.HESITATION_SECONDS) {
      this._changeState('swimming');
    } else if (this.state === 'looking' &&
        this.stateTime + 0.0000001 >= constants.LOOK_SECONDS) {
      this._changeState('resting');
    }

    var moving = this.state === 'swimming' || this.state === 'settling';
    var destination = this.state === 'anticipating' ? this._anchorY : this.targetY;
    if (moving || Math.abs(this.velocity) > 0 || Math.abs(destination - this.y) > 0.001) {
      var acceleration = clamp((destination - this.y) * constants.SPRING -
        this.velocity * constants.DAMPING, -constants.MAX_ACCELERATION, constants.MAX_ACCELERATION);
      this.velocity = clamp(this.velocity + acceleration * dt, -constants.MAX_SPEED, constants.MAX_SPEED);
      this.y += this.velocity * dt;
      this._contain();
    }

    var distance = Math.abs(this.targetY - this.y);
    var speed = Math.abs(this.velocity);
    if (this.state === 'swimming' && distance < 24 && speed < 80) this._changeState('settling');
    if (this.state === 'settling' && this.stateTime >= constants.SETTLE_SECONDS &&
        distance <= constants.REST_DISTANCE && speed <= constants.REST_SPEED) {
      this.y = this.targetY;
      this.velocity = 0;
      this._changeState('resting');
    }

    if (moving && speed > 8) this.direction = this.velocity < 0 ? -1 : 1;
    var targetEnergy = moving ? clamp(speed / 250, 0, 1) : 0;
    this.energy += (targetEnergy - this.energy) * (1 - Math.exp(-dt * 7));
    if (this.energy < 0.0001) this.energy = 0;
  };

  return { Companion: Companion, constants: constants };
}));
