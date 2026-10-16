'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const Physics = require('../physics-core.js');
const source = fs.readFileSync(require('node:path').join(__dirname, '../game.js'), 'utf8');
const begin = source.indexOf('const TRACK_DEFS = [') + 'const TRACK_DEFS = '.length;
const finish = source.indexOf('\n  ];', begin) + 4;
if (begin < 0 || finish < 4) throw new Error('Could not read production track definitions');
const tracks = vm.runInNewContext(`(${source.slice(begin, finish)})`);
const def = tracks[1];
const count = 960, roadWidth = Number(source.match(/const ROAD_WIDTH = (\d+);/)?.[1] || 0), carWidth = 62;
const failures = [];
const mod = (n, m) => ((n % m) + m) % m;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function catmull(p0, p1, p2, p3, t) {
  const t2=t*t,t3=t2*t;
  return {x:.5*(2*p1[0]+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),y:.5*(2*p1[1]+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)};
}
const route=[];
for(let i=0;i<count;i++){const n=i/count*def.points.length,s=Math.floor(n),t=n-s;route.push(catmull(def.points[mod(s-1,def.points.length)],def.points[s],def.points[(s+1)%def.points.length],def.points[(s+2)%def.points.length],t));}
const at=i=>route[mod(Math.round(i),count)];
const tangent=i=>{const a=at(i-2),b=at(i+2);return Math.atan2(b.x-a.x,-(b.y-a.y));};
let length=0;for(let i=0;i<count;i++){const a=at(i),b=at(i+1);length+=Math.hypot(b.x-a.x,b.y-a.y);}
if(def.name!=='CANYON CIRCUIT'||def.theme!=='canyon')failures.push('Track #2 is not the CANYON reference');
if(tracks[0].name!=='PINE RIDGE RUN'||tracks[2].name!=='BLACKWATER LOOP')failures.push('A deferred track definition changed');
if(Math.abs(roadWidth/carWidth-5.16)>.03)failures.push(`Race width ratio ${ (roadWidth/carWidth).toFixed(2) } buggy widths, expected about 5–6`);
for(const field of ['kerbs','barriers','walls','racingLine','modules','waterCrossings','shortcut','tunnel'])if(!def[field])failures.push(`Missing Canyon course kit: ${field}`);
const tunnelWalls=def.walls.filter(([from,to])=>from<=def.tunnel.from&&to>=def.tunnel.to),tunnelSides=new Set(tunnelWalls.map(([, ,side])=>side)),narrowClearance=Math.min(...tunnelWalls.map(([, , ,distance])=>distance||roadWidth*.62+56))*2-106;
if(!tunnelSides.has(-1)||!tunnelSides.has(1))failures.push('Tunnel passage is missing opposing Canyon walls');
if(narrowClearance<carWidth*4||narrowClearance>=roadWidth)failures.push(`Tunnel clear width ${narrowClearance.toFixed(0)} does not provide a deliberate but passable pinch`);
for(const fraction of [...def.jumps,...def.bumps,...def.oils,...def.cones.map(c=>c[0]),...def.pickupFractions])if(!(fraction>=0&&fraction<1))failures.push(`Invalid course feature fraction ${fraction}`);
let last=0;for(const z of def.zones){if(Math.abs(z.from-last)>.001)failures.push(`Surface map has a gap/overlap near ${last.toFixed(3)}`);last=z.to;}if(Math.abs(last-1)>.001)failures.push('Surface map does not cover the complete circuit');
if(!source.includes('drawCanyonKerbs')||!source.includes('drawCanyonBarriers')||!source.includes('drawCanyonWalls')||!source.includes('texturePattern')||!source.includes('drawCanyonGantry'))failures.push('Canyon circuit readability kit is not wired into the renderer');
if(!source.includes("'assets/canyon/surface-asphalt.png'")||!source.includes("'assets/canyon/surface-dirt.png'")||!source.includes("'assets/canyon/surface-gravel.png'"))failures.push('Generated Canyon surface textures are not loaded by the game');
if(!source.includes('for(const f of this.track.def.oils)')||!source.includes('laneTarget=(c.number%2?1:-1)*112')||!source.includes('oilFactor:c.oilTimer>0?.1:1'))failures.push('Canyon oil is not wired to production AI avoidance and the shared physics penalty');
if(!source.includes('this.track.def.cones.map')||!source.includes('updateCones(dt)'))failures.push('Canyon cones are not wired to the shared physical cone system');
for(const filename of ['surface-asphalt.png','surface-dirt.png','surface-gravel.png'])if(!fs.existsSync(require('node:path').join(__dirname,'../assets/canyon',filename)))failures.push(`Missing Canyon surface texture ${filename}`);

const config={maxSpeed:326,acceleration:120,braking:245,steering:3.15,grip:7.8,drag:.981};
const surface={tarmac:{speed:1.08,accel:1.04,grip:1.12,drag:.985},dirt:{speed:1,accel:1,grip:1,drag:.981},gravel:{speed:.92,accel:.92,grip:.82,drag:.972},mud:{speed:.64,accel:.48,grip:.54,drag:.981,resistance:175}};
function surfaceAt(index){const f=mod(index,count)/count;return def.zones.find(z=>f>=z.from&&f<z.to)?.type||'gravel';}
function simulateCompetentLap(){
  const dt=1/60,s={x:at(0).x,y:at(0).y,angle:tangent(0),vx:0,vy:0,speed:0,angularVelocity:0,slipAngle:0,routeIndex:0};let idx=0,lastIdx=0,offFrames=0,maxSlip=0,lap=0,lapTime=0;
  const maxFrames=90/dt;
  for(let frame=0;frame<maxFrames;frame++){
    let best=idx,bestD=Infinity;for(let k=-80;k<=80;k+=2){const n=mod(Math.round(idx)+k,count),p=at(n),d=(p.x-s.x)**2+(p.y-s.y)**2;if(d<bestD){bestD=d;best=n;}}
    lastIdx=idx;idx=best;s.routeIndex=idx;
    const distance=Math.sqrt(bestD),speed=Math.hypot(s.vx,s.vy),look=20+speed*.14,target=at(idx+look),desired=Math.atan2(target.x-s.x,-(target.y-s.y));
    let steer=clamp(Physics.angleDelta(s.angle,desired)*2.25-s.slipAngle*.92-s.angularVelocity*.06,-1,1);
    let curve=0;for(const d of [16,28,42,58,76])curve=Math.max(curve,Math.abs(Physics.angleDelta(tangent(idx+d-7),tangent(idx+d+7)))*(1.18-d*.004));
    const surf=surfaceAt(idx),mat=surface[surf],targetSpeed=326*mat.speed*clamp(1.01-curve*1.8,.43,.99)*.94,braking=speed>targetSpeed*1.025,throttle=braking?0:speed<targetSpeed*.97?1:.32,brake=braking?clamp((speed-targetSpeed)/48,.2,1):0;
    const onRoad=distance<roadWidth*.54;if(!onRoad)offFrames++;
    const driveSurface=onRoad?mat:{speed:.215,accel:.70,grip:.5,drag:.981,resistance:70};
    Physics.step(s,{throttle,brake,steer},{...config,maxSpeed:326*driveSurface.speed,accelScale:driveSurface.accel,grip:config.grip*driveSurface.grip,drag:driveSurface.drag,surfaceResistance:driveSurface.resistance||0},dt);
    maxSlip=Math.max(maxSlip,Math.abs(s.slipAngle));
    if(frame>240&&lastIdx>count*.84&&idx<count*.16){lap=1;lapTime=(frame+1)*dt;break;}
  }
  return {lapTime,offRoadRatio:offFrames/Math.max(1,lapTime/dt),maxSlip};
}
const lap=simulateCompetentLap();
console.log(`Canyon route length=${length.toFixed(0)} units width=${roadWidth} (${(roadWidth/carWidth).toFixed(2)} buggy widths)`);
console.log(`Competent controller lap=${lap.lapTime?lap.lapTime.toFixed(1):'not completed'}s off-road=${(lap.offRoadRatio*100).toFixed(1)}% peak-slip=${(lap.maxSlip*180/Math.PI).toFixed(1)}°`);
console.log(`route features: fast straight, sweep, hairpin, S bend, dirt cut, oil=${def.oils.length}, cones=${def.cones.length}, hop=${def.jumps.length}, bridge/water=${def.waterCrossings.length}, tunnel clear width=${narrowClearance.toFixed(0)} units (${(narrowClearance/carWidth).toFixed(1)} buggy widths), kerbs=${def.kerbs.length}`);
console.log('hazard wiring: production AI oil avoidance and shared oil handling verified; Canyon cones use shared physical cone update');
if(!lap.lapTime)failures.push('Competent controller did not complete a lap');
if(lap.lapTime&& (lap.lapTime<35||lap.lapTime>75))failures.push(`Controller lap ${lap.lapTime.toFixed(1)}s is outside the broad 35–75s tuning window`);
if(lap.offRoadRatio>.12)failures.push(`Controller spent ${(lap.offRoadRatio*100).toFixed(1)}% of the lap off road`);
if(failures.length){console.error(failures.map(x=>`FAIL ${x}`).join('\n'));process.exit(1);}console.log('PASS Canyon course checks');
