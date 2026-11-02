/* WM-UX-006 / WM-BATTLE-005 | additive child-first UX, original maths/licence/save preserved. */
'use strict';
const WM6=(()=>{
  const KEY='wm_ux006_v1';
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){saved={}}
  const fix=x=>Number.isInteger(x)&&x>=0&&x<3?x:0;
  const styles={};['kesatria','pemanah','sihir'].forEach(id=>{
    let a=saved.styles?.[id]||{};styles[id]={coat:fix(a.coat),crest:fix(a.crest)};
  });
  return {key:KEY,introDone:saved.introDone===true,firstFlow:saved.introDone!==true,styles,heroIndex:Math.max(0,HEROES.findIndex(h=>h.id===S.hero)),version:'WM-UX-006'};
})();
function wm6Store(){
 try{localStorage.setItem(WM6.key,JSON.stringify({introDone:WM6.introDone,styles:WM6.styles}))}catch(_){/* game runs without storage */}
}
const wm6T=(bm,en)=>EN()?en:bm;
const wm6Role={
 kesatria:['Pedang & perisai · lompat, slash, kombo kilat.','Sword & shield · leap, slash, lightning combo.'],
 pemanah:['Busur yang pantas · serangan anak panah.','Swift bow · arrow attacks.'],
 sihir:['Tongkat ajaib · serangan cahaya dan sihir.','Magic staff · light and spell attacks.']
};
const wm6CoatNames=[['Asal','Original'],['Mentari','Sunrise'],['Zamrud','Emerald']];
const wm6CrestNames=[['Bintang','Star'],['Permata','Gem'],['Sayap','Wings']];
const wm6Colors={
 kesatria:['#3b82f6','#f07862','#31b7a0'],
 pemanah:['#22a35a','#ec9455','#6b7ff5'],
 sihir:['#7c3aed','#e276ac','#2679ca']
};
const wm6OldHeroSVG=heroSVG;
heroSVG=function(id){
 const a=WM6.styles[id]||{coat:0,crest:0};let art=wm6OldHeroSVG(id);
 const original={kesatria:'#3b82f6',pemanah:'#22a35a',sihir:'#7c3aed'}[id];
 const outfit=wm6Colors[id]?.[a.coat]||original;
 if(original)art=art.replace('fill="'+original+'"','fill="'+outfit+'"');
 // Accessories are original SVG overlays: zero image requests, zero external libraries.
 const emblems=[
 '<path d="M60 79l3.8 7.2 8 .9-5.7 5.5 1.3 8-7.4-3.9-7.4 3.9 1.3-8-5.7-5.5 8-.9Z" fill="#ffe082" stroke="#8a5a10" stroke-width="1"/>',
 '<path d="M60 79L71 89L60 101L49 89Z" fill="#8aeaff" stroke="#146c95" stroke-width="2"/><path d="M60 79L60 101L49 89Z" fill="#dbffff" opacity=".48"/>',
 '<path d="M49 90Q34 83 32 76Q48 77 56 90Q64 78 81 76Q79 83 67 90L60 100Z" fill="#ffe5a2" stroke="#bc7b20" stroke-width="1"/>'
 ];
 return art.replace('</svg>',`<g class="wm6-crest">${emblems[a.crest]}</g></svg>`);
};
function wm6SelectHero(d){
 WM6.heroIndex=(WM6.heroIndex+d+3)%3;S.hero=HEROES[WM6.heroIndex].id;save();wm6Store();
 const target=screen==='wm6Customize'?wm6Customize:home;target(screen==='wm6Customize'?WM6.firstFlow:undefined);
}
function wm6Carousel(prefix){
 const h=HEROES[WM6.heroIndex];return `<div class="wm6-carousel" id="${prefix}Carousel">
   <button class="wm6-arrow" id="${prefix}Prev" aria-label="${wm6T('Wira sebelumnya','Previous hero')}">‹</button>
   <div class="wm6-hero-preview" role="group" aria-label="${wm6T('Wira pilihan','Selected hero')}: ${escapeText(tr(h.name))}">
     <div class="wm6-stage-glow"></div><div class="wm6-hero-drawing">${heroSVG(h.id)}</div>
     <div class="wm6-hero-name">${escapeText(tr(h.name))}</div>
     <div class="wm6-hero-role">${escapeText(wm6T(...wm6Role[h.id]))}</div>
   </div>
   <button class="wm6-arrow" id="${prefix}Next" aria-label="${wm6T('Wira seterusnya','Next hero')}">›</button>
 </div><div class="wm6-dots" aria-label="${wm6T('Tiga pilihan wira','Three hero choices')}">${HEROES.map((x,i)=>`<button type="button" class="${i===WM6.heroIndex?'active':''}" data-hero-index="${i}" aria-label="${escapeText(tr(x.name))}" ${i===WM6.heroIndex?'aria-current="true"':''}></button>`).join('')}</div>`;
}
function wm6WireCarousel(prefix){
 document.getElementById(prefix+'Prev').onclick=()=>{SFX.tap();wm6SelectHero(-1)};
 document.getElementById(prefix+'Next').onclick=()=>{SFX.tap();wm6SelectHero(1)};
 view.querySelectorAll('[data-hero-index]').forEach(btn=>btn.onclick=()=>{SFX.tap();wm6SelectHero(+btn.dataset.heroIndex-WM6.heroIndex)});
 const stage=document.getElementById(prefix+'Carousel');let start=null;
 stage.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;start={x:e.clientX,y:e.clientY}}, {passive:true});
 stage.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){SFX.tap();wm6SelectHero(dx<0?1:-1)}},{passive:true});
 stage.addEventListener('pointercancel',()=>{start=null});
}
function wm6ChooseOptions(){
 const h=S.hero,a=WM6.styles[h];
 return `<div class="wm6-choices"><div class="wm6-option-title">🎨 ${wm6T('Warna pakaian','Outfit colour')}</div><div class="wm6-option-row">${wm6CoatNames.map((s,i)=>`<button class="wm6-choice ${a.coat===i?'active':''}" data-coat="${i}" aria-pressed="${a.coat===i}"><i style="background:${wm6Colors[h][i]}"></i><span>${wm6T(...s)}</span></button>`).join('')}</div>
 <div class="wm6-option-title">✨ ${wm6T('Lencana wira','Hero badge')}</div><div class="wm6-option-row">${wm6CrestNames.map((s,i)=>`<button class="wm6-choice ${a.crest===i?'active':''}" data-crest="${i}" aria-pressed="${a.crest===i}">${['⭐','💎','🪽'][i]} <span>${wm6T(...s)}</span></button>`).join('')}</div></div>`;
}
function wm6WireOptions(){
 view.querySelectorAll('[data-coat]').forEach(x=>x.onclick=()=>{SFX.tap();WM6.styles[S.hero].coat=+x.dataset.coat;wm6Store();wm6Customize(WM6.firstFlow)});
 view.querySelectorAll('[data-crest]').forEach(x=>x.onclick=()=>{SFX.tap();WM6.styles[S.hero].crest=+x.dataset.crest;wm6Store();wm6Customize(WM6.firstFlow)});
}
function wm6Customize(first=!WM6.introDone){
 WM6.firstFlow=first;stopBattle();screen='wm6Customize';redraw=()=>wm6Customize(first);head('',first?null:home);
 WM6.heroIndex=Math.max(0,HEROES.findIndex(h=>h.id===S.hero));
 view.innerHTML=`<section class="wm6-customize">
   <div class="wm6-onboarding-top"><span class="wm6-mini-kicker">${first?wm6T('LANGKAH PERTAMA','YOUR FIRST STEP'):wm6T('BILIK PERSALINAN','DRESSING ROOM')}</span><h1>${wm6T('Cipta Gaya Wiramu!','Style Your Hero!')}</h1><p>${wm6T('Pilih wira dan pakaian kegemaranmu. Semua pilihan awal ini percuma.','Choose a hero and look you love. All starter options are free.')}</p></div>
   ${wm6Carousel('wm6Custom')}${wm6ChooseOptions()}
   <button class="wm6-mainbtn" id="wm6Finish">${first?wm6T('SIAP! JOM MAIN ▶','READY! LET’S PLAY ▶'):wm6T('SIMPAN GAYA ✓','SAVE MY STYLE ✓')}</button>
 </section>`;
 wm6WireCarousel('wm6Custom');wm6WireOptions();
 document.getElementById('wm6Finish').onclick=()=>{SFX.win();WM6.introDone=true;WM6.firstFlow=false;wm6Store();save();home()};
}
function wm6More(){
 const show=view.querySelector('#wm6MorePanel');if(show){show.hidden=!show.hidden;document.getElementById('wm6MoreBtn').setAttribute('aria-expanded',String(!show.hidden))}
}
const wm6OldHome=home;
home=function(){
 if(!WM6.introDone)return wm6Customize(true);
 stopBattle();screen='home';redraw=home;head('',null);WM6.heroIndex=Math.max(0,HEROES.findIndex(h=>h.id===S.hero));
 view.innerHTML=`<section class="wm6-home">
 <div class="wm6-home-heading"><h1>${wm6T('WIRA MATEMATIK','MATH HEROES')}</h1><div class="wm6-home-sub">${wm6T('14 dunia · 42 pertempuran','14 worlds · 42 battles')} <span>⭐ ${totalStars()}</span></div>${wmHai()}</div>
 ${wm6Carousel('wm6Home')}
 <button class="wm6-mainbtn" id="wm6Play">▶ ${wins()?wm6T('SAMBUNG BERMAIN','CONTINUE QUEST'):wm6T('MULA BERMAIN','START PLAYING')}</button>
 <div class="wm6-home-cards"><button id="wm6Arena" class="wm6-navbtn"><span>🎯</span>${wm6T('Arena Latihan','Practice Arena')}</button>
 <button id="wm6Costume" class="wm6-navbtn"><span>🎨</span>${wm6T('Kostum Wira','Hero Costume')}</button></div>
 <button class="wm6-small-nav" id="wm6MoreBtn" aria-expanded="false">🎒 ${wm6T('Koleksi, Bank Soalan & Lagi','Collection, Question Bank & More')} <span>⌄</span></button>
 <div class="wm6-more" id="wm6MorePanel" hidden>
 <button id="wm6Bank">📚 ${wm6T('Bank 1,019 Soalan','1,019 Question Bank')}</button>
 <button id="wm6Camp">🏕️ ${wm6T('Kem Wira & Inventori','Hero Camp & Inventory')}</button>
 <button id="wm6Progress">📊 ${wm6T('Penguasaan Murid','Learning Progress')}</button>
 <button id="wm6Book">📖 ${wm6T('Koleksi Raksasa','Monster Collection')}</button>
 <button id="wm6Quest">📜 ${wm6T('Misi Sampingan','Side Quests')}</button>
 <a class="wm6-more-link" href="misi/">📜 ${wm6T('Misi Khas Ibu Bapa','Parent Quests')}</a>
 <button id="wm6Teacher">👩‍🏫 ${wm6T('Ruang Guru / Ibu Bapa','Teacher / Parent Area')}</button>
 <button id="wm6How">❔ ${wm6T('Cara Main','How to Play')}</button>
 <button id="wm6Licence">🔒 ${full?wm6T('Lesen Aktif','Active Licence'):wm6T('Buka Versi Penuh','Unlock Full Game')}</button>
 <button id="wm6Reset">↺ ${wm6T('Set Semula Kemajuan','Reset Progress')}</button>
 </div>
 <div class="wm6-local-note">${wm6T('Pilih wira dengan leret kiri atau kanan.','Swipe left or right to choose your hero.')}</div></section>`;
 wm6WireCarousel('wm6Home');
 document.getElementById('wm6Play').onclick=()=>{SFX.tap();map()};
 document.getElementById('wm6Arena').onclick=()=>{SFX.tap();wmArena()};
 document.getElementById('wm6Costume').onclick=()=>{SFX.tap();wm6CostumeScreen()};
 document.getElementById('wm6MoreBtn').onclick=wm6More;
 const ids={wm6Bank:()=>wm4OpenBank(1),wm6Camp:inventoryScreen,wm6Progress:wmProgress,wm6Book:book,wm6Quest:questBoard,wm6Teacher:wmTeacher,wm6How:how,wm6Licence:()=>full?gate(licenceScreen):unlock()};
 Object.entries(ids).forEach(([id,fn])=>document.getElementById(id).onclick=()=>{SFX.tap();fn()});
 document.getElementById('wm6Reset').onclick=()=>{if(!confirm(wm6T('Set semula kemajuan misi dan XP? Kostum awal kekal.','Reset mission progress and XP? Starter costume remains.')))return;S.stars={};resetRPGProgress();save();home();};
};
function wm6CostumeScreen(){
 // An in-world summary of the chosen hero, then genuine editable starter gear.
 stopBattle();screen='wm6Costume';redraw=wm6CostumeScreen;head(wm6T('Kostum Wira','Hero Costume'),home);
 const h=HEROES.find(x=>x.id===S.hero),a=WM6.styles[S.hero];
 view.innerHTML=`<section class="wm6-costume-page"><div class="wm6-costume-art">${heroSVG(S.hero)}</div><h2>${escapeText(tr(h.name))}</h2>
 <p>${escapeText(wm6T(...wm6Role[S.hero]))}</p><div class="wm6-costume-line">🎨 ${wm6T(...wm6CoatNames[a.coat])} · ${wm6T(...wm6CrestNames[a.crest])}</div>
 <button class="wm6-mainbtn" id="wm6EditCostume">🎨 ${wm6T('UBAH GAYA','CHANGE LOOK')}</button>
 <button class="wm6-secondarybtn" id="wm6Legendary">👑 ${wm6T('Dewan Kosmetik Legendary','Legendary Cosmetic Hall')}</button>
 <button class="wm6-secondarybtn" id="wm6BackHome">⌂ ${wm6T('Halaman Utama','Home')}</button></section>`;
 document.getElementById('wm6EditCostume').onclick=()=>wm6Customize(false);
 document.getElementById('wm6Legendary').onclick=wmCosmetics;
 document.getElementById('wm6BackHome').onclick=home;
}
// 1st / 2nd correct answer: physical leap into melee range (not ranged lightning).
// 3rd correct answer: existing WM4 electric projectile + existing Super Attack math.
function wm6Melee(){
 if(wm4Reduce())return;
 const arena=document.querySelector('.arena'),hero=document.getElementById('uHero'),mon=document.getElementById('uMon');
 if(!arena||!hero||!mon)return;
 const a=arena.getBoundingClientRect(),h=hero.getBoundingClientRect(),m=mon.getBoundingClientRect();
 const dx=Math.max(20,Math.min(a.width*.57,m.left-h.right+24));
 hero.style.setProperty('--wm6-jump',dx+'px');
 arena.classList.add('wm6-melee');hero.classList.remove('wm6-jump');void hero.offsetWidth;hero.classList.add('wm6-jump');
 const fx=document.createElement('div');fx.className='wm6-swordcut';fx.setAttribute('aria-hidden','true');
 fx.style.left=(m.left-a.left+m.width*.1)+'px';fx.style.top=(m.top-a.top+m.height*.05)+'px';
 fx.innerHTML='<svg viewBox="0 0 130 120" aria-hidden="true"><path d="M6 100Q66 -14 126 17Q75 19 31 104" stroke="#fff9cc" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M14 105Q72 -3 123 23" stroke="#65e8ff" stroke-width="4" fill="none"/></svg>';
 arena.appendChild(fx);const battleAtStart=B;setTimeout(()=>{fx.remove();if(B===battleAtStart&&arena.isConnected&&hero.isConnected){hero.classList.remove('wm6-jump');arena.classList.remove('wm6-melee')}},670);
}
const wm6OldAnswer=answer;
answer=async function(v,btn){
 const near=!!(B&&!B.busy&&B.hero?.id==='kesatria'&&v===B.q?.ans&&B.combo<2);
 if(near){wm6Melee();return wm4PrevAnswer(v,btn)}
 return wm6OldAnswer(v,btn);
};
// Primary result actions remain visible within a short phone viewport; optional details are explicit.
resultScreen=function(R){
 lastResultData=R; // Required: RPG reward wrapper rerenders after awarding XP.
 const {l,b,right,total,won,st,firstWin}=R;
 const last=won&&b===2&&l===LANDS.length-1;
 const nextB=won?(b<2?[l,b+1]:l<LANDS.length-1?[l+1,0]:null):null;
 const unlockedLand=won&&b===2&&l<LANDS.length-1&&firstWin&&!paid(l+1);
 const reward=typeof latestReward!=='undefined'&&latestReward&&latestReward.l===l&&latestReward.b===b?latestReward:null;
 screen='result';redraw=()=>resultScreen(R);head('',map);
 view.innerHTML=`<section class="wm6-result ${won?'wm6-win':'wm6-loss'}">
  <div class="wm6-result-title">${won?'WIN!':wm6T('KALAH','DEFEATED')}</div>
  <div class="wm6-result-visual ${won?'wm6-enemy-down':'wm6-hero-tired'}">
    <div class="wm6-result-figure">${won?monArt(l,b):heroSVG(S.hero)}</div>
    <span class="wm6-result-state" aria-hidden="true">${won?'💫':'💤'}</span>
  </div>
  <div class="wm6-result-gain">${won?`<span class="wm6-xp">✨ +${reward?reward.xp:'…'} XP</span><span class="wm6-level">Lv ${rpgLevel()}</span>`:
    `<span class="wm6-xp">${wm6T('Cuba lagi, Wira!','Try again, Hero!')}</span>`}</div>
  ${won?`<div class="wm6-result-stars">${[1,2,3].map(i=>`<span class="${i>st?'dim':''}">★</span>`).join('')}</div>`:
    `<div class="wm6-result-stars wm6-trymsg">${wm6T('Terus berlatih. Kamu boleh!','Keep practising. You can do it!')}</div>`}
  ${unlockedLand?`<div class="wm6-unlock">🔓 ${wm6T('Dunia baharu dibuka!','New world unlocked!')} ${escapeText(tr(LANDS[l+1].name))}</div>`:''}
  ${last?`<div class="wm6-unlock">🏆 ${wm6T('Semua dunia selesai!','All worlds completed!')}</div>`:''}
  <button class="wm6-mainbtn wm6-result-continue" id="wm6ResultMain">${won?(nextB?wm6T('SETERUSNYA ▶','NEXT ▶'):wm6T('PILIH DUNIA ▶','CHOOSE WORLD ▶')):wm6T('CUBA LAGI ↻','TRY AGAIN ↻')}</button>
  <div class="wm6-result-minor"><button id="wm6ResultSecondary">${won?wm6T('Main Semula','Replay'):wm6T('Pilih Dunia','Choose World')}</button><button id="wm6ResultDetail" aria-expanded="false">ⓘ ${wm6T('Butiran & Ganjaran','Details & Rewards')} ▾</button></div>
  <div class="wm6-result-details" id="wm6ResultDetails" hidden>
   <div>✅ ${wm6T('Jawapan betul','Correct answers')}: <strong>${right}/${total}</strong></div>
   ${won&&reward?.newItems?`<div>🎒 ${wm6T('Item baharu','New gear')}: ${reward.newItems}</div>`:''}
   ${won&&firstWin?`<div>📖 ${wm6T('Raksasa baharu dalam koleksi','New monster in collection')}</div>`:''}
   <div>🌍 ${escapeText(tr(LANDS[l].name))} · ${escapeText(tr(LANDS[l].mons[b][0]))}</div>
   <button id="wm6ResultMap">🗺️ ${wm6T('Lihat Peta','View Map')}</button>
  </div>
 </section>`;
 document.getElementById('wm6ResultMain').onclick=()=>{SFX.tap();if(!won)battle(l,b);else if(nextB)battle(nextB[0],nextB[1]);else map()};
 document.getElementById('wm6ResultSecondary').onclick=()=>{SFX.tap();won?battle(l,b):map()};
 document.getElementById('wm6ResultDetail').onclick=()=>{const p=document.getElementById('wm6ResultDetails'),show=p.hidden;p.hidden=!show;document.getElementById('wm6ResultDetail').setAttribute('aria-expanded',String(show))};
 document.getElementById('wm6ResultMap').onclick=()=>{SFX.tap();map()};
};
window.WM6=WM6;
home();
