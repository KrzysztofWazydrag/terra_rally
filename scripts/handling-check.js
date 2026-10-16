'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Physics = require('../physics-core.js');
const DT = 1 / 60;
const cfg = { maxSpeed:326, acceleration:205, accelScale:1, braking:245, steering:3.15, grip:7.8, drag:.981, airborne:false, boost:false };
const paceCfg = {...cfg, acceleration:120};

function car(speed=245){ return {x:0,y:0,angle:0,vx:0,vy:-speed,speed,angularVelocity:0,slipAngle:0}; }
function run(initial,inputFor,seconds=1.4,config=cfg){const s={...initial};let maxSlip=0,maxYaw=0,maxSqueal=0;for(let i=0;i<seconds/DT;i++){Physics.step(s,inputFor(i*DT),config,DT);maxSlip=Math.max(maxSlip,Math.abs(s.slipAngle));maxYaw=Math.max(maxYaw,Math.abs(s.angularVelocity));maxSqueal=Math.max(maxSqueal,s.squeal);}return {state:s,maxSlip,maxYaw,maxSqueal,distance:Math.hypot(s.x,s.y)};}

const fastCorner=run(car(),()=>({throttle:1,brake:0,steer:1}),1.25);
const cleanCorner=run(car(),()=>({throttle:1,brake:0,steer:.5}),1.25);
const mildSteer=run(car(),()=>({throttle:1,brake:0,steer:.08}),.45);
const lowSpeedTurn=run(car(65),()=>({throttle:1,brake:0,steer:1}),.55);
const flatOut=run(car(210),t=>({throttle:1,brake:0,steer:t<.7?1:t<1.4?-1:1}),2.1);
const lift=run(car(),()=>({throttle:0,brake:0,steer:1}),1.25);
const oil=run(car(),()=>({throttle:1,brake:0,steer:1}),1.25,{...cfg,oilFactor:.1});
const airborne=run(car(),()=>({throttle:1,brake:0,steer:1}),.7,{...cfg,airborne:true});
function wheels(initial,input,forward,slip,seconds){const state={...initial};for(let t=0;t<seconds;t+=DT)Physics.updateWheelState(state,input,forward,slip,DT);return state;}
const rollingWheels=wheels({}, {throttle:1,brake:0,steer:0}, 160, 0, .5);
const stoppedPhase=rollingWheels.frontWheelPhase;
const stoppedWheels=wheels(rollingWheels,{throttle:0,brake:0,steer:0},0,0,.2);
const reversingWheels=wheels({frontWheelPhase:.5,rearWheelPhase:.5},{throttle:0,brake:0,steer:0},-90,0,.2);
const brakingWheels=wheels({frontWheelSpeed:160,rearWheelSpeed:160},{throttle:0,brake:1,steer:0},160,0,.35);
const slidingWheels=wheels({},{throttle:1,brake:0,steer:-1},160,.3,.35);
const counterSteer=(()=>{const s=car();for(let i=0;i<55;i++)Physics.step(s,{throttle:1,brake:0,steer:.5},cfg,DT);const peak=Math.abs(s.slipAngle);for(let i=0;i<40;i++)Physics.step(s,{throttle:0,brake:0,steer:-.5},cfg,DT);return{peak,end:Math.abs(s.slipAngle)};})();
function hopRun(launchSpeed){const s={z:0,zv:launchSpeed,vx:0,vy:-245},initialMomentum=[s.vx,s.vy];let frames=0,maxHeight=s.z;while(frames<120){Physics.stepVertical(s,DT,420);maxHeight=Math.max(maxHeight,s.z);frames++;if(s.z===0&&s.zv===0)break;}return{duration:frames*DT,height:maxHeight,impact:launchSpeed,momentumPreserved:s.vx===initialMomentum[0]&&s.vy===initialMomentum[1]};}
const roadHop=hopRun(105),roadBump=hopRun(55);
function suspensionRun(){const s={suspension:-1.15,suspensionVelocity:0},samples=[];for(let i=0;i<150;i++){Physics.stepSuspension(s,DT);samples.push(s.suspension);}return{compression:-1.15,rebound:Math.max(...samples),settled:s.suspension};}
const suspension=suspensionRun();

function catmull(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return{x:.5*(2*p1[0]+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),y:.5*(2*p1[1]+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)};}
const points=[[430,400],[850,230],[1370,270],[1790,530],[1910,890],[1730,1300],[1340,1530],[900,1490],[430,1280],[220,900]],route=[];
for(let i=0;i<960;i++){const n=i/960*points.length,s=Math.floor(n),t=n-s;route.push(catmull(points[(s-1+points.length)%points.length],points[s],points[(s+1)%points.length],points[(s+2)%points.length],t));}
const at=i=>route[((Math.round(i)%route.length)+route.length)%route.length];
const tangent=i=>{const a=at(i-2),b=at(i+2);return Math.atan2(b.x-a.x,-(b.y-a.y));};
function trackRun(skilled,laps=1){
  const start=at(0),s={...car(0),x:start.x,y:start.y,angle:tangent(0)},maxFrames=(laps*30+12)/DT;
  let index=0,last=0,off=0,maxSlip=0,completed=0;
  for(let frame=0;frame<maxFrames;frame++){
    let best=index,bestD=Infinity;
    for(let k=-80;k<=80;k+=2){const n=(Math.round(index)+k+960)%960,p=at(n),d=(p.x-s.x)**2+(p.y-s.y)**2;if(d<bestD){bestD=d;best=n;}}
    last=index;index=best;
    const distance=Math.sqrt(bestD),speed=Math.hypot(s.vx,s.vy),look=20+speed*.12,targetPoint=at(index+look),desired=Math.atan2(targetPoint.x-s.x,-(targetPoint.y-s.y)),steer=Math.max(-1,Math.min(1,Physics.angleDelta(s.angle,desired)*1.9-s.slipAngle*.75)),curve=Math.abs(Physics.angleDelta(tangent(index+8),tangent(index+48)));
    let throttle=1,brake=0;
    if(skilled){const target=326*Math.max(.52,Math.min(.98,.99-curve*.72));throttle=speed<target?1:0;brake=speed>target*1.04?Math.min(1,(speed-target)/55):0;}
    const onRoad=distance<160,roadCfg=onRoad?cfg:{...cfg,maxSpeed:70,accelScale:.25,grip:3.9,drag:.85};
    Physics.step(s,{throttle,brake,steer},roadCfg,DT);if(!onRoad)off++;maxSlip=Math.max(maxSlip,Math.abs(s.slipAngle));
    if(frame>240&&last>810&&index<120){completed++;if(completed>=laps)return{time:frame*DT,offRatio:off/frame,maxSlip};}
  }
  return{time:maxFrames*DT,offRatio:off/maxFrames,maxSlip};
}
const fullLap=trackRun(false),skilledLap=trackRun(true),sixLapAI=trackRun(true,6);
function straightRun(config,startSpeed=0,seconds=20){const s={...car(0),vy:-startSpeed};for(let i=0;i<seconds/DT;i++)Physics.step(s,{throttle:1,brake:0,steer:0},{...paceCfg,...config},DT);return Math.hypot(s.vx,s.vy);}
const accelerationProfile=[1,2,3,4,5,6].map(seconds=>straightRun({},0,seconds));
function accelerationMilestones(){const s={...car(0)},times={approach95:null,approach99:null,cap:null};for(let frame=1;frame<=600;frame++){Physics.step(s,{throttle:1,brake:0,steer:0},paceCfg,DT);const speed=Math.hypot(s.vx,s.vy),time=frame*DT;if(times.approach95===null&&speed>=paceCfg.maxSpeed*.95)times.approach95=time;if(times.approach99===null&&speed>=paceCfg.maxSpeed*.99)times.approach99=time;if(times.cap===null&&speed>=paceCfg.maxSpeed-.01)times.cap=time;}return times;}
const accelerationTimes=accelerationMilestones();
const grassSustainable=straightRun({accelScale:.70,drag:.981,surfaceResistance:70});
const mudSustainable=straightRun({accelScale:.48,drag:.981,surfaceResistance:175});
const grassEntry=straightRun({accelScale:.70,drag:.981,surfaceResistance:125},300,1);
const mudEntry=straightRun({accelScale:.48,drag:.981,surfaceResistance:175},300,1);
const gameSource=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
const physicsSource=fs.readFileSync(path.join(__dirname,'../physics-core.js'),'utf8');
const roadWidth=Number(gameSource.match(/const ROAD_WIDTH = (\d+);/)?.[1]||0);
const laneMatch=gameSource.match(/const AI_LANES = \[([^\]]+)\]/);
const aiLanes=laneMatch?laneMatch[1].split(',').map(Number):[];
const carWidth=Number(gameSource.match(/g\.drawImage\(this\.image,-31,-38,(\d+),76\)/)?.[1]||0);
const fullFieldWidth=Math.max(...[0,...aiLanes].map(Math.abs))*2+carWidth;
const bridgeWidth=roadWidth*.88;
const coneCar={...car(150),number:1,damage:0},cone={x:8,y:0,vx:0,vy:0,spin:0,down:0};
const coneHit=Physics.hitCone(coneCar,cone,1);
const failures=[];
if(lowSpeedTurn.maxYaw<.65)failures.push(`STEERING RESPONSE: low-speed yaw ${lowSpeedTurn.maxYaw.toFixed(3)}, expected >= 0.650`);
if(cleanCorner.maxSlip<.05||cleanCorner.maxSlip>.18)failures.push(`CLEAN CORNER: slip ${(cleanCorner.maxSlip*180/Math.PI).toFixed(1)}°, expected 3–10°`);
if(fastCorner.maxSlip<.14||fastCorner.maxSlip>.32)failures.push(`GRIP LIMIT: aggressive slip ${(fastCorner.maxSlip*180/Math.PI).toFixed(1)}°, expected a readable 8–18° slide`);
if(mildSteer.maxSlip<.10&&mildSteer.maxSqueal>.02)failures.push(`SQUEAL: steering with ${ (mildSteer.maxSlip*180/Math.PI).toFixed(1)}° slip generated ${mildSteer.maxSqueal.toFixed(2)} despite staying below the grip-limit threshold`);
if(flatOut.maxSlip<.22||flatOut.maxSqueal<.65)failures.push(`SQUEAL: grip-limit S-bend slip=${flatOut.maxSlip.toFixed(3)}rad level=${flatOut.maxSqueal.toFixed(2)}, expected obvious slip feedback`);
if(!physicsSource.includes('const slideIntensity = clamp((Math.abs(state.slipAngle) - .10) / .16')||!gameSource.includes('squeal*.055*rough'))failures.push('SQUEAL AUDIO: level is not tied to actual slip intensity or its gain was not raised for legibility');
if(!gameSource.includes('clamp(-car.slipAngle*.4,-.18,.18)'))failures.push('VEHICLE POSTURE: grip-limit slide yaw is not visually emphasized');
if(!gameSource.includes("buggyImage.src = 'assets/player-buggy-topdown.png'")||gameSource.includes('drawTyre(')||!gameSource.includes('g.imageSmoothingEnabled=false'))failures.push('VEHICLE PIPELINE: built-in wheel sprite is not rendered as the sole crisp directional layer');
if(!gameSource.includes('ctx.translate(c.x+3,c.y+5)')||!gameSource.includes('drawY=car.y-car.z-(car.suspension||0)*3'))failures.push('VEHICLE DEPTH: ground shadow must remain at ground position while the body rises and compresses');
if(roadHop.duration<.45||roadHop.duration>.6||roadHop.height<11||roadHop.height>15)failures.push(`HOP: duration=${roadHop.duration.toFixed(2)}s height=${roadHop.height.toFixed(1)}, expected brief 0.45–0.60s rise at 11–15 units`);
if(roadBump.duration<.2||roadBump.duration>.35||roadBump.height<3||roadBump.height>5)failures.push(`BUMP: duration=${roadBump.duration.toFixed(2)}s height=${roadBump.height.toFixed(1)}, expected subtle short 0.20–0.35s movement at 3–5 units`);
if(!roadHop.momentumPreserved||!roadBump.momentumPreserved)failures.push('HOP: vertical integration changed forward momentum');
if(suspension.rebound<.05||Math.abs(suspension.settled)>.01)failures.push(`SUSPENSION: compression/rebound response ${suspension.rebound.toFixed(2)} did not settle (${suspension.settled.toFixed(3)})`);
if(!physicsSource.includes('function stepVertical')||!physicsSource.includes('function stepSuspension')||!gameSource.includes('c.zv=Math.max(c.zv,105)')||!gameSource.includes('c.zv=Math.max(c.zv,55)')||!gameSource.includes('TerraPhysics.stepVertical(c,dt)'))failures.push('HOP SYSTEM: production game is not using the small step/bump and spring helpers');
if(rollingWheels.frontWheelSpeed<130||rollingWheels.frontWheelPhase===0)failures.push('WHEELS: straight-line rolling did not animate from actual speed');
if(stoppedWheels.frontWheelSpeed!==0||stoppedWheels.frontWheelPhase!==stoppedPhase)failures.push('WHEELS: rotation continued after the car stopped');
if(reversingWheels.frontWheelPhase>=.5)failures.push('WHEELS: phase did not reverse while reversing');
if(brakingWheels.frontWheelSpeed>70)failures.push(`WHEELS: heavy braking retained ${brakingWheels.frontWheelSpeed.toFixed(1)} wheel speed`);
if(slidingWheels.rearWheelSpeed-slidingWheels.frontWheelSpeed<8)failures.push('WHEELS: driven-wheel spin did not separate from road speed during a skid');
if(slidingWheels.frontSteer>-.8)failures.push(`STEERING VISUAL: front tyre angle lagged at ${slidingWheels.frontSteer.toFixed(2)}`);
if(flatOut.maxSlip<.14)failures.push(`FULL THROTTLE: S-bend slip ${flatOut.maxSlip.toFixed(3)}rad, expected >= 0.140rad`);
if(!(lift.maxSlip<fastCorner.maxSlip*.86))failures.push(`LIFT: slip ${lift.maxSlip.toFixed(3)}rad did not settle below flat-out ${fastCorner.maxSlip.toFixed(3)}rad`);
if(oil.maxSlip<fastCorner.maxSlip*1.35)failures.push(`OIL: slip ${oil.maxSlip.toFixed(3)}rad was not at least 35% above clean-road slip`);
if(airborne.maxYaw>fastCorner.maxYaw*.12)failures.push(`AIRBORNE: yaw ${airborne.maxYaw.toFixed(3)} retained too much steering authority`);
if(counterSteer.end>counterSteer.peak*.7)failures.push(`COUNTERSTEER: slip ${(counterSteer.peak*180/Math.PI).toFixed(1)}° recovered only to ${(counterSteer.end*180/Math.PI).toFixed(1)}° in 0.67s`);
if(!(accelerationTimes.approach95>=4&&accelerationTimes.approach95<=6&&accelerationTimes.approach99>=4.5&&accelerationTimes.approach99<=6.5&&accelerationProfile[5]>=paceCfg.maxSpeed-.1))failures.push(`ACCELERATION CURVE: 95%=${accelerationTimes.approach95?.toFixed(2)}s 99%=${accelerationTimes.approach99?.toFixed(2)}s at 6s=${accelerationProfile[5].toFixed(1)}`);
if(!gameSource.includes('throttle=0')||!gameSource.includes('speedRatio*.018')||!gameSource.includes('clamp(throttle,0,1)*.012'))failures.push('ENGINE FEEDBACK: pitch/level do not respond to speed and throttle load');
if(grassSustainable<326*.68||grassSustainable>326*.8)failures.push(`GRASS SPEED: settled at ${grassSustainable.toFixed(1)}, expected 68–80% of road speed`);
if(mudSustainable<326*.4||mudSustainable>326*.5||mudSustainable>=grassSustainable)failures.push(`MUD SPEED: settled at ${mudSustainable.toFixed(1)}, expected 40–50% and slower than grass`);
if(grassEntry>270||grassEntry<210||mudEntry>=grassEntry||mudEntry<155)failures.push(`OFF-ROAD DECAY: grass=${grassEntry.toFixed(1)}, mud=${mudEntry.toFixed(1)} after 1s from 300`);
if(roadWidth<carWidth*5||fullFieldWidth>roadWidth)failures.push(`TRACK WIDTH: road=${roadWidth}, car=${carWidth}, five-car field=${fullFieldWidth}`);
if(bridgeWidth<carWidth*4||bridgeWidth>carWidth*5.5)failures.push(`BRIDGE WIDTH: ${bridgeWidth.toFixed(0)} for ${carWidth}px buggy`);
if(!gameSource.includes('buildStaticSceneCache')||!gameSource.includes('ctx.drawImage(s.canvas')||!gameSource.includes('drawPerformanceDebug'))failures.push('RENDER CACHE: static scene or F2 profiling overlay missing');
if(!gameSource.includes('this.maxParticles=60')||!gameSource.includes('trailHead')||!gameSource.includes('trailCount'))failures.push('BOUNDED TRANSIENTS: particle cap or skid-mark ring buffer missing');
if(!coneHit||cone.down<=0||Math.hypot(cone.vx,cone.vy)<25)failures.push('CONE: impact did not launch and spin the cone');
if(sixLapAI.time>145||sixLapAI.offRatio>.05)failures.push(`AI: six-lap controller time ${sixLapAI.time.toFixed(1)}s off-road ${(sixLapAI.offRatio*100).toFixed(0)}%`);
console.log(`clean-corner slip=${(cleanCorner.maxSlip*180/Math.PI).toFixed(1)}° squeal=${cleanCorner.maxSqueal.toFixed(2)} mild-steer slip=${(mildSteer.maxSlip*180/Math.PI).toFixed(1)}° squeal=${mildSteer.maxSqueal.toFixed(2)}`);
console.log(`grip-limit slip=${(fastCorner.maxSlip*180/Math.PI).toFixed(1)}° squeal=${fastCorner.maxSqueal.toFixed(2)} yaw=${fastCorner.maxYaw.toFixed(3)} S-bend squeal=${flatOut.maxSqueal.toFixed(2)}`);
console.log(`countersteer ${(counterSteer.peak*180/Math.PI).toFixed(1)}° -> ${(counterSteer.end*180/Math.PI).toFixed(1)}° in 0.67s`);
console.log(`low-speed steering yaw=${lowSpeedTurn.maxYaw.toFixed(3)} after 0.55s`);
console.log(`full-throttle slip=${flatOut.maxSlip.toFixed(3)} distance=${flatOut.distance.toFixed(1)}`);
console.log(`lift slip=${lift.maxSlip.toFixed(3)} speed=${Math.abs(lift.state.speed).toFixed(1)}`);
console.log(`oil slip=${oil.maxSlip.toFixed(3)} airborne-yaw=${airborne.maxYaw.toFixed(3)}`);
console.log(`road hop=${roadHop.duration.toFixed(2)}s peak=${roadHop.height.toFixed(1)} impact=${roadHop.impact} momentum=preserved bump=${roadBump.duration.toFixed(2)}s peak=${roadBump.height.toFixed(1)} momentum=preserved suspension compression=-1.15 rebound=${suspension.rebound.toFixed(2)} settle=${suspension.settled.toFixed(3)}`);
console.log(`wheels rolling=${rollingWheels.frontWheelSpeed.toFixed(1)} stopped=${stoppedWheels.frontWheelSpeed.toFixed(1)} braking=${brakingWheels.frontWheelSpeed.toFixed(1)} skid-delta=${(slidingWheels.rearWheelSpeed-slidingWheels.frontWheelSpeed).toFixed(1)} steer=${slidingWheels.frontSteer.toFixed(2)}`);
console.log(`lap flat-out=${fullLap.time.toFixed(1)}s off-road=${(fullLap.offRatio*100).toFixed(0)}% skilled=${skilledLap.time.toFixed(1)}s off-road=${(skilledLap.offRatio*100).toFixed(0)}%`);
console.log(`cone launched=${coneHit} velocity=${Math.hypot(cone.vx,cone.vy).toFixed(1)} spin=${cone.spin.toFixed(1)}`);
console.log(`six-lap AI=${sixLapAI.time.toFixed(1)}s off-road=${(sixLapAI.offRatio*100).toFixed(0)}%`);
console.log(`acceleration 1–6s=${accelerationProfile.map(v=>v.toFixed(1)).join('/')} 95%=${accelerationTimes.approach95?.toFixed(2)}s 99%=${accelerationTimes.approach99?.toFixed(2)}s cap=${accelerationTimes.cap?.toFixed(2)}s max=${cfg.maxSpeed}`);
console.log(`surface settled grass=${grassSustainable.toFixed(1)} (${(grassSustainable/326*100).toFixed(0)}%) mud=${mudSustainable.toFixed(1)} (${(mudSustainable/326*100).toFixed(0)}%) entry1s grass=${grassEntry.toFixed(1)} mud=${mudEntry.toFixed(1)}`);
console.log(`proportions road=${roadWidth} car=${carWidth} five-car field=${fullFieldWidth} bridge=${bridgeWidth.toFixed(0)}`);
if(failures.length){console.error(failures.map(x=>`FAIL ${x}`).join('\n'));process.exit(1);}console.log('PASS handling checks');
