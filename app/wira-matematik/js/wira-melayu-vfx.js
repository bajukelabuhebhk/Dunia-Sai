/* Dunia Sai: Wira Melayu Fasa 2, kesan serangan PNG untuk Kesatria, Pemanah dan Ahli Falak (VFX V2, 8 Nov 2026).
   Hanya dalam Gaya Wira Melayu (lesen penuh). Masa dan kerosakan pertempuran tidak berubah; ini lapisan visual sahaja.
   01 tebasan biasa, 03 Serangan Super (kombo 3), 02 pukulan penamat raksasa, 04 pukulan penamat bos. */
'use strict';
(function(){
 if(typeof answer!=='function'||typeof WMM==='undefined')return;
 const DIR='assets/wira-melayu/vfx/';
 const KIND={1:{ms:520,cls:'v1'},2:{ms:760,cls:'v2'},3:{ms:1150,cls:'v3'},4:{ms:1650,cls:'v4'}};
 const reduce=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
 const HEROES=['kesatria','pemanah','sihir'];
 const hid=()=>{try{const id=B?.hero?.id;return wmmStyle()&&B&&!B.dead&&HEROES.includes(id)?id:null}catch(_){return null}};
 const on=()=>hid()==='kesatria';
 // muat awal supaya tiada kelip semasa serangan pertama
 const loaded={};function preload(id){if(!id||loaded[id])return;loaded[id]=1;[1,2,3,4].forEach(n=>{const i=new Image();i.src=DIR+id+'-0'+n+'.webp'})}
 function show(id,n,delay=0){
  const arena=document.querySelector('.arena'),hero=document.getElementById('uHero'),mon=document.getElementById('uMon');
  if(!arena||!hero||!mon)return;
  const a=arena.getBoundingClientRect(),h=hero.getBoundingClientRect(),m=mon.getBoundingClientRect();
  const k=KIND[n],x0=h.left-a.left+h.width*.55,x1=m.right-a.left+8,w=Math.max(120,x1-x0),cy=(h.top+m.top)/2-a.top+Math.min(h.height,m.height)*.5;
  const el=document.createElement('div');el.className='wmm-vfx '+k.cls;
  // gambar 16:9, kesan mengalir dari kiri ke kanan; lebar mengikut jarak wira ke raksasa
  // kesatria 04 dilebarkan ke kiri (tepi kiri disorok dengan mask); yang lain bermula dari wira
  const ks=id==='kesatria',W=n===4?w*(ks?1.25:1.1):w,H=W*9/16;
  el.classList.add('h-'+id);
  Object.assign(el.style,{left:(n===4&&ks?x0-w*.2:x0)+'px',top:(cy-H/2)+'px',width:W+'px',height:H+'px',backgroundImage:`url('${DIR}${id}-0${n}.webp')`,animationDelay:delay+'ms'});
  arena.appendChild(el);setTimeout(()=>el.remove(),k.ms+delay+60);
  if(n>=3&&!reduce())setTimeout(()=>{if(arena.isConnected){arena.classList.remove('wmm-shake');void arena.offsetWidth;arena.classList.add('wmm-shake')}},delay+k.ms*.55);
 }
 // kesan prosedural lama digantikan oleh PNG dalam gaya ini (pedang di sini; anak panah/bintang emoji disorok dengan CSS .arena.wmm-png)
 if(typeof wm4SwordWave==='function'){const old=wm4SwordWave;wm4SwordWave=function(...a){if(on())return;return old.apply(this,a)}}
 const prev=answer;
 answer=async function(v,btn){
  const id=hid();
  if(B&&!B.busy&&!B.dead&&v===B.q?.ans&&id){
   preload(id);document.querySelector('.arena')?.classList.add('wmm-png');
   const sup=B.combo===2,dmg=sup?2:1,akhir=B.hp<=dmg;
   if(akhir)show(id,B.b===2?4:2,sup?380:60);
   else if(sup)show(id,3,380);
   else show(id,1,40);
  }
  return prev(v,btn);
 };
 if(typeof battle==='function'){const ob=battle;battle=function(...a){const r=ob.apply(this,a);try{const id=hid();document.querySelector('.arena')?.classList.toggle('wmm-png',!!id);preload(id)}catch(_){}return r}}
})();
