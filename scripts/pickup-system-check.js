'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const pickups = require('../pickup-core.js');
const game = fs.readFileSync(require('node:path').join(__dirname, '../game.js'), 'utf8');

function car(number, x, lap = 0, extras = {}) {
  return { number, x, y: 0, lap, z: 0, finishTime: null, ...extras };
}

function runWinnerCase(label, cars, expected) {
  const pickup = { active: true, respawnLap: 0, collectedBy: null };
  const point = { x: 0, y: 0 };
  const winner = pickups.selectCollector(cars, point);
  assert.equal(winner?.number, expected, `${label}: closest eligible racer should win`);
  assert.equal(pickups.claim(pickup, winner), true, `${label}: first claim should succeed`);
  assert.equal(pickups.claim(pickup, cars.find(c => c.number !== expected)), false,
    `${label}: one pickup must not be awarded twice`);
  assert.equal(pickup.active, false);
  assert.equal(pickup.collectedBy, expected);
  return pickup;
}

const playerFirst = runWinnerCase('player first', [car(1, 12), car(2, 28)], 1);
const aiFirst = runWinnerCase('AI first', [car(1, 31), car(2, 8)], 2);
const tie = pickups.selectCollector([car(4, 10), car(2, -10)], { x: 0, y: 0 });
assert.equal(tie.number, 2, 'equal-distance claims use stable racer-number tie-break');
assert.equal(pickups.selectCollector([car(1, 0, 0, { z: 23 })], { x: 0, y: 0 }), null,
  'a racer too high above the ground cannot collect');
assert.equal(pickups.selectCollector([car(1, 0, 0, { finishTime: 12 })], { x: 0, y: 0 }), null,
  'a finished racer cannot collect');
assert.equal(pickups.respawnOnLap(playerFirst, car(1, 0, 0)), false, 'pickup stays absent during the collector lap');
assert.equal(pickups.respawnOnLap(playerFirst, car(2, 0, 1)), false, 'a different racer cannot trigger another racer’s respawn');
assert.equal(pickups.respawnOnLap(playerFirst, car(1, 0, 1)), true, 'pickup returns when its collector completes the next lap');
assert.equal(pickups.respawnOnLap(playerFirst, car(1, 0, 1)), false, 'respawn happens once');
assert.equal(playerFirst.collectedBy, null, 'respawn clears prior ownership');
assert.equal(aiFirst.respawnLap, 1, 'AI claim schedules the same shared respawn rule');

for (const token of [
  'TerraPickups.selectCollector(this.cars,point,42)',
  'TerraPickups.claim(p,collector)',
  'TerraPickups.respawnOnLap(p,c)',
  'if(!pickup.active)continue',
  'this.awardPickup(p,collector,point)',
  "this.toast(`RIVAL ${c.number} GOT ${p.type.toUpperCase()}`)",
  'ctx.translate(q.x,q.y);ctx.fillStyle=\'#07131399\'',
  'const q=this.track.at(p.index),bob=Math.sin(this.time*3+p.phase)*5'
]) assert.ok(game.includes(token), `production integration missing: ${token}`);

console.log('player-first: player 1 claimed; AI-first: AI 2 claimed');
console.log('single-winner, deterministic tie-break, airborne/finished filtering, one-lap respawn: PASS');
console.log('production integration: shared pool, AI pickup targeting, reward routing, rival feedback, stationary shadow and bobbing prism: PASS');
