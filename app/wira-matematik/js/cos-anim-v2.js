/* WM-COS-002 / WM-ANIM-002 — visual-only equipment layers and character FX.
 * Preserves 14 lands, 42 encounters, licence, maths, audio, XP and save schemas.
 * Reads the existing WMV cosmetics state; never adds a paid/power advantage. */
'use strict';
(function(){
 const tierColors=[
  {main:'#97bc7e',light:'#e5f2c8',dark:'#457b61'},
  {main:'#ba8051',light:'#f0c58c',dark:'#74452d'},
  {main:'#bccdde',light:'#ffffff',dark:'#657f9b'},
  {main:'#edbc43',light:'#fff4b0',dark:'#a4661a'},
  {main:'#a678ea',light:'#e9d0ff',dark:'#6246ae'},
  {main:'#f6b548',light:'#fff5c1',dark:'#8758d8'}
 ];
 const levelNames=['Pengembara','Gangsa','Perak','Emas','Mitos','Legendary'];
 const clampTier=(x)=>{x=Number(x);return Number.isInteger(x)&&x>=0&&x<=5?x:0;};
 const cosmetics=()=>{
   const raw=WMV?.st?.cosmetics||{};
   return {helm:clampTier(raw.helm),armor:clampTier(raw.armor),weapon:clampTier(raw.weapon),aura:clampTier(raw.aura)};
 };
 const gearDefs=`<defs>
  <linearGradient id="wm8-metal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="var(--wm8-light)"/><stop offset=".55" stop-color="var(--wm8-main)"/><stop offset="1" stop-color="var(--wm8-dark)"/></linearGradient>
  <radialGradient id="wm8-gem"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".7" stop-color="var(--wm8-light)"/><stop offset="1" stop-color="var(--wm8-main)"/></radialGradient>
  </defs>`;
 function gearLayers(id){
   const c=cosmetics(),h=tierColors[c.helm],a=tierColors[c.armor],w=tierColors[c.weapon],u=tierColors[c.aura];
   const head= c.helm===0?
    `<path d="M34 34 Q58 22 86 34" fill="none" stroke="${h.main}" stroke-width="4.2" stroke-linecap="round"/><circle cx="60" cy="28" r="4" fill="${h.light}" stroke="${h.dark}" stroke-width="1.5"/>`:
    `<path d="M31 36 Q35 19 49 17 L71 17 Q87 22 89 36 L79 32 Q60 26 41 32Z" fill="${h.main}" stroke="${h.dark}" stroke-width="2.6"/>
      <path d="M34 31 Q52 20 85 31" fill="none" stroke="${h.light}" stroke-width="2.6"/>
      <path d="M53 20L60 ${c.helm>=3?7:12}L67 20L64 30L56 30Z" fill="${h.light}" stroke="${h.dark}" stroke-width="1.5"/>
      ${c.helm>=4?`<path d="M31 23 L21 12 L37 20 M88 23 L100 12 L83 20" stroke="${h.main}" stroke-width="4" fill="none"/>`:''}`;
   const armor=`<path d="M43 75Q51 71 60 73Q69 71 77 75L81 87L72 93L48 93L39 86Z" fill="${a.main}" fill-opacity=".75" stroke="${a.dark}" stroke-width="2"/>
    <path d="M43 75L32 79L36 88L48 88L50 78ZM77 75L88 79L84 88L72 88L70 78Z" fill="${a.dark}" stroke="${a.light}" stroke-width="1.8"/>
    <path d="M47 79H73" stroke="${a.light}" stroke-width="2" opacity=".95"/>
    <path d="M60 78 L65 84L60 90L55 84Z" fill="${a.light}" stroke="${a.dark}" stroke-width="1.3"/>
    ${c.armor>=3?`<path d="M39 94H81" stroke="${a.light}" stroke-width="2.5"/>`:''}`;
   const sideShield=id==='kesatria'?`<path d="M17 65Q29 69 44 65L44 86Q39 98 30 103Q21 96 17 86Z" fill="${a.main}" stroke="${a.dark}" stroke-width="2.5"/>
    <path d="M21 70L40 70V85Q37 92 30 97Q23 92 21 85Z" fill="${a.light}" opacity=".65"/>
    <path d="M30 74V91M23 82H37" stroke="${a.dark}" stroke-width="2.4"/>`:'';
   let weapon;
   if(id==='pemanah'){
     weapon=`<path d="M99 31 Q119 64 99 101" fill="none" stroke="${w.main}" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M100 32 Q115 64 100 100" fill="none" stroke="${w.light}" stroke-width="2"/>
      <circle cx="102" cy="66" r="${c.weapon>=3?5:3}" fill="${w.light}" stroke="${w.dark}" stroke-width="1.2"/>`;
   }else if(id==='sihir'){
     weapon=`<rect x="93" y="32" width="7" height="78" rx="3" fill="${w.dark}" stroke="${w.main}" stroke-width="1.7"/>
      <path d="M96 13 L109 26 L96 39 L83 26 Z" fill="${w.main}" stroke="${w.light}" stroke-width="2.3"/>
      <path d="M96 17 L101 26 L96 35 L91 26Z" fill="${w.light}" opacity=".9"/>${c.weapon>=3?`<circle cx="96" cy="26" r="18" fill="none" stroke="${w.light}" opacity=".6" stroke-width="1.5"/>`:''}`;
   }else{
     weapon=`<rect x="94" y="18" width="8" height="62" rx="3" fill="${w.light}" stroke="${w.dark}" stroke-width="2"/>
      <path d="M98 18L100 68L96 68Z" fill="${w.main}" opacity=".8"/><rect x="86" y="78" width="24" height="7" rx="3.5" fill="${w.main}" stroke="${w.dark}" stroke-width="1.5"/>
      ${c.weapon>=3?`<path d="M98 13L98 69" stroke="${w.light}" stroke-width="2.6" opacity=".95"/>`:''}`;
   }
   const aura=c.aura===0?'':`<g class="wm8-aura wm8-aura-${c.aura}" opacity="${c.aura===1?'.5':'.72'}">
     <ellipse cx="60" cy="105" rx="48" ry="11" fill="none" stroke="${u.main}" stroke-width="${c.aura>=4?3.5:2}"/>
     <path d="M10 75Q6 35 30 22 M110 75Q114 35 90 22" fill="none" stroke="${u.light}" stroke-width="2" stroke-linecap="round" stroke-dasharray="6 9"/>
     <circle cx="19" cy="46" r="4" fill="${u.main}"/><circle cx="101" cy="46" r="4" fill="${u.main}"/>
     ${c.aura>=4?`<path d="M5 25L12 12L19 25L12 36Z M101 25L108 12L115 25L108 36Z" fill="${u.light}"/>`:''}
     </g>`;
   // The earlier RPG equipment/inventory is a separate system from cosmetic tiers.
   // Respect BOTH sources so equipping earned hats, armour or weapons updates the hero.
   const equipped=(typeof S==='object'&&S.equipped&&typeof S.equipped==='object')?S.equipped:{};
   const earnedHead=equipped.head==='crown'?`<path d="M43 14L48 3L58 11L64 1L73 11L82 3L85 14Z" fill="#ffd546" stroke="#a85a0f" stroke-width="2.2"/><circle cx="64" cy="11" r="3" fill="#ec667d"/>`:
     equipped.head==='crystalhelm'?`<path d="M59 17L64 8L69 17L64 28Z" fill="#8deeff" stroke="#3a7ca1" stroke-width="1.5"/>`:'';
   const earnedArmor=equipped.body==='forestarmor'?`<path d="M41 81L60 76L79 81L72 99L48 99Z" fill="none" stroke="#58d49a" stroke-width="3.3"/><path d="M60 81V92" stroke="#e5f9c7" stroke-width="2.4"/>`:
     equipped.body==='starrobe'?`<path d="M38 77L29 110L60 101L92 110L82 77" fill="#ab84e6" fill-opacity=".35" stroke="#e3bdf7" stroke-width="2"/><path d="M60 79L63 85L70 85L65 90L67 97L60 93L53 97L55 90L50 85L57 85Z" fill="#ffe4a6"/>`:'';
   const earnedWeapon=equipped.weapon==='flameweapon'?`<path d="M97 22Q90 7 99 0Q106 14 101 24Z" fill="#ffb04a" stroke="#fff0b2" stroke-width="1.5"/>`:
     equipped.weapon==='thunderweapon'?`<path d="M99 11L91 27H97L93 42L110 20H101L107 11Z" fill="#ffe26b" stroke="#fff7d1" stroke-width="1.5"/>`:'';
   const legacy=`<g class="wm8-legacy-equipped" aria-hidden="true">${earnedArmor}${earnedHead}${earnedWeapon}</g>`;
   const halo=aura?`<g class="wm8-back-layer">${aura}</g>`:'';
   const front=`<g class="wm8-gear" aria-hidden="true">
    <g class="wm8-helm">${head}</g><g class="wm8-armor">${armor}${sideShield}</g>
    <g class="wm8-weapon">${weapon}</g>${legacy}</g>`;
   return {halo,front};
 }
 const oldHero=heroSVG;
 heroSVG=function(id){
  let base=oldHero(id);if(!/^<svg\b/.test(base))return base;
  const {halo,front}=gearLayers(id);
  base=base.replace(/(<svg\b[^>]*>)/, '$1'+gearDefs+halo);
  return base.replace('</svg>',front+'</svg>');
 };
 function updateCosmeticLabels(){
   const banner=document.querySelector('.wm-banner');if(!banner||screen!=='wmV3')return;
   let info=document.createElement('p');info.className='wm8-info';
   info.textContent=EN()?'Choose a look — Explorer (Lv1), Bronze (Lv3), Silver (Lv6), Gold (Lv10), Mythic (Lv14), Legendary (Lv18). Cosmetics are visual only.':
    'Pilih gaya — Pengembara (Lv1), Gangsa (Lv3), Perak (Lv6), Emas (Lv10), Mitos (Lv14), Legendary (Lv18). Semua kosmetik hanya mengubah rupa.';
   banner.appendChild(info);
   document.querySelectorAll('.wm-cos[data-tier]').forEach(btn=>{
     const n=clampTier(btn.dataset.tier);btn.title=(EN()?'Style':'Gaya')+': '+levelNames[n]+' · '+(EN()?'Hero level':'Tahap Wira')+' '+WMV.tiers[n].min;
   });
 }
 // Clarify that the second component is protective clothing, not the Wise Shield skill.
 if(Array.isArray(WMV.types)&&WMV.types[1]){WMV.types[1][1]='Zirah / Perisai';WMV.types[1][2]='Armour / Shield'}
 const oldCos=wmCosmetics;
 wmCosmetics=function(){oldCos();updateCosmeticLabels();};
 // Make the hero preview refresh from the same equipment renderer on each screen transition.
 const oldSet=wm6CostumeScreen;
 wm6CostumeScreen=function(){oldSet();const target=view.querySelector('.wm6-costume-art');if(target)target.innerHTML=heroSVG(S.hero)};
 function cancelIfGone(el){return !!(el&&el.isConnected&&screen==='battle'&&B&&!B.dead);}
 function placeFX(cls,x,y,dx=0,dy=0,dur=620,content=''){
   const arena=document.querySelector('.arena');if(!arena||!B||screen!=='battle'||matchMedia('(prefers-reduced-motion: reduce)').matches)return null;
   const el=document.createElement('div');el.className='wm8-fx '+cls;el.style.left=x+'px';el.style.top=y+'px';el.style.setProperty('--wm8-dx',dx+'px');el.style.setProperty('--wm8-dy',dy+'px');el.innerHTML=content;
   arena.appendChild(el);setTimeout(()=>{if(el.isConnected)el.remove()},dur+180);return el;
 }
 function points(){
   const arena=document.querySelector('.arena'),hero=document.getElementById('uHero'),mon=document.getElementById('uMon');if(!arena||!hero||!mon)return null;
   const a=arena.getBoundingClientRect(),h=hero.getBoundingClientRect(),m=mon.getBoundingClientRect();
   return {hero,mon,source:[h.right-a.left-16,h.top-a.top+h.height*.42],target:[m.left-a.left+m.width*.4,m.top-a.top+m.height*.50]};
 }
 function archerFX(superMove=false){
   const p=points();if(!p)return;
   p.hero.classList.remove('wm8-archer-cast');void p.hero.offsetWidth;p.hero.classList.add('wm8-archer-cast');
   setTimeout(()=>{if(cancelIfGone(p.hero))p.hero.classList.remove('wm8-archer-cast')},590);
   if(superMove) {placeFX('wm8-charge',p.source[0],p.source[1],0,0,700,'✦');return;}
   let dx=p.target[0]-p.source[0],dy=p.target[1]-p.source[1];
   setTimeout(()=>{if(!cancelIfGone(p.hero))return;placeFX('wm8-arrow',p.source[0],p.source[1],dx,dy,490,'➤');},105);
   setTimeout(()=>{if(!cancelIfGone(p.mon))return;placeFX('wm8-hit',p.target[0],p.target[1],0,0,350,'✧');},400);
 }
 function mageFX(superMove=false){
   const p=points();if(!p)return;
   p.hero.classList.remove('wm8-mage-cast');void p.hero.offsetWidth;p.hero.classList.add('wm8-mage-cast');
   setTimeout(()=>{if(cancelIfGone(p.hero))p.hero.classList.remove('wm8-mage-cast')},690);
   placeFX('wm8-rune',p.source[0],p.source[1],0,0,520,superMove?'✺':'✦');
   if(superMove){setTimeout(()=>{if(cancelIfGone(p.mon))placeFX('wm8-meteor-circle',p.target[0],p.target[1],0,0,720,'✧')},340);return;}
   const dx=p.target[0]-p.source[0],dy=p.target[1]-p.source[1];
   setTimeout(()=>{if(cancelIfGone(p.hero))placeFX('wm8-orb',p.source[0],p.source[1],dx,dy,500,'●')},115);
   setTimeout(()=>{if(cancelIfGone(p.mon))placeFX('wm8-hit wm8-magic-hit',p.target[0],p.target[1],0,0,380,'✦')},405);
 }
 const oldAnswer=answer;
 answer=function(v,btn){
   if(B&&!B.busy&&!B.dead&&screen==='battle'&&v===B.q?.ans&&B.combo!==2){
     if(B.hero?.id==='pemanah')archerFX();
     else if(B.hero?.id==='sihir')mageFX();
   }
   return oldAnswer(v,btn);
 };
 const oldSuper=superAttack;
 superAttack=function(id,hero,mon){
   if(B&&!B.dead&&screen==='battle'){
     if(id==='pemanah')archerFX(true);
     else if(id==='sihir')mageFX(true);
   }
   return oldSuper(id,hero,mon);
 };
 window.WM8={version:'WM-COS-002-ANIM-002',cosmetics,tiers:levelNames};
 // Existing boot renders Home/first-run before this additive script loads. Refresh once.
 if(screen==='wm6Customize')wm6Customize(WM6.firstFlow);
 else if(screen==='home')home();
})();
