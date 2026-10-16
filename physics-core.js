(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TerraPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (n, m) => ((n % m) + m) % m;
  const angleDelta = (a, b) => mod(b - a + Math.PI, Math.PI * 2) - Math.PI;

  function step(state, input, cfg, dt) {
    state.angularVelocity ||= 0;
    const speedBefore = Math.hypot(state.vx, state.vy);
    let fx = Math.sin(state.angle), fy = -Math.cos(state.angle);
    let rx = Math.cos(state.angle), ry = Math.sin(state.angle);
    let forward = state.vx * fx + state.vy * fy;
    let lateral = state.vx * rx + state.vy * ry;
    const speedRatio = clamp(speedBefore / Math.max(1, cfg.maxSpeed), 0, 1.25);
    const direction = forward >= -2 ? 1 : -.62;

    // Steering creates yaw, but never rotates the velocity vector directly.
    // Response peaks at medium speed and fades near maximum speed.
    const lowSpeedAuthority = clamp(speedBefore / 54, .32, 1);
    const highSpeedFade = 1 - clamp((speedRatio - .42) * 1.65, 0, .78);
    const brakeRotation = 1 + clamp(input.brake || 0, 0, 1) * speedRatio * .18;
    const targetYaw = input.steer * cfg.steering * lowSpeedAuthority * highSpeedFade * brakeRotation * direction * (cfg.airborne ? .035 : 1);
    const yawResponse = cfg.airborne ? .7 : (input.throttle ? 8.5 : 7.5);
    state.angularVelocity += (targetYaw - state.angularVelocity) * clamp(yawResponse * dt, 0, 1);
    state.angularVelocity *= Math.pow(cfg.airborne ? .998 : .975, dt * 60);
    state.angle += state.angularVelocity * dt;

    fx = Math.sin(state.angle); fy = -Math.cos(state.angle);
    rx = Math.cos(state.angle); ry = Math.sin(state.angle);
    forward = state.vx * fx + state.vy * fy;
    lateral = state.vx * rx + state.vy * ry;

    const accelerationCurve = .9 - .45 * Math.pow(clamp(speedRatio, 0, 1), 1.5);
    const drive = cfg.acceleration * cfg.accelScale * accelerationCurve * (cfg.boost ? 1.28 : 1);
    if (input.throttle) { state.vx += fx * drive * dt; state.vy += fy * drive * dt; }
    if (input.brake) {
      const brakeDelta = Math.min(Math.abs(forward), cfg.braking * input.brake * dt);
      state.vx -= fx * Math.sign(forward || 1) * brakeDelta;
      state.vy -= fy * Math.sign(forward || 1) * brakeDelta;
    }

    // Tyres remove lateral velocity gradually. At high speed the available
    // correction falls, preserving outward momentum and a recoverable slide.
    const throttleStability = input.throttle ? .86 : 2.2;
    const turnLoad = Math.abs(input.steer) * clamp((speedRatio - .28) * (.18 + (input.brake || 0) * .05), 0, .14);
    const gripLimit = (.97 - clamp(speedRatio, 0, 1) * .5) * (1 - turnLoad) * throttleStability * (cfg.oilFactor ?? 1);
    const gripRate = cfg.grip * gripLimit * (cfg.airborne ? 0 : 1);
    const lateralCorrection = lateral * clamp(gripRate * dt, 0, .42);
    state.vx -= rx * lateralCorrection;
    state.vy -= ry * lateralCorrection;

    const coastBlend = input.throttle ? .08 : .36;
    const rolling = Math.pow(1 - (1 - cfg.drag) * coastBlend, dt * 60);
    state.vx *= rolling; state.vy *= rolling;
    const speedAfterRolling = Math.hypot(state.vx, state.vy);
    const surfaceResistance = Math.max(0, cfg.surfaceResistance || 0) * speedRatio * speedRatio;
    if (surfaceResistance > 0 && speedAfterRolling > 0) {
      const resistanceStep = Math.min(speedAfterRolling, surfaceResistance * dt);
      const resistanceScale = (speedAfterRolling - resistanceStep) / speedAfterRolling;
      state.vx *= resistanceScale;
      state.vy *= resistanceScale;
    }
    const velocityAngle = Math.atan2(state.vx, -state.vy);
    state.slipAngle = Math.hypot(state.vx,state.vy) > 10 ? angleDelta(state.angle, velocityAngle) : 0;
    const scrub = clamp(Math.abs(state.slipAngle) * .62, 0, .3) * (cfg.airborne ? 0 : 1);
    state.vx *= 1 - scrub * dt; state.vy *= 1 - scrub * dt;

    const magnitude = Math.hypot(state.vx, state.vy);
    if (magnitude > cfg.maxSpeed) { const s=cfg.maxSpeed/magnitude; state.vx*=s; state.vy*=s; }
    state.x += state.vx * dt; state.y += state.vy * dt;
    forward = state.vx * fx + state.vy * fy;
    lateral = state.vx * rx + state.vy * ry;
    state.speed = forward;
    state.steerLoad = Math.abs(input.steer) * clamp(magnitude / 180, 0, 1.2);
    state.squeal = clamp((Math.abs(state.slipAngle)-.035)*3.8 + state.steerLoad*.22,0,1) * clamp((magnitude-55)/130,0,1);
    return { forward, lateral, speedRatio, slipAngle:state.slipAngle };
  }

  function hitCone(state, cone, damageScale=1) {
    const dx=cone.x-state.x,dy=cone.y-state.y,d=Math.hypot(dx,dy),speed=Math.hypot(state.vx,state.vy);
    if(cone.down>0||d>=28||speed<=38)return false;
    cone.down=6;cone.vx=state.vx*.56+dx*2.3;cone.vy=state.vy*.56+dy*2.3;cone.spin=((state.number||1)%2?1:-1)*(8+speed*.035);
    state.vx*=.94;state.vy*=.94;state.angularVelocity+=((state.number||1)%2?-1:1)*.12;state.damage=clamp((state.damage||0)+1.1*damageScale,0,100);
    return true;
  }

  function updateWheelState(state, input, forward, slipAngle, dt) {
    state.frontWheelSpeed ??= 0;
    state.rearWheelSpeed ??= 0;
    state.frontWheelPhase ??= 0;
    state.rearWheelPhase ??= 0;
    state.frontSteer ??= 0;

    const stopped = Math.abs(forward) < 1.5 && !input.throttle && !input.brake;
    const brakeLock = clamp(input.brake || 0, 0, 1) * clamp(Math.abs(forward) / 80, 0, 1) * .84;
    const rollingTarget = stopped ? 0 : forward * (1 - brakeLock);
    const travelSign = Math.sign(forward || state.rearWheelSpeed || 1);
    const drivenSlip = travelSign * Math.abs(slipAngle) * 58 * clamp(input.throttle || 0, 0, 1);
    const rearTarget = stopped ? 0 : rollingTarget + drivenSlip;

    state.frontWheelSpeed += (rollingTarget - state.frontWheelSpeed) * clamp(dt * 18, 0, 1);
    state.rearWheelSpeed += (rearTarget - state.rearWheelSpeed) * clamp(dt * 13, 0, 1);
    if (stopped) state.frontWheelSpeed = state.rearWheelSpeed = 0;
    state.frontWheelPhase = mod(state.frontWheelPhase + state.frontWheelSpeed * dt * .012, 1);
    state.rearWheelPhase = mod(state.rearWheelPhase + state.rearWheelSpeed * dt * .012, 1);
    state.frontSteer += ((input.steer || 0) - state.frontSteer) * clamp(dt * 16, 0, 1);
    return state;
  }

  return { step, hitCone, updateWheelState, angleDelta, clamp };
});
