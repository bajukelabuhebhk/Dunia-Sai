/* WM-VIS-004 — compact HUD, lightning sword, light 2.5D and full formative bank.
   Keeps legacy licence, save, audio, world and damage math unchanged. */
'use strict';
const WM4={version:'WM-VIS-004',bank:Array.isArray(window.WM4_SOURCE_BANK)?window.WM4_SOURCE_BANK:[],mode:'bank',year:1,topic:'ALL',index:0,round:[],shown:false,marked:false,firstMiss:false,attempts:0};
const wm4Text=(bm,en)=>EN()?en:bm;
const wm4Escape=s=>escapeText(String(s??''));
const wm4Reduce=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const wm4ElectricSVG=`<svg viewBox="0 0 110 130" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M4 119Q19 12 101 5Q72 19 62 38Q26 56 4 119Z" fill="#23c7e3" fill-opacity=".46" stroke="#c3ffff" stroke-width="3"/><path d="M12 104Q26 29 88 13" fill="none" stroke="#fff7c2" stroke-width="5" stroke-linecap="round"/><path d="M30 24L47 38L39 48L63 51L48 69L71 76L59 88" fill="none" stroke="#9bfaff" stroke-width="3" stroke-linejoin="round"/><path d="M67 12L77 24L68 28L84 39" fill="none" stroke="#e6ffff" stroke-width="2.6"/></svg>`;
const wm4ShieldSVG=`<svg viewBox="0 0 48 56" aria-hidden="true"><path d="M24 3L43 10V28Q41 44 24 53Q7 44 5 28V10Z" fill="#22668e" stroke="#cdeefe" stroke-width="3"/><path d="M24 7L38 13V29Q35 39 24 46Z" fill="#72cfe0" opacity=".65"/><path d="M24 7L10 13V28Q12 37 24 46Z" fill="#2c789f"/></svg>`;
function wm4Vfx(x0,y0,x1,y1,large=false){
 if(wm4Reduce())return;
 const arena=document.querySelector('.arena'),hero=document.getElementById('uHero'),mon=document.getElementById('uMon');
 if(!arena||!hero||!mon||!B||B.dead)return;
 const fx=document.createElement('div');fx.className='wm4-vfx wm4-wave';fx.innerHTML=wm4ElectricSVG;
 fx.style.setProperty('--x0',(x0-36)+'px');fx.style.setProperty('--y0',(y0-53)+'px');
 fx.style.setProperty('--x1',(x1-38)+'px');fx.style.setProperty('--y1',(y1-61)+'px');
 if(large){fx.style.width='125px';fx.style.height='146px'}
 arena.appendChild(fx);setTimeout(()=>{if(fx.isConnected)fx.remove()},720);
 hero.classList.remove('wm4-windup','wm4-lunge');void hero.offsetWidth;hero.classList.add(large?'wm4-lunge':'wm4-windup');
 setTimeout(()=>{if(hero.isConnected&&arena.isConnected)hero.classList.remove('wm4-windup','wm4-lunge')},650);
 setTimeout(()=>{
  if(!fx.isConnected||!arena.isConnected)return;
  const spark=document.createElement('div');spark.className='wm4-vfx wm4-spark';spark.style.left=(x1-32)+'px';spark.style.top=(y1-32)+'px';arena.appendChild(spark);
  if(mon.isConnected){mon.classList.remove('wm4-hit');void mon.offsetWidth;mon.classList.add('wm4-hit');setTimeout(()=>{if(mon.isConnected)mon.classList.remove('wm4-hit')},450)}
  setTimeout(()=>spark.remove(),430)
 },large?360:280);
}
function wm4SwordWave(large=false){
 if(!B||B.hero?.id!=='kesatria')return;
 const arena=document.querySelector('.arena'),hero=document.getElementById('uHero'),mon=document.getElementById('uMon');if(!arena||!hero||!mon)return;
 const a=arena.getBoundingClientRect(),h=hero.getBoundingClientRect(),m=mon.getBoundingClientRect();
 wm4Vfx(h.right-a.left-14,h.top-a.top+h.height*.45,m.left-a.left+m.width*.38,m.top-a.top+m.height*.45,large);
}
/* Super Attack keeps exactly the original timing/damage integration. Only the knight's visuals change. */
const wm4LegacySuper=superAttack;
superAttack=async function(heroId,heroEl,monEl){
 if(heroId!=='kesatria')return wm4LegacySuper(heroId,heroEl,monEl);
 const arena=monEl?.parentElement;if(!arena)return wm4LegacySuper(heroId,heroEl,monEl);
 const mx=monEl.offsetLeft+monEl.offsetWidth*.5,my=monEl.offsetTop+monEl.offsetHeight*.55;
 restart(heroEl.firstElementChild,'cast');SFX.magic();
 sfxEl(arena,'sbanner',null,null,t('supers')[heroId]);say(t('supers')[heroId],['super-'+heroId]);
 await wait(430);
 SFX.zap();wm4SwordWave(true);await wait(170);
 if(!wm4Reduce()){
  wm4SwordWave(true);await wait(200);
  sfxEl(arena,'thunder',mx,null,BOLT,{top:'-10px'},550);
 }
 SFX.boom();burst(arena,mx,my,['⚡','✨','💥'],wm4Reduce()?2:7);
 sfxEl(arena,'flash');restart(arena,'quake');
};
const wm4PrevAnswer=answer;
answer=async function(v,btn){
 if(B&&!B.busy&&B.hero?.id==='kesatria'&&v===B.q?.ans){
  if(B.combo!==2)wm4SwordWave(false);
 }
 return wm4PrevAnswer(v,btn);
};
/* Compact top HUD with functional (not decorative) Wise Shield action. */
function wm4ShieldPaint(){
 const btn=document.getElementById('rpgPowerBtn');if(!btn||!B)return;
 const knight=B.hero.id==='kesatria',need=isEquipped('rune')?1:2;
 const active=Math.min(2,Math.round(Math.min(B.right,need)/need*2));
 const ready=B.right>=need&&!B.rpgPowerUsed;
 const label=B.rpgPowerUsed?wm4Text('Kuasa telah digunakan','Skill already used'):
  (knight?wm4Text('Perisai Bijak: ','Wise Shield: '):wm4Text('Kuasa wira: ','Hero skill: '))+
  (ready?wm4Text('sedia digunakan','ready'):wm4Text('perlu ','needs ')+(need-B.right)+wm4Text(' jawapan betul',' correct answers'));
 btn.setAttribute('aria-label',label);btn.title=label;
 btn.classList.toggle('wm4-ready',ready);btn.classList.toggle('wm4-guard',!!B.rpgGuard);
 const holder=btn.closest('.rpg-power');holder?.classList.toggle('wm4-knight',knight);
 if(knight){
  btn.innerHTML=wm4ShieldSVG+`<span class="wm4-bars" aria-hidden="true"><i class="${active>=1?'on':''} ${B.rpgGuard?'guard':''}"></i><i class="${active>=2?'on':''} ${B.rpgGuard?'guard':''}"></i></span>`;
 }else{
  btn.textContent=B.hero.id==='pemanah'?'🏹':'✨';
 }
}
function wm4MoveHUD(){
 if(!B||screen!=='battle')return;
 const arena=view.querySelector('.arena'),combo=view.querySelector('#combo'),power=view.querySelector('.rpg-power'),heroHud=arena?.querySelector('.hud>div:first-child');
 if(!arena||!combo||!power||!heroHud)return;
 combo.classList.add('wm4-combo');arena.appendChild(combo);
 power.classList.add('wm4-shield-holder');heroHud.appendChild(power);
 wm4ShieldPaint();
 // Prevent a full sentence expanding an overlay into a large paragraph.
 const hint=combo.textContent||'';if(hint.length>55)combo.setAttribute('title',hint);
}
const wm4PrevUpdatePower=updatePowerButton;
updatePowerButton=function(){wm4PrevUpdatePower();wm4ShieldPaint()};
const wm4PrevDrawHud=drawHud;
drawHud=function(){wm4PrevDrawHud();if(B&&screen==='battle'){wm4ShieldPaint();const c=document.getElementById('combo');if(c){c.classList.add('wm4-combo');c.setAttribute('aria-label',wm4Text('Kombo','Combo')+' '+B.combo+'/3');}}};
const wm4PrevBattle=battle;
battle=function(l,b){
 const result=wm4PrevBattle(l,b);
 if(B&&screen==='battle')wm4MoveHUD();
 return result;
};
/* Changes to legacy game are visual only. The bank below is optional formative training. */
function wm4RecordQuestion(q,right,mode){
 const rec={day:new Date().toISOString().slice(0,10),alias:wmAlias(),year:q.year,topic:q.topic||'Matematik',id:q.id,right:!!right,attempts:1,hints:0,mode:mode||'bank-self',assignmentId:WMV.st.activeAssignment?.id||null};
 WMV.st.attempts.push(rec);if(WMV.st.attempts.length>3000)WMV.st.attempts.splice(0,WMV.st.attempts.length-3000);wmSave();
}
function wm4OpenBank(year=WM4.year){
 WM4.year=Number(year)||1;
 if(WM4.year>2&&!full){unlock();return}
 wmGoTitle(wm4Text('Bank Soalan Matematik','Mathematics Question Bank'),home);
 redraw=()=>wm4OpenBank(WM4.year);
 const topics=[...new Set(WM4.bank.filter(q=>q.year===WM4.year).map(q=>q.topic))].sort((a,b)=>a.localeCompare(b,'ms'));
 if(WM4.topic!=='ALL'&&!topics.includes(WM4.topic))WM4.topic='ALL';
 const selected=WM4.bank.filter(q=>q.year===WM4.year&&(WM4.topic==='ALL'||q.topic===WM4.topic));
 if(!selected.length){view.innerHTML='<div class="wm-panel">Tiada soalan dalam kumpulan ini.</div>';return}
 if(WM4.index>=selected.length||WM4.index<0)WM4.index=0;
 const q=selected[WM4.index];WM4.shown=false;WM4.marked=false;WM4.firstMiss=false;WM4.attempts=0;WM4.round=selected;
 const counts=Array.from({length:6},(_,i)=>WM4.bank.filter(x=>x.year===i+1).length);
 view.innerHTML=`<div class="wm-banner"><h2>📚 ${wm4Text('Bank Latihan Matematik','Mathematics Practice Bank')}</h2><p>${wm4Text('Semua 1,019 entri boleh dipelajari. Soalan terbuka dinilai melalui semakan kendiri. Tiada pemasa.','All 1,019 source entries are available for formative practice. Open questions use self-review. No timer.')}</p>
 <div class="wm4-bank-controls"><label>${wm4Text('Pilih Tahun','Choose year')}<select id="wm4Year">${counts.map((c,i)=>`<option value="${i+1}" ${WM4.year===i+1?'selected':''}>${wm4Text('Tahun','Year')} ${i+1} · ${c}</option>`).join('')}</select></label>
 <label>${wm4Text('Topik','Topic')}<select id="wm4Topic"><option value="ALL">${wm4Text('Semua topik','All topics')}</option>${topics.map((t,i)=>`<option value="${i}" ${WM4.topic===t?'selected':''}>${wm4Escape(t)}</option>`).join('')}</select></label></div></div>
 <div class="wm4-bank-scene wm-scene" style="background-image:url('${wmBg([1,5,7,10,11,14][WM4.year-1])}')"><div class="wm-actor" id="wm4BankHero">${heroSVG(S.hero)}</div><span class="wm-vs">⚔</span><div class="wm-enemy" id="wm4BankMonster">${monArt(Math.min(13,[0,4,6,9,10,13][WM4.year-1]),WM4.index%3)}</div></div>
 <div class="wm4-bank-card"><div class="wm4-bank-label">${wm4Text('Soalan','Question')} ${WM4.index+1}/${selected.length} · ${wm4Escape(q.id)} · ${wm4Escape(q.difficulty||'Latihan')}</div>
 <h3>${wm4Escape(q.prompt)}</h3><div class="wm4-bank-label">${wm4Escape(q.topic)}</div>
 <div class="wm4-bank-answer"><label for="wm4Draft">${wm4Text('Cuba jawab dahulu (pilihan)','Try answering first (optional)')}</label><input id="wm4Draft" type="text" autocomplete="off" spellcheck="false" placeholder="${wm4Text('Jawapan kamu','Your answer')}"/>${WMV.bank.some(x=>x.id===q.id)?`<button class="wm-action" id="wm4Auto">✅ ${wm4Text('Semak nombor','Check number')}</button>`:''}<button class="wm-action" id="wm4Show">${wm4Text('Lihat Skema Sumber','Reveal source answer')}</button><div id="wm4Reveal" aria-live="polite"></div></div></div>
 <div class="wm4-bank-actions"><button id="wm4Prev">◀ ${wm4Text('Sebelum','Previous')}</button><button id="wm4Next" class="wm4-primary">${wm4Text('Seterusnya','Next')} ▶</button><button id="wm4Shuffle">🔀 ${wm4Text('Rawak','Random')}</button></div>
 <div class="wm-panel wm4-bank-status">${wm4Text('Bank ini untuk latihan formatif. Skema sumber dipaparkan seperti dokumen asal; bagi soalan kompleks, rajah yang tiada atau jawapan alternatif, buat semakan guru. Markah latihan kendiri bukan TP rasmi.','Formative practice only. Source keys are shown as supplied; complex questions, missing diagrams and valid alternative responses need teacher checking. Self-review is not an official TP rating.')}</div>`;
 document.getElementById('wm4Year').onchange=e=>{const n=+e.target.value;if(n>2&&!full){unlock();e.target.value=String(WM4.year);return}WM4.topic='ALL';WM4.index=0;wm4OpenBank(n)};
 document.getElementById('wm4Topic').onchange=e=>{WM4.topic=e.target.value==='ALL'?'ALL':topics[+e.target.value];WM4.index=0;wm4OpenBank(WM4.year)};
 document.getElementById('wm4Show').onclick=()=>wm4Reveal(q);
 const check=document.getElementById('wm4Auto');if(check)check.onclick=()=>wm4Auto(q);
 document.getElementById('wm4Prev').onclick=()=>{WM4.index=(WM4.index-1+selected.length)%selected.length;wm4OpenBank(WM4.year)};
 document.getElementById('wm4Next').onclick=()=>{WM4.index=(WM4.index+1)%selected.length;wm4OpenBank(WM4.year)};
 document.getElementById('wm4Shuffle').onclick=()=>{WM4.index=Math.floor(Math.random()*selected.length);wm4OpenBank(WM4.year)};
}
function wm4Auto(q){
 if(WM4.marked||WM4.shown)return;
 const known=WMV.bank.find(x=>x.id===q.id);if(!known||typeof known.answer!=='number')return;
 const node=document.getElementById('wm4Draft'),raw=(node?.value||'').trim().replace(/[ ,]/g,'');
 if(!raw||!Number.isFinite(Number(raw)))return wmFlash(wm4Text('Masukkan nombor dahulu.','Enter a number first.'));
 WM4.attempts++;
 const yes=Math.abs(Number(raw)-known.answer)<1e-7;
 if(!yes){WM4.firstMiss=true;wmFlash(wm4Text('Belum tepat. Cuba lagi.','Not quite. Try again.'));return}
 WM4.shown=true;WM4.marked=true;
 document.getElementById('wm4Show').disabled=true;document.getElementById('wm4Auto').disabled=true;
 wm4RecordQuestion(q,!WM4.firstMiss,'bank-auto');
 document.getElementById('wm4Reveal').innerHTML=`<div class="wm4-bank-result">✅ ${wm4Text('Tepat!','Correct!')} ${wm4Escape(q.source_answer)}</div>`;
 wm4BankBattleEffect(true);
}
function wm4BankBattleEffect(yes){
 if(!yes)return;
 const hero=document.getElementById('wm4BankHero'),mon=document.getElementById('wm4BankMonster');
 hero?.classList.add('wm-attack');mon?.classList.add('wm-hurt');
 try{SFX.slash()}catch(e){}
 setTimeout(()=>{hero?.classList.remove('wm-attack');mon?.classList.remove('wm-hurt')},600);
}
function wm4Reveal(q){
 if(WM4.shown)return;WM4.shown=true;
 const out=document.getElementById('wm4Reveal');if(!out)return;
 out.innerHTML=`<div class="wm4-bank-result"><p>✓ ${wm4Text('Skema jawapan sumber','Source answer key')}: ${wm4Escape(q.source_answer||wm4Text('Tiada skema','No key'))}</p>${q.source_solution?`<p>${wm4Text('Panduan','Working')}: ${wm4Escape(q.source_solution)}</p>`:''}
 ${q.flags?`<p>⚠ ${wm4Text('Nota audit','Audit note')}: ${wm4Escape(q.flags)}</p>`:''}</div>
 <div class="wm4-bank-actions"><button class="wm4-primary" id="wm4SelfRight">✅ ${wm4Text('Saya tepat','I got it')}</button><button id="wm4SelfRevise">🔁 ${wm4Text('Perlu ulang','Need revision')}</button></div>`;
 document.getElementById('wm4Show').disabled=true;
 document.getElementById('wm4SelfRight').onclick=()=>wm4SelfMark(q,true);
 document.getElementById('wm4SelfRevise').onclick=()=>wm4SelfMark(q,false);
}
function wm4SelfMark(q,yes){
 if(WM4.marked)return;WM4.marked=true;
 wm4RecordQuestion(q,yes,'bank-self');wm4BankBattleEffect(yes);
 document.getElementById('wm4SelfRight').disabled=true;document.getElementById('wm4SelfRevise').disabled=true;
 wmFlash(yes?wm4Text('Direkodkan sebagai latihan kendiri.','Self-review recorded.'):wm4Text('Direkodkan untuk ulang kaji.','Marked for revision.'));
}
/* Add bank to home and teacher screens without replacing legacy wrappers. */
const wm4PrevHome=home;
home=function(){wm4PrevHome();const nav=view.querySelector('.wm-extra-nav');if(nav&&!document.getElementById('wm4BankBtn')){
 nav.insertAdjacentHTML('beforeend',`<button id="wm4BankBtn">📚 ${wm4Text('Bank 1,019 Soalan','1,019 Question Bank')}<small>${wm4Text('Latihan Tahun 1–6 · semakan kendiri','Years 1–6 · formative practice')}</small></button>`);
 document.getElementById('wm4BankBtn').onclick=()=>wm4OpenBank(1);
 }};
const wm4PrevTeacher=wmTeacher;
wmTeacher=function(){wm4PrevTeacher();const panel=view.querySelector('.wm-banner');if(panel&&!document.getElementById('wm4TeacherBank')){
 panel.insertAdjacentHTML('beforeend',`<div style="margin-top:7px"><button id="wm4TeacherBank" class="wm-action">📚 ${wm4Text('Buka Bank 1,019 Soalan','Open 1,019 Question Bank')}</button></div>`);
 document.getElementById('wm4TeacherBank').onclick=()=>wm4OpenBank(1);
 }};
/* Keep API exposure only for headless tests / diagnostics. */
window.WM4=WM4;
home();
