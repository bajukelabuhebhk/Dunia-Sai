/* Dunia Sai: Ruang Ibu Bapa dan Ruang Cikgu untuk Wonder Island (model: Wira Matematik WM-MONITOR).
   - Ruang Ibu Bapa: percuma, guna data sebenar anak dalam telefon ini (tiada apa dihantar keluar).
   - Ruang Cikgu: paparan contoh Versi Cikgu dengan kelas rekaan. Butang yang menyimpan, menghantar
     atau memuat turun dikunci dan menunjukkan tawaran WhatsApp. Tukar CIKGU_LOCK kepada false untuk buka kunci.
   Permainan memanggil WIRuang.mula / betul / salah / tamat (baris bertanda "Dunia Sai:" dalam index.html). */
(function(){
'use strict';
const CIKGU_LOCK=true;
const WA='601137865789'; // sama dengan DS.whatsapp dalam shared/js/config.js
const KEY='wi_ruang_v1',GAME_KEY='wonder-grand-v1';

/* ---------- Kemahiran: setiap permainan mini dikira dalam satu kemahiran ---------- */
const SKILLS=[
 {id:'huruf',icon:'🔤',name:'Huruf & bunyi',tip:'Main "Saya nampak huruf…" di dapur: cari huruf B pada label botol atau kotak, kemudian sebut bunyinya dalam English (b… b… bottle!).'},
 {id:'eja',icon:'✏️',name:'Ejaan perkataan pendek',tip:'Eja perkataan tiga huruf bersama (cat, sun, bus) guna magnet peti sejuk atau kertas kecil. Biar anak susun sendiri.'},
 {id:'kosa',icon:'🐾',name:'Kosa kata (haiwan, makanan, benda)',tip:'Semasa ke kedai atau pasar, minta anak namakan lima benda dalam English: apple, milk, bread, egg, fish.'},
 {id:'konsep',icon:'🎨',name:'Warna, bentuk & nombor',tip:'Dalam kereta, kira dan sebut warna kereta lain: "Three red cars! One blue car!"'},
 {id:'dengar',icon:'👂',name:'Mendengar & ikut arahan',tip:'Main "Simon says" dalam English: touch your nose, jump two times, find something yellow.'}];
const GAME={
 '0-0':['🐾','Animal Safari','kosa'],'0-1':['🔎','Hidden Treasures','kosa'],'0-2':['👂','Sound Detective','dengar'],'0-3':['🔤','Letter Hunt','huruf'],'0-4':['🎭','Who Am I?','dengar'],'0-5':['🔷','Shape Explorer','konsep'],
 '1-0':['🥕','Feed the Friends','kosa'],'1-1':['🌈','Rainbow Sort','konsep'],'1-2':['🧩','Word Builder','eja'],'1-3':['⭐','Star Counting','konsep'],'1-4':['↔️','Opposite Pairs','dengar'],'1-5':['🃏','Memory Match','kosa'],
 '2-0':['🌷','Magic Garden','kosa'],'2-1':['🏠','House Builder','kosa'],'2-2':['🐶','Pet Parade','kosa'],'2-3':['🍎','Fruit Market','kosa'],'2-4':['🌤️','Weather Watch','dengar'],'2-5':['💎','Treasure Letters','huruf'],
 '3-0':['🎈','Balloon Pop','dengar'],'3-1':['🎨','Color Painter','konsep'],'3-2':['🥪','Snack Maker','dengar'],'3-3':['🗺️','Treasure Trail','dengar']};
const skillOf=k=>SKILLS.find(s=>s.id===(GAME[k]||[])[2]);

/* ---------- Simpan data sebenar ---------- */
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Array.isArray(v.ev))return v}catch(e){}return {v:1,ev:[]}}
let D=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}
function child(){try{return String(JSON.parse(localStorage.getItem('ds_anak')||'{}').active||'').trim().slice(0,30)}catch(e){return ''}}
function childNames(){let n=[];try{const a=JSON.parse(localStorage.getItem('ds_anak')||'{}');if(Array.isArray(a.names))n=a.names.map(x=>String(x).trim()).filter(Boolean)}catch(e){}
 D.ev.forEach(x=>{if(x.a&&!n.includes(x.a))n.push(x.a)});return n}
let cur=null;
function mula(k){cur={k,a:child(),t0:Date.now(),ok:0,x:0,first:{},r:-1}}
function tanda(round,good){if(!cur)return;if(good)cur.ok++;else cur.x++;if(!(round in cur.first))cur.first[round]=good;cur.r=Math.max(cur.r,round)}
function tamat(k,isNew){if(!cur||cur.k!==k)return;const r=Object.keys(cur.first).length,f=Object.values(cur.first).filter(Boolean).length;
 D.ev.push({k,a:cur.a,t:Date.now(),s:Math.min(1800,Math.round((Date.now()-cur.t0)/1000)),r,f,ok:cur.ok,x:cur.x,n:isNew?1:0});
 if(D.ev.length>3000)D.ev=D.ev.slice(-3000);save();cur=null}

/* ---------- Bantuan paparan ---------- */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?Math.round(a/b*100):null;
const DAY=86400000,dayStart=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
const HARI=['Ahd','Isn','Sel','Rab','Kha','Jum','Sab'];
function mins(s){const m=Math.round(s/60);return m<1&&s>0?'<1':String(m)}
function bar(p,cls=''){return `<div class="wir-bar ${cls}"><i style="width:${p||0}%"></i></div>`}
function status(p,n){if(n<3)return ['Belum cukup bukti','grey'];if(p>=80)return ['Kukuh','good'];if(p>=55)return ['Berkembang','mid'];return ['Perlu bimbingan','low']}
function chip(st){return `<span class="wir-chip ${st[1]}">${st[0]}</span>`}
function skillRows(ev){return SKILLS.map(s=>{const rows=ev.filter(x=>skillOf(x.k)===s),r=rows.reduce((a,x)=>a+x.r,0),f=rows.reduce((a,x)=>a+x.f,0);return {s,n:rows.length,r,f,p:pct(f,r)}})}

/* ---------- Kerangka ---------- */
let root=null,tab='ibubapa',onClose=null,pick='',ctab='kuasa',cls=null;
function css(){if(document.getElementById('wirCss'))return;const st=document.createElement('style');st.id='wirCss';st.textContent=`
#wir{position:fixed;inset:0;z-index:2147482000;overflow-y:auto;-webkit-overflow-scrolling:touch;background:linear-gradient(#cfeefa,#eef9f6 60%,#d6efd2);color:#2c3a4f;font-family:ui-rounded,"SF Pro Rounded","Nunito","Trebuchet MS",system-ui,sans-serif;-webkit-user-select:text;user-select:text}
#wir *{box-sizing:border-box}
#wir h2,#wir h3,#wir p{text-align:left}.wir-table td:first-child{white-space:nowrap}
.wir-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:8px max(12px,env(safe-area-inset-right)) 8px max(12px,env(safe-area-inset-left));background:#ffffffe6;border-bottom:2px solid #fff;box-shadow:0 2px 10px #7fb5c833}
.wir-top h1{flex:1;margin:0;font-size:18px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wir-back{border:0;border-radius:14px;background:#f6c35b;box-shadow:0 3px #d59c2c;font:inherit;font-weight:900;padding:8px 13px;min-height:42px;cursor:pointer}
.wir-wrap{width:min(100%,760px);margin:0 auto;padding:12px 12px 40px;display:flex;flex-direction:column;gap:12px}
.wir-switch{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.wir-switch button,.wir-tabs button,.wir-kid{border:2px solid #cfe5dc;background:#fff;border-radius:16px;font:inherit;font-weight:850;padding:10px 8px;cursor:pointer;color:#2c3a4f}
.wir-switch button.on,.wir-tabs button.on,.wir-kid.on{background:#1f7a62;border-color:#1f7a62;color:#fff}
.wir-switch small{display:block;font-weight:700;font-size:12px;opacity:.8}
.wir-tabs{display:flex;gap:7px;overflow-x:auto;padding-bottom:2px}.wir-tabs button{white-space:nowrap;flex-shrink:0;padding:9px 12px}
.wir-hero{background:linear-gradient(135deg,#1f6f5c,#2a8a6e);color:#fff;border-radius:22px;padding:16px 18px}
.wir-hero.cikgu{background:linear-gradient(135deg,#3d3f8f,#5b55b8)}
.wir-kicker{font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;opacity:.85}
.wir-hero h2{margin:6px 0;font-size:clamp(20px,5vw,26px);line-height:1.2}.wir-hero p{margin:0;font-weight:650;opacity:.92;line-height:1.45}
.wir-card{background:#fff;border:2px solid #e3efe9;border-radius:20px;padding:14px 16px}
.wir-card h3{margin:0 0 10px;font-size:17px}
.wir-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.wir-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.wir-stat{background:#fff;border:2px solid #e3efe9;border-radius:18px;padding:11px 8px;text-align:center}
.wir-stat b{display:block;font-size:clamp(21px,5.6vw,28px);color:#1f6f5c}.wir-stat span{font-size:12px;font-weight:750;color:#5b6680}
.wir-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid #eef3f1}.wir-row:first-of-type{border-top:0}
.wir-row .ic{font-size:24px;width:32px;text-align:center;flex-shrink:0}.wir-row .tx{flex:1;min-width:0}.wir-row .tx strong{display:block;font-size:15px}.wir-row .tx small{color:#5b6680;font-weight:700}
.wir-bar{height:10px;background:#e9f1ee;border-radius:9px;overflow:hidden;margin-top:5px}.wir-bar i{display:block;height:100%;background:#3aa57f;border-radius:9px}
.wir-bar.mid i{background:#e8b23c}.wir-bar.low i{background:#e0795f}.wir-bar.grey i{background:#b8c4cc}
.wir-chip{display:inline-block;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:900;white-space:nowrap}
.wir-chip.good{background:#d8f6e1;color:#20784c}.wir-chip.mid{background:#fff0c7;color:#8a6410}.wir-chip.low{background:#ffe0d8;color:#a8442c}.wir-chip.grey{background:#e9eef2;color:#566373}
.wir-badge{display:inline-block;border-radius:20px;padding:5px 11px;font-size:12px;font-weight:900;background:#e3f6ec;color:#1f6f5c;border:0;font-family:inherit}
.wir-badge.demo{background:#fff0f0;color:#9b3b3b;border:1px solid #f1c3c3}.wir-badge.cta{background:#ffd56b;color:#4b3a05;cursor:pointer}
.wir-flex{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.wir-kids{display:flex;gap:7px;flex-wrap:wrap}.wir-kid{padding:7px 13px}
.wir-week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:end;height:120px;margin-top:6px}
.wir-week div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:11px;font-weight:800;color:#5b6680;gap:3px}
.wir-week i{display:block;width:70%;max-width:34px;background:#7d72d6;border-radius:8px 8px 3px 3px;min-height:3px}
.wir-note{background:#fff8e1;border:2px solid #f5df9d;border-radius:16px;padding:10px 13px;font-weight:700;font-size:14px;line-height:1.45}
.wir-privacy{background:#eaf3fb;border:2px solid #cfe2f3;border-radius:16px;padding:10px 13px;font-size:13px;font-weight:700;color:#3b5068;line-height:1.45}
.wir-btn{border:0;border-radius:15px;background:#1f7a62;color:#fff;font:inherit;font-weight:900;padding:11px 16px;min-height:46px;cursor:pointer;box-shadow:0 3px #155443;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.wir-btn.alt{background:#fff;color:#1f6f5c;border:2px solid #cfe5dc;box-shadow:none}
.wir-btn.lock{background:#eef0f3;color:#5c6672;box-shadow:none;border:2px dashed #c3cad3}
.wir-btns{display:flex;flex-wrap:wrap;gap:8px}
.wir-table{width:100%;border-collapse:collapse;font-size:14px}.wir-table th{text-align:left;font-size:12px;color:#5b6680;padding:6px 4px;border-bottom:2px solid #eef3f1}.wir-table td{padding:7px 4px;border-bottom:1px solid #eef3f1;vertical-align:middle}
.wir-class{display:block;width:100%;text-align:left;border:2px solid #e3e6f6;background:#fff;border-radius:16px;padding:11px 13px;margin-top:8px;font:inherit;color:inherit;cursor:pointer}
.wir-class strong{display:block;font-size:16px}.wir-class span{font-size:13px;font-weight:700;color:#5b6680}
.wir-muted{color:#5b6680;font-weight:700;font-size:14px;line-height:1.45;margin:0}
.wir-check{display:flex;align-items:center;gap:8px;padding:6px 0;font-weight:800}.wir-check input{width:20px;height:20px}
.wir-pop{position:fixed;inset:0;z-index:2147482500;background:#16203099;display:flex;align-items:center;justify-content:center;padding:16px}
.wir-popbox{background:#fff;border-radius:22px;padding:20px;max-width:400px;text-align:center;display:flex;flex-direction:column;gap:10px}
.wir-popbox h3{margin:0;font-size:20px}.wir-popbox p{margin:0;font-weight:650;line-height:1.5;color:#3d4a5c}
@media(max-width:560px){.wir-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wir-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.wir-hide-s{display:none}}
@media print{.wir-top,.wir-switch,.wir-tabs,.wir-btns{display:none}#wir{position:static}}`;document.head.append(st)}
function buka(t,back){css();tab=t==='cikgu'?'cikgu':'ibubapa';onClose=back||null;D=load();
 if(!root){root=document.createElement('div');root.id='wir';root.setAttribute('role','dialog');root.setAttribute('aria-label','Ruang Ibu Bapa dan Cikgu');document.body.append(root)}
 draw();root.scrollTop=0}
function tutup(){if(root){root.remove();root=null}if(onClose)onClose()}
function draw(){const body=tab==='cikgu'?cikgu():ibubapa();
 root.innerHTML=`<header class="wir-top"><button type="button" class="wir-back" id="wirBack">← Kembali</button><h1>${tab==='cikgu'?'🎓 Ruang Cikgu':'🏡 Ruang Ibu Bapa'}</h1></header>
 <div class="wir-wrap"><div class="wir-switch"><button type="button" data-tab="ibubapa" class="${tab==='ibubapa'?'on':''}">🏡 Ibu Bapa<small>Percuma</small></button><button type="button" data-tab="cikgu" class="${tab==='cikgu'?'on':''}">🎓 Cikgu<small>${CIKGU_LOCK?'Contoh paparan':'Versi Cikgu'}</small></button></div>${body}</div>`;
 root.querySelector('#wirBack').onclick=tutup;
 root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;draw();root.scrollTop=0});
 bind()}

/* ---------- Ruang Ibu Bapa (data sebenar) ---------- */
function ibubapa(){const names=childNames();if(pick&&!names.includes(pick))pick='';
 const ev=D.ev.filter(x=>!pick||x.a===pick),now=Date.now(),today=dayStart(now);
 let done={};try{done=(JSON.parse(localStorage.getItem(GAME_KEY)||'{}').done)||{}}catch(e){}
 const main=Object.keys(done).filter(k=>done[k]&&/^[012]-[0-5]$/.test(k)).length,bonus=Object.keys(done).filter(k=>done[k]&&/^3-[0-3]$/.test(k)).length;
 const week=ev.filter(x=>x.t>=today-6*DAY),wSecs=week.reduce((a,x)=>a+x.s,0);
 const R=ev.reduce((a,x)=>a+x.r,0),F=ev.reduce((a,x)=>a+x.f,0),acc=pct(F,R);
 const days=[...Array(7)].map((_,i)=>{const d=today-(6-i)*DAY;return {d,s:ev.filter(x=>x.t>=d&&x.t<d+DAY).reduce((a,x)=>a+x.s,0)}}),maxS=Math.max(60,...days.map(x=>x.s));
 const skills=skillRows(ev),weak=skills.filter(x=>x.r>=3).sort((a,b)=>a.p-b.p)[0];
 const last=ev.slice(-6).reverse();
 const kids=names.length?`<div class="wir-card"><h3>👨‍👩‍👧 Anak</h3><div class="wir-kids"><button type="button" class="wir-kid ${pick?'':'on'}" data-kid="">Semua</button>${names.map(n=>`<button type="button" class="wir-kid ${pick===n?'on':''}" data-kid="${esc(n)}">${esc(n)}</button>`).join('')}</div><p class="wir-muted" style="margin-top:8px">Rekod disimpan mengikut nama anak yang dipilih dalam Dunia Sai semasa bermain.</p></div>`:'';
 return `<div class="wir-flex"><span class="wir-badge">Percuma</span></div>
 <div class="wir-hero"><div class="wir-kicker">🏡 Ruang Ibu Bapa · percuma</div><h2>Anak belajar English, kita faham perkembangannya.</h2><p>Tiada ranking dan tiada label gagal. Semua angka di sini datang daripada permainan sebenar anak dalam telefon ini.</p></div>
 ${kids}
 <div class="wir-grid"><div class="wir-stat"><b>${main}/18</b><span>Pengembaraan selesai</span></div><div class="wir-stat"><b>${mins(wSecs)}</b><span>Minit main (7 hari)</span></div><div class="wir-stat"><b>${acc===null?'—':acc+'%'}</b><span>Betul cubaan pertama</span></div><div class="wir-stat"><b>${ev.length}</b><span>Permainan dimainkan</span></div></div>
 ${ev.length?'':`<div class="wir-note">📌 Rekod terperinci (masa, ketepatan, kemahiran) bermula hari ini. Biar anak main satu atau dua permainan, kemudian buka semula ruang ini.${main?` Pelekat yang sudah dikumpul sebelum ini (${main}/18${bonus?', bonus '+bonus+'/4':''}) tetap dikira.`:''}</div>`}
 <div class="wir-card"><h3>📅 Masa bermain minggu ini</h3><div class="wir-week">${days.map(x=>`<div><span>${x.s?mins(x.s)+'m':''}</span><i style="height:${Math.round(x.s/maxS*82)}%"></i>${HARI[new Date(x.d).getDay()]}</div>`).join('')}</div></div>
 <div class="wir-card"><h3>📘 Kemahiran English</h3>${skills.map(x=>{const st=status(x.p,x.r);return `<div class="wir-row"><div class="ic">${x.s.icon}</div><div class="tx"><strong>${x.s.name}</strong><small>${x.r?x.p+'% betul cubaan pertama · '+x.r+' soalan':'Belum dimainkan'}</small>${bar(x.p,st[1])}</div>${chip(st)}</div>`}).join('')}<p class="wir-muted" style="margin-top:8px">Kukuh = 80% ke atas · Berkembang = 55–79% · Perlu bimbingan = bawah 55%. Sekurang-kurangnya 3 soalan diperlukan.</p></div>
 <div class="wir-card"><h3>🛒 Cadangan aktiviti di rumah</h3><p class="wir-muted" style="color:#2c3a4f">${weak?`<b>${weak.s.icon} ${weak.s.name}</b> paling perlu latihan sekarang (${weak.p}%). ${esc(weak.s.tip)}`:'Biar anak main 3 permainan dahulu. Kemudian kami cadangkan aktiviti mengikut kemahiran yang paling perlu dibantu.'}</p></div>
 <div class="wir-card"><h3>🕘 Permainan terkini</h3>${last.length?last.map(x=>{const g=GAME[x.k]||['🎮',x.k];const d=new Date(x.t);return `<div class="wir-row"><div class="ic">${g[0]}</div><div class="tx"><strong>${esc(g[1])}</strong><small>${d.toLocaleDateString('ms-MY',{day:'numeric',month:'short'})} ${d.toLocaleTimeString('ms-MY',{hour:'2-digit',minute:'2-digit'})}${x.a&&!pick?' · '+esc(x.a):''} · ${mins(x.s)} min · ${x.f}/${x.r} betul cubaan pertama</small></div>${x.n?'<span class="wir-chip good">Pelekat baharu</span>':''}</div>`}).join(''):'<p class="wir-muted">Belum ada permainan direkod.</p>'}</div>
 <div class="wir-card"><h3>🔗 Sambung dengan kelas cikgu</h3><p class="wir-muted">Bila tadika atau sekolah anak guna Versi Cikgu, masukkan kod daripada cikgu di sini supaya cikgu nampak perkembangan anak.</p><div class="wir-btns" style="margin-top:10px"><button type="button" class="wir-btn ${CIKGU_LOCK?'lock':''}" data-lock="1">${CIKGU_LOCK?'🔒 ':''}Masukkan kod cikgu</button></div></div>
 <div class="wir-privacy">🔐 Data anak disimpan dalam telefon ini sahaja. Tiada ranking dan tiada data dihantar keluar.</div>
 <button type="button" class="wir-btn alt" data-close="1">← Kembali ke permainan</button>`}

/* ---------- Ruang Cikgu (contoh, data rekaan) ---------- */
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
const CLASSES=[['Prasekolah Melati','5–6 tahun',26],['Prasekolah Mawar','5–6 tahun',24],['1 Amanah','Tahun 1',31],['1 Bestari','Tahun 1',29]];
const BASE={huruf:.74,eja:.52,kosa:.83,konsep:.79,dengar:.64};
let SAMPLE=null;
function sample(){if(SAMPLE)return SAMPLE;const R=rng(20261030);
 SAMPLE=CLASSES.map(([name,lvl,n],ci)=>{const pupils=[...Array(n)].map((_,i)=>{const sk={};let tot=0,hit=0;const ability=(R()-.5)*.5+(ci>1?.05:0);
  SKILLS.forEach(s=>{const q=4+Math.floor(R()*14),p=Math.max(.15,Math.min(.99,BASE[s.id]+ability+(R()-.5)*.3)),h=Math.round(q*p);sk[s.id]={r:q,f:h};tot+=q;hit+=h});
  const active=R()>.06;if(!active)SKILLS.forEach(s=>{sk[s.id]={r:0,f:0}});
  const r=Object.values(sk).reduce((a,x)=>a+x.r,0),f=Object.values(sk).reduce((a,x)=>a+x.f,0);
  const weak=SKILLS.filter(s=>sk[s.id].r>=3).sort((a,b)=>sk[a.id].f/sk[a.id].r-sk[b.id].f/sk[b.id].r)[0];
  return {name:'Murid '+String(i+1).padStart(2,'0'),sk,r,f,p:pct(f,r),min:active?Math.round(25+R()*95):0,done:active?Math.round(4+R()*14):0,weak,code:'WIP-'+(1000+Math.floor(R()*9000))}});
  return {name,lvl,pupils}});return SAMPLE}
function groupSkills(pupils){return SKILLS.map(s=>{const r=pupils.reduce((a,p)=>a+p.sk[s.id].r,0),f=pupils.reduce((a,p)=>a+p.sk[s.id].f,0);return {s,r,f,p:pct(f,r)}})}
const TONE={Kukuh:'good',Berkembang:'mid','Perlu bimbingan':'low','Belum cukup bukti':'grey'};
function counts(pupils){const c={Kukuh:0,Berkembang:0,'Perlu bimbingan':0,'Belum cukup bukti':0};pupils.forEach(p=>c[status(p.p,p.r)[0]]++);return c}
function lockBtn(label,id,alt){return `<button type="button" class="wir-btn ${CIKGU_LOCK?'lock':alt?'alt':''}" data-lock="1"${id?` id="${id}"`:''}>${CIKGU_LOCK?'🔒 ':''}${label}</button>`}
function cikgu(){const S=sample(),all=S.flatMap(c=>c.pupils),active=all.filter(p=>p.r>=3).length,c=counts(all);
 const tabs=[['kuasa','📊 Penguasaan'],['tugas','📝 Tugasan'],['laporan','📄 Laporan'],['kelas','🏫 Kelas & kod']];
 let inner='';
 if(ctab==='kuasa'&&cls!==null){const k=S[cls],cc=counts(k.pupils);
  inner=`<button type="button" class="wir-btn alt" id="wirAllCls">← Semua kelas</button>
  <div class="wir-card"><h3>🏫 ${k.name} · ${k.lvl}</h3><div class="wir-btns">${Object.entries(cc).map(([n,v])=>chip([n+' '+v,TONE[n]])).join(' ')}</div></div>
  <div class="wir-card"><h3>📘 Kemahiran kelas</h3>${groupSkills(k.pupils).map(x=>{const st=status(x.p,x.r);return `<div class="wir-row"><div class="ic">${x.s.icon}</div><div class="tx"><strong>${x.s.name}</strong><small>${x.p}% betul cubaan pertama · ${x.r} jawapan</small>${bar(x.p,st[1])}</div></div>`}).join('')}</div>
  <div class="wir-card"><h3>👧 Murid (${k.pupils.length})</h3><table class="wir-table"><thead><tr><th>Murid</th><th>Status</th><th>Perlu latihan</th><th class="wir-hide-s">Minit/minggu</th></tr></thead><tbody>${k.pupils.map(p=>`<tr><td><b>${p.name}</b></td><td>${chip(status(p.p,p.r))}</td><td>${p.r>=3&&p.weak?p.weak.icon+' '+p.weak.name.split(' (')[0]:'—'}</td><td class="wir-hide-s">${p.min||'—'}</td></tr>`).join('')}</tbody></table></div>`}
 else if(ctab==='kuasa'){const gs=groupSkills(all),weak=[...gs].sort((a,b)=>a.p-b.p)[0];
  inner=`<div class="wir-grid three"><div class="wir-stat"><b>${S.length}</b><span>Kelas</span></div><div class="wir-stat"><b>${all.length}</b><span>Murid</span></div><div class="wir-stat"><b>${active}</b><span>Ada laporan</span></div></div>
  <div class="wir-card"><h3>🏫 Ringkasan penguasaan</h3><div class="wir-btns">${chip(['Kukuh '+c.Kukuh,'good'])}${chip(['Berkembang '+c.Berkembang,'mid'])}${chip(['Perlu bimbingan '+c['Perlu bimbingan'],'low'])}${chip(['Belum cukup bukti '+c['Belum cukup bukti'],'grey'])}</div><p class="wir-muted" style="margin-top:9px">Status ialah petunjuk daripada latihan dalam game, <b>bukan Tahap Penguasaan rasmi</b>. Tiada laporan tidak bererti murid lemah.</p></div>
  <div class="wir-card"><h3>📘 Kemahiran English semua kelas</h3>${gs.map(x=>{const st=status(x.p,x.r);return `<div class="wir-row"><div class="ic">${x.s.icon}</div><div class="tx"><strong>${x.s.name}</strong><small>${x.p}% betul cubaan pertama · ${x.r.toLocaleString('ms-MY')} jawapan</small>${bar(x.p,st[1])}</div>${chip(st)}</div>`}).join('')}<div class="wir-note" style="margin-top:10px">💡 Fokus minggu ini: <b>${weak.s.icon} ${weak.s.name}</b> (${weak.p}%). Cadangan: beri tugasan Word Builder 10 minit.</div></div>
  <div class="wir-card"><h3>Pilih kelas untuk lihat murid</h3>${S.map((k,i)=>{const cc=counts(k.pupils),g=groupSkills(k.pupils).sort((a,b)=>a.p-b.p)[0];return `<button type="button" class="wir-class" data-cls="${i}"><strong>${k.name} · ${k.lvl}</strong><span>${cc['Perlu bimbingan']} perlu bimbingan · ${cc.Berkembang} berkembang · ${cc.Kukuh} kukuh · ${cc['Belum cukup bukti']} belum cukup bukti</span><br><span style="font-size:12px">Fokus: ${g.s.name.split(' (')[0]} · ${k.pupils.filter(p=>p.r>=3).length}/${k.pupils.length} laporan</span></button>`}).join('')}</div>`}
 else if(ctab==='tugas'){
  inner=`<div class="wir-card"><h3>📝 Beri tugasan kepada kelas</h3><p class="wir-muted">Pilih permainan; murid nampak tugasan bila buka Wonder Island di rumah. Cikgu nampak siapa sudah siap.</p>
  <div style="margin:10px 0">${['1-2','0-3','2-5','0-2'].map((k,i)=>`<label class="wir-check"><input type="checkbox" ${i<2?'checked':''} data-lock="1"> ${GAME[k][0]} ${GAME[k][1]} <span class="wir-muted">· ${skillOf(k).name.split(' (')[0]}</span></label>`).join('')}</div>
  <div class="wir-btns">${lockBtn('Hantar kepada 1 Amanah','wirSendTask')}</div></div>
  <div class="wir-card"><h3>📋 Tugasan aktif (contoh)</h3><table class="wir-table"><thead><tr><th>Tugasan</th><th>Kelas</th><th>Siap</th></tr></thead><tbody>
  <tr><td>🧩 Word Builder ×3</td><td>1 Amanah</td><td>22/31 ${bar(71,'mid')}</td></tr><tr><td>🔤 Letter Hunt</td><td>Prasekolah Melati</td><td>24/26 ${bar(92)}</td></tr><tr><td>👂 Sound Detective</td><td>Prasekolah Mawar</td><td>15/24 ${bar(63,'mid')}</td></tr></tbody></table></div>`}
 else if(ctab==='laporan'){const p=S[2].pupils[4],gs=SKILLS.map(s=>({s,p:pct(p.sk[s.id].f,p.sk[s.id].r)}));
  inner=`<div class="wir-card"><h3>📄 Laporan mingguan kepada ibu bapa (contoh)</h3><p class="wir-muted"><b>${p.name}</b> · 1 Amanah · minggu 26 Okt – 1 Nov</p>
  <div class="wir-grid three" style="margin:10px 0"><div class="wir-stat"><b>${p.min}</b><span>Minit main</span></div><div class="wir-stat"><b>${p.done}</b><span>Permainan siap</span></div><div class="wir-stat"><b>${p.p}%</b><span>Betul cubaan pertama</span></div></div>
  ${gs.map(x=>`<div class="wir-row"><div class="ic">${x.s.icon}</div><div class="tx"><strong>${x.s.name}</strong>${bar(x.p,status(x.p,9)[1])}</div><b>${x.p}%</b></div>`).join('')}
  <div class="wir-note" style="margin-top:10px">✍️ Nota cikgu: ${p.name} makin yakin menyebut bunyi huruf. Minggu depan kita fokus ${p.weak?p.weak.name.split(' (')[0].toLowerCase():'ejaan perkataan pendek'}.</div>
  <div class="wir-btns" style="margin-top:10px">${lockBtn('Hantar kepada ibu bapa','wirSendRpt')}${lockBtn('Muat turun CSV kelas','wirCsv',1)}${lockBtn('Cetak','wirPrint',1)}</div></div>`}
 else{
  inner=`<div class="wir-card"><h3>➕ Daftar kelas sekali sahaja</h3><p class="wir-muted">Masukkan nama kelas dan senarai murid, atau import fail Excel/CSV. Setiap murid dapat kod pasangan untuk ibu bapa.</p><div class="wir-btns" style="margin-top:10px">${lockBtn('Cipta kelas')}${lockBtn('Import senarai murid (CSV)','',1)}</div></div>
  <div class="wir-card"><h3>📇 Kod pasangan murid · ${S[0].name} (contoh)</h3><table class="wir-table"><thead><tr><th>Murid</th><th>Kod untuk ibu bapa</th><th>Status</th></tr></thead><tbody>${S[0].pupils.slice(0,6).map((p,i)=>`<tr><td><b>${p.name}</b></td><td><code>${p.code}</code></td><td>${i===3?chip(['Belum pasang','grey']):chip(['Bersambung','good'])}</td></tr>`).join('')}</tbody></table><div class="wir-btns" style="margin-top:10px">${lockBtn('Cetak kad kod untuk ibu bapa','',1)}</div></div>`}
 return `<div class="wir-flex">${CIKGU_LOCK?`<span class="wir-badge demo">👀 CONTOH PAPARAN</span><button type="button" class="wir-badge cta" data-lock="1">🔒 Versi Cikgu</button>`:'<span class="wir-badge">Versi Cikgu</span>'}</div>
 <div class="wir-hero cikgu"><div class="wir-kicker">🎓 Ruang Cikgu</div><h2>Lihat keperluan pembelajaran, bukan ranking.</h2><p>Inilah yang cikgu nampak bila murid bermain Wonder Island: kemahiran English yang lemah, murid yang perlu bimbingan, dan tugasan yang sudah siap. Tekan mana-mana kelas untuk lihat.</p></div>
 <div class="wir-tabs">${tabs.map(([id,l])=>`<button type="button" data-ctab="${id}" class="${ctab===id?'on':''}">${l}</button>`).join('')}</div>
 ${CIKGU_LOCK?'<div class="wir-note">⚠️ Semua nama dan markah dalam Ruang Cikgu ialah rekaan untuk tunjuk cara. Tiada murid sebenar dinilai.</div>':''}
 ${inner}
 <div class="wir-privacy">Belum hantar laporan ≠ murid lemah. Peratus di sini ialah petunjuk formatif daripada game, bukan pentaksiran rasmi KPM.</div>`}

/* ---------- Butang ---------- */
function offer(){const old=document.querySelector('.wir-pop');if(old)old.remove();const text='Salam, saya berminat dengan Versi Cikgu Wonder Island untuk kelas/tadika/sekolah saya.';
 const pop=document.createElement('div');pop.className='wir-pop';pop.innerHTML=`<div class="wir-popbox"><div style="font-size:44px">🔒</div><h3>Ciri Versi Cikgu</h3><p>Ini paparan contoh. Dengan Versi Cikgu, cikgu boleh daftar kelas sendiri, beri tugasan Wonder Island, dan terima laporan murid untuk tahu kemahiran English mana yang murid lemah.</p><a class="wir-btn" href="https://wa.me/${WA}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">💬 Saya berminat, WhatsApp kami</a><button type="button" class="wir-btn alt" id="wirPopClose">Tutup</button></div>`;
 document.body.append(pop);const close=()=>pop.remove();pop.onclick=ev=>{if(ev.target===pop)close()};pop.querySelector('#wirPopClose').onclick=close}
function csv(){const rows=[['Kelas','Murid','Status','Betul cubaan pertama %',...SKILLS.map(s=>s.name+' %'),'Minit seminggu']];
 sample().forEach(k=>k.pupils.forEach(p=>rows.push([k.name,p.name,status(p.p,p.r)[0],p.p??'',...SKILLS.map(s=>pct(p.sk[s.id].f,p.sk[s.id].r)??''),p.min])));
 const blob=new Blob(['﻿'+rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'}),u=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=u;a.download='wonder-island-laporan-kelas.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
function bind(){
 root.querySelectorAll('[data-close]').forEach(b=>b.onclick=tutup);
 root.querySelectorAll('[data-kid]').forEach(b=>b.onclick=()=>{pick=b.dataset.kid;draw()});
 root.querySelectorAll('[data-ctab]').forEach(b=>b.onclick=()=>{ctab=b.dataset.ctab;cls=null;draw()});
 root.querySelectorAll('[data-cls]').forEach(b=>b.onclick=()=>{cls=+b.dataset.cls;draw();root.scrollTop=0});
 const all=root.querySelector('#wirAllCls');if(all)all.onclick=()=>{cls=null;draw()};
 root.querySelectorAll('[data-lock]').forEach(b=>{
  if(CIKGU_LOCK){const stop=ev=>{ev.preventDefault();ev.stopPropagation();if(ev.type==='click')offer()};b.addEventListener('click',stop);if(b.tagName==='INPUT')b.addEventListener('change',stop);return}
  if(b.id==='wirCsv')b.onclick=csv;else if(b.id==='wirPrint')b.onclick=()=>window.print();
  else if(b.tagName==='BUTTON'&&!b.classList.contains('cta'))b.onclick=()=>alert('Ciri ini disambung bila Versi Cikgu dilancarkan untuk sekolah anda.')})}

window.WIRuang={mula,betul:r=>tanda(r,true),salah:r=>tanda(r,false),tamat,buka,get data(){return D}};
})();
