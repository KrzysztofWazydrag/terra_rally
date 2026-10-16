'use strict';

const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8');
const failures = [];

if (source.includes('aiSkill')) failures.push('AI-only speed/grip skill bonuses remain in the controller');
if (!source.includes('targetSpeed*1.5,maxSurfaceSpeed')) failures.push('AI pace target is missing the requested 1.5x controller target');
if (!source.includes(')*1.25,-1,1')) failures.push('AI steering command is missing the requested 1.25x controller response');
if (!source.includes('c.surface===SURFACES.grass||c.surface===SURFACES.mud?1:(c.surface?.speed??1)')) failures.push('AI target cap does not match the shared physics surface speed rule');
if (!source.includes('TerraPhysics.step(c,input,{maxSpeed,acceleration:c.profile.acceleration')) failures.push('AI does not use the shared production physics core');
if (!source.includes('candidates=[-120,-78,-36,0,36,78,120]')) failures.push('AI lane selection no longer evaluates multiple race lines');
if (!source.includes('mistakeGap<10') || !source.includes('c.aiMistakeTimer=.24')) failures.push('Seeded, short AI mistake behavior is missing');
if (!source.includes('hazards.push({gap,lateral:0,radius:62,type:\'oil\'})') || !source.includes('pickupGap<Infinity')) failures.push('AI hazard or pickup line planning is missing');

if (failures.length) {
  console.error(failures.map(failure => `FAIL ${failure}`).join('\n'));
  process.exit(1);
}

console.log('AI controller targets: speed 1.5x (capped by shared physical limit), steering 1.25x (clamped to normal input range)');
console.log('shared physics, multiple lanes, seeded mistakes, hazard avoidance, and pickup competition: PASS');
