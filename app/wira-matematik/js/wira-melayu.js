/* Dunia Sai: Wira Melayu Fasa 1. Potret baharu di skrin pilih wira dan Kostum, dengan aksesori berlapis.
   Pertempuran masih guna lukisan SVG asal (Fasa 2). Simpanan: localStorage wm_melayu_v1. */
'use strict';
const WMM=(()=>{
 const KEY='wm_melayu_v1',DIR='assets/wira-melayu/';
 // Susunan dalam senarai = susunan lapisan (bawah ke atas). bintang = jumlah bintang RPG untuk membuka item.
 const ITEMS={
  kesatria:[
   {id:'04',box:[177,359,371,597],bm:'Bengkung Diraja',en:'Royal Sash',r:'rare',bintang:30},
   {id:'02',box:[198,266,381,433],bm:'Rompi Perajurit',en:'Soldier Vest',r:'uncommon',bintang:5},
   {id:'06',box:[171,220,411,458],bm:'Baju Zirah',en:'Armour Coat',r:'epic',bintang:75},
   {id:'03',box:[317,271,401,364],bm:'Pelindung Bahu',en:'Shoulder Guard',r:'rare',bintang:15},
   {id:'05',box:[246,248,345,377],bm:'Rantai Azimat',en:'Hero Pendant',r:'epic',bintang:50},
   {id:'01',box:[200,94,367,202],bm:'Tengkolok Biasa',en:'Simple Tengkolok',r:'common',bintang:0},
   {id:'07',box:[98,59,410,558],bm:'Set Kesatria Legenda',en:'Legendary Knight Set',r:'legendary',bintang:100,set:true}
  ],
  pemanah:[],sihir:[]
 };
 const R={common:['Biasa','Common'],uncommon:['Luar Biasa','Uncommon'],rare:['Jarang','Rare'],epic:['Epik','Epic'],legendary:['Legenda','Legendary']};
 let st={};try{st=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){st={}}
 const on=id=>Array.isArray(st[id])?st[id]:(st[id]=[]);
 const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(_){}};
 const stars=()=>{try{return totalStars()}catch(_){return 0}};
 const open=it=>stars()>=it.bintang;
 function portrait(id){
  const worn=on(id).filter(x=>{const it=(ITEMS[id]||[]).find(i=>i.id===x);return it&&open(it)});
  const layers=(ITEMS[id]||[]).filter(it=>worn.includes(it.id)).map(it=>`<img src="${DIR}${id}-${it.id}.webp" alt="" draggable="false">`).join('');
  return `<div class="wmm-portrait"><img src="${DIR}${id}.webp" alt="" draggable="false">${layers}</div>`;
 }
 function toggle(id,itemId){
  const it=ITEMS[id].find(i=>i.id===itemId);if(!it||!open(it))return;
  let w=on(id);
  if(w.includes(itemId))w=w.filter(x=>x!==itemId);
  else w=it.set?[itemId]:[...w.filter(x=>!ITEMS[id].find(i=>i.id===x)?.set),itemId]; // set lengkap tidak bertindih dengan item lain
  st[id]=w;store();
 }
 // Ikon = lapisan aksesori itu sendiri, dipotong ke kotaknya (tiada tulisan Lv dalam ikon)
 function icon(id,it,B=52){const[x0,y0,x1,y1]=it.box,w=x1-x0,h=y1-y0,k=B*.92/Math.max(w,h);return `background-image:url('${DIR}${id}-${it.id}.webp');background-size:${512*k}px ${768*k}px;background-position:${(B-w*k)/2-x0*k}px ${(B-h*k)/2-y0*k}px`}
 function wardrobe(id){
  const list=ITEMS[id]||[];const s=stars();
  if(!list.length)return `<div class="wmm-wardrobe"><h3>🧥 ${wm6T('Aksesori Melayu','Malay Accessories')}</h3><p class="wmm-soon">${wm6T('Aksesori untuk wira ini akan datang.','Accessories for this hero are coming soon.')}</p></div>`;
  const sorted=[...list].sort((a,b)=>a.bintang-b.bintang);
  return `<div class="wmm-wardrobe"><h3>🧥 ${wm6T('Aksesori Melayu','Malay Accessories')} <small>⭐ ${s}</small></h3><div class="wmm-items">${sorted.map(it=>{const ok=open(it),w=on(id).includes(it.id);
   return `<button class="wmm-item r-${it.r} ${w?'worn':''} ${ok?'':'locked'}" data-wmm="${it.id}" aria-pressed="${w}" ${ok?'':'aria-disabled="true"'}><span class="wmm-icon" style="${icon(id,it)}"></span><b>${wm6T(it.bm,it.en)}</b><small>${ok?(w?wm6T('Dipakai','Worn'):wm6T(...R[it.r])):'🔒 ⭐ '+it.bintang}</small></button>`}).join('')}</div>
   <p class="wmm-note">${wm6T('Kumpul bintang dalam pertempuran untuk membuka aksesori. Rupa dalam pertempuran akan dikemas kini kemudian.','Collect battle stars to unlock accessories. The in-battle look will be updated later.')}</p></div>`;
 }
 return {ITEMS,portrait,toggle,wardrobe,open,gaya:()=>st.gaya||'melayu',setGaya:g=>{st.gaya=g;store()}};
})();

// Ganti lukisan wira di carousel dan halaman Kostum dengan potret Wira Melayu
// Gaya Wira Melayu ialah ganjaran versi penuh (lesen). Versi percubaan kekal dengan wira comel asal dan nampak pratonton berkunci.
function wmmStyle(){return full&&WMM.gaya()==='melayu'}
const wmmSetStyle=g=>WMM.setGaya(g);
function wmmTeaser(){
 const d=document.createElement('div');d.className='wmm-teaser';
 d.innerHTML=`<div class="wmm-teaser-box" role="dialog" aria-modal="true"><div class="wmm-teaser-art">${WMM.portrait(S.hero)}<span class="wmm-lock">🔒</span></div><h3>👑 ${wm6T('Gaya Wira Melayu','Malay Hero Style')}</h3><p>${wm6T('Tanjak, samping dan zirah diraja dengan aksesori yang dibuka melalui bintang. Tersedia dalam versi penuh.','Tanjak, samping and royal armour with accessories unlocked by stars. Available in the full version.')}</p><button class="wm6-mainbtn" id="wmmBuy">🔓 ${wm6T('Buka Versi Penuh','Unlock Full Game')}</button><button class="wm6-secondarybtn" id="wmmClose">${wm6T('Nanti dulu','Maybe later')}</button></div>`;
 document.body.appendChild(d);
 d.querySelector('#wmmClose').onclick=()=>d.remove();d.onclick=e=>{if(e.target===d)d.remove()};
 d.querySelector('#wmmBuy').onclick=()=>{d.remove();unlock()};
}
function wmmFill(){
 const page=view.querySelector('.wm6-costume-page');
 if(!wmmStyle()){
  // percubaan, atau pemilik lesen yang memilih gaya comel: lukisan asal kekal, tambah butang gaya
  const pv=view.querySelector('.wm6-hero-preview')||page;
  if(pv&&!pv.querySelector('.wmm-chip'))(pv===page?view.querySelector('.wm6-costume-art'):pv).insertAdjacentHTML(pv===page?'afterend':'beforeend',`<button type="button" class="wmm-chip" id="wmmChip">👑 ${full?wm6T('Pakai Gaya Wira Melayu','Wear Malay Hero Style'):wm6T('Gaya Wira Melayu 🔒','Malay Hero Style 🔒')}</button>`);
  const chip=view.querySelector('#wmmChip');if(chip)chip.onclick=e=>{e.stopPropagation();SFX.tap();if(full){wmmSetStyle('melayu');redraw()}else wmmTeaser()};
  return;
 }
 // warna dan lencana lama hanya mengubah lukisan SVG, jadi disorok supaya pilihan tidak nampak 'tak jadi apa-apa'
 view.querySelectorAll('.wm6-choices,.wm6-costume-line').forEach(el=>el.hidden=true);
 view.querySelectorAll('.wm6-hero-drawing').forEach(el=>{el.classList.add('wmm-on');el.innerHTML=WMM.portrait(S.hero)});
 const art=view.querySelector('.wm6-costume-art');
 if(art){art.classList.add('wmm-on');art.innerHTML=WMM.portrait(S.hero);
  if(page&&!page.querySelector('.wmm-wardrobe')){
   (page.querySelector('.wm6-costume-line')||page.querySelector('p'))?.insertAdjacentHTML('afterend',WMM.wardrobe(S.hero)+`<button type="button" class="wm6-secondarybtn" id="wmmCute">🧸 ${wm6T('Tukar ke Gaya Comel','Switch to Cute Style')}</button>`);
   page.querySelectorAll('[data-wmm]').forEach(b=>b.onclick=()=>{
    const it=WMM.ITEMS[S.hero].find(i=>i.id===b.dataset.wmm);
    if(!WMM.open(it)){SFX.tap();alert(wm6T('Kumpul '+it.bintang+' bintang untuk membuka '+it.bm+'.','Collect '+it.bintang+' stars to unlock '+it.en+'.'));return}
    SFX.tap();WMM.toggle(S.hero,b.dataset.wmm);wm6CostumeScreen()});
   page.querySelector('#wmmCute').onclick=()=>{SFX.tap();wmmSetStyle('comel');wm6CostumeScreen()};
  }
 }
}
['home','wm6Customize','wm6CostumeScreen'].forEach(name=>{
 const old=window[name];if(typeof old!=='function')return;
 window[name]=function(...a){const r=old.apply(this,a);try{wmmFill()}catch(e){console.warn(e)}return r};
});
try{wmmFill()}catch(_){}
