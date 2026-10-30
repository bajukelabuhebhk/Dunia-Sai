/* Dunia Sai: Ruang Ibu Bapa yang dikongsi semua game (model: Wira Matematik WM-MONITOR, tanpa Ruang Cikgu).
   Percuma. Guna data sebenar anak dalam telefon ini sahaja; tiada apa dihantar keluar.

   Cara pasang dalam game (lihat Wonder Island, Kenal Jawi, Nakhoda Jawi, Robot Rumble):
   1. <script src="/shared/js/ruang-ibubapa.js"></script> dalam <head> (tanpa defer, supaya game boleh terus guna).
   2. DSRuang.pasang({...}) sekali, dengan senarai aktiviti dan kemahiran game itu.
   3. Panggil DSRuang.jawab(aktiviti, betul, item) setiap kali anak menjawab,
      DSRuang.selesai(aktiviti, {baru}) bila satu permainan tamat, dan DSRuang.buka(kembali) dari butang 👪.
   Satu "soalan" tamat bila anak menjawab betul; betul tanpa salah sebelumnya = betul cubaan pertama.
   Rekod sesi: {k aktiviti, a nama anak, t mula, s saat, r soalan, f betul cubaan pertama, x salah, d selesai, n baharu}. */
(function(){
'use strict';
if(window.DSRuang)return;
let C=null,D=null,cur=null,lastK='',saveT=0;
const GAP=150000; // jeda lebih 2.5 minit = sesi baharu
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?Math.round(a/b*100):null;
const DAY=86400000,dayStart=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
const HARI=['Ahd','Isn','Sel','Rab','Kha','Jum','Sab'];
const KATA={soalan:'soalan',betul:'Betul cubaan pertama',main:'Permainan dimainkan',baru:'Baharu',kemahiran:'Kemahiran',terkini:'Permainan terkini',kemahiranNota:''};

/* ---------- Simpan ---------- */
function key(){return C.kunci||('ds_ruang_'+C.id)}
function load(){try{const v=JSON.parse(localStorage.getItem(key())||'null');if(v&&Array.isArray(v.ev)){v.it=v.it&&typeof v.it==='object'?v.it:{};return v}}catch(e){}return {v:1,ev:[],it:{}}}
function save(){clearTimeout(saveT);saveT=0;try{localStorage.setItem(key(),JSON.stringify(D))}catch(e){}}
function later(){if(!saveT)saveT=setTimeout(save,500)}
addEventListener('pagehide',()=>{if(saveT)save()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&saveT)save()});
function child(){try{return String(JSON.parse(localStorage.getItem('ds_anak')||'{}').active||'').trim().slice(0,30)}catch(e){return ''}}
function childNames(){let n=[];try{const a=JSON.parse(localStorage.getItem('ds_anak')||'{}');if(Array.isArray(a.names))n=a.names.map(x=>String(x).trim()).filter(Boolean)}catch(e){}
 D.ev.forEach(x=>{if(x.a&&!n.includes(x.a))n.push(x.a)});return n}

/* ---------- Rekod ---------- */
function open(k){const now=Date.now();cur={rec:{k:String(k),a:child(),t:now,s:0,r:0,f:0,x:0,d:0,n:0},last:now,miss:false};D.ev.push(cur.rec);if(D.ev.length>2500)D.ev=D.ev.slice(-2500);lastK=String(k)}
function ensure(k){k=String(k||lastK||'');if(!k)return false;const now=Date.now();
 if(!cur||cur.rec.k!==k||now-cur.last>GAP||cur.rec.d)open(k);
 else{cur.rec.s=Math.min(3600,cur.rec.s+Math.round((now-cur.last)/1000));cur.last=now}return true}
function mula(k){if(!C)return;open(k);later()}
// opt.satu: setiap jawapan ialah satu soalan (game yang tidak beri cubaan kedua), salah pun dikira soalan
function jawab(k,ok,item,opt){if(!C)return;try{if(!ensure(k))return;const r=cur.rec,satu=!!(opt&&opt.satu),first=satu||!cur.miss;
 if(ok){r.r++;if(first)r.f++}else{r.x++;if(satu)r.r++}
 if(item!=null&&item!==''){const a=r.a||'',box=D.it[a]||(D.it[a]={}),name=String(item).slice(0,60),it=box[name]||(box[name]={n:0,f:0,x:0});
  if(ok){it.n++;if(first)it.f++}else{it.x++;if(satu)it.n++}it.t=Date.now()}
 cur.miss=!ok&&!satu;later()}catch(e){}}
function selesai(k,opt){if(!C)return;try{if(!ensure(k))return;cur.rec.d=1;if(opt&&opt.baru)cur.rec.n=1;cur.rec.s+=3;save();cur=null}catch(e){}}
function henti(){if(cur){cur=null;save()}}

/* ---------- Paparan ---------- */
function mins(s){const m=Math.round(s/60);return m<1&&s>0?'<1':String(m)}
function bar(p,cls=''){return `<div class="dsr-bar ${cls}"><i style="width:${p||0}%"></i></div>`}
function status(p,n){if(n<3||p==null)return ['Belum cukup bukti','grey'];if(p>=80)return ['Kukuh','good'];if(p>=55)return ['Berkembang','mid'];return ['Perlu bimbingan','low']}
function chip(st){return `<span class="dsr-chip ${st[1]}">${st[0]}</span>`}
function info(k){const a=typeof C.aktiviti==='function'?C.aktiviti(k):(C.aktiviti||{})[k];return a||['🎮',k,'']}
function skillRows(ev){if(C.kemahiranData)return C.kemahiranData(ev).map(x=>({...x,p:pct(x.f,x.r)}));
 return (C.kemahiran||[]).map(s=>{const rows=ev.filter(x=>info(x.k)[2]===s.id),r=rows.reduce((a,x)=>a+x.r,0),f=rows.reduce((a,x)=>a+x.f,0);return {icon:s.icon,name:s.name,tip:s.tip,r,f,p:pct(f,r)}})}
let root=null,onBack=null,pick='',lulus=false;
function css(){if(document.getElementById('dsrCss'))return;const st=document.createElement('style');st.id='dsrCss';st.textContent=`
#dsr{position:fixed;inset:0;z-index:2147482000;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:linear-gradient(#cfeefa,#eef9f6 60%,#d6efd2);color:#2c3a4f;font:16px/1.4 ui-rounded,"SF Pro Rounded","Nunito","Trebuchet MS",system-ui,sans-serif;-webkit-user-select:text;user-select:text;text-align:left;letter-spacing:normal;text-transform:none}
#dsr *{box-sizing:border-box}
#dsr h1,#dsr h2,#dsr h3,#dsr p{text-align:left;text-shadow:none;letter-spacing:normal;font-family:inherit}
#dsr button{font-family:inherit;text-transform:none;letter-spacing:normal}
.dsr-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:8px max(12px,env(safe-area-inset-right)) 8px max(12px,env(safe-area-inset-left));background:#ffffffe6;border-bottom:2px solid #fff;box-shadow:0 2px 10px #7fb5c833}
.dsr-top h1{flex:1;margin:0;font-size:18px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#2c3a4f}
.dsr-back{border:0;border-radius:14px;background:#f6c35b;box-shadow:0 3px #d59c2c;font-size:16px;font-weight:900;padding:8px 13px;min-height:42px;cursor:pointer;color:#2c3a4f}
.dsr-wrap{width:min(100%,760px);margin:0 auto;padding:12px 12px 40px;display:flex;flex-direction:column;gap:12px}
.dsr-hero{background:linear-gradient(135deg,#1f6f5c,#2a8a6e);color:#fff;border-radius:22px;padding:16px 18px}
.dsr-kicker{font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;opacity:.85}
.dsr-hero h2{margin:6px 0;font-size:clamp(20px,5vw,26px);line-height:1.2;color:#fff}.dsr-hero p{margin:0;font-weight:650;opacity:.92;line-height:1.45;color:#fff}
.dsr-card{background:#fff;border:2px solid #e3efe9;border-radius:20px;padding:14px 16px}
.dsr-card h3{margin:0 0 10px;font-size:17px;color:#2c3a4f}
.dsr-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.dsr-stat{background:#fff;border:2px solid #e3efe9;border-radius:18px;padding:11px 8px;text-align:center}
.dsr-stat b{display:block;font-size:clamp(21px,5.6vw,28px);color:#1f6f5c}.dsr-stat span{font-size:12px;font-weight:750;color:#5b6680}
.dsr-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid #eef3f1}.dsr-row:first-of-type{border-top:0}
.dsr-row .ic{font-size:24px;min-width:32px;text-align:center;flex-shrink:0}.dsr-row .tx{flex:1;min-width:0}.dsr-row .tx strong{display:block;font-size:15px}.dsr-row .tx small{color:#5b6680;font-weight:700;font-size:13px}
.dsr-bar{height:10px;background:#e9f1ee;border-radius:9px;overflow:hidden;margin-top:5px}.dsr-bar i{display:block;height:100%;background:#3aa57f;border-radius:9px}
.dsr-bar.mid i{background:#e8b23c}.dsr-bar.low i{background:#e0795f}.dsr-bar.grey i{background:#b8c4cc}
.dsr-chip{display:inline-block;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:900;white-space:nowrap}
.dsr-chip.good{background:#d8f6e1;color:#20784c}.dsr-chip.mid{background:#fff0c7;color:#8a6410}.dsr-chip.low{background:#ffe0d8;color:#a8442c}.dsr-chip.grey{background:#e9eef2;color:#566373}
.dsr-badge{display:inline-block;border-radius:20px;padding:5px 11px;font-size:12px;font-weight:900;background:#e3f6ec;color:#1f6f5c}
.dsr-kids{display:flex;gap:7px;flex-wrap:wrap}
.dsr-kid{border:2px solid #cfe5dc;background:#fff;border-radius:16px;font-size:15px;font-weight:850;cursor:pointer;color:#2c3a4f;padding:7px 13px}.dsr-kid.on{background:#1f7a62;border-color:#1f7a62;color:#fff}
.dsr-week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:end;height:120px;margin-top:6px}
.dsr-week div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:11px;font-weight:800;color:#5b6680;gap:3px}
.dsr-week i{display:block;width:70%;max-width:34px;background:#7d72d6;border-radius:8px 8px 3px 3px;min-height:3px}
.dsr-items{display:flex;flex-wrap:wrap;gap:7px}
.dsr-item{border-radius:14px;padding:6px 11px;font-weight:850;font-size:15px;background:#ffe9e2;color:#8f3a24}.dsr-item.good{background:#dcf6e5;color:#1f6f45}.dsr-item small{font-weight:700;opacity:.8;font-size:12px}
.dsr-note{background:#fff8e1;border:2px solid #f5df9d;border-radius:16px;padding:10px 13px;font-weight:700;font-size:14px;line-height:1.45}
.dsr-privacy{background:#eaf3fb;border:2px solid #cfe2f3;border-radius:16px;padding:10px 13px;font-size:13px;font-weight:700;color:#3b5068;line-height:1.45}
.dsr-btn{border:2px solid #cfe5dc;border-radius:15px;background:#fff;color:#1f6f5c;font-size:16px;font-weight:900;padding:11px 16px;min-height:46px;cursor:pointer}
.dsr-muted{color:#5b6680;font-weight:700;font-size:14px;line-height:1.45;margin:0}
.dsr-gate{display:flex;flex-direction:column;align-items:center;gap:14px;padding:40px 16px;text-align:center}
.dsr-gate h2,.dsr-gate p{text-align:center!important;margin:0}
.dsr-hold{position:relative;overflow:hidden;width:min(280px,80vw);height:74px;border:0;border-radius:22px;background:#1f7a62;color:#fff;font-size:19px;font-weight:900;box-shadow:0 4px #155443;cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none}
.dsr-hold i{position:absolute;left:0;top:0;bottom:0;width:0;background:#f6c35b}.dsr-hold span{position:relative}
@media(max-width:560px){.dsr-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media print{.dsr-top{display:none}#dsr{position:static}}`;document.head.append(st)}

function buka(back,opt){if(!C)return;css();onBack=back||null;if(saveT)save();D=load();
 if(!root){root=document.createElement('div');root.id='dsr';root.setAttribute('role','dialog');root.setAttribute('aria-label','Ruang Ibu Bapa');document.body.append(root)}
 balik(false);if(C.gate!==false&&!(opt&&opt.gate===false)&&!lulus)gate();else draw();root.scrollTop=0}
function balik(on){const b=document.getElementById('ds-balik');if(b)b.style.visibility=on?'':'hidden'}
function tutup(){if(root){root.remove();root=null}balik(true);lulus=false;if(onBack)onBack()}
function shell(inner){root.innerHTML=`<header class="dsr-top"><button type="button" class="dsr-back" id="dsrBack">← Kembali</button><h1>🏡 Ruang Ibu Bapa</h1></header><div class="dsr-wrap">${inner}</div>`;root.querySelector('#dsrBack').onclick=tutup}
function gate(){shell(`<div class="dsr-gate"><div style="font-size:56px">👨‍👩‍👧</div><h2>Untuk ibu bapa</h2><p class="dsr-muted">Tekan dan tahan butang di bawah selama 3 saat.</p><button type="button" class="dsr-hold" id="dsrHold"><i id="dsrFill"></i><span>Tahan di sini</span></button></div>`);
 const b=root.querySelector('#dsrHold'),f=root.querySelector('#dsrFill');let t0=0,raf=0;
 const stop=()=>{cancelAnimationFrame(raf);t0=0;f.style.width='0'};
 const tick=t=>{if(!root)return;const p=Math.min(1,(t-t0)/3000);f.style.width=p*100+'%';if(p>=1){lulus=true;draw();root.scrollTop=0;return}raf=requestAnimationFrame(tick)};
 b.onpointerdown=e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}t0=performance.now();raf=requestAnimationFrame(tick)};
 b.onpointerup=b.onpointercancel=b.onpointerleave=stop;b.oncontextmenu=e=>e.preventDefault()}
function draw(){shell(page());
 root.querySelectorAll('[data-close]').forEach(b=>b.onclick=tutup);
 root.querySelectorAll('[data-kid]').forEach(b=>b.onclick=()=>{pick=b.dataset.kid;draw()})}

function page(){const K={...KATA,...(C.kata||{})},names=childNames();if(pick&&!names.includes(pick))pick='';
 const ev=D.ev.filter(x=>(!pick||x.a===pick)&&(x.r||x.x||x.d)),today=dayStart(Date.now());
 const wSecs=ev.filter(x=>x.t>=today-6*DAY).reduce((a,x)=>a+x.s,0);
 const R=ev.reduce((a,x)=>a+x.r,0),F=ev.reduce((a,x)=>a+x.f,0),acc=pct(F,R);
 const days=[...Array(7)].map((_,i)=>{const d=today-(6-i)*DAY;return {d,s:ev.filter(x=>x.t>=d&&x.t<d+DAY).reduce((a,x)=>a+x.s,0)}}),maxS=Math.max(60,...days.map(x=>x.s));
 const skills=skillRows(ev),weak=skills.filter(x=>x.r>=3&&x.p!=null).sort((a,b)=>a.p-b.p)[0];
 const extra=C.kemajuan?C.kemajuan(pick):[];
 const stats=[...extra,[mins(wSecs),'Minit main (7 hari)'],[acc===null?'—':acc+'%',K.betul],[ev.length,K.main]].slice(0,4);
 const kids=names.length?`<div class="dsr-card"><h3>👨‍👩‍👧 Anak</h3><div class="dsr-kids"><button type="button" class="dsr-kid ${pick?'':'on'}" data-kid="">Semua</button>${names.map(n=>`<button type="button" class="dsr-kid ${pick===n?'on':''}" data-kid="${esc(n)}">${esc(n)}</button>`).join('')}</div><p class="dsr-muted" style="margin-top:8px">Rekod disimpan mengikut nama anak yang dipilih dalam Dunia Sai semasa bermain.</p></div>`:'';
 const note=C.nota?C.nota(ev.length):'';
 return `<div><span class="dsr-badge">Percuma</span></div>
 <div class="dsr-hero"><div class="dsr-kicker">🏡 Ruang Ibu Bapa · ${esc(C.nama||'')}</div><h2>${esc(C.tajuk||'Anak belajar, kita faham perkembangannya.')}</h2><p>Tiada ranking dan tiada label gagal. Semua angka di sini datang daripada permainan sebenar anak dalam telefon ini.</p></div>
 ${kids}
 <div class="dsr-grid">${stats.map(([v,l])=>`<div class="dsr-stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
 ${ev.length?'':`<div class="dsr-note">📌 Rekod terperinci (masa, ketepatan, kemahiran) bermula selepas kemas kini ini. Biar anak main satu atau dua permainan, kemudian buka semula ruang ini.${note?' '+esc(note):''}</div>`}
 <div class="dsr-card"><h3>📅 Masa bermain minggu ini</h3><div class="dsr-week">${days.map(x=>`<div><span>${x.s?mins(x.s)+'m':''}</span><i style="height:${Math.round(x.s/maxS*82)}%"></i>${HARI[new Date(x.d).getDay()]}</div>`).join('')}</div></div>
 ${skills.length?`<div class="dsr-card"><h3>📘 ${esc(K.kemahiran)}</h3>${skills.map(x=>{const st=status(x.p,x.r);return `<div class="dsr-row"><div class="ic">${x.icon}</div><div class="tx"><strong>${esc(x.name)}</strong><small>${x.r?x.p+'% '+esc(K.betul.toLowerCase())+' · '+x.r+' '+esc(K.soalan):'Belum dimainkan'}</small>${bar(x.p,st[1])}</div>${chip(st)}</div>`}).join('')}<p class="dsr-muted" style="margin-top:8px">Kukuh = 80% ke atas · Berkembang = 55–79% · Perlu bimbingan = bawah 55%. Sekurang-kurangnya 3 ${esc(K.soalan)} diperlukan.${K.kemahiranNota?' '+esc(K.kemahiranNota):''}</p></div>`:''}
 ${items()}
 ${skills.length&&skills.some(x=>x.tip)?`<div class="dsr-card"><h3>🛒 Cadangan aktiviti di rumah</h3><p class="dsr-muted" style="color:#2c3a4f">${weak&&weak.tip?`<b>${weak.icon} ${esc(weak.name)}</b> paling perlu latihan sekarang (${weak.p}%). ${esc(weak.tip)}`:esc(C.tipUmum||'Biar anak main beberapa permainan dahulu. Kemudian kami cadangkan aktiviti mengikut kemahiran yang paling perlu dibantu.')}</p></div>`:''}
 <div class="dsr-card"><h3>🕘 ${esc(K.terkini)}</h3>${recent(ev,K)}</div>
 <div class="dsr-privacy">🔐 Data anak disimpan dalam telefon ini sahaja. Tiada ranking dan tiada data dihantar keluar.</div>
 <button type="button" class="dsr-btn" data-close="1">← Kembali ke permainan</button>`}
function recent(ev,K){const last=ev.slice(-6).reverse();if(!last.length)return '<p class="dsr-muted">Belum ada permainan direkod.</p>';
 return last.map(x=>{const g=info(x.k),d=new Date(x.t);return `<div class="dsr-row"><div class="ic">${g[0]}</div><div class="tx"><strong>${esc(g[1])}</strong><small>${d.toLocaleDateString('ms-MY',{day:'numeric',month:'short'})} ${d.toLocaleTimeString('ms-MY',{hour:'2-digit',minute:'2-digit'})}${x.a&&!pick?' · '+esc(x.a):''} · ${mins(x.s)} min · ${x.f}/${x.r} ${esc(K.betul.toLowerCase())}</small></div>${x.n?`<span class="dsr-chip good">${esc(K.baru)}</span>`:x.d?'<span class="dsr-chip grey">Selesai</span>':''}</div>`}).join('')}
function items(){const I=C.item;if(!I)return '';const box={};
 Object.entries(D.it).forEach(([a,m])=>{if(pick&&a!==pick)return;Object.entries(m).forEach(([k,v])=>{const b=box[k]||(box[k]={n:0,f:0,x:0});b.n+=v.n||0;b.f+=v.f||0;b.x+=v.x||0})});
 const all=Object.entries(box).map(([k,v])=>({k,...v,p:pct(v.f,v.n)}));
 if(I.mod==='gagal'){const top=all.filter(x=>x.x>0).sort((a,b)=>b.x-a.x).slice(0,6);
  return `<div class="dsr-card"><h3>${esc(I.tajuk)}</h3>${top.length?top.map(x=>`<div class="dsr-row"><div class="tx"><strong>${esc(x.k)}</strong></div><span class="dsr-chip low">${x.x}×</span></div>`).join(''):`<p class="dsr-muted">${esc(I.kosong||'Belum ada rekod.')}</p>`}${I.nota?`<p class="dsr-muted" style="margin-top:8px">${esc(I.nota)}</p>`:''}</div>`}
 const weak=all.filter(x=>x.n+x.x>=2&&(x.p??0)<70).sort((a,b)=>(a.p??0)-(b.p??0)||b.x-a.x).slice(0,8),good=all.filter(x=>x.n>=3&&x.p>=90).sort((a,b)=>b.n-a.n).slice(0,10);
 return `<div class="dsr-card"><h3>${esc(I.tajuk)}</h3>${weak.length?`<div class="dsr-items">${weak.map(x=>`<span class="dsr-item">${esc(x.k)} <small>${x.f}/${x.n} · ${x.x} silap</small></span>`).join('')}</div>`:`<p class="dsr-muted">${all.length?'Tiada yang membimbangkan setakat ini. 👍':esc(I.kosong||'Belum ada rekod.')}</p>`}
 ${good.length?`<h3 style="margin-top:14px">${esc(I.kukuh||'Sudah kukuh')}</h3><div class="dsr-items">${good.map(x=>`<span class="dsr-item good">${esc(x.k)}</span>`).join('')}</div>`:''}
 <p class="dsr-muted" style="margin-top:8px">${esc(I.nota||'Dikira daripada jawapan pertama anak. Sekurang-kurangnya 2 cubaan.')}</p></div>`}

window.DSRuang={pasang(c){C=c;D=load()},mula,jawab,selesai,henti,buka,get data(){return D}};
})();
