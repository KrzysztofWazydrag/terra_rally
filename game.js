(() => {
  'use strict';

  const canvas = document.querySelector('#game');
  let ctx = canvas.getContext('2d', { alpha: false });
  const TAU = Math.PI * 2;
  const FIXED_STEP = 1 / 60;
  const LAPS = 6;
  const ROAD_WIDTH = 320;
  const AI_LANES = [-92,-30,30,92];
  const keys = { up: false, down: false, left: false, right: false, boost: false };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mod = (n, m) => ((n % m) + m) % m;
  const angleDelta = (a, b) => mod(b - a + Math.PI, TAU) - Math.PI;
  const ordinal = n => `${n}${n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH'}`;
  const formatTime = seconds => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const cs = Math.floor((seconds % 1) * 100).toString().padStart(2, '0');
    return `${m}:${s}.${cs}`;
  };

  const ui = Object.fromEntries([
    'hud','place','lap','speed','damageFill','turboFill','timer','raceBanner','pickupToast','surfaceChip',
    'soundButton','fullscreenButton','titleScreen','startButton','briefingScreen','eventNumber','trackName',
    'trackDescription','surfaceList','raceButton','backTitleButton','resultsScreen','resultPlace','resultTime',
    'bestLap','finishBonus','pickupCash','totalCash','shopButton','shopScreen','wallet','upgradeGrid',
    'nextRaceButton','championScreen','championshipSummary','replayButton'
  ].map(id => [id, document.querySelector(`#${id}`)]));

  const buggyImage = new Image();
  buggyImage.src = 'assets/player-buggy-topdown.png';
  const groveImage = new Image();
  groveImage.src = 'assets/forest-grove.png';
  const canyonTextures = { tarmac:new Image(), dirt:new Image(), gravel:new Image() };
  canyonTextures.tarmac.src = 'assets/canyon/surface-asphalt.png';
  canyonTextures.dirt.src = 'assets/canyon/surface-dirt.png';
  canyonTextures.gravel.src = 'assets/canyon/surface-gravel.png';

  class DirectionalVehicleAtlas {
    constructor(image, directions=32){this.image=image;this.directions=directions;this.frames=[];image.addEventListener('load',()=>this.build());if(image.complete&&image.naturalWidth)this.build();}
    build(){
      this.frames=[];
      for(let i=0;i<this.directions;i++){
        const frame=document.createElement('canvas'),g=frame.getContext('2d'),a=i/this.directions*TAU;
        g.imageSmoothingEnabled=false;
        frame.width=96;frame.height=112;g.translate(48,56);g.rotate(a+Math.PI);
        g.drawImage(this.image,-31,-38,62,76);
        g.globalCompositeOperation='source-atop';
        const shine=g.createLinearGradient(-30,0,30,0);
        shine.addColorStop(0,Math.sin(a)>.05?'#07131a33':'#ffe6a616');shine.addColorStop(.52,'#ffffff00');shine.addColorStop(1,Math.sin(a)>.05?'#ffe6a616':'#07131a33');
        g.fillStyle=shine;g.fillRect(-33,-40,66,80);g.globalCompositeOperation='source-over';this.frames.push(frame);
      }
    }
    draw(target,car,hue=0){
      if(!this.frames.length)return false;
      const driftPosture=clamp(-car.slipAngle*.4,-.18,.18);
      const visualAngle=car.angle+clamp((car.steerInput||0)*.035+car.angularVelocity*.012+driftPosture,-.13,.13);
      const index=mod(Math.round(visualAngle/TAU*this.directions),this.directions),frameAngle=index/this.directions*TAU;
      const roll=clamp((car.steerInput||0)*.045+car.angularVelocity*.055,-.12,.12),drawY=car.y-car.z-(car.suspension||0)*3;
      target.save();target.translate(car.x+Math.cos(frameAngle)*roll*3,drawY+Math.sin(frameAngle)*roll*3);
      if(hue)target.filter=`hue-rotate(${hue}deg) saturate(1.35)`;target.drawImage(this.frames[index],-48,-56);target.restore();
      return true;
    }
  }
  const vehicleAtlas = new DirectionalVehicleAtlas(buggyImage,32);

  class Random {
    constructor(seed = 1) { this.seed = seed >>> 0; }
    next() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
    range(a, b) { return a + (b - a) * this.next(); }
  }

  const SURFACES = {
    tarmac: { label: 'TARMAC', color: '#475154', edge: '#242c2d', speed: 1.08, accel: 1.04, grip: 1.12, drag: .985, dust: '#aeb6ae' },
    dirt:   { label: 'DIRT', color: '#8b5938', edge: '#5d3b2a', speed: 1, accel: 1, grip: 1, drag: .981, dust: '#c18a58' },
    gravel: { label: 'GRAVEL', color: '#8a806e', edge: '#504a42', speed: .92, accel: .92, grip: .82, drag: .972, dust: '#c7bda6' },
    mud:    { label: 'MUD', color: '#5c3f31', edge: '#3d2b26', speed: .64, accel: .48, grip: .54, drag: .981, resistance: 175, dust: '#6e4c39' },
    water:  { label: 'WATER', color: '#397e83', edge: '#24565d', speed: .61, accel: .56, grip: .76, drag: .947, dust: '#8fd5cf' },
    grass:  { label: 'GRASS', color: '#315b32', edge: '#243d28', speed: .215, accel: .70, grip: .5, drag: .981, resistance: 70, dust: '#6d9352' }
  };

  const VEHICLES = {
    buggy: { name: 'VANGUARD BUGGY', topSpeed: 326, acceleration: 120, braking: 245, steering: 3.15, grip: 7.8, weight: 1 },
    fourByFour: { name: 'TITAN 4X4', topSpeed: 285, acceleration: 180, braking: 220, steering: 2.65, grip: 9.2, weight: 1.3 },
    formula: { name: 'TEMPEST XR', topSpeed: 355, acceleration: 218, braking: 265, steering: 3.35, grip: 8.4, weight: .84 }
  };

  const TRACK_DEFS = [
    {
      name: 'PINE RIDGE RUN', description: 'Fast dirt bends, a narrow timber bridge and a wet ravine crossing.',
      surfaces: 'DIRT · TARMAC · MUD · WATER', seed: 1989,
      points: [[430,400],[850,230],[1370,270],[1790,530],[1910,890],[1730,1300],[1340,1530],[900,1490],[430,1280],[220,900]],
      cuts: [[.1,.19,1,'earth'],[.28,.37,-1,'rock'],[.72,.8,1,'earth']],
      zones: [{from:.04,to:.16,type:'tarmac'},{from:.35,to:.42,type:'gravel'},{from:.55,to:.62,type:'water'},{from:.72,to:.79,type:'mud'}],
      bridge:.57, jumps:[.27,.83], bumps:[.38,.76], oils:[.21,.69], cones:[[.15,-.26],[.16,.05],[.17,.3],[.47,-.22],[.48,.18]], tunnel:{from:.42,to:.47}, pickupFractions:[.08,.19,.31,.45,.52,.66,.75,.9]
    },
    {
      name: 'CANYON CIRCUIT', description: 'Fast mesa straight, rock-cut hairpin, river causeway and a tight canyon pass.',
      surfaces: 'TARMAC · GRAVEL · DIRT · MUD', seed: 4093, theme:'canyon',
      points: [[158,292],[748,145],[1362,108],[1916,206],[2236,526],[2248,834],[1929,1042],[2212,1226],[2138,1583],[1683,1792],[1202,1656],[882,1324],[1115,1018],[845,772],[1066,538],[746,427],[402,563],[107,809],[21,514]],
      cuts: [[.18,.25,1,'rock'],[.43,.49,-1,'rock'],[.57,.65,1,'earth'],[.82,.86,-1,'rock']],
      zones: [{from:0,to:.08,type:'gravel'},{from:.08,to:.22,type:'tarmac'},{from:.22,to:.31,type:'dirt'},{from:.31,to:.4,type:'tarmac'},{from:.4,to:.53,type:'gravel'},{from:.53,to:.66,type:'dirt'},{from:.66,to:.7,type:'mud'},{from:.7,to:.73,type:'dirt'},{from:.73,to:.8,type:'tarmac'},{from:.8,to:.86,type:'gravel'},{from:.86,to:.94,type:'dirt'},{from:.94,to:1,type:'gravel'}],
      bridge:.755, waterCrossings:[.755], jumps:[.115,.625], bumps:[.46,.68], oils:[.345,.585,.89], cones:[[.265,-.28],[.275,0],[.285,.28],[.405,-.22],[.415,.22],[.615,-.18]], tunnel:{from:.865,to:.925}, shortcut:{from:.56,to:.635},
      kerbs:[[.29,.355,1],[.39,.445,-1],[.49,.535,1],[.61,.655,-1],[.755,.79,1],[.84,.865,-1]],
      barriers:[[.18,.25,1],[.32,.37,-1],[.43,.49,-1],[.82,.86,-1],[.865,.925,1]],
      walls:[[.15,.255,1],[.405,.495,-1],[.825,.93,1,189],[.865,.925,-1,189],[.94,.985,-1]],
      racingLine:[[.3,.35,-34],[.425,.465,30],[.505,.53,-28],[.605,.64,32]],
      modules:[[.055,-1,'board',1.1],[.205,1,'marshal',1.15],[.345,-1,'tyres',1.05],[.465,1,'barrel',1.1],[.555,-1,'board',1.15],[.705,1,'hut',1.1],[.79,-1,'tyres',1.15],[.84,1,'board',1.1],[.955,1,'palm',1.1]],
      pickupFractions:[.06,.17,.29,.41,.54,.68,.79,.93]
    },
    {
      name: 'BLACKWATER LOOP', description: 'Technical forest racing with a risky muddy cut through the marsh.',
      surfaces: 'DIRT · WATER · MUD · TARMAC', seed: 8111,
      points: [[450,270],[1030,210],[1570,300],[1880,650],[1730,1040],[1900,1400],[1440,1580],[1020,1370],[610,1580],[260,1260],[210,760]],
      cuts: [[.12,.21,1,'earth'],[.29,.38,-1,'rock'],[.68,.78,1,'earth']],
      zones: [{from:.08,to:.2,type:'tarmac'},{from:.37,to:.44,type:'water'},{from:.56,to:.67,type:'mud'},{from:.78,to:.88,type:'gravel'}],
      bridge:.4, jumps:[.24,.7], bumps:[.32,.58,.86], oils:[.26,.82], cones:[[.19,-.24],[.2,.1],[.21,.3],[.74,-.25],[.75,.18]], tunnel:{from:.31,to:.36}, shortcut:{from:.56,to:.69}, pickupFractions:[.07,.16,.28,.4,.5,.61,.74,.88]
    }
  ];

  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return {
      x: .5 * (2*p1[0] + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
      y: .5 * (2*p1[1] + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
    };
  }

  class Track {
    constructor(def) {
      this.def = def;
      this.count = 960;
      this.route = [];
      const cps = def.points;
      for (let i = 0; i < this.count; i++) {
        const n = i / this.count * cps.length, s = Math.floor(n), t = n - s;
        this.route.push(catmull(cps[mod(s-1,cps.length)], cps[s], cps[(s+1)%cps.length], cps[(s+2)%cps.length], t));
      }
      this.tangents = this.route.map((_, i) => {
        const a = this.at(i - 2), b = this.at(i + 2);
        return Math.atan2(b.x - a.x, -(b.y - a.y));
      });
      this.props = this.makeProps();
      this.specks = this.makeSpecks();
      this.cornerWear = this.makeCornerWear();
      this.shortcut = def.shortcut ? this.makeShortcut(def.shortcut) : null;
    }
    at(i) { return this.route[mod(Math.round(i), this.count)]; }
    tangent(i) { return this.tangents[mod(Math.round(i), this.count)]; }
    surfaceAt(i, shortcut = false) {
      if (shortcut) return SURFACES.mud;
      const f = mod(i, this.count) / this.count;
      const zone = this.def.zones.find(z => z.from <= z.to ? f >= z.from && f <= z.to : f >= z.from || f <= z.to);
      return SURFACES[zone ? zone.type : 'dirt'];
    }
    makeShortcut({ from, to }) {
      const start = from * this.count, end = to * this.count, a = this.at(start), d = this.at(end);
      const angleA = this.tangent(start), angleB = this.tangent(end), distance = Math.hypot(d.x-a.x,d.y-a.y), h = distance * .34;
      const b = { x:a.x+Math.sin(angleA)*h, y:a.y-Math.cos(angleA)*h };
      const c = { x:d.x-Math.sin(angleB)*h, y:d.y+Math.cos(angleB)*h };
      const points = [];
      for (let i=0;i<=90;i++) { const t=i/90,u=1-t; points.push({x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y,index:lerp(start,end,t)}); }
      return { start, end, points };
    }
    makeProps() {
      const rng = new Random(this.def.seed), result=[];
      for (let i=0;i<this.count;i+=7) {
        const p=this.at(i), a=this.tangent(i), nx=Math.cos(a), ny=Math.sin(a);
        for (const side of [-1,1]) {
          if (rng.next() < .36) continue;
          const canyon=this.def.theme==='canyon',d=ROAD_WIDTH*.62+rng.range(canyon?80:52,canyon?390:300), x=p.x+nx*d*side, y=p.y+ny*d*side;
          const r=rng.next();
          const type=canyon?(r<.26?'canyonRock':r<.43?'palm':r<.57?'bush':r<.69?'rock':r<.78?'tyres':r<.86?'barrel':r<.95?'board':'canyonRock'):(r<.36?'tree':r<.56?'pine':r<.72?'bush':r<.84?'rock':r<.91?'stump':r<.96?'tyres':'flowers');
          result.push({x,y,scale:rng.range(.72,canyon?1.35:1.25),phase:rng.range(0,TAU),type});
        }
      }
      for(const [fraction,side,type,scale=1] of this.def.modules||[]){const i=fraction*this.count,p=this.at(i),a=this.tangent(i),d=ROAD_WIDTH*.65+110;result.push({x:p.x+Math.cos(a)*d*side,y:p.y+Math.sin(a)*d*side,scale,phase:0,type});}
      for(let i=0;i<(this.def.theme==='canyon'?6:5);i++){const n=Math.floor(rng.range(0,this.count)),p=this.at(n),a=this.tangent(n),d=ROAD_WIDTH*.7+rng.range(170,260);result.push({x:p.x+Math.cos(a)*d*(i%2?1:-1),y:p.y+Math.sin(a)*d*(i%2?1:-1),scale:rng.range(.75,1),phase:0,type:this.def.theme==='canyon'?'canyonRock':'grove'});}
      return result.sort((a,b)=>a.y-b.y);
    }
    makeSpecks(){const rng=new Random(this.def.seed+99),a=[];for(let i=0;i<this.count;i+=2){const p=this.at(i),t=this.tangent(i),d=rng.range(-ROAD_WIDTH*.38,ROAD_WIDTH*.38);a.push({x:p.x+Math.cos(t)*d,y:p.y+Math.sin(t)*d,r:rng.range(1,3),light:rng.next()>.52});}return a;}
    makeCornerWear(){const rng=new Random(this.def.seed+211),wear=[];for(let i=0;i<this.count;i+=9){const before=this.tangent(i-14),after=this.tangent(i+14),curve=angleDelta(before,after);if(Math.abs(curve)<.055)continue;const p=this.at(i),a=this.tangent(i),outer=Math.sign(curve)*ROAD_WIDTH*.43;wear.push({x:p.x+Math.cos(a)*outer,y:p.y+Math.sin(a)*outer,a,curve:Math.abs(curve),r:rng.range(2,5)});}return wear;}
    nearest(car, full=false) {
      let best=car.routeIndex||0,bestD=Infinity,branch=false;
      const range=full?this.count:92;
      for(let k=full?0:-range;k<=(full?this.count:range);k+=full?3:2){const i=full?k:Math.round(car.routeIndex)+k,p=this.at(i),d=(p.x-car.x)**2+(p.y-car.y)**2;if(d<bestD){bestD=d;best=mod(i,this.count);branch=false;}}
      if(car.player&&this.shortcut)for(let j=0;j<this.shortcut.points.length;j+=2){const p=this.shortcut.points[j],d=(p.x-car.x)**2+(p.y-car.y)**2;if(d<bestD){bestD=d;best=p.index;branch=true;}}
      return {index:best,distance:Math.sqrt(bestD),shortcut:branch};
    }
  }

  class AudioSystem {
    constructor(){this.enabled=true;this.ctx=null;this.engine=null;this.engineGain=null;this.squeal=null;this.squealGain=null;this.terrain=null;this.terrainGain=null;this.step=-1;}
    ensure(){if(!this.enabled)return false;try{this.ctx ||= new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();return true;}catch(_){return false;}}
    tone(freq,duration=.12,type='square',gain=.045,delay=0){if(!this.ensure())return;const now=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);o.connect(g);g.connect(this.ctx.destination);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.start(now);o.stop(now+duration+.02);}
    effect(name){const m={count:[280,.08,'square'],go:[720,.24,'square'],pickup:[980,.14,'sine'],cash:[1250,.16,'square'],repair:[520,.25,'sine'],jump:[210,.2,'triangle'],land:[115,.11,'triangle'],oil:[390,.22,'sawtooth'],cone:[175,.08,'square'],hit:[82,.12,'sawtooth'],finish:[660,.45,'triangle'],buy:[880,.18,'square']}[name];if(m)this.tone(...m);if(name==='finish'){this.tone(880,.38,'triangle',.04,.14);this.tone(1100,.36,'triangle',.04,.28);}}
    update(racing,time,speed,squeal=0,surface='DIRT',airborne=false,throttle=0){
      if(!this.ensure())return;
      if(racing&&!this.engine){
        this.engine=this.ctx.createOscillator();this.engineGain=this.ctx.createGain();this.engine.type='sawtooth';this.engine.connect(this.engineGain);this.engineGain.connect(this.ctx.destination);this.engine.start();
        this.squeal=this.ctx.createOscillator();this.squealGain=this.ctx.createGain();this.squeal.type='sawtooth';this.squeal.connect(this.squealGain);this.squealGain.connect(this.ctx.destination);this.squeal.start();
        this.terrain=this.ctx.createOscillator();this.terrainGain=this.ctx.createGain();this.terrain.type='square';this.terrain.connect(this.terrainGain);this.terrainGain.connect(this.ctx.destination);this.terrain.start();
      }
      if(this.engine){const speedRatio=clamp(speed/326,0,1),load=.88+clamp(throttle,0,1)*.18+Math.min(.12,squeal*.08);this.engine.frequency.setTargetAtTime((72+speed*.78)*load*(airborne?.84:1),this.ctx.currentTime,.05);const level=.032+speedRatio*.018+clamp(throttle,0,1)*.012+Math.min(.012,squeal*.01);this.engineGain.gain.setTargetAtTime(racing?level:0,this.ctx.currentTime,.06);}
      if(this.squeal){const rough=surface==='GRAVEL'||surface==='GRASS'?.72:1;this.squeal.frequency.setTargetAtTime(570+squeal*330+Math.sin(time*17)*22,this.ctx.currentTime,.035);this.squealGain.gain.setTargetAtTime(racing?squeal*.055*rough:0,this.ctx.currentTime,.045);}
      if(this.terrain){const texture={TARMAC:[0,38],DIRT:[.52,54],GRAVEL:[.82,73],MUD:[.68,34],WATER:[.48,46],GRASS:[.76,42]}[surface]||[.5,52],motion=clamp((speed-20)/220,0,1);this.terrain.frequency.setTargetAtTime(texture[1]+Math.sin(time*19)*5,this.ctx.currentTime,.04);this.terrainGain.gain.setTargetAtTime(racing&&!airborne?texture[0]*motion*.007:0,this.ctx.currentTime,.05);}
      const step=Math.floor(time*4);if(step!==this.step){this.step=step;const seq=racing?[110,110,165,110,220,165,110,147]:[110,147,165,220,165,147,123,147];this.tone(seq[mod(step,seq.length)],.09,step%2?'triangle':'square',.012);}
    }
    toggle(){this.enabled=!this.enabled;if(!this.enabled&&this.engineGain)this.engineGain.gain.setTargetAtTime(0,this.ctx.currentTime,.04);if(!this.enabled&&this.squealGain)this.squealGain.gain.setTargetAtTime(0,this.ctx.currentTime,.04);if(!this.enabled&&this.terrainGain)this.terrainGain.gain.setTargetAtTime(0,this.ctx.currentTime,.04);return this.enabled;}
  }

  class Car {
    constructor(player,index,color){this.player=player;this.number=index+1;this.color=color;this.profile=VEHICLES.buggy;this.routeIndex=0;this.lap=0;this.x=0;this.y=0;this.angle=0;this.vx=0;this.vy=0;this.speed=0;this.angularVelocity=0;this.slipAngle=0;this.steerLoad=0;this.squeal=0;this.frontWheelSpeed=0;this.rearWheelSpeed=0;this.frontWheelPhase=0;this.rearWheelPhase=0;this.frontSteer=0;this.oilTimer=0;this.oilLock=0;this.suspension=0;this.damage=0;this.turbo=100;this.z=0;this.zv=0;this.jumpLock=0;this.hitLock=0;this.surface=SURFACES.dirt;this.onShortcut=false;this.finishTime=null;this.pickupCash=0;this.temp={grip:0,speed:0,accel:0};this.trail=Array(150);this.trailHead=0;this.trailCount=0;this.aiLane=player?0:(AI_LANES[index-1]||0);this.aiMistakeSeed=0;this.aiMistakeRoll=100;this.aiMistakeIndex=-1;this.aiMistakeDone=false;this.aiMistakeTimer=0;this.aiMistakes=0;}
    reset(track,slot){const offset=mod(-slot*18,track.count),p=track.at(offset);this.x=p.x+Math.cos(track.tangent(offset))*((slot%2?.5:-.5)*42);this.y=p.y+Math.sin(track.tangent(offset))*((slot%2?.5:-.5)*42);this.angle=track.tangent(offset);this.routeIndex=offset;this.lap=slot===0?0:-1;this.vx=this.vy=this.speed=this.angularVelocity=this.slipAngle=0;this.frontWheelSpeed=this.rearWheelSpeed=this.frontWheelPhase=this.rearWheelPhase=this.frontSteer=0;this.oilTimer=this.oilLock=this.suspension=this.suspensionVelocity=0;this.damage=0;this.turbo=100;this.z=this.zv=0;this.finishTime=null;this.pickupCash=0;this.temp={grip:0,speed:0,accel:0};this.trail.fill(undefined);this.trailHead=this.trailCount=0;}
  }

  class Game {
    constructor(){
      this.width=1;this.height=1;this.dpr=1;this.mode='title';this.trackIndex=0;this.track=new Track(TRACK_DEFS[0]);this.cars=[];this.player=null;this.particles=[];this.particlePool=[];this.maxParticles=60;this.pickups=[];this.cones=[];this.camera={x:700,y:600,zoom:1.36,shake:0};this.time=0;this.raceTime=0;this.countdown=0;this.last=performance.now();this.accumulator=0;this.audio=new AudioSystem();this.cash=0;this.raceCash=0;this.results=[];this.lapStarted=0;this.lapTimes=[];this.aiRaceSerial=0;this.aiCurvature=null;this.aiArcLength=null;this.aiTrackLength=0;this.upgrades={engine:0,gears:0,tyres:0,shell:0};this.debug=false;this.hudHidden=false;this.perf={fps:60,frameMs:0,updateMs:0,renderMs:0,visibleObjects:0};this.staticScene=null;this.tunnelScene=null;this.propSprites={};this.rng=new Random(7331);this.bind();this.resize();this.buildStaticSceneCache();this.renderUpgrades();requestAnimationFrame(t=>this.frame(t));
    }
    bind(){
      addEventListener('resize',()=>this.resize());
      const surfaceImages=Object.values(canyonTextures);surfaceImages.forEach(image=>image.addEventListener('load',()=>{if(this.track.def.theme==='canyon'&&surfaceImages.every(asset=>asset.complete&&asset.naturalWidth))this.buildStaticSceneCache();}));
      addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();this.setKey(e.code,true);if(e.code==='KeyR'&&(this.mode==='race'||this.mode==='countdown'))this.resetPlayer();if(!e.repeat&&e.code==='F2'){e.preventDefault();this.debug=!this.debug;}if(!e.repeat&&e.code==='KeyH'){this.hudHidden=!this.hudHidden;this.syncHud();}});
      addEventListener('keyup',e=>this.setKey(e.code,false));addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
      ui.startButton.onclick=()=>{this.audio.ensure();this.newChampionship();};ui.raceButton.onclick=()=>this.startRace();ui.backTitleButton.onclick=()=>this.show('title');ui.shopButton.onclick=()=>this.openShop();ui.nextRaceButton.onclick=()=>this.nextEvent();ui.replayButton.onclick=()=>this.newChampionship();
      ui.soundButton.onclick=()=>{ui.soundButton.textContent=this.audio.toggle()?'SOUND ON':'SOUND OFF';};ui.fullscreenButton.onclick=()=>document.fullscreenElement?document.exitFullscreen?.():document.querySelector('#gameShell').requestFullscreen?.();
    }
    setKey(code,down){if(code==='ArrowUp'||code==='KeyW')keys.up=down;if(code==='ArrowDown'||code==='KeyS')keys.down=down;if(code==='ArrowLeft'||code==='KeyA')keys.left=down;if(code==='ArrowRight'||code==='KeyD')keys.right=down;if(code==='Space')keys.boost=down;}
    resize(){this.dpr=Math.min(devicePixelRatio||1,2);this.width=innerWidth;this.height=innerHeight;canvas.width=Math.round(this.width*this.dpr);canvas.height=Math.round(this.height*this.dpr);ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.buildVignetteCache();}
    show(name){for(const n of ['title','briefing','results','shop','champion'])ui[`${n}Screen`].classList.toggle('hidden',n!==name);this.mode=name;this.syncHud();}
    syncHud(){const racing=['race','countdown'].includes(this.mode),hide=!racing||this.hudHidden;ui.hud.classList.toggle('hidden',hide);ui.surfaceChip.classList.toggle('hidden',hide);ui.soundButton.classList.toggle('hidden',this.hudHidden&&racing);ui.fullscreenButton.classList.toggle('hidden',this.hudHidden&&racing);}
    buildVignetteCache(){if(!this.width||!this.height)return;const layer=document.createElement('canvas');layer.width=this.width;layer.height=this.height;const g=layer.getContext('2d'),v=g.createRadialGradient(this.width/2,this.height*.52,Math.min(this.width,this.height)*.28,this.width/2,this.height*.52,Math.max(this.width,this.height)*.72);v.addColorStop(0,'#0000');v.addColorStop(1,'#0208088c');g.fillStyle=v;g.fillRect(0,0,this.width,this.height);g.globalAlpha=.08;g.fillStyle='#000';for(let y=0;y<this.height;y+=4)g.fillRect(0,y,this.width,1);this.vignetteCanvas=layer;}
    buildStaticSceneCache(){
      const points=[...this.track.route,...this.track.props,...(this.track.shortcut?.points||[])];
      const minX=Math.floor(Math.min(...points.map(p=>p.x))-360),minY=Math.floor(Math.min(...points.map(p=>p.y))-360),maxX=Math.ceil(Math.max(...points.map(p=>p.x))+360),maxY=Math.ceil(Math.max(...points.map(p=>p.y))+360);
      const worldWidth=maxX-minX,worldHeight=maxY-minY,scale=Math.min(1,4096/worldWidth,4096/worldHeight),scene=document.createElement('canvas');scene.width=Math.ceil(worldWidth*scale);scene.height=Math.ceil(worldHeight*scale);
      const previous={ctx,width:this.width,height:this.height,camera:this.camera};this.width=worldWidth;this.height=worldHeight;this.camera={x:(minX+maxX)/2,y:(minY+maxY)/2,zoom:1,shake:0};ctx=scene.getContext('2d');ctx.setTransform(scale,0,0,scale,-minX*scale,-minY*scale);
      this.drawGround();this.drawWaterCrossings();this.drawTerrainCuts();this.drawTrack();this.drawFeatures();this.drawPropShadows();
      ctx=previous.ctx;this.width=previous.width;this.height=previous.height;this.camera=previous.camera;this.staticScene={canvas:scene,minX,minY,worldWidth,worldHeight,scale};
      this.buildPropSprites();
      const tunnel=this.track.def.tunnel;
      if(tunnel){const tunnelPoints=[];for(let f=tunnel.from;f<=tunnel.to;f+=.004)tunnelPoints.push(this.track.at(f*this.track.count));const roofMinX=Math.floor(Math.min(...tunnelPoints.map(p=>p.x))-ROAD_WIDTH),roofMinY=Math.floor(Math.min(...tunnelPoints.map(p=>p.y))-ROAD_WIDTH),roofMaxX=Math.ceil(Math.max(...tunnelPoints.map(p=>p.x))+ROAD_WIDTH),roofMaxY=Math.ceil(Math.max(...tunnelPoints.map(p=>p.y))+ROAD_WIDTH),roof=document.createElement('canvas');roof.width=roofMaxX-roofMinX;roof.height=roofMaxY-roofMinY;ctx=roof.getContext('2d');ctx.setTransform(1,0,0,1,-roofMinX,-roofMinY);this.drawTunnelRoof();ctx=previous.ctx;this.tunnelScene={canvas:roof,minX:roofMinX,minY:roofMinY,width:roofMaxX-roofMinX,height:roofMaxY-roofMinY};}else this.tunnelScene=null;
      ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    }
    buildPropSprites(){this.propSprites={};for(const type of ['tree','pine','bush','rock','stump','tyres','flowers','canyonRock','palm','barrel','board','marshal','hut']){const sprite=document.createElement('canvas');sprite.width=128;sprite.height=160;const previous=ctx;ctx=sprite.getContext('2d');ctx.translate(64,80);this.drawPropBody({x:0,y:0,scale:1,type});ctx=previous;this.propSprites[type]=sprite;}}
    newChampionship(){this.trackIndex=0;this.cash=250;this.results=[];this.upgrades={engine:0,gears:0,tyres:0,shell:0};this.showBriefing();}
    showBriefing(){this.track=new Track(TRACK_DEFS[this.trackIndex]);this.buildStaticSceneCache();const d=this.track.def;ui.eventNumber.parentElement.firstChild.textContent=d.theme==='canyon'?'CANYON WORLD · EVENT ':'FOREST WORLD · EVENT ';ui.eventNumber.textContent=String(this.trackIndex+1).padStart(2,'0');ui.trackName.textContent=d.name;ui.trackDescription.textContent=d.description;ui.surfaceList.textContent=d.surfaces;this.show('briefing');}
    startRace(){
      this.buildAIRouteData();this.aiRaceSerial++;
      this.cars=[new Car(true,0,'#f8782d'),new Car(false,1,'#35d6df'),new Car(false,2,'#f4d241'),new Car(false,3,'#d553d1'),new Car(false,4,'#e84b48')];this.player=this.cars[0];this.cars.forEach((c,i)=>{c.reset(this.track,i);if(!c.player){let seed=(this.track.def.seed^Math.imul(this.aiRaceSerial,0x9e3779b1)^Math.imul(c.number,0x85ebca6b))>>>0;seed=Math.imul(seed^(seed>>>16),0x7feb352d)>>>0;seed=Math.imul(seed^(seed>>>15),0x846ca68b)>>>0;seed=(seed^(seed>>>16))>>>0;c.aiMistakeSeed=seed;c.aiMistakeRoll=(seed>>>8)%100;c.aiMistakeIndex=this.aiMistakeZones[seed%Math.max(1,this.aiMistakeZones.length)]??seed%this.track.count;}});this.pickups=this.track.def.pickupFractions.map((f,i)=>({index:f*this.track.count,type:['cash','turbo','grip','repair','speed','cash','accel','turbo'][i%8],active:true,respawnLap:0,collectedBy:null,phase:i*.9}));this.cones=this.track.def.cones.map(([f,side],i)=>{const index=f*this.track.count,p=this.track.at(index),a=this.track.tangent(index),d=side*ROAD_WIDTH*.42,x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;return {x,y,homeX:x,homeY:y,index,vx:0,vy:0,spin:0,angle:i*.4,down:0};});this.particles=[];this.raceTime=0;this.countdown=3.2;this.raceCash=0;this.lapStarted=0;this.lapTimes=[];this.camera.x=this.player.x;this.camera.y=this.player.y;this.camera.zoom=1.38;this.show('countdown');this.banner('3');this.audio.effect('count');
    }
    resetPlayer(){const p=this.track.at(this.player.routeIndex);this.player.x=p.x;this.player.y=p.y;this.player.angle=this.track.tangent(this.player.routeIndex);this.player.vx=this.player.vy=this.player.angularVelocity=this.player.slipAngle=0;this.player.frontWheelSpeed=this.player.rearWheelSpeed=0;this.player.oilTimer=0;this.player.damage=Math.min(100,this.player.damage+3);this.banner('RESET');}
    nextEvent(){if(this.trackIndex>=TRACK_DEFS.length-1){const score=this.results.reduce((a,b)=>a+(6-b.place),0);ui.championshipSummary.textContent=`Championship score ${score}. Workshop balance $${this.cash}.`;this.show('champion');return;}this.trackIndex++;this.showBriefing();}
    openShop(){this.renderUpgrades();this.show('shop');}
    renderUpgrades(){const defs={engine:['E','ENGINE','Acceleration and top speed'],gears:['G','GEARS','Faster power delivery'],tyres:['T','TYRES','Grip on loose surfaces'],shell:['S','SHELL','Reduces impact damage']};ui.wallet.textContent=`$${this.cash}`;ui.upgradeGrid.innerHTML='';Object.entries(defs).forEach(([key,[icon,name,desc]])=>{const level=this.upgrades[key],price=180+level*170,card=document.createElement('article');card.className='upgrade-card';card.innerHTML=`<div class="upgrade-icon">${icon}</div><div class="upgrade-copy"><strong>${name}</strong><span>${desc}</span><div class="upgrade-pips">${'◆'.repeat(level)}${'◇'.repeat(3-level)}</div></div><button class="buy-button" ${level>=3||this.cash<price?'disabled':''}>${level>=3?'MAX':`$${price}`}</button>`;card.querySelector('button').onclick=()=>{if(this.cash>=price&&level<3){this.cash-=price;this.upgrades[key]++;this.audio.effect('buy');this.renderUpgrades();}};ui.upgradeGrid.append(card);});}
    buildAIRouteData(){const count=this.track.count;this.aiArcLength=new Float64Array(count+1);this.aiCurvature=new Float32Array(count);this.aiMistakeZones=[];for(let i=0;i<count;i++){const a=this.track.at(i),b=this.track.at(i+1);this.aiArcLength[i+1]=this.aiArcLength[i]+Math.hypot(b.x-a.x,b.y-a.y);}this.aiTrackLength=this.aiArcLength[count];for(let i=0;i<count;i++){const start=mod(i-8,count),turn=angleDelta(this.track.tangent(i-8),this.track.tangent(i+8)),span=this.distanceAhead(start,16);this.aiCurvature[i]=turn/Math.max(1,span);}let lastPeak=-24;for(let i=0;i<count;i++){const strength=Math.abs(this.aiCurvature[i]),before=Math.abs(this.aiCurvature[mod(i-4,count)]),after=Math.abs(this.aiCurvature[mod(i+4,count)]);if(strength>.006&&strength>=before&&strength>=after&&i-lastPeak>=16){this.aiMistakeZones.push(i);lastPeak=i;}}}
    distanceAhead(index,offset){const count=this.track.count,start=mod(Math.round(index),count),raw=Math.round(index)+Math.round(offset),laps=Math.floor(raw/count),end=mod(raw,count);return this.aiArcLength[end]+laps*this.aiTrackLength-this.aiArcLength[start];}
    banner(text){ui.raceBanner.textContent=text;ui.raceBanner.classList.remove('show');void ui.raceBanner.offsetWidth;ui.raceBanner.classList.add('show');}
    toast(text){ui.pickupToast.textContent=text;ui.pickupToast.classList.remove('show');void ui.pickupToast.offsetWidth;ui.pickupToast.classList.add('show');}
    frame(now){const frameMs=now-this.last,delta=Math.min(.1,frameMs/1000);this.last=now;this.perf.frameMs=frameMs;this.perf.fps=lerp(this.perf.fps,1000/Math.max(1,frameMs),.12);const updateStart=performance.now();this.accumulator+=delta;while(this.accumulator>=FIXED_STEP){this.update(FIXED_STEP);this.accumulator-=FIXED_STEP;}this.perf.updateMs=lerp(this.perf.updateMs,performance.now()-updateStart,.18);const renderStart=performance.now();this.render();this.perf.renderMs=lerp(this.perf.renderMs,performance.now()-renderStart,.18);requestAnimationFrame(t=>this.frame(t));}
    update(dt){this.time+=dt;this.camera.shake=Math.max(0,this.camera.shake-dt*3);const active=this.mode==='race'||this.mode==='countdown';this.audio.update(this.mode==='race',this.time,this.player?Math.hypot(this.player.vx,this.player.vy):0,this.player?.squeal||0,this.player?.surface.label||'DIRT',(this.player?.z||0)>1,this.mode==='race'&&keys.up?1:0);if(!active)return;if(this.mode==='countdown'){const old=Math.ceil(this.countdown);this.countdown-=dt;const now=Math.ceil(this.countdown);if(now!==old&&now>0){this.banner(String(now));this.audio.effect('count');}if(this.countdown<=0){this.mode='race';this.banner('GO!');this.audio.effect('go');}this.updateCamera(dt);return;}this.raceTime+=dt;for(const c of this.cars){if(c.finishTime!==null)continue;const input=c.player?this.playerInput(c):this.aiInput(c);this.updateCar(c,input,dt);this.updateProgress(c);}this.collideCars();this.updateCones(dt);this.updatePickups();this.updateParticles(dt);this.updateCamera(dt);this.updateHUD();if(this.player.lap>=LAPS)this.finishRace();}
    playerInput(c){return {throttle:keys.up?1:0,brake:keys.down?1:0,steer:(keys.right?1:0)-(keys.left?1:0),boost:keys.boost&&c.turbo>0};}
    aiInput(c){
      const speed=Math.hypot(c.vx,c.vy),count=this.track.count,baseIndex=Math.round(c.routeIndex),base=this.track.at(baseIndex),baseAngle=this.track.tangent(baseIndex),normalX=Math.cos(baseAngle),normalY=Math.sin(baseAngle);
      const profileLane=AI_LANES[c.number-2]||0,candidates=[-120,-78,-36,0,36,78,120];
      let peakOffset=Infinity,peakCurvature=0,peakStrength=0,targetSpeed=c.profile.topSpeed;
      for(let offset=0;offset<=108;offset+=6){const index=mod(baseIndex+offset,count),curvature=this.aiCurvature[index],strength=Math.abs(curvature);if(strength>peakStrength){peakStrength=strength;peakCurvature=curvature;peakOffset=offset;}if(strength>.00045){const cornerSpeed=clamp(Math.sqrt(138/strength),112,c.profile.topSpeed*.96),distance=this.distanceAhead(baseIndex,offset),brakingReach=Math.sqrt(cornerSpeed*cornerSpeed+2*178*distance);targetSpeed=Math.min(targetSpeed,brakingReach);}}
      let desiredLane=profileLane;
      if(peakStrength>.003){const turn=Math.sign(peakCurvature),outside=-turn*48,inside=turn*50;if(peakOffset>48)desiredLane+=outside;else if(peakOffset>12)desiredLane+=lerp(outside,inside,(48-peakOffset)/36);else desiredLane+=turn*22;}
      const ahead=[],behind=[];for(const rival of this.cars){if(rival===c)continue;const gap=mod(rival.routeIndex-c.routeIndex,count),distance=Math.hypot(rival.x-c.x,rival.y-c.y),lateral=(rival.x-base.x)*normalX+(rival.y-base.y)*normalY;if(gap>3&&gap<54&&distance<240&&Math.abs(rival.lap-c.lap)<=1)ahead.push({gap,distance,lateral});const back=mod(c.routeIndex-rival.routeIndex,count);if(back>3&&back<26&&distance<170&&Math.abs(rival.lap-c.lap)<=1)behind.push({gap:back,distance,lateral});}
      let pickupGap=Infinity;for(const pickup of this.pickups){if(!pickup.active)continue;const gap=mod(pickup.index-baseIndex,count);if(gap>5&&gap<54)pickupGap=Math.min(pickupGap,gap);}if(pickupGap<Infinity)desiredLane=lerp(desiredLane,0,.72);
      const hazards=[];for(const fraction of this.track.def.oils){const index=fraction*count,gap=mod(index-baseIndex,count);if(gap>1&&gap<52)hazards.push({gap,lateral:0,radius:62,type:'oil'});}for(const cone of this.cones){if(cone.down>0)continue;const gap=mod(cone.index-baseIndex,count);if(gap<40){const point=this.track.at(cone.index),angle=this.track.tangent(cone.index),nx=Math.cos(angle),ny=Math.sin(angle),lateral=(cone.homeX-point.x)*nx+(cone.homeY-point.y)*ny;hazards.push({gap,lateral,radius:56,type:'cone'});}}
      const defending=behind.length>0;let laneTarget=desiredLane,bestScore=Infinity;
      for(const candidate of candidates){let score=Math.abs(candidate-desiredLane)+Math.abs(candidate-c.aiLane)*.12;for(const rival of ahead){const clearance=Math.abs(candidate-rival.lateral);if(clearance<72)score+=(72-clearance)*(1+(54-rival.gap)/54);}for(const hazard of hazards){const clearance=Math.abs(candidate-hazard.lateral);if(clearance<hazard.radius)score+=(hazard.radius-clearance)*(1+(52-hazard.gap)/52)*2.2;}if(defending&&Math.abs(candidate-desiredLane)>40)score+=14;if(score<bestScore){bestScore=score;laneTarget=candidate;}}
      c.aiLane=lerp(c.aiLane,laneTarget,.075);
      const look=clamp(24+speed*.15,28,76),targetPoint=this.track.at(baseIndex+look),targetAngle=this.track.tangent(baseIndex+look),targetX=targetPoint.x+Math.cos(targetAngle)*c.aiLane,targetY=targetPoint.y+Math.sin(targetAngle)*c.aiLane,desired=Math.atan2(targetX-c.x,-(targetY-c.y));
      // AI asks for a more assertive pace and steering response, but remains
      // subject to the same shared surface and damage speed limits as the player.
      const steer=clamp((angleDelta(c.angle,desired)*2.18-c.slipAngle*.88-c.angularVelocity*.085)*1.25,-1,1);
      const surfaceLimit=c.surface===SURFACES.grass||c.surface===SURFACES.mud?1:(c.surface?.speed??1),maxSurfaceSpeed=c.profile.topSpeed*surfaceLimit*(1-c.damage*.0013)*(c.temp.speed>0?1.12:1);targetSpeed=Math.min(targetSpeed*1.5,maxSurfaceSpeed);
      const mistakeGap=mod(c.aiMistakeIndex-baseIndex,count);if(!c.aiMistakeDone&&c.aiMistakeRoll<27&&mistakeGap<10&&c.lap>=0){c.aiMistakeDone=true;c.aiMistakeTimer=.24;c.aiMistakes++;}
      let throttle=speed>targetSpeed+5?0:1,brake=speed>targetSpeed+24?clamp((speed-targetSpeed-8)/62,.12,.82):0;if(c.aiMistakeTimer>0){c.aiMistakeTimer=Math.max(0,c.aiMistakeTimer-1/60);throttle=0;c.aiLane=clamp(c.aiLane+((c.aiMistakeSeed&1)?1.25:-1.25),-118,118);}
      const nearHazard=hazards.some(h=>h.gap<28),straight=peakStrength<.0012&&!nearHazard&&pickupGap===Infinity,boost=c.turbo>42&&straight&&speed<Math.min(targetSpeed-24,c.profile.topSpeed*.86)&&Math.sin(this.raceTime*.31+c.number*1.73)>.68;
      c.aiTargetSpeed=targetSpeed;c.aiLaneTarget=laneTarget;c.aiUpcomingCurvature=peakCurvature;c.aiDefending=defending;c.aiOvertaking=ahead.some(r=>Math.abs(r.lateral-c.aiLane)<84);return {throttle,brake,steer,boost};
    }
    updateCar(c,input,dt){
      const near=this.track.nearest(c);c.routeIndex=near.index;c.onShortcut=near.shortcut;c.surface=near.distance<ROAD_WIDTH*.54?this.track.surfaceAt(near.index,near.shortcut):SURFACES.grass;
      const u=this.upgrades, playerBonus=c.player?1:0;const engine=1+playerBonus*u.engine*.045,gears=1+playerBonus*u.gears*.038,tyres=1+playerBonus*u.tyres*.065,shell=1-playerBonus*u.shell*.13;
      c.temp.grip=Math.max(0,c.temp.grip-dt);c.temp.speed=Math.max(0,c.temp.speed-dt);c.temp.accel=Math.max(0,c.temp.accel-dt);c.jumpLock=Math.max(0,c.jumpLock-dt);c.hitLock=Math.max(0,c.hitLock-dt);c.oilTimer=Math.max(0,c.oilTimer-dt);c.oilLock=Math.max(0,c.oilLock-dt);TerraPhysics.stepSuspension(c,dt);c.steerInput=input.steer;
      for(const f of this.track.def.oils){const o=this.track.at(f*this.track.count);if(c.oilLock<=0&&Math.hypot(c.x-o.x,c.y-o.y)<34&&Math.hypot(c.vx,c.vy)>75){c.oilTimer=1.25;c.oilLock=2;c.angularVelocity+=(c.number%2?1:-1)*(.62+Math.hypot(c.vx,c.vy)*.0015);if(c.player){this.audio.effect('oil');this.toast('OIL — COUNTER-STEER!');}}}
      const boost=input.boost&&c.turbo>0&&input.throttle>.2, damageFactor=1-c.damage*.0013, surfaceSpeedLimit=c.surface===SURFACES.grass||c.surface===SURFACES.mud?1:c.surface.speed, maxSpeed=c.profile.topSpeed*engine*surfaceSpeedLimit*damageFactor*(c.temp.speed>0?1.12:1)*(boost?1.18:1);
      const grip=c.profile.grip*c.surface.grip*tyres*(c.temp.grip>0?1.28:1)*(c.z>0?0.3:1);
      const physics=TerraPhysics.step(c,input,{maxSpeed,acceleration:c.profile.acceleration*gears,accelScale:c.surface.accel*(c.temp.accel>0?1.18:1),braking:c.profile.braking,steering:c.profile.steering,grip,drag:c.surface.drag,surfaceResistance:c.surface.resistance||0,airborne:c.z>0,boost,oilFactor:c.oilTimer>0?.1:1},dt);
      const {forward,lateral,speedRatio}=physics;TerraPhysics.updateWheelState(c,input,forward,c.slipAngle,dt);if(boost)c.turbo=Math.max(0,c.turbo-31*dt);else c.turbo=Math.min(100,c.turbo+5.5*dt);
      const fx=Math.sin(c.angle),fy=-Math.cos(c.angle);
      if(c.surface===SURFACES.gravel||c.surface===SURFACES.mud||c.surface===SURFACES.grass)c.angle+=Math.sin(this.raceTime*14+c.number)*(.0018+Math.abs(lateral)*.00005);
      if(this.inFractions(c.routeIndex,this.track.def.jumps,.012)&&c.jumpLock<=0&&Math.abs(forward)>135){c.zv=Math.max(c.zv,105);c.jumpLock=1.1;if(c.player)this.audio.effect('jump');}
      if(this.inFractions(c.routeIndex,this.track.def.bumps,.01)&&c.hitLock<=0&&Math.abs(forward)>110){c.zv=Math.max(c.zv,55);c.angle+=(c.number%2?1:-1)*.025;c.hitLock=.45;if(c.player&&c.z===0)this.audio.effect('jump');}
      const impactSpeed=TerraPhysics.stepVertical(c,dt);if(impactSpeed>35){c.suspension=-1.15;c.suspensionVelocity=0;if(impactSpeed>85){this.camera.shake=c.player?.22:this.camera.shake;c.damage=clamp(c.damage+Math.max(0,(impactSpeed-125)*.012)*shell,0,100);}if(c.player)this.audio.effect('land');}
      if(c.player&&Math.abs(forward)>35){const realSlide=Math.abs(c.slipAngle)>.075&&Math.hypot(c.vx,c.vy)>90,marking=realSlide||c.squeal>.1||c.oilTimer>0||boost,rearX=c.x-fx*25,rearY=c.y-fy*25,trailPoint={x:rearX,y:rearY,angle:c.angle,t:this.raceTime,surface:c.surface,boost,marking,slide:Math.abs(c.slipAngle)};if(c.trailCount<150){c.trail[(c.trailHead+c.trailCount)%150]=trailPoint;c.trailCount++;}else{c.trail[c.trailHead]=trailPoint;c.trailHead=(c.trailHead+1)%150;}const loose=c.surface===SURFACES.dirt||c.surface===SURFACES.gravel||c.surface===SURFACES.mud||c.surface===SURFACES.water||c.surface===SURFACES.grass;if(loose&&this.rng.next()<.28+c.squeal*.62){const rx=Math.cos(c.angle)*13,ry=Math.sin(c.angle)*13,type=c.surface===SURFACES.water?'splash':'dust';this.spawnParticle(rearX+rx,rearY+ry,c.surface.dust,type);if(realSlide)this.spawnParticle(rearX-rx,rearY-ry,c.surface.dust,type);}}
    }
    inFractions(index,list,r){const f=index/this.track.count;return list.some(x=>Math.abs(f-x)<r);}
    updateProgress(c){const old=c._lastIndex??c.routeIndex,curr=c.routeIndex;c._lastIndex=curr;if(old>this.track.count*.84&&curr<this.track.count*.16&&c.speed>25){c.lap++;if(c.player){const lapTime=this.raceTime-this.lapStarted;this.lapStarted=this.raceTime;if(c.lap>0)this.lapTimes.push(lapTime);if(c.lap<LAPS)this.banner(`LAP ${c.lap+1}`);}for(const p of this.pickups)TerraPickups.respawnOnLap(p,c);}if(old<this.track.count*.16&&curr>this.track.count*.84&&c.speed<0)c.lap--;if(c.lap>=LAPS&&c.finishTime===null)c.finishTime=this.raceTime;}
    collideCars(){for(let i=0;i<this.cars.length;i++)for(let j=i+1;j<this.cars.length;j++){const a=this.cars[i],b=this.cars[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0&&d<35&&Math.abs(a.z-b.z)<18){const nx=dx/d,ny=dy/d,overlap=(35-d)*.52;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;const hit=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(hit>0){a.vx-=nx*hit*.36;a.vy-=ny*hit*.36;b.vx+=nx*hit*.36;b.vy+=ny*hit*.36;a.angularVelocity-=hit*.006*(ny*Math.sin(a.angle)-nx*Math.cos(a.angle));b.angularVelocity+=hit*.006*(ny*Math.sin(b.angle)-nx*Math.cos(b.angle));const amount=Math.abs(hit)*.018;if(a.player){a.damage=clamp(a.damage+amount*(1-this.upgrades.shell*.13),0,100);this.camera.shake=.22;this.audio.effect('hit');}if(b.player){b.damage=clamp(b.damage+amount*(1-this.upgrades.shell*.13),0,100);this.camera.shake=.22;this.audio.effect('hit');}}}}}
    updateCones(dt){for(const cone of this.cones){if(cone.down>0){cone.x+=cone.vx*dt;cone.y+=cone.vy*dt;cone.angle+=cone.spin*dt;cone.vx*=Math.pow(.965,dt*60);cone.vy*=Math.pow(.965,dt*60);cone.spin*=Math.pow(.97,dt*60);cone.down-=dt;if(cone.down<=0){cone.x=cone.homeX;cone.y=cone.homeY;cone.vx=cone.vy=cone.spin=0;}continue;}for(const c of this.cars){if(TerraPhysics.hitCone(c,cone,c.player?1-this.upgrades.shell*.13:.64)){if(c.player){this.audio.effect('cone');this.camera.shake=.1;}break;}}}}
    updatePickups(){for(const p of this.pickups){if(!p.active)continue;const point=this.track.at(p.index),collector=TerraPickups.selectCollector(this.cars,point,42);if(!TerraPickups.claim(p,collector))continue;this.awardPickup(p,collector,point);}}
    awardPickup(p,c,point){const labels={cash:'CASH +$100',turbo:'TURBO CHARGE',repair:'DAMAGE REPAIRED',grip:'GRIP BOOST',speed:'MAX SPEED BOOST',accel:'ACCELERATION BOOST'},colors={cash:'#ffd552',turbo:'#ff7342',grip:'#57e59b',repair:'#72ddeb',speed:'#ce67e5',accel:'#f2a643'};if(p.type==='cash'){c.pickupCash+=100;if(c.player)this.raceCash+=100;}else if(p.type==='turbo')c.turbo=Math.min(100,c.turbo+55);else if(p.type==='repair')c.damage=Math.max(0,c.damage-28);else if(p.type==='grip')c.temp.grip=7;else if(p.type==='speed')c.temp.speed=6;else if(p.type==='accel')c.temp.accel=7;if(c.player)this.toast(labels[p.type]);else this.toast(`RIVAL ${c.number} GOT ${p.type.toUpperCase()}`);this.audio.effect(p.type==='cash'?'cash':p.type==='repair'?'repair':'pickup');this.spawnPickupBurst(point.x,point.y,colors[p.type]);}
    spawnParticle(x,y,color,type){const n=type==='splash'?2:1;for(let i=0;i<n&&this.particles.length<this.maxParticles;i++){const p=this.particlePool.pop()||{};p.x=x+this.rng.range(-8,8);p.y=y+this.rng.range(-8,8);p.vx=this.rng.range(-18,18);p.vy=this.rng.range(-18,18);p.life=this.rng.range(.25,.55);p.size=this.rng.range(3,8);p.color=color;p.type=type;this.particles.push(p);}}
    spawnPickupBurst(x,y,color){for(let i=0;i<8&&this.particles.length<this.maxParticles;i++){const a=i/8*TAU,speed=this.rng.range(35,75),p=this.particlePool.pop()||{};p.x=x;p.y=y;p.vx=Math.cos(a)*speed;p.vy=Math.sin(a)*speed;p.life=.42;p.size=this.rng.range(3,6);p.color=color;p.type='pickup';p.phase=i*.17;this.particles.push(p);}}
    updateParticles(dt){for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.size+=dt*9;if(p.life<=0){this.particles[i]=this.particles[this.particles.length-1];this.particles.pop();this.particlePool.push(p);}}}
    updateCamera(dt){if(!this.player)return;const speed=Math.hypot(this.player.vx,this.player.vy),lead=clamp(speed*.3,28,100),tx=this.player.x+Math.sin(this.player.angle)*lead,ty=this.player.y-Math.cos(this.player.angle)*lead,t=1-Math.exp(-dt*5);this.camera.x=lerp(this.camera.x,tx,t);this.camera.y=lerp(this.camera.y,ty,t);const targetZoom=clamp(1.52-speed*.00055,1.29,1.49);this.camera.zoom=lerp(this.camera.zoom,targetZoom,1-Math.exp(-dt*2.4));}
    updateHUD(){const ranking=[...this.cars].sort((a,b)=>(b.lap+b.routeIndex/this.track.count)-(a.lap+a.routeIndex/this.track.count)),place=ranking.indexOf(this.player)+1;ui.place.textContent=`${place} / 5`;ui.lap.textContent=`${clamp(this.player.lap+1,1,LAPS)} / ${LAPS}`;ui.speed.textContent=String(Math.round(Math.hypot(this.player.vx,this.player.vy))).padStart(3,'0');ui.damageFill.style.width=`${this.player.damage}%`;ui.turboFill.style.width=`${this.player.turbo}%`;ui.timer.textContent=formatTime(this.raceTime);ui.surfaceChip.textContent=this.player.surface.label;ui.surfaceChip.style.borderColor=this.player.surface===SURFACES.tarmac?'#aeb9ba':this.player.surface===SURFACES.water?'#4ed6e0':this.player.surface===SURFACES.mud?'#d27b4b':'#55f1e6';}
    finishRace(){const ranking=[...this.cars].sort((a,b)=>(b.lap+b.routeIndex/this.track.count)-(a.lap+a.routeIndex/this.track.count)),place=ranking.indexOf(this.player)+1,base=[0,900,600,400,250,150][place],best=this.lapTimes.length?Math.min(...this.lapTimes):this.raceTime,bonus=base+(best<28?150:0),total=bonus+this.raceCash;this.cash+=total;this.results.push({place,time:this.raceTime,best});ui.resultPlace.textContent=`${ordinal(place)} PLACE`;ui.resultTime.textContent=formatTime(this.raceTime);ui.bestLap.textContent=formatTime(best);ui.finishBonus.textContent=`$${bonus}`;ui.pickupCash.textContent=`$${this.raceCash}`;ui.totalCash.textContent=`$${total}`;this.audio.effect('finish');this.show('results');}

    render(){this.perf.visibleObjects=0;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.width,this.height);ctx.fillStyle='#24472f';ctx.fillRect(0,0,this.width,this.height);ctx.save();const shake=this.camera.shake?Math.sin(this.time*73)*this.camera.shake*12:0;ctx.translate(this.width*.5+shake,this.height*.58+shake*.5);ctx.scale(this.camera.zoom,this.camera.zoom);ctx.translate(-this.camera.x,-this.camera.y);if(this.staticScene){const s=this.staticScene;ctx.drawImage(s.canvas,s.minX,s.minY,s.worldWidth,s.worldHeight);}else{this.drawGround();this.drawWaterCrossings();this.drawTerrainCuts();this.drawTrack();this.drawFeatures();this.drawPropShadows();}this.drawCones();this.drawTrails();this.drawPickups();this.drawActors();this.drawParticles();if(this.tunnelScene){const s=this.tunnelScene;ctx.drawImage(s.canvas,s.minX,s.minY,s.width,s.height);}if(this.debug)this.drawDebug();ctx.restore();this.drawVignette();if(this.debug)this.drawPerformanceDebug();}
    visible(x,y,pad=120){return Math.abs(x-this.camera.x)<this.width/this.camera.zoom*.65+pad&&Math.abs(y-this.camera.y)<this.height/this.camera.zoom*.65+pad;}
    drawGround(){const canyon=this.track.def.theme==='canyon';ctx.fillStyle=canyon?'#69573f':'#315f35';ctx.fillRect(-3000,-3000,8000,8000);if(canyon){const dirt=this.texturePattern('dirt');if(dirt){ctx.globalAlpha=.3;ctx.fillStyle=dirt;ctx.fillRect(-3000,-3000,8000,8000);ctx.globalAlpha=1;}}const spanX=this.width/this.camera.zoom*.7+100,spanY=this.height/this.camera.zoom*.7+100,startX=Math.floor((this.camera.x-spanX)/64)*64,startY=Math.floor((this.camera.y-spanY)/64)*64;for(let x=startX;x<this.camera.x+spanX;x+=64)for(let y=startY;y<this.camera.y+spanY;y+=64){const h=Math.abs(Math.sin(x*12.9898+y*78.233)*43758.5453)%1,hx=Math.abs(Math.sin(x*17.123+y*68.941)*19341.117)%1,hy=Math.abs(Math.sin(x*83.151-y*29.527)*29371.731)%1;if(canyon){ctx.fillStyle=h>.7?'#806a49':'#5d4d39';ctx.beginPath();ctx.ellipse(x+hx*64,y+hy*64,9+h*8,5+hx*4,hy*.7,0,TAU);ctx.fill();ctx.fillStyle='#a48961';ctx.beginPath();ctx.ellipse(x+hy*64,y+hx*64,4+h*5,2+hy*2,hx*.6,0,TAU);ctx.fill();continue;}ctx.fillStyle=h>.6?'#3c713a':'#2c5630';ctx.beginPath();ctx.ellipse(x+h*37,y+(1-h)*43,12+h*10,6+h*4,-.4,0,TAU);ctx.fill();ctx.strokeStyle='#548348';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+15,y+24);ctx.lineTo(x+11,y+14);ctx.moveTo(x+15,y+24);ctx.lineTo(x+21,y+16);ctx.stroke();}}
    pathRoute(width,color){ctx.beginPath();this.track.route.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
    pathRouteOffset(width,color,dx,dy){ctx.beginPath();this.track.route.forEach((p,i)=>i?ctx.lineTo(p.x+dx,p.y+dy):ctx.moveTo(p.x+dx,p.y+dy));ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
    pathSide(offset,width,color){ctx.beginPath();this.track.route.forEach((p,i)=>{const a=this.track.tangent(i),x=p.x+Math.cos(a)*offset,y=p.y+Math.sin(a)*offset;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
    strokeSegment(from,to,offset,width,color,dx=0,dy=0){ctx.beginPath();let n=0;for(let f=from;f<=to;f+=.003){const i=f*this.track.count,p=this.track.at(i),a=this.track.tangent(i),x=p.x+Math.cos(a)*offset+dx,y=p.y+Math.sin(a)*offset+dy;n++?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
    drawWaterCrossings(){const crossings=[...this.track.def.zones.filter(z=>z.type==='water').map(z=>(z.from+z.to)/2),...(this.track.def.waterCrossings||[])];for(const f of crossings){const index=f*this.track.count,p=this.track.at(index),a=this.track.tangent(index);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='#142f35';ctx.fillRect(-278,-151,556,302);ctx.fillStyle='#604832';ctx.fillRect(-270,-143,540,286);ctx.fillStyle='#292f29';ctx.fillRect(-260,-132,520,264);const water=ctx.createLinearGradient(0,-122,0,122);water.addColorStop(0,'#285e65');water.addColorStop(.5,'#34777d');water.addColorStop(1,'#1f5059');ctx.fillStyle=water;ctx.fillRect(-250,-119,500,238);ctx.fillStyle='#152e31aa';ctx.fillRect(-250,103,500,16);ctx.fillStyle='#8b6944';ctx.fillRect(-258,-132,516,10);ctx.fillStyle='#bb8b56';ctx.fillRect(-250,-122,500,4);ctx.strokeStyle='#73b9b0aa';ctx.lineWidth=3;for(let y=-92;y<92;y+=26){ctx.beginPath();ctx.moveTo(-238,y);ctx.bezierCurveTo(-115,y-9,58,y+11,236,y-3);ctx.stroke();}ctx.globalAlpha=.28;ctx.fillStyle='#d7eee4';for(let x=-210;x<230;x+=86){ctx.beginPath();ctx.ellipse(x,-48+(x%3)*21,34,3,-.08,0,TAU);ctx.fill();}ctx.restore();}}
    drawTerrainCuts(){for(const [from,to,side,type] of this.track.def.cuts||[]){const edge=side*ROAD_WIDTH*.67,rock=type==='rock';this.strokeSegment(from,to,edge,54,'#17231e',8,10);this.strokeSegment(from,to,edge,48,rock?'#45392f':'#5a402d',4,6);this.strokeSegment(from,to,edge,35,rock?'#6f6555':'#87613d');this.strokeSegment(from,to,edge-side*5,13,rock?'#9c9277':'#b88652',-2,-3);this.strokeSegment(from,to,edge-side*13,8,rock?'#4b5147':'#436b38');for(let f=from+.01;f<to;f+=.022){const i=f*this.track.count,p=this.track.at(i),a=this.track.tangent(i),x=p.x+Math.cos(a)*edge,y=p.y+Math.sin(a)*edge;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeStyle=rock?'#b7aa88':'#c6965f';ctx.globalAlpha=.55;ctx.lineWidth=2;for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(-15+k*7,-8);ctx.lineTo(12+k*5,7);ctx.stroke();}ctx.restore();}ctx.globalAlpha=1;}if(this.track.def.theme==='canyon')this.drawCanyonWalls();}
    drawCanyonWalls(){for(const [from,to,side,distance=ROAD_WIDTH*.62+56] of this.track.def.walls||[]){const offset=side*distance;this.strokeSegment(from,to,offset,106,'#1c1c18b8',12,18);this.strokeSegment(from,to,offset,91,'#403d33');this.strokeSegment(from,to,offset-side*7,70,'#686454');this.strokeSegment(from,to,offset-side*18,47,'#83795f');this.strokeSegment(from,to,offset-side*31,9,'#b4a27c');for(let f=from+.012;f<to;f+=.026){const p=this.track.at(f*this.track.count),a=this.track.tangent(f*this.track.count),x=p.x+Math.cos(a)*offset,y=p.y+Math.sin(a)*offset;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeStyle='#393a32';ctx.globalAlpha=.65;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-22,-18);ctx.lineTo(-7,-3);ctx.lineTo(4,-14);ctx.moveTo(8,11);ctx.lineTo(24,25);ctx.stroke();ctx.restore();}ctx.globalAlpha=1;}}
    texturePattern(type){const image=canyonTextures[type];return image?.complete&&image.naturalWidth?ctx.createPattern(image,'repeat'):null;}
    drawTrack(){
      this.pathRouteOffset(ROAD_WIDTH+46,'#10231da0',9,11);
      this.pathRouteOffset(ROAD_WIDTH+36,'#352d26',5,7);
      this.pathRoute(ROAD_WIDTH+34,'#263a2e');
      const canyon=this.track.def.theme==='canyon';
      this.pathRoute(ROAD_WIDTH+26,canyon?'#423b30':'#4e392a');
      this.pathRouteOffset(ROAD_WIDTH+19,canyon?'#a18459':'#b27c4c',-3,-3);
      this.pathRoute(ROAD_WIDTH+15,canyon?'#514536':'#6b4931');
      this.pathRoute(ROAD_WIDTH,canyon?'#454541':SURFACES.dirt.color);
      if(canyon){const pattern=this.texturePattern('tarmac');if(pattern){ctx.globalAlpha=.36;this.pathRoute(ROAD_WIDTH,pattern);ctx.globalAlpha=1;}}
      this.pathRouteOffset(ROAD_WIDTH-12,canyon?'#c4ad7d28':'#a46b4144',-2,-2);
      for(const z of this.track.def.zones)this.strokeZone(z);
      if(this.track.shortcut)this.drawShortcut();
      this.pathSide(-ROAD_WIDTH*.42,5,canyon?'#d8c29399':'#d4a06455');this.pathSide(ROAD_WIDTH*.42,6,canyon?'#241f1a99':'#3c2b2388');
      this.pathSide(-23,13,canyon?'#b29a6e24':'#5b3d2b30');this.pathSide(23,13,canyon?'#211e1a30':'#5b3d2b30');
      for(const s of this.track.specks){if(!this.visible(s.x,s.y))continue;ctx.globalAlpha=canyon?.22:.48;ctx.fillStyle=s.light?(canyon?'#ddc18a':'#c0925e'):(canyon?'#342b22':'#573b2d');ctx.beginPath();ctx.ellipse(s.x,s.y,s.r*2.2,s.r,.2,0,TAU);ctx.fill();}
      ctx.globalAlpha=1;this.drawCornerWear();if(canyon){this.drawCanyonRacingLine();this.drawCanyonKerbs();this.drawCanyonBarriers();}this.pathRoute(3,canyon?'#e3cf9e42':'#e3b36a2e');ctx.setLineDash([34,46]);this.pathRoute(3,canyon?'#29272055':'#3d302966');ctx.setLineDash([]);
    }
    strokeZone(z){const surface=SURFACES[z.type],canyon=this.track.def.theme==='canyon';this.strokeSegment(z.from,z.to,0,ROAD_WIDTH-8,surface.edge,4,5);this.strokeSegment(z.from,z.to,0,ROAD_WIDTH-18,surface.color);if(canyon&&z.type!=='water'){const pattern=this.texturePattern(z.type==='tarmac'?'tarmac':z.type==='gravel'?'gravel':'dirt');if(pattern){ctx.globalAlpha=z.type==='tarmac'?.32:.28;this.strokeSegment(z.from,z.to,0,ROAD_WIDTH-18,pattern);ctx.globalAlpha=1;}}this.strokeSegment(z.from,z.to,0,ROAD_WIDTH-34,z.type==='water'?'#4b929388':z.type==='tarmac'?'#64707355':'#ffffff12',-2,-2);if(z.type==='gravel'){ctx.strokeStyle=canyon?'#e4d0a866':'#d7c9a966';ctx.lineWidth=5;ctx.setLineDash([3,13]);this.strokeSegment(z.from,z.to,0,5,canyon?'#e4d0a866':'#d7c9a966');ctx.setLineDash([]);}}
    drawCanyonRacingLine(){for(const [from,to,side] of this.track.def.racingLine||[]){this.strokeSegment(from,to,side,21,'#231f1b38');this.strokeSegment(from,to,side-7,5,'#211f1b48');this.strokeSegment(from,to,side+7,5,'#211f1b48');this.strokeSegment(from,to,side-12,2,'#dbc89b25');}}
    drawCanyonKerbs(){for(const [from,to,side] of this.track.def.kerbs||[]){const offset=side*ROAD_WIDTH*.435;this.strokeSegment(from,to,offset,34,'#181a17a0',7,7);this.strokeSegment(from,to,offset,31,'#c63e32');ctx.save();ctx.lineWidth=22;ctx.lineCap='butt';ctx.lineJoin='round';ctx.setLineDash([23,23]);ctx.lineDashOffset=0;this.strokeSegment(from,to,offset,22,'#f2e4c7');ctx.setLineDash([]);ctx.restore();this.strokeSegment(from,to,offset-side*15,3,'#fff2d488');}}
    drawCanyonBarriers(){for(const [from,to,side] of this.track.def.barriers||[]){const offset=side*(ROAD_WIDTH*.62+10);this.strokeSegment(from,to,offset,34,'#191a17aa',7,9);this.strokeSegment(from,to,offset,29,'#392f27');this.strokeSegment(from,to,offset,22,'#c54335');ctx.save();ctx.lineWidth=16;ctx.lineCap='butt';ctx.setLineDash([19,29]);this.strokeSegment(from,to,offset,16,'#f0e1c1');ctx.setLineDash([]);ctx.restore();this.strokeSegment(from,to,offset-side*11,3,'#e1cba0');}}
    drawCornerWear(){for(const w of this.track.cornerWear){if(!this.visible(w.x,w.y,60))continue;ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.a);ctx.globalAlpha=clamp(w.curve*4,.2,.58);ctx.fillStyle='#d0a065';ctx.beginPath();ctx.ellipse(0,0,10+w.r*2,3+w.r*.5,.18,0,TAU);ctx.fill();ctx.fillStyle='#4b3327';ctx.beginPath();ctx.ellipse(-5,1,4+w.r,1.5,0,0,TAU);ctx.fill();ctx.restore();}ctx.globalAlpha=1;}
    drawShortcut(){const s=this.track.shortcut;ctx.beginPath();s.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#25392d';ctx.lineWidth=142;ctx.stroke();ctx.strokeStyle='#422f27';ctx.lineWidth=128;ctx.stroke();ctx.strokeStyle='#654432';ctx.lineWidth=112;ctx.stroke();for(let j=14;j<s.points.length-8;j+=20){const p=s.points[j],q=s.points[j+2],a=Math.atan2(q.x-p.x,-(q.y-p.y));ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='#e4b54f';ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(-9,2);ctx.lineTo(-3,1);ctx.lineTo(0,11);ctx.lineTo(3,1);ctx.lineTo(9,2);ctx.closePath();ctx.fill();ctx.restore();}}
    drawFeatures(){this.drawStart();this.drawBridge();this.drawRamps();if(this.track.def.theme!=='canyon')this.drawFences();this.drawOils();}
    drawStart(){const p=this.track.at(0),a=this.track.tangent(0);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);for(let x=-ROAD_WIDTH/2;x<ROAD_WIDTH/2;x+=16)for(let y=-12;y<12;y+=12){ctx.fillStyle=((Math.floor(x/16)+Math.floor(y/12))&1)?'#f4e7bd':'#172629';ctx.fillRect(x,y,16,12);}ctx.restore();if(this.track.def.theme==='canyon')this.drawCanyonGantry(p,a);}
    drawCanyonGantry(p,a){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='#15181488';ctx.fillRect(-220,-50,440,34);for(const side of [-1,1]){ctx.fillStyle='#28251f';ctx.fillRect(side*183-10,-78,20,88);ctx.fillStyle='#bdb08c';ctx.fillRect(side*183-13,-78,6,85);ctx.fillStyle='#5d5040';ctx.fillRect(side*183-23,-4,46,12);}ctx.fillStyle='#43392e';ctx.fillRect(-214,-94,428,27);ctx.fillStyle='#8b3a2d';ctx.fillRect(-205,-91,410,19);ctx.fillStyle='#e2cda0';ctx.fillRect(-204,-74,408,4);ctx.fillStyle='#182321';ctx.fillRect(-89,-100,178,28);ctx.strokeStyle='#d5b879';ctx.lineWidth=2;ctx.strokeRect(-89,-100,178,28);ctx.fillStyle='#f1e3bd';ctx.font='900 16px Courier New';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('CANYON RUN',0,-86);for(const side of [-1,1]){ctx.fillStyle=side<0?'#d84b3b':'#f1e7c9';ctx.fillRect(side*151,-90,28,15);}ctx.restore();}
    drawBridge(){const n=this.track.def.bridge*this.track.count,p=this.track.at(n),a=this.track.tangent(n),w=ROAD_WIDTH*.44;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);
      ctx.fillStyle='#101a18aa';ctx.fillRect(-w-12,-104,w*2+24,222);
      ctx.fillStyle='#34271f';for(const x of [-w-10,w+2])for(const y of [-74,48])ctx.fillRect(x,y,13,39);
      ctx.fillStyle='#211a17';for(let y=-78;y<82;y+=42)ctx.fillRect(-w-8,y,w*2+16,9);
      ctx.fillStyle='#493225';ctx.fillRect(-w-8,-100,w*2+16,204);ctx.fillStyle='#291e19';ctx.fillRect(-w-8,96,w*2+16,12);ctx.fillRect(w, -100,8,208);
      for(const end of [-1,1]){ctx.beginPath();ctx.moveTo(-w,end*98);ctx.lineTo(-ROAD_WIDTH*.49,end*130);ctx.lineTo(ROAD_WIDTH*.49,end*130);ctx.lineTo(w,end*98);ctx.closePath();ctx.fillStyle='#62442d';ctx.fill();ctx.strokeStyle='#bd8751';ctx.lineWidth=3;ctx.stroke();}
      ctx.fillStyle='#765034';ctx.fillRect(-w,-96,w*2,192);
      for(let y=-92;y<96;y+=15){ctx.fillStyle=(Math.floor(y/15)&1)?'#895b37':'#a26f43';ctx.fillRect(-w+3,y,w*2-6,12);ctx.strokeStyle='#c28d55';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w+5,y+2);ctx.lineTo(w-5,y+2);ctx.stroke();}
      ctx.fillStyle='#2c201a';ctx.fillRect(-w-8,-100,9,204);ctx.fillRect(w-1,-100,9,204);ctx.fillStyle='#c18d56';ctx.fillRect(-w-5,-100,4,197);ctx.fillRect(w+1,-100,4,197);
      for(const side of [-1,1]){ctx.strokeStyle='#3a281f';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(side*(w+5),-99);ctx.lineTo(side*(w+5),102);ctx.stroke();ctx.strokeStyle='#d1a061';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(side*(w+3),-96);ctx.lineTo(side*(w+3),96);ctx.stroke();}
      ctx.restore();}
    drawRamps(){for(const f of this.track.def.jumps){const p=this.track.at(f*this.track.count),a=this.track.tangent(f*this.track.count);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='#11171455';ctx.beginPath();ctx.ellipse(0,5,45,23,0,0,TAU);ctx.fill();ctx.fillStyle='#34352b';ctx.fillRect(-39,-18,78,36);ctx.fillStyle='#77705a';ctx.fillRect(-36,-15,72,30);ctx.fillStyle='#a49a76';ctx.fillRect(-34,-14,68,4);ctx.fillStyle='#443d30';ctx.fillRect(-34,10,68,4);ctx.strokeStyle='#c9b985';ctx.globalAlpha=.62;ctx.lineWidth=2;ctx.setLineDash([9,8]);ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(24,0);ctx.stroke();ctx.setLineDash([]);ctx.restore();}}
    drawFences(){for(const [from,to,side] of [[.12,.2,-1],[.3,.37,1],[.75,.83,-1]])for(let f=from;f<to;f+=.012){const p=this.track.at(f*this.track.count),a=this.track.tangent(f*this.track.count),d=ROAD_WIDTH*.62,x=p.x+Math.cos(a)*d*side,y=p.y+Math.sin(a)*d*side,q=this.track.at((f+.012)*this.track.count),b=this.track.tangent((f+.012)*this.track.count),x2=q.x+Math.cos(b)*d*side,y2=q.y+Math.sin(b)*d*side;ctx.strokeStyle='#10201866';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x+6,y+10);ctx.lineTo(x2+6,y2+10);ctx.stroke();ctx.fillStyle='#10201877';ctx.beginPath();ctx.ellipse(x+5,y+10,10,5,.2,0,TAU);ctx.fill();ctx.strokeStyle='#4c3425';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x,y+19);ctx.stroke();ctx.fillStyle='#c29258';ctx.fillRect(x-7,y-11,14,7);ctx.strokeStyle='#a37142';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x2,y2-5);ctx.moveTo(x,y+8);ctx.lineTo(x2,y2+8);ctx.stroke();ctx.strokeStyle='#e0b574';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x2,y2-7);ctx.stroke();}}
    drawOils(){for(const f of this.track.def.oils){const p=this.track.at(f*this.track.count),a=this.track.tangent(f*this.track.count);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='#11171bd9';ctx.beginPath();ctx.ellipse(0,0,38,21,.1,0,TAU);ctx.ellipse(-29,7,14,8,-.2,0,TAU);ctx.ellipse(29,-5,13,7,.3,0,TAU);ctx.fill();ctx.strokeStyle='#6d858c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-5,-3,20,6,-.25,0,TAU);ctx.stroke();ctx.restore();}}
    drawCones(){for(const c of this.cones){if(!this.visible(c.x,c.y,60))continue;this.perf.visibleObjects++;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.angle);ctx.fillStyle='#0a111177';ctx.beginPath();ctx.ellipse(4,10,11,5,0,0,TAU);ctx.fill();ctx.fillStyle='#f06c2f';ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(-8,8);ctx.lineTo(8,8);ctx.closePath();ctx.fill();ctx.fillStyle='#f5e2af';ctx.fillRect(-6,-1,12,4);ctx.fillStyle='#d14c29';ctx.fillRect(-11,7,22,5);ctx.restore();}}
    drawTunnelRoof(){const t=this.track.def.tunnel;if(!t)return;const points=[];for(let f=t.from;f<=t.to;f+=.004)points.push(this.track.at(f*this.track.count));const roofPath=(dx=0,dy=0)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x+dx,p.y+dy):ctx.moveTo(p.x+dx,p.y+dy));};roofPath(10,12);ctx.strokeStyle='#09120faa';ctx.lineWidth=ROAD_WIDTH+54;ctx.lineCap='butt';ctx.lineJoin='round';ctx.stroke();roofPath(4,6);ctx.strokeStyle='#25281f';ctx.lineWidth=ROAD_WIDTH+46;ctx.stroke();roofPath();ctx.strokeStyle='#4b4b39';ctx.lineWidth=ROAD_WIDTH+34;ctx.stroke();roofPath(-3,-3);ctx.strokeStyle='#72705a';ctx.lineWidth=ROAD_WIDTH+20;ctx.stroke();roofPath();ctx.strokeStyle='#40533b';ctx.lineWidth=ROAD_WIDTH+10;ctx.stroke();ctx.strokeStyle='#75906477';ctx.lineWidth=3;ctx.setLineDash([18,13]);ctx.stroke();ctx.setLineDash([]);for(const [f,end] of [[t.from,1],[t.to,-1]]){const p=this.track.at(f*this.track.count),a=this.track.tangent(f*this.track.count);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='#090e0d';ctx.beginPath();ctx.ellipse(0,end*3,ROAD_WIDTH*.5,27,0,0,TAU);ctx.fill();ctx.fillStyle='#302a23';ctx.fillRect(-ROAD_WIDTH*.58,-4,15,29);ctx.fillRect(ROAD_WIDTH*.58-15,-4,15,29);ctx.strokeStyle='#201b17';ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(-ROAD_WIDTH*.57,10);ctx.quadraticCurveTo(0,-38,ROAD_WIDTH*.57,10);ctx.stroke();ctx.strokeStyle='#a17c50';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-ROAD_WIDTH*.57,5);ctx.quadraticCurveTo(0,-31,ROAD_WIDTH*.57,5);ctx.stroke();ctx.fillStyle='#10171588';ctx.fillRect(-ROAD_WIDTH*.53,8,ROAD_WIDTH*1.06,20);ctx.restore();}}
    drawTrails(){if(!this.player)return;const {trail,trailHead,trailCount}=this.player;for(let i=1;i<trailCount;i++){const a=trail[(trailHead+i-1)%150],b=trail[(trailHead+i)%150],age=this.raceTime-b.t;if(age>2||(!b.marking&&age>.38)||!this.visible(b.x,b.y,80))continue;ctx.globalAlpha=(1-age/2)*(b.marking?clamp(.58+(b.slide||0)*.7,.58,.86):.22);ctx.strokeStyle=b.boost?'#ffd980':b.surface===SURFACES.water?'#a1e8df':'#211f1b';ctx.lineWidth=b.boost?5:b.marking?4:3;const arx=Math.cos(a.angle)*13,ary=Math.sin(a.angle)*13,brx=Math.cos(b.angle)*13,bry=Math.sin(b.angle)*13;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(a.x+arx*side,a.y+ary*side);ctx.lineTo(b.x+brx*side,b.y+bry*side);ctx.stroke();}}ctx.globalAlpha=1;}
    drawPickups(){for(const p of this.pickups){if(!p.active)continue;const q=this.track.at(p.index),bob=Math.sin(this.time*3+p.phase)*5;if(!this.visible(q.x,q.y))continue;this.perf.visibleObjects++;const colors={cash:'#ffd552',turbo:'#ff7342',grip:'#57e59b',repair:'#72ddeb',speed:'#ce67e5',accel:'#f2a643'},color=colors[p.type]||'#ffd552';ctx.save();ctx.translate(q.x,q.y);ctx.fillStyle='#07131399';ctx.beginPath();ctx.ellipse(5,17,19,7,0,0,TAU);ctx.fill();ctx.fillStyle=`${color}55`;ctx.beginPath();ctx.ellipse(0,16,13,4,0,0,TAU);ctx.fill();ctx.restore();ctx.save();ctx.translate(q.x,q.y+bob);ctx.rotate(Math.sin(this.time*.8+p.phase)*.08);ctx.rotate(this.time*.52+p.phase);ctx.lineJoin='round';ctx.lineWidth=2.5;ctx.strokeStyle='#fff1c0';ctx.beginPath();ctx.moveTo(-17,-11);ctx.lineTo(0,0);ctx.lineTo(0,20);ctx.lineTo(-17,10);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(17,-11);ctx.lineTo(17,10);ctx.lineTo(0,20);ctx.closePath();ctx.fillStyle='#263333';ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-17,-11);ctx.lineTo(0,-24);ctx.lineTo(17,-11);ctx.lineTo(0,0);ctx.closePath();ctx.fillStyle='#fff0bd';ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(-12,-12);ctx.lineTo(0,-21);ctx.lineTo(12,-12);ctx.lineTo(0,-4);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#17211f';ctx.font='900 14px Courier New';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText({cash:'$',turbo:'T',grip:'G',repair:'+',speed:'V',accel:'A'}[p.type],0,9);ctx.restore();}}
    drawPropShadows(){for(const o of this.track.props){if(!this.visible(o.x,o.y,190))continue;const s=o.scale,large=o.type==='grove'||o.type==='canyonRock'||o.type==='marshal'||o.type==='hut',wide=large?38:o.type==='palm'?29:o.type==='bush'?20:o.type==='board'?17:14,long=large?22:o.type==='palm'?16:o.type==='tree'||o.type==='pine'?10:8;ctx.save();ctx.translate(o.x+8*s,o.y+12*s);ctx.rotate(.18);ctx.globalAlpha=o.type==='flowers'?.2:.38;if(this.track.def.theme!=='canyon')ctx.filter='blur(2px)';ctx.fillStyle='#07130f';ctx.beginPath();ctx.ellipse(0,0,wide*s,long*s,0,0,TAU);ctx.fill();ctx.restore();}}
    drawActors(){const cars=this.cars,props=this.track.props;let ci=0;const sortedCars=[...cars].sort((a,b)=>a.y-b.y);for(const p of props){if(!this.visible(p.x,p.y,190))continue;while(ci<sortedCars.length&&sortedCars[ci].y<p.y)this.drawCar(sortedCars[ci++]);this.drawProp(p);}while(ci<sortedCars.length)this.drawCar(sortedCars[ci++]);}
    drawProp(o){if(!this.visible(o.x,o.y,190))return;this.perf.visibleObjects++;const s=o.scale;if(o.type==='grove'&&groveImage.complete&&groveImage.naturalWidth){ctx.drawImage(groveImage,o.x-105*s,o.y-180*s,210*s,190*s);return;}const sprite=this.propSprites[o.type];if(sprite)ctx.drawImage(sprite,o.x-64*s,o.y-80*s,128*s,160*s);}
    drawPropBody(o){
      ctx.save();ctx.translate(o.x,o.y);const s=o.scale;
      if(o.type==='tree'){ctx.fillStyle='#473124';ctx.fillRect(-6*s,-3*s,12*s,31*s);ctx.fillStyle='#173d29';ctx.beginPath();ctx.arc(0,-9*s,29*s,0,TAU);ctx.fill();ctx.fillStyle='#25633a';ctx.beginPath();ctx.arc(-14*s,-17*s,18*s,0,TAU);ctx.arc(14*s,-15*s,19*s,0,TAU);ctx.arc(1*s,-32*s,19*s,0,TAU);ctx.fill();ctx.fillStyle='#62a84a';ctx.beginPath();ctx.arc(-8*s,-34*s,8*s,0,TAU);ctx.arc(17*s,-20*s,6*s,0,TAU);ctx.fill();}
      else if(o.type==='pine'){ctx.fillStyle='#4d3424';ctx.fillRect(-4*s,-2*s,8*s,31*s);for(let i=0;i<4;i++){ctx.fillStyle=['#173d31','#1b5136','#22623c','#2c7140'][i];ctx.beginPath();ctx.moveTo(0,(-54+i*12)*s);ctx.lineTo((-25+i*2)*s,(-8+i*12)*s);ctx.lineTo((25-i*2)*s,(-8+i*12)*s);ctx.closePath();ctx.fill();}}
      else if(o.type==='bush'){for(const [x,y,r,c] of [[-12,0,17,'#16442e'],[3,-7,21,'#205d37'],[17,1,15,'#327743']]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x*s,y*s,r*s,0,TAU);ctx.fill();}}
      else if(o.type==='rock'||o.type==='stump'||o.type==='canyonRock'){const boulder=o.type==='canyonRock',rx=boulder?29:18,ry=boulder?20:15;ctx.fillStyle=o.type==='stump'?'#60412c':boulder?'#45483f':'#575c51';ctx.beginPath();ctx.moveTo(-rx*s,ry*.45*s);ctx.lineTo(-rx*.82*s,-ry*.5*s);ctx.lineTo(-rx*.28*s,-ry*s);ctx.lineTo(rx*.55*s,-ry*.72*s);ctx.lineTo(rx*s,ry*.18*s);ctx.lineTo(rx*.6*s,ry*.8*s);ctx.closePath();ctx.fill();ctx.fillStyle=o.type==='stump'?'#a37548':boulder?'#777768':'#8d8d79';ctx.beginPath();ctx.moveTo(-rx*.82*s,-ry*.5*s);ctx.lineTo(-rx*.28*s,-ry*s);ctx.lineTo(rx*.55*s,-ry*.72*s);ctx.lineTo(rx*.08*s,-ry*.08*s);ctx.lineTo(-rx*.28*s,ry*.02*s);ctx.closePath();ctx.fill();ctx.strokeStyle=boulder?'#a89a7a':'#b6b39a';ctx.globalAlpha=.55;ctx.lineWidth=1.5*s;ctx.beginPath();ctx.moveTo(-rx*.2*s,ry*.25*s);ctx.lineTo(rx*.1*s,ry*.6*s);ctx.moveTo(rx*.45*s,-ry*.42*s);ctx.lineTo(rx*.65*s,ry*.1*s);ctx.stroke();}
      else if(o.type==='tyres'){for(let i=-1;i<=1;i++){ctx.fillStyle='#171d1d';ctx.beginPath();ctx.ellipse(i*14*s,(i&1)*-4*s,11*s,9*s,0,0,TAU);ctx.fill();ctx.fillStyle='#57635e';ctx.beginPath();ctx.ellipse(i*14*s,(i&1)*-4*s,5*s,4*s,0,0,TAU);ctx.fill();}}
      else if(o.type==='palm'){ctx.fillStyle='#46382b';ctx.beginPath();ctx.ellipse(1*s,1*s,7*s,8*s,0,0,TAU);ctx.fill();ctx.fillStyle='#b18a52';ctx.beginPath();ctx.arc(0,0,5*s,0,TAU);ctx.fill();for(let i=0;i<8;i++){const a=i/8*TAU;ctx.save();ctx.rotate(a);ctx.fillStyle=i%2?'#52623b':'#71804b';ctx.beginPath();ctx.ellipse(0,-22*s,5*s,22*s,0,0,TAU);ctx.fill();ctx.strokeStyle='#c1a06a';ctx.globalAlpha=.6;ctx.lineWidth=1.2*s;ctx.beginPath();ctx.moveTo(0,-5*s);ctx.lineTo(0,-40*s);ctx.stroke();ctx.restore();}}
      else if(o.type==='barrel'){ctx.fillStyle='#3b2e25';ctx.beginPath();ctx.ellipse(2*s,10*s,15*s,8*s,0,0,TAU);ctx.fill();ctx.fillStyle='#8c422f';ctx.beginPath();ctx.roundRect(-11*s,-15*s,22*s,29*s,4*s);ctx.fill();ctx.fillStyle='#c9b18a';ctx.fillRect(-11*s,-7*s,22*s,4*s);ctx.fillRect(-11*s,6*s,22*s,3*s);ctx.fillStyle='#e1cba0';ctx.fillRect(-8*s,-13*s,3*s,8*s);}
      else if(o.type==='board'){ctx.fillStyle='#40352a';ctx.fillRect(-3*s,-2*s,6*s,27*s);ctx.fillRect(-20*s,17*s,40*s,5*s);ctx.fillStyle='#1c2827';ctx.fillRect(-24*s,-24*s,48*s,28*s);ctx.fillStyle='#c7b287';ctx.fillRect(-21*s,-21*s,42*s,22*s);ctx.fillStyle='#793b2e';ctx.fillRect(-19*s,-19*s,38*s,6*s);ctx.fillStyle='#425855';ctx.fillRect(-18*s,-10*s,15*s,8*s);ctx.fillStyle='#d9c79e';ctx.fillRect(2*s,-10*s,15*s,3*s);ctx.fillRect(2*s,-4*s,11*s,2*s);}
      else if(o.type==='marshal'||o.type==='hut'){ctx.fillStyle='#40372c';ctx.fillRect(-25*s,-14*s,50*s,41*s);ctx.fillStyle=o.type==='marshal'?'#8a704d':'#756048';ctx.fillRect(-25*s,-22*s,50*s,38*s);ctx.fillStyle='#b79865';ctx.beginPath();ctx.moveTo(-31*s,-19*s);ctx.lineTo(-2*s,-34*s);ctx.lineTo(31*s,-19*s);ctx.closePath();ctx.fill();ctx.fillStyle='#342d25';ctx.fillRect(-7*s,1*s,14*s,15*s);ctx.fillStyle='#78a9a3';ctx.fillRect(-20*s,-15*s,9*s,9*s);ctx.fillRect(11*s,-15*s,9*s,9*s);ctx.fillStyle='#d7c394';ctx.fillRect(-21*s,-14*s,3*s,7*s);ctx.fillRect(10*s,-14*s,3*s,7*s);ctx.fillStyle='#ba4938';ctx.fillRect(-26*s,-22*s,52*s,4*s);}
      else{ctx.fillStyle='#e6b851';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(i*7*s,-3*Math.abs(i)*s,3*s,0,TAU);ctx.fill();}}
      ctx.restore();
    }
    drawCar(c){
      if(!this.visible(c.x,c.y,90))return;this.perf.visibleObjects++;
      const lift=c.z,rise=clamp(lift/130,0,.8);
      ctx.save();ctx.translate(c.x+3,c.y+5);ctx.rotate(c.angle);ctx.globalAlpha=.32-rise*.12;ctx.fillStyle='#07100d';
      ctx.beginPath();ctx.ellipse(0,0,14,24,0,0,TAU);ctx.fill();
      for(const x of [-24,24])for(const y of [-25,25]){ctx.beginPath();ctx.ellipse(x,y,4.5,8,0,0,TAU);ctx.fill();}
      ctx.restore();
      if(c.player&&keys.boost&&c.turbo>0){ctx.save();ctx.translate(c.x,c.y-lift);ctx.rotate(c.angle);ctx.fillStyle='#ff8738';ctx.beginPath();ctx.moveTo(-8,28);ctx.lineTo(0,44+Math.sin(this.time*40)*5);ctx.lineTo(8,28);ctx.fill();ctx.fillStyle='#fff0a1';ctx.beginPath();ctx.moveTo(-4,30);ctx.lineTo(0,39);ctx.lineTo(4,30);ctx.fill();ctx.restore();}
      if(!vehicleAtlas.draw(ctx,c,c.player?0:c.number*66)){ctx.save();ctx.translate(c.x,c.y-lift);ctx.rotate(c.angle+Math.PI);ctx.fillStyle='#1b2424';for(const x of [-25,15])for(const y of [-25,11])ctx.fillRect(x,y,10,20);ctx.fillStyle=c.color;this.roundRect(-20,-32,40,65,9);ctx.fillStyle='#85d4d5';this.roundRect(-13,-13,26,25,6);ctx.restore();}
    }
    drawDebug(){if(!this.player)return;const c=this.player,speed=Math.hypot(c.vx,c.vy),scale=.28,hx=Math.sin(c.angle)*72,hy=-Math.cos(c.angle)*72,vx=c.vx*scale,vy=c.vy*scale,velocityAngle=Math.atan2(c.vx,-c.vy);ctx.save();ctx.translate(c.x,c.y);ctx.lineWidth=4;ctx.strokeStyle='#ffd84f';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(hx,hy);ctx.stroke();ctx.strokeStyle='#42e9ff';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(vx,vy);ctx.stroke();ctx.strokeStyle='#ff6e58';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,42,c.angle-Math.PI/2,velocityAngle-Math.PI/2,c.slipAngle<0);ctx.stroke();ctx.fillStyle='#071416dd';ctx.fillRect(-82,52,164,48);ctx.fillStyle='#e8fff8';ctx.font='700 11px Courier New';ctx.textAlign='center';ctx.fillText(`SPD ${speed.toFixed(0)}  YAW ${c.angularVelocity.toFixed(2)}`,0,69);ctx.fillText(`SLIP ${(c.slipAngle*180/Math.PI).toFixed(1)}°  STEER ${(c.frontSteer||0).toFixed(2)}`,0,86);ctx.restore();}
    roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill();}
    drawParticles(){for(const p of this.particles){if(!this.visible(p.x,p.y,30))continue;this.perf.visibleObjects++;ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;if(p.type==='pickup'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate((this.raceTime+p.phase)*8);ctx.fillRect(-p.size*.5,-p.size*1.5,p.size,p.size*3);ctx.restore();}else{ctx.beginPath();if(p.type==='splash'){ctx.ellipse(p.x,p.y,p.size*1.5,p.size*.35,0,0,TAU);}else ctx.arc(p.x,p.y,p.size,0,TAU);ctx.fill();}}ctx.globalAlpha=1;}
    drawVignette(){if(this.vignetteCanvas)ctx.drawImage(this.vignetteCanvas,0,0,this.width,this.height);}
    drawPerformanceDebug(){ctx.save();ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.fillStyle='#071416e8';ctx.fillRect(14,144,196,112);ctx.fillStyle='#e8fff8';ctx.font='700 12px Courier New';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(`FPS ${this.perf.fps.toFixed(0)}  FRAME ${this.perf.frameMs.toFixed(1)} ms`,24,154);ctx.fillText(`UPDATE ${this.perf.updateMs.toFixed(1)} ms`,24,174);ctx.fillText(`RENDER ${this.perf.renderMs.toFixed(1)} ms`,24,194);ctx.fillText(`PARTICLES ${this.particles.length}/${this.maxParticles}`,24,214);ctx.fillText(`OBJECTS ${this.perf.visibleObjects}`,24,234);ctx.restore();}
  }

  new Game();
})();
