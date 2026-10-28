/* Pure calculation model. Audited S14 assumptions and limits: MECHANICS.md. */
(function(root){'use strict';
const D=typeof module!=='undefined'?require('./gamedata.js'):root.ThrowData,T=Math.trunc,C=(n,a,b)=>Math.max(a,Math.min(b,n));
const dm=(l,a,b)=>l>0?Math.min(b,a+T(T(110*l/(l+6))*(b-a)/100)):0;
const ln=(id,l,a=0,b=1)=>l>0?D.skills[id].p[a]+(l-1)*D.skills[id].p[b]:0;
function tier(base,steps,l){let n=Math.max(0,l-1),v=base;for(const [i,size]of [7,8,6,6,1000].entries()){const k=Math.min(n,size);v+=k*steps[i];n-=k;}return l>0?v:0;}
const defaults={buildName:'',clvl:90,str:150,dex:250,skill:30,mastery:30,swing:20,frenzyHard:20,deep:0,grim:0,bc:0,
 ed:0,flatMin:0,flatMax:0,demonEd:0,undeadEd:0,cs:0,ds:0,maxDs:0,cm:0,dm:0,cb:0,cbEff:0,ow:0,bleed:0,
 gearIas:0,incSpeed:0,frenzy:0,fana:0,might:0,conc:0,auraOwner:'party',otherSpeed:0,speedMode:'auto',frames:10,
 physRes:50,physPierce:0,amp:0,curseMastery:0,breaking:0,targetType:'other',boss:'normal',hp:100000,hpPct:100,players:1,
 hitMode:'manual',hit:95,ar:5000,arPct:0,targetDef:1000,targetLevel:85,block:0,flatDR:0,magicDR:0,window:10,
 contacts:1,ordering:'audit',bounceHand:'stream',mainHand:'a',poisonDps:0,poisonSeconds:0,poisonRes:0,plr:0,poisonPierce:0};
for(const e of ['fire','cold','light','magic'])for(const [k,v]of Object.entries({Min:0,Max:0,Bonus:0,Res:0,Pierce:0}))defaults[e+k]=v;
for(const hand of ['a','b'])Object.assign(defaults,{[hand+'Base']:hand==='a'?'7bk':'7ta',[hand+'Mode']:'base',[hand+'Eth']:false,[hand+'Ed']:200,[hand+'LocalMin']:0,[hand+'LocalMax']:0,[hand+'MaxPerLevel']:0,[hand+'ShownMin']:100,[hand+'ShownMax']:200,[hand+'Wsm']:D.weapons.find(w=>w.code===(hand==='a'?'7bk':'7ta')).wsm,[hand+'StrCoeff']:75,[hand+'DexCoeff']:75,[hand+'Ias']:30,[hand+'Cs']:0,[hand+'Ds']:0,[hand+'MaxDs']:0,[hand+'Cm']:0,[hand+'Dm']:0,[hand+'Cb']:0,[hand+'CbEff']:0,[hand+'Ow']:0,[hand+'Bleed']:0,[hand+'Pierce']:0,[hand+'DemonEd']:0,[hand+'UndeadEd']:0,[hand+'FlatEd']:0,[hand+'Ar']:0,[hand+'ArPct']:0,[hand+'PoisonDps']:0,[hand+'PoisonSeconds']:0});
for(const h of ['a','b'])for(const e of ['fire','cold','light','magic']){defaults[h+e+'Min']=0;defaults[h+e+'Max']=0;}
function clean(input){const s={...defaults};for(const k of Object.keys(s)){if(input[k]===undefined)continue;if(typeof s[k]==='number'){s[k]=Number(input[k]);if(!Number.isFinite(s[k])||Math.abs(s[k])>1e9)throw Error('Enter a finite, reasonable value for '+k+'.');}else if(typeof s[k]==='boolean')s[k]=input[k]===true||input[k]==='true';else s[k]=String(input[k]);}
for(const k of ['clvl','skill','mastery','swing','frenzyHard','deep','grim','bc','incSpeed','frenzy','fana','might','conc','amp','curseMastery']){const max=['swing','frenzyHard','grim','incSpeed','curseMastery'].includes(k)?20:k==='clvl'?99:100;if(s[k]<0||s[k]>max||!Number.isInteger(s[k]))throw Error(k+' must be a whole number from 0 to '+max+'.');}
if(s.skill<1||s.clvl<1)throw Error('Character and Double Throw levels must be at least 1.');
for(const k of ['flatMin','flatMax','gearIas','hp','ar','targetDef','poisonDps','poisonSeconds','flatDR','magicDR','bleed'])if(s[k]<0)throw Error(k+' cannot be negative.');
if(s.hp<=0||s.frames<1||s.frames>200||s.window<1||s.window>60||s.players<1||s.players>8||!Number.isInteger(s.players)||!Number.isInteger(s.frames)||s.hpPct<=0||s.hpPct>100||s.targetLevel<1)throw Error('Check target life, life %, players (1–8), timing (1–200 frames) and window (1–60 seconds).');
for(const k of ['physPierce','breaking','poisonPierce',...['fire','cold','light','magic'].map(e=>e+'Pierce')])s[k]=Math.abs(s[k]);
if(!['normal','prime','special'].includes(s.boss)||!['audit','uniform'].includes(s.ordering)||!['stream','a','b'].includes(s.bounceHand)||!['a','b'].includes(s.mainHand))throw Error('Select a valid target and chain model.');return s;}
function resistance(raw,pierce=0,sources=[]){const immune=raw>=100;let r=raw;for(const source of sources)r-=immune?T(Math.abs(source)/2):Math.abs(source);const cursed=r;if(r>=100)return {cursed,effective:r,factor:0,immune:true};r-=Math.abs(pierce);if(r<0)r=T(r/2);r=Math.max(-100,r);return {cursed,effective:r,factor:(100-r)/100,immune:false};}
function timing(s){const get=h=>{const w=D.weapons.find(w=>w.code===s[h+'Base']);return {wsm:s[h+'Mode']==='base'&&w?w.wsm:s[h+'Wsm'],ias:s[h+'Ias']};},a=get('a'),b=get('b');if(a.ias<0||b.ias<0)throw Error('Weapon IAS cannot be negative.');const winner=(-b.wsm+b.ias>=-a.wsm+a.ias)?'b':'a',w=winner==='a'?a:b;
const total=w.ias+s.gearIas+2*s.incSpeed,sias=dm(s.frenzy,0,50)+dm(s.fana,10,40)+s.otherSpeed;
const at=ias=>{const eias=T(120*ias/(120+ias)),speed=C(100+sias-w.wsm+eias-30,15,175),rate=T(256*speed/100);return {frames:Math.max(1,Math.ceil(12*256/rate)-1),release:[5,9].map(f=>Math.max(1,Math.ceil(f*256/rate))),rate};};
const auto=at(total),frames=s.speedMode==='manual'?s.frames:auto.frames;let breakpoints=[],last;for(let i=0;i<=500;i++){const r=at(w.ias+2*s.incSpeed+i);if(r.frames!==last){breakpoints.push({ias:i,frames:r.frames});last=r.frames;}}
// Events pace two throws, one from each hand; manual mode scales release offsets to the entered cycle.
return {winner,frames,rate:auto.rate,sias,totalIas:total,release:auto.release.map(f=>s.speedMode==='manual'?Math.max(1,Math.round(f*frames/auto.frames)):Math.min(f,frames)),pairs:25/frames,breakpoints};}
function strike(cs,ds,maxDs,cm,dmBonus){const c=C(cs,0,75)/100,cap=C(75+maxDs,0,100),d=C(ds,0,cap)/100,e=(1-c)*d;const mC=Math.max(0,2+cm/100),mD=Math.max(0,1.5+dmBonus/100);return {cs:c,ds:d,effectiveDs:e,none:1-c-e,chance:c+e,multiplier:(1-c-e)+c*mC+e*mD,cm:mC,dm:mD,cap};}
function hitChance(ar,alvl,def,dlvl){if(def<0){ar-=def;def=0;}if(ar<0){def-=ar;ar=0;}const sum=ar+def,L=alvl+dlvl,ratio=sum?T(111*ar/sum):100,c=T(ratio*alvl*2/L);if(c<5)return 5;if(c<=95)return c;let ex=ratio-T(95*L/(2*alvl));if(sum)ex=T(T(sum*ex/111)*90/sum);return Math.min(T(ex*alvl*2/L)+95,100);}
function owBase(l){let v=0,n=Math.max(0,l-1);for(const [i,size]of [14,15,15,15,100].entries()){const k=Math.min(n,size);v+=k*[9,18,27,36,45][i];n-=k;}return v;}
function cbDamage(s,res,eff){let div=s.boss==='prime'?70+10*(100-T(s.hpPct)):s.boss==='special'?30:8;div+=70*(s.players-1)/50;div*=1.5;const current=s.hp*s.hpPct/100;return {divisor:div,damage:res>=100?0:Math.min(current,Math.max(0,current/div*(1+eff/100)*(100-res)/100))};}
function calculate(input={},options={}){const s=clean(input),speed=timing(s),S=ln('140',s.skill)+D.skills['140'].p[7]*(s.swing+s.frenzyHard),cap=Math.min(3+T(s.skill/3),8),contacts=C(T(s.contacts),1,cap);
const masteryEd=ln('135',s.mastery,2,3),masteryCrit=dm(s.mastery,0,35),fanaEd=ln('122',s.fana,4,5),mightEd=tier(D.skills['98'].emin,D.skills['98'].minsteps,s.might),concEd=ln('113',s.conc,2,3);
const auraEd=T((fanaEd+mightEd+concEd)/2)+(s.auraOwner==='self'?fanaEd+mightEd+concEd:0),buffEd=ln('155',s.bc,2,3);
const amp=s.amp?14+s.amp+T(s.curseMastery/2):0,res= resistance(s.physRes,s.physPierce,[amp,s.breaking]),deepStat=T(tier(D.skills['368'].emax,D.skills['368'].steps,s.deep)*(100+s.grim*4)/100),deepChance=s.deep?5+T(s.deep/2):0;
const hands={};for(const h of ['a','b']){const w=D.weapons.find(w=>w.code===s[h+'Base']),mode=s[h+'Mode'];if(!['base','shown'].includes(mode)||!w)throw Error('Choose a valid weapon base and damage input mode.');
for(const k of ['Ed','LocalMin','LocalMax','ShownMin','ShownMax'])if(s[h+k]<0)throw Error('Weapon damage and local ED cannot be negative.');
const baseMin=T(w.min*(s[h+'Eth']?1.5:1)),baseMax=T(w.max*(s[h+'Eth']?1.5:1)),localMin=mode==='shown'?s[h+'ShownMin']:T(baseMin*(100+s[h+'Ed'])/100)+s[h+'LocalMin'],localMax=mode==='shown'?s[h+'ShownMax']:T(baseMax*(100+s[h+'Ed'])/100)+s[h+'LocalMax']+T(s[h+'MaxPerLevel']*s.clvl);
if(mode==='shown'&&localMax<localMin)throw Error('Weapon '+h.toUpperCase()+' maximum must be at least minimum.');
const attr=T(s.str*(mode==='base'?w.str:s[h+'StrCoeff'])/100)+T(s.dex*(mode==='base'?w.dex:s[h+'DexCoeff'])/100),race=s.targetType==='demon'?s.demonEd+s[h+'DemonEd']:s.targetType==='undead'?s.undeadEd+s[h+'UndeadEd']:0;
const otherEd=s.ed+s[h+'FlatEd']+attr+race+masteryEd+auraEd+buffEd,crit=strike(s.cs+s[h+'Cs']+masteryCrit,s.ds+s[h+'Ds'],s.maxDs+s[h+'MaxDs'],s.cm+s[h+'Cm'],s.dm+s[h+'Dm']),rf=resistance(s.physRes,s.physPierce+Math.abs(s[h+'Pierce']),[amp,s.breaking]);
let element=0,elementRaw=0;const elements=[];for(const e of ['fire','cold','light','magic']){const lo=s[e+'Min']+s[h+e+'Min'],hi=s[e+'Max']+s[h+e+'Max'];if(lo<0||hi<lo)throw Error('Check '+e+' min/max for hand '+h.toUpperCase()+'.');const base=(lo+hi)/2*Math.max(0,1+s[e+'Bonus']/100),ef=resistance(s[e+'Res'],s[e+'Pierce']),after=Math.max(0,base-s.magicDR)*ef.factor;element+=after;elementRaw+=base;elements.push({type:e,raw:base,after});}
const AR=Math.max(0,T((s.ar+s[h+'Ar'])*(100+s.arPct+s[h+'ArPct']+ln('135',s.mastery)+35+15*(s.skill-1))/100)),hit=(s.hitMode==='ar'?hitChance(AR,s.clvl,s.targetDef,s.targetLevel):C(s.hit,0,100))/100*(1-C(s.block,0,100)/100);
const owChance=C(s.ow+s[h+'Ow']+deepChance,0,100)/100,bleedStat=deepStat+s.bleed+s[h+'Bleed'],bleedPerFrame=T((owBase(s.clvl)+40+5*bleedStat)*rf.factor)/256,cb=cbDamage(s,rf.cursed,Math.max(-100,s.cbEff+s[h+'CbEff'])),cbChance=C(s.cb+s[h+'Cb'],0,100)/100;
function damage(applications){const ed=Math.max(-90,otherEd+S*applications),lo=T((localMin+s.flatMin)*(100+ed)/100*256)/256,hi=Math.max(lo,T((Math.max(localMin,localMax)+s.flatMax)*(100+ed)/100*256)/256);const outcomes=[{p:crit.none,m:1},{p:crit.cs,m:crit.cm},{p:crit.effectiveDs,m:crit.dm}];const phys=outcomes.reduce((sum,o)=>sum+o.p*(Math.max(0,lo*o.m-s.flatDR)+Math.max(0,hi*o.m-s.flatDR))/2*rf.factor,0);return {lo,hi,ed,phys,physicalRaw:(lo+hi)/2*crit.multiplier,raw:(lo+hi)/2*crit.multiplier+elementRaw,after:phys+element};}
const poisonRf=resistance(s.poisonRes,s.poisonPierce),poisonDuration=Math.max(0,s[h+'PoisonSeconds']*(100-Math.max(-100,s.plr-Math.abs(s.poisonPierce)/2))/100),poison={dps:Math.max(0,s[h+'PoisonDps'])*poisonRf.factor,seconds:poisonDuration};
 hands[h]={poison,localMin,localMax,attr,otherEd,crit,rf,element,elements,AR,hit,owChance,bleedPerFrame,cb,cbChance,damage};}
const initial=contacts>1&&s.ordering==='audit'?2:1;const pair=['a','b'].reduce((n,h)=>n+hands[h].damage(initial).after*hands[h].hit,0),pairRaw=['a','b'].reduce((n,h)=>n+hands[h].damage(initial).raw,0),cbPair=['a','b'].reduce((n,h)=>n+hands[h].cb.damage*hands[h].cbChance*hands[h].hit,0);
const chain=[];let chainTotal=0;for(let i=0;i<contacts;i++){const applications=s.ordering==='uniform'||contacts===1?1:i===0?2:i===contacts-1?0:1;let damage=0;for(const stream of ['a','b']){const h=i===0||s.bounceHand==='stream'?stream:s.bounceHand;damage+=hands[h].damage(applications).after*hands[h].hit;}chain.push({contact:i+1,applications,damage});chainTotal+=damage;}
// User-selected playstyle scenarios, per bounce rather than a claim about chain counts or movement DPS.
const bounceCase=applications=>{
 const main=hands[s.mainHand],m=main.damage(applications),a=hands.a.damage(applications),b=hands.b.damage(applications);
 const stutter={raw:m.raw,after:m.after,expected:m.after*main.hit};
 const continuous={raw:(a.raw+b.raw)/2,after:(a.after+b.after)/2,expected:(a.after*hands.a.hit+b.after*hands.b.hit)/2};
 return {applications,stutter,continuous,difference:continuous.after?100*(stutter.after/continuous.after-1):null};
};
const playstyles={mainHand:s.mainHand,intermediate:bounceCase(1),final:bounceCase(s.ordering==='audit'?0:1)};
const bleed=options.skipBleed?null:bleedWindow(hands,speed,s.window);
return {s,hands,speed,S,cap,contacts,initial,masteryEd,masteryCrit,auraEd,buffEd,amp,deepStat,deepChance,res,pair,pairRaw,dps:pair*speed.pairs,cbPair,cbDps:cbPair*speed.pairs,bleed,chain,chainTotal,playstyles};}
// Exact expectation for this isolated bleed model: one source, independent hit/proc rolls, 3 stacks,
// 125-frame shared expiry. Tracks probability and weighted drain (different weapons can add different bleeds).
function bleedWindow(hands,speed,seconds){let states=new Map([[0,{p:1,d:0}]]),total=0;const length=Math.round(seconds*25);let events=0;
const put=(map,k,p,d)=>{if(p===0)return;const old=map.get(k)||{p:0,d:0};old.p+=p;old.d+=d;map.set(k,old);};
for(let frame=0;frame<length;frame++){let next=new Map();for(const [key,x]of states){const stack=key%4,age=Math.floor(key/4);if(!stack||age+1>=125)put(next,0,x.p,0);else put(next,(age+1)*4+stack,x.p,x.d);}states=next;
for(const [index,h]of ['a','b'].entries())if(frame>=speed.release[index]&&(frame-speed.release[index])%speed.frames===0){events++;const hand=hands[h],p=hand.hit*hand.owChance;next=new Map();for(const [key,x]of states){put(next,key,x.p*(1-p),x.d*(1-p));const stack=key%4;put(next,Math.min(3,stack+1),x.p*p,(x.d+(stack<3?x.p*hand.bleedPerFrame:0))*p);}states=next;}
for(const x of states.values())total+=x.d;}
let stacks=0,dps=0;for(const [key,x]of states){stacks+=(key%4)*x.p;dps+=25*x.d;}return {total,averageDps:total/seconds,endDps:dps,stacks,events};}
const api={defaults,calculate,resistance,strike,timing,hitChance,owBase,cbDamage,tier};if(typeof module!=='undefined')module.exports=api;else root.DoubleThrow=api;
})(globalThis);
