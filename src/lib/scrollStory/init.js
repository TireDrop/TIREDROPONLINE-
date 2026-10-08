import * as A from "animejs";

/* eslint-disable */
export function initStory(){
var root = document.documentElement;
var offs = [];
function on(t,e,f,o){t.addEventListener(e,f,o);offs.push(function(){t.removeEventListener(e,f,o)})}
var rmq=false;try{rmq=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
root.classList.add(rmq?'rm':'js');
var RM = rmq;
var NS = 'http://www.w3.org/2000/svg';
function $(s){return document.querySelector(s)}
function svgEl(tag, attrs, parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
var rad = Math.PI/180;
var COL=['#ff5a4d','#ffb224','#7ee05a','#58cdf5'];

/* ---------- geometry: dark instrument ---------- */
var blocksG=$('#blocks'), N=60;
for(var i=0;i<N;i++){
  var g=svgEl('g',{transform:'rotate('+(i*360/N)+')'},blocksG);
  svgEl('rect',{class:'blk',x:-7,y:-267,width:14,height:(i%2)?15:22,rx:2},g);
}
var ticksG=$('#ticks');
for(var t=0;t<180;t++){
  var long=(t%6===0), r1=long?296:294, r2=long?281:286;
  svgEl('line',{class:'tick',x1:0,y1:-r1,x2:0,y2:-r2,transform:'rotate('+(t*2)+')',opacity:long?.85:.4},ticksG);
}
var arcsG=$('#arcs');
function arcPath(r,a0,a1){var x0=Math.sin(a0*rad)*r,y0=-Math.cos(a0*rad)*r,x1=Math.sin(a1*rad)*r,y1=-Math.cos(a1*rad)*r;return 'M'+x0.toFixed(2)+' '+y0.toFixed(2)+'A'+r+' '+r+' 0 '+((a1-a0)>180?1:0)+' 1 '+x1.toFixed(2)+' '+y1.toFixed(2)}
[[8,92,0],[100,170,1],[182,262,2],[272,352,3]].forEach(function(a){svgEl('path',{class:'arc',d:arcPath(300,a[0],a[1]),stroke:COL[a[2]]},arcsG)});
var mdG=$('#mdots'), STEP=22, MD=7;
for(var iy=-MD;iy<=MD;iy++)for(var ix=-MD;ix<=MD;ix++){
  var x=ix*STEP,y=iy*STEP,d=Math.sqrt(x*x+y*y); if(d>158)continue;
  var ang=((Math.atan2(x,-y)/rad)+360)%360, da=Math.min(ang%72,72-ang%72);
  var s0=0.35, s1=(d>=100&&d<=156)?1.5:0.25;
  var s2=(d<42)?1.5:((da<9&&d<150)?1.35:((d>138)?1.2:0.2));
  var c=svgEl('circle',{class:'md',cx:x,cy:y,r:2.4,'data-s0':s0,'data-s1':s1,'data-s2':s2},mdG);
  c.style.transform='scale('+s2+')';
}
var spokesG=$('#spokes');
for(var s=0;s<5;s++){
  var g2=svgEl('g',{transform:'rotate('+(s*72)+')'},spokesG), sx=svgEl('g',{class:'sx'},g2), d='M-9 -44L-15 -150L15 -150L9 -44Z';
  svgEl('path',{class:'sf spoke-fill',d:d},sx); svgEl('path',{class:'sp spoke',d:d},sx);
}
var lugsG=$('#lugs');
for(var l=0;l<5;l++){
  var la=(36+l*72)*rad, cx=Math.sin(la)*31, cy=-Math.cos(la)*31, pts=[];
  for(var k=0;k<6;k++){var pa=k*60*rad;pts.push((cx+Math.cos(pa)*6.5).toFixed(2)+','+(cy+Math.sin(pa)*6.5).toFixed(2))}
  svgEl('polygon',{class:'lug',points:pts.join(' ')},lugsG);
}

/* ---------- geometry: exploded technical drawing ---------- */
var K=0.42, TH=-24*rad, SC=0.8;
function W(x,y){return [(x*Math.cos(TH)-y*Math.sin(TH))*SC,(x*Math.sin(TH)+y*Math.cos(TH))*SC]}
function ell(p,cx,cy,r,cls){return svgEl('ellipse',{cx:cx,cy:cy,rx:r,ry:r*K,class:cls||'xl'},p)}
function thick(p,r,h){
  svgEl('path',{d:'M'+(-r)+' 0V'+h+'A'+r+' '+(r*K)+' 0 0 0 '+r+' '+h+'V0Z',class:'xfo'},p);
  svgEl('path',{d:'M'+(-r)+' '+h+'A'+r+' '+(r*K)+' 0 0 0 '+r+' '+h,class:'xl'},p);
  svgEl('line',{x1:-r,y1:0,x2:-r,y2:h,class:'xl'},p); svgEl('line',{x1:r,y1:0,x2:r,y2:h,class:'xl'},p);
  ell(p,0,0,r,'xl xf');
}
var explG=$('#expl'), parts=[], rg=svgEl('g',{transform:'rotate(-24) scale(.8)',id:'explRot'},explG);
// each: id, dy, dx, bx, by, build, anchor [ax,ay], side, label, colour
parts.push({id:'tire',dy:165,build:function(p){thick(p,190,46);ell(p,0,0,140,'xl xf');for(var a=0;a<360;a+=10){svgEl('line',{x1:Math.cos(a*rad)*190,y1:Math.sin(a*rad)*190*K,x2:Math.cos(a*rad)*181,y2:Math.sin(a*rad)*181*K,class:'xl'},p)}},
  calls:[{ax:Math.cos(-38*rad)*190,ay:Math.sin(-38*rad)*190*K,side:1,label:'TREAD',c:0},{ax:190,ay:24,side:1,label:'SIDEWALL',c:1}]});
parts.push({id:'bead',dy:70,build:function(p){thick(p,150,10);ell(p,0,0,136,'xl xf')},calls:[{ax:150,ay:6,side:1,label:'BEAD',c:2}]});
parts.push({id:'stem',dy:20,dx:-250,bx:104,by:10,build:function(p){svgEl('rect',{x:-3.5,y:0,width:7,height:34,rx:2,class:'xl xf'},p);ell(p,0,34,7,'xl xf');svgEl('rect',{x:-2,y:-8,width:4,height:9,class:'xl xf'},p)},calls:[{ax:-3,ay:22,side:-1,label:'VALVE STEM',c:3}]});
parts.push({id:'barrel',dy:-45,build:function(p){thick(p,135,56);ell(p,0,0,118,'xl xf')},calls:[{ax:135,ay:30,side:1,label:'RIM',c:3}]});
parts.push({id:'spokes',dy:-135,build:function(p){
  ell(p,0,0,135,'xl xf');
  var f=svgEl('g',{transform:'scale(1,'+K+')'},p);
  for(var i=0;i<5;i++){svgEl('path',{d:'M-9 -40L-15 -128L15 -128L9 -40Z',transform:'rotate('+(i*72)+')',class:'xl xf'},f)}
  svgEl('circle',{r:42,class:'xl xf'},f)},calls:[{ax:-53,ay:73*K,side:-1,label:'SPOKE',c:1}]});
parts.push({id:'lugs',dy:-215,build:function(p){
  for(var i=0;i<5;i++){var a=(36+i*72)*rad,x=Math.cos(a)*40,y=Math.sin(a)*40*K;
    var q=svgEl('g',{transform:'translate('+x.toFixed(1)+' '+y.toFixed(1)+')'},p);
    thick(q,8,9)}},calls:[{ax:Math.cos(200*rad)*40,ay:Math.sin(200*rad)*40*K,side:-1,label:'LUG NUT',c:0}]});
parts.push({id:'cap',dy:-290,build:function(p){thick(p,27,11);ell(p,0,0,16,'xl xf')},calls:[{ax:-27,ay:5,side:-1,label:'CENTRE CAP',c:2}]});
var callG=svgEl('g',{id:'calls'},explG);
parts.forEach(function(pt){
  var xp=svgEl('g',{class:'xp','data-dy':pt.dy,'data-dx':pt.dx||0},rg);
  var xi=svgEl('g',pt.bx!==undefined?{transform:'translate('+pt.bx+' '+pt.by+')'}:{},xp);
  pt.build(xi);
  pt.calls.forEach(function(cl){
    var w=W((pt.bx||0)+(pt.dx||0)+cl.ax,(pt.by||0)+pt.dy+cl.ay), ex=cl.side*214;
    var g=svgEl('g',{class:'call'},callG);
    svgEl('line',{class:'ld',x1:w[0].toFixed(1),y1:w[1].toFixed(1),x2:ex,y2:w[1].toFixed(1)},g);
    svgEl('circle',{class:'cd',cx:w[0].toFixed(1),cy:w[1].toFixed(1),r:3.6,fill:COL[cl.c]},g);
    var tx=svgEl('text',{class:'lt',x:ex+cl.side*6,y:(w[1]+4).toFixed(1),'text-anchor':cl.side>0?'start':'end'},g); tx.textContent=cl.label;
  });
});

/* ---------- ruler ticks ---------- */
var rt=$('#rticks'), T=10800, secs=[0,800/T,3500/T,6800/T];
for(var q=0;q<64;q++){var i2=document.createElement('i'); if(q%8===0)i2.className='m'; rt.appendChild(i2)}
[0,8,27,50].forEach(function(n){rt.children[n].className='s'});

/* ---------- dot grid ---------- */
var dotsEl=$('#dots'), dots=[], cols=0, rows=0, gap=26, lastW=0;
function buildDots(){
  gap=parseInt(getComputedStyle(root).getPropertyValue('--gap'))||26;
  var w=innerWidth,h=innerHeight;
  cols=Math.ceil(w/gap)+1; rows=Math.ceil(h/gap)+1;
  dotsEl.style.gridTemplateColumns='repeat('+cols+','+gap+'px)';
  dotsEl.style.gridAutoRows=gap+'px';
  dotsEl.textContent='';
  var f=document.createDocumentFragment();
  for(var i=0;i<cols*rows;i++)f.appendChild(document.createElement('i'));
  dotsEl.appendChild(f);
  dots=Array.prototype.slice.call(dotsEl.children);
  lastW=w;
}
buildDots();

if(RM||!A){ return; }

var animate=A.animate, createTimeline=A.createTimeline, stagger=A.stagger, svg=A.svg, onScroll=A.onScroll, splitText=A.splitText, utils=A.utils;
var mobile = matchMedia('(max-width:859px)').matches;
function split(sel){ return splitText(sel,{chars:{wrap:'clip',class:'ch'}}); }
function scrollToFrac(f){var tr=$('#track'),top=tr.getBoundingClientRect().top+scrollY,span=tr.offsetHeight-innerHeight;scrollTo({top:top+f*span,behavior:'smooth'})}

function start(){
  var h1sp=split('#h1'), h2a=split('#h2a'), h2b=split('#h2b'), h2c=split('#h2c');
  utils.set('#h1',{opacity:1});
  utils.set('#lightbg',{opacity:0}); utils.set('#rimG',{opacity:0,scale:0.78}); utils.set('.blk',{opacity:0});
  utils.set('#sideText',{opacity:0}); utils.set('.lug',{scale:0,opacity:0}); utils.set('#cap',{scale:0});
  utils.set('.spoke-fill',{opacity:0}); utils.set('.sx',{scaleY:0.45});
  utils.set('.md',{scale:function(el){return +el.getAttribute('data-s0')}});
  var wheelDraw=svg.createDrawable('.draw'), arcDraw=svg.createDrawable('.arc');
  var spokeDraw=svg.createDrawable('.spoke'), seamDraw=svg.createDrawable('#seam'), leadDraw=svg.createDrawable('.ld');

  /* ======= 1. LOAD INTRO ======= */
  var intro=createTimeline({defaults:{ease:'outExpo'}});
  intro
    .add(dots,{opacity:[0,0.34],scale:[0,1],duration:900,delay:stagger(14,{grid:[cols,rows],from:'center'})},0)
    .add('#ticks line',{opacity:[0,function(el){return +el.getAttribute('opacity')}],duration:600,delay:stagger(6)},300)
    .add(arcDraw,{draw:['0 0','0 1'],duration:1400,delay:stagger(160),ease:'inOutQuart'},300)
    .add(wheelDraw,{draw:['0 0','0 1'],duration:1700,delay:stagger(220),ease:'inOutQuart'},250)
    .add(['#tireFill','#treadFill'],{opacity:[0,1],duration:900,ease:'outQuad'},1500)
    .add('.md',{opacity:[0,1],duration:900,delay:stagger(12,{from:'center'})},1500)
    .add(h1sp.chars,{y:['105%','0%'],opacity:[0,1],duration:900,delay:stagger(34)},900)
    .add('.p0 .rise',{y:[18,0],opacity:[0,1],duration:800,delay:stagger(110)},1500)
    .add('.hdr, .strip, .ruler',{opacity:[0,1],duration:700,ease:'outQuad'},500);

  /* ======= SCROLL TIMELINE ======= */
  var tire='#tireG', rim='#rimG';
  var prevIdx=-1, labels=['00 / INTRO','01 / TIRE','02 / RIM','03 / FIT'];
  var wrap=$('#wheelwrap'), wheelSize=wrap.offsetWidth, stageH=innerHeight;
  var cShift=mobile?{scale:[1,0.8],y:[0,(0.395*stageH)-(wrap.offsetTop+wheelSize/2)]}:{scale:[1,1],y:[0,0]};
  var panelEls=[].slice.call(document.querySelectorAll('.panel'));

  function setIdx(p){
    var t=p*T, idx=t<800?0:t<3500?1:t<6800?2:3;
    if(idx===prevIdx) return; prevIdx=idx;
    var lab=$('#sectLabel');
    animate(lab,{opacity:[0,1],y:[6,0],duration:400,ease:'outQuad'});
    lab.textContent=labels[idx];
    document.body.classList.toggle('light',idx===2);
    panelEls.forEach(function(el,i){el.classList.toggle('live',i===idx)});
  }

  var tl=createTimeline({
    defaults:{ease:'inOutQuad'},
    autoplay:onScroll({target:'#track',enter:'start start',leave:'end end',sync:0.25}),
    onUpdate:function(self){setIdx(self.progress)}
  });
  var morph=function(a,b){return {scale:[function(el){return +el.getAttribute('data-s'+a)},function(el){return +el.getAttribute('data-s'+b)}],duration:1400,delay:stagger(14,{from:'center'}),ease:'inOutCubic'}};

  tl.add(tire,{rotate:[0,170],duration:T,ease:'linear'},0)
    .add('#arcs',{rotate:[0,300],duration:T,ease:'linear'},0)
    .add('#ticks',{rotate:[0,-90],duration:T,ease:'linear'},0)
    .add('#scanG',{rotate:[0,900],duration:T,ease:'linear'},0)
    .add('#ph',{x:['-100%','0%'],duration:T,ease:'linear'},0)

  /* hero out */
    .add('.p0',{opacity:[1,0],y:[0,-36],duration:600,ease:'inQuad'},350)

  /* A: THE TIRE (dark instrument) */
    .add('.pa',{opacity:[0,1],duration:300,ease:'linear'},900)
    .add(h2a.chars,{y:['105%','0%'],opacity:[0,1],duration:700,delay:stagger(22),ease:'outQuart'},900)
    .add('.pa .rise',{y:[18,0],opacity:[0,1],duration:700,delay:stagger(120),ease:'outQuart'},1300)
    .add('.blk',{opacity:[0,1],y:[18,0],duration:800,delay:stagger(34),ease:'outCubic'},1000)
    .add('#sideText',{opacity:[0,1],duration:900,ease:'linear'},1900)
    .add('#sideText',{rotate:[0,200],duration:2400,ease:'inOutSine'},1500)
    .add('.md',morph(0,1),1300)
    .add('.pa',{opacity:[1,0],y:[0,-30],duration:500,ease:'inQuad'},3200)

  /* B: THE RIM (light, exploded drawing) */
    .add('#lightbg',{opacity:[0,1],duration:600,ease:'linear'},3500)
    .add('#darkG',{opacity:[1,0],duration:500,ease:'linear'},3500)
    .add('#expl',{opacity:[0,1],duration:400,ease:'linear'},3900)
    .add('.pb',{opacity:[0,1],duration:300,ease:'linear'},3800)
    .add(h2b.chars,{y:['105%','0%'],opacity:[0,1],duration:700,delay:stagger(18),ease:'outQuart'},3800)
    .add('.pb .rise',{y:[18,0],opacity:[0,1],duration:700,delay:stagger(120),ease:'outQuart'},4200)
    .add('.xp',{y:[0,function(el){return +el.getAttribute('data-dy')}],x:[0,function(el){return +el.getAttribute('data-dx')}],duration:1300,delay:stagger(110,{reversed:true}),ease:'outCubic'},4100)
    .add(leadDraw,{draw:['0 0','0 1'],duration:600,delay:stagger(60),ease:'inOutQuad'},4800)
    .add('.cd',{scale:[0,1],opacity:[0,1],duration:700,delay:stagger(60),ease:'outElastic(1,.5)'},4800)
    .add('.lt',{opacity:[0,1],x:function(el){return [el.getAttribute('text-anchor')==='end'?-10:10,0]},duration:500,delay:stagger(60),ease:'outQuad'},4950)
    .add('#bar',{opacity:[0,1],duration:400,ease:'linear'},4300)
    .add('#cover',{scaleX:[1,0],duration:2000,ease:'linear'},4500)
    .add('#bar',{opacity:[1,0],duration:400,ease:'linear'},6400)
    .add('.pb',{opacity:[1,0],y:[0,-30],duration:500,ease:'inQuad'},6300)
    .add('.call',{opacity:[1,0],duration:300,ease:'linear'},6400)
    .add('.xp',{y:[function(el){return +el.getAttribute('data-dy')},0],x:[function(el){return +el.getAttribute('data-dx')},0],duration:800,delay:stagger(60),ease:'inOutCubic'},6400)

  /* C: FIT (dark, assembled) */
    .add('#lightbg',{opacity:[1,0],duration:500,ease:'linear'},6800)
    .add('#expl',{opacity:[1,0],duration:400,ease:'linear'},7000)
    .add('#darkG',{opacity:[0,1],duration:500,ease:'linear'},7000)
    .add('.md',morph(1,2),7100)
    .add(rim,{opacity:[0,1],scale:[0.78,0.78],duration:300,ease:'linear'},7300)
    .add(spokeDraw,{draw:['0 0','0 1'],duration:900,delay:stagger(150),ease:'inOutQuad'},7400)
    .add('.spoke-fill',{opacity:[0,1],duration:600,delay:stagger(150),ease:'linear'},7800)
    .add('.sx',{scaleY:[0.45,1],duration:1000,delay:stagger(150),ease:'outCubic'},7400)
    .add('.lug',{scale:[0,1],opacity:[0,1],duration:1000,delay:stagger(110),ease:'outElastic(1,.45)'},8200)
    .add('#cap',{scale:[0,1],rotate:[-720,0],duration:1300,ease:'outExpo'},8500)
    .add('.md',{opacity:[1,0],duration:600,ease:'linear'},9200)
    .add(rim,{scale:[0.78,1],duration:1000,ease:'inOutCubic'},9000)
    .add('#wheelwrap',cShift,7000)
    .add(seamDraw,{draw:['0 0','0 1'],duration:700,ease:'inOutQuad'},9700)
    .add('#seam',{opacity:[0,0.9],duration:10,ease:'linear'},9700)
    .add('#pulse',{scale:[1,1.7],opacity:[0.9,0],duration:1200,ease:'outQuad'},9900)
    .add('#pulse2',{scale:[1,1.45],opacity:[0.7,0],duration:1100,ease:'outQuad'},10150)
    .add('.pc',{opacity:[0,1],duration:300,ease:'linear'},7300)
    .add(h2c.chars,{y:['105%','0%'],opacity:[0,1],duration:700,delay:stagger(22),ease:'outQuart'},7300)
    .add('.pc .rise',{y:[20,0],opacity:[0,1],duration:700,delay:stagger(140),ease:'outQuart'},8000);

  window.__tl=tl;

  $('#learn').addEventListener('click',function(){scrollToFrac(0.1)});
  $('#ruler').addEventListener('click',function(e){var r=$('#ruler').getBoundingClientRect();var f=Math.max(0,Math.min(1,(e.clientX-r.left-12)/(r.width-24)));scrollToFrac(f)});

  /* ======= cursor / touch reactive grid ======= */
  var lastCell=-1;
  function react(x,y){
    var c=Math.round((x-(innerWidth-(cols-1)*gap)/2)/gap), r=Math.round((y-(innerHeight-(rows-1)*gap)/2)/gap);
    c=Math.max(0,Math.min(cols-1,c)); r=Math.max(0,Math.min(rows-1,r));
    var cell=r*cols+c; if(cell===lastCell) return; lastCell=cell;
    var R=4, hit=[], dist=[];
    for(var j=-R;j<=R;j++)for(var i=-R;i<=R;i++){
      var cc=c+i, rr=r+j; if(cc<0||rr<0||cc>=cols||rr>=rows) continue;
      var dd=Math.sqrt(i*i+j*j); if(dd>R) continue;
      hit.push(dots[rr*cols+cc]); dist.push(dd);
    }
    animate(hit,{scale:[{to:2.6,duration:220,ease:'outQuad'},{to:1,duration:700,ease:'outElastic(1,.6)'}],opacity:[{to:1,duration:220},{to:0.34,duration:700}],backgroundColor:[{to:'#ffb224',duration:220},{to:'#5d6b82',duration:700}],delay:function(el,i){return dist[i]*38}});
  }
  on(window,'pointermove',function(e){react(e.clientX,e.clientY)},{passive:true});
  on(window,'pointerdown',function(e){react(e.clientX,e.clientY)},{passive:true});
  on(window,'resize',function(){ if(innerWidth!==lastW){ buildDots(); } });
}

(document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,1200)})]):Promise.resolve()).then(start);
return function destroy(){ offs.forEach(function(f){f()}); try{ if(window.__tl&&window.__tl.revert) window.__tl.revert(); }catch(e){} window.__tl=null; root.classList.remove('js','rm'); document.body.classList.remove('light'); };
}
