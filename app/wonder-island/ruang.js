/* Dunia Sai: Ruang Ibu Bapa untuk Wonder Island. Paparan dan rekod dalam /shared/js/ruang-ibubapa.js;
   fail ini hanya senarai permainan dan kemahiran. Permainan memanggil WIRuang.mula / betul / salah / tamat
   (baris bertanda "Dunia Sai:" dalam index.html). */
(function(){
'use strict';
if(!window.DSRuang)return;
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
DSRuang.pasang({id:'wonder-island',kunci:'wi_ruang_v1',nama:'Wonder Island',tajuk:'Anak belajar English, kita faham perkembangannya.',gate:false,
 aktiviti:GAME,kemahiran:SKILLS,kata:{kemahiran:'Kemahiran English',baru:'Pelekat baharu'},
 kemajuan(){let done={};try{done=(JSON.parse(localStorage.getItem('wonder-grand-v1')||'{}').done)||{}}catch(e){}
  return [[Object.keys(done).filter(k=>done[k]&&/^[012]-[0-5]$/.test(k)).length+'/18','Pengembaraan selesai']]},
 nota(){return 'Pelekat yang sudah dikumpul sebelum ini tetap dikira.'}});
let k='';
window.WIRuang={mula(x){k=x;DSRuang.mula(x)},betul(){DSRuang.jawab(k,true)},salah(){DSRuang.jawab(k,false)},
 tamat(x,baru){DSRuang.selesai(x,{baru})},buka(back){DSRuang.buka(back,{gate:false})}};
})();
