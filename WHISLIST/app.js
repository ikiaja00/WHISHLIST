'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* === ISI DUA NILAI INI (Supabase > Project Settings > API). Pakai anon public key, JANGAN service_role. === */
const SUPABASE_URL='https://xsrdcvxpartarabjcmbu.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcmRjdnhwYXJ0YXJhYmpjbWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNTY4MzQsImV4cCI6MjEwODgzMjgzNH0.Yg9he59erJ8ao7xFBxC--u_GDoUxlj9vyykH3REeVeI';
const configured=!!(window.supabase&&!SUPABASE_URL.includes('YOUR')&&!SUPABASE_ANON_KEY.includes('YOUR'));
const sb=configured?supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
const CATS=['Kencan','Petualangan','Kuliner','Kreatif','Romantis','Kenangan','Lainnya'];
const STAT={not_yet:'Belum',in_progress:'Sedang Dijalani',completed:'Selesai'};
const EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'},MAXMB=5,MAXPH=10;
const S={user:null,couple:null,items:[],mem:{},photos:{},filter:'all',q:'',tab:'wish',files:[],authMode:'in'};

const q=async p=>{const{data,error}=await p;if(error)throw error;return data};
function toast(m,err){const t=$('#toast');t.textContent=m;t.className='show'+(err?' err':'');clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',3600)}
async function run(fn,okMsg){
  if(!navigator.onLine){toast('Kamu sedang tidak terhubung internet. Sambungkan internet lalu coba lagi.',1);return false}
  try{const r=await fn();if(okMsg)toast(okMsg);return r===undefined?true:r}
  catch(e){console.error(e);toast(e.message||'Ada yang salah. Silakan coba lagi.',1);return false}
}
const fmt=d=>d?new Date(d+'T00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):'';
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const photosOf=id=>{const m=S.mem[id];return m?S.photos[m.id]||[]:[]};
function hearts(){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;for(let i=0;i<22;i++){const s=document.createElement('span');s.className='fly';s.textContent=['❤','✦','♡','💗'][i%4];s.style.cssText=`left:${Math.random()*100}vw;font-size:${14+Math.random()*20}px;color:#d9667c;animation-delay:${Math.random()*.8}s`;document.body.append(s);setTimeout(()=>s.remove(),3800)}}

/* ---------- data ---------- */
async function load(){
  const m=await q(sb.from('couple_members').select('couple_id').eq('user_id',S.user.id).maybeSingle());
  if(!m){S.couple=null;return}
  const id=m.couple_id;
  const [c,w,me,ph]=await Promise.all([
    q(sb.from('couples').select('*').eq('id',id).single()),
    q(sb.from('wishlists').select('*').eq('couple_id',id).order('position')),
    q(sb.from('memories').select('*').eq('couple_id',id)),
    q(sb.from('memory_photos').select('*').eq('couple_id',id).order('created_at'))]);
  S.couple=c;S.items=w;S.mem={};me.forEach(x=>S.mem[x.wishlist_id]=x);S.photos={};
  if(ph.length){
    const{data}=await sb.storage.from('memories').createSignedUrls(ph.map(p=>p.path),3600);
    ph.forEach((p,i)=>{p.url=data?.[i]?.signedUrl||'';(S.photos[p.memory_id]??=[]).push(p)});
  }
}
async function refresh(){await load();render()}

/* ---------- views ---------- */
function render(){
  const a=$('#app');
  if(!configured){a.innerHTML='<div class="card auth center"><h2>Hampir siap ❤️</h2><p>Buka <code>app.js</code> lalu isi <code>SUPABASE_URL</code> dan <code>SUPABASE_ANON_KEY</code> di bagian atas (lihat README).</p></div>';return}
  if(!S.user)return authView();
  if(!S.couple)return onboardView();
  mainView();
}
function authView(){
  const up=S.authMode==='up';
  $('#app').innerHTML=`<form class="card auth" id="authf"><h1>Our Little Journey ❤️</h1><p>${up?'Daftar akunmu':'Senang melihatmu kembali'}</p>
  <label>Alamat email<input type="email" name="email" required autocomplete="email"></label>
  <label>Kata sandi<input type="password" name="pw" required minlength="6" autocomplete="${up?'new-password':'current-password'}"></label>
  <div class="actions"><button class="primary" type="submit">${up?'Daftar':'Masuk'}</button><button type="button" data-act="authMode">${up?'Saya sudah punya akun':'Daftar akun'}</button></div></form>`;
}
function onboardView(){
  $('#app').innerHTML=`<div class="auth"><div class="card"><h2>Mulai perjalanan kita</h2><form id="createf"><label>Namamu<input name="a" maxlength="30" required></label><label>Nama pasanganmu<input name="b" maxlength="30" required></label><label>Bersama sejak<input type="date" name="d"></label><div class="actions"><button class="primary">Buat perjalanan kita</button></div></form></div>
  <div class="card" style="margin-top:14px"><h2>Pasanganmu sudah mulai?</h2><form id="joinf"><label>Kode undangan<input name="code" maxlength="12" required></label><div class="actions"><button class="primary">Gabung ke perjalanan kita</button><button type="button" data-act="out">Keluar</button></div></form></div></div>`;
}
function msgFor(d,t){return t&&d===t?'Berhasil! Kenangan kita akan selalu tersimpan.':d>=10?'Setengah perjalanan petualangan kecil kita.':d>=5?'Lihat, sudah banyak kenangan yang kita buat.':'Kisah kita baru saja dimulai.'}
function mainView(){
  const c=S.couple,t=S.items.length,d=S.items.filter(i=>i.status==='completed').length,m=Object.keys(S.mem).length;
  const days=c.start_date?Math.max(0,Math.floor((Date.now()-new Date(c.start_date+'T00:00'))/864e5)):null;
  $('#app').innerHTML=`<header class="hero"><span class="deco" style="left:9%;top:34px">✦</span><span class="deco" style="right:10%;top:70px">❤</span>
  <h1>Our Little Journey ❤️</h1><p class="sub"><p class="sub">Petualangan seru yang ingin kita wujudkan bersama.</p>.</p>
  <div class="names"><input data-f="name_a" value="${esc(c.name_a)}" maxlength="30" aria-label="Nama pertama"> <span>&amp;</span> <input data-f="name_b" value="${esc(c.name_b)}" maxlength="30" aria-label="Nama kedua"></div>
  <div class="meta"><label>Bersama sejak <input type="date" data-f="start_date" value="${c.start_date||''}"></label>${days!==null?`<span>💞 ${days} hari bersamamu</span>`:''}</div></header>
  <section class="card"><div class="hearts" role="progressbar" aria-label="Daftar Whislist selesai" aria-valuemin="0" aria-valuemax="${t}" aria-valuenow="${d}">${S.items.map(i=>i.status==='completed'?'<span class="f">♥</span>':'<span>♡</span>').join('')}</div>
  <div class="msg">${msgFor(d,t)}</div><div class="stats"><span><b>${t}</b> Total daftar Whislist</span><span><b>${d}</b> Selesai</span><span><b>${m}</b> Album Kenangan</span></div></section>
  <nav class="tabs"><button data-act="tab" data-id="wish" class="${S.tab==='wish'?'on':''}">Daftar Whislist
  </button><button data-act="tab" data-id="mem" class="${S.tab==='mem'?'on':''}">Album Kenangan</button></nav>
  <div id="tools"></div><div id="list"></div>
  <footer class="foot">Kode undangan <b>${esc(c.invite_code)}</b> <button data-act="copy">Salin</button> <button data-act="out">Keluar</button></footer>`;
  drawList();
}
function setupTrack(){
  const tr=$('#track');if(!tr||!tr.children)return;const cs=[...tr.children];let raf=0,down=0,sx=0,sl=0;
  const focus=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const r=tr.getBoundingClientRect(),c=r.left+r.width/2;let best=null,min=1e9;cs.forEach(k=>{const b=k.getBoundingClientRect(),d=Math.abs(c-(b.left+b.width/2));if(d<min){min=d;best=k}});cs.forEach(k=>k.classList.toggle('is-focus',k===best))})};
  tr.addEventListener('scroll',focus,{passive:true});
  tr.addEventListener('mousedown',e=>{down=1;S.moved=false;sx=e.pageX;sl=tr.scrollLeft;tr.style.scrollSnapType='none'});
  window.onmouseup=()=>{if(!down)return;down=0;tr.style.scrollSnapType=''};
  tr.addEventListener('mousemove',e=>{if(!down)return;const w=(e.pageX-sx)*1.4;if(Math.abs(w)>5)S.moved=true;tr.scrollLeft=sl-w});
  tr.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){e.preventDefault();tr.scrollLeft+=e.deltaX}},{passive:false});
  addEventListener('resize',focus);focus();
}
function drawList(){
  const L=$('#list'),T=$('#tools');if(!L)return;
  if(S.tab==='mem'){
    T.innerHTML='<div class="tools"><button class="primary" data-act="addMem">+ Tambah kenangan</button></div>';
    const ms=Object.values(S.mem).sort((a,b)=>(a.activity_date||'').localeCompare(b.activity_date||''));
    if(!ms.length){L.innerHTML='<div class="empty card"><h2>Album kita menunggu ❤️</h2><p>Tambahkan foto dan cerita pertamamu, atau selesaikan satu daftar Whislist dari daftar kita.</p><button class="primary" data-act="addMem">+ Tambah kenangan</button></div>';return}
    const cards=ms.flatMap(m=>{const w=S.items.find(i=>i.id===m.wishlist_id);if(!w)return[];const ps=S.photos[m.id]||[];return(ps.length?ps:[null]).map(p=>({w,m,p}))});
    L.innerHTML='<p class="hint">Geser untuk melihat kenangan kita ✦</p><div class="h-track" id="track">'+cards.map(({w,m,p})=>`<div class="pcard" role="button" tabindex="0" data-act="card" data-id="${w.id}" data-src="${p?esc(p.url):''}" aria-label="${esc(w.title)}">${p?`<img src="${esc(p.url)}" alt="${esc(w.title)}" loading="lazy" draggable="false">`:`<div class="ph"><b>♥</b>${esc(m.caption||(m.notes||'').slice(0,90))}</div>`}<div class="cap"><h3>${esc(w.title)}</h3><small>${fmt(m.activity_date)}${m.location?', '+esc(m.location):''}</small>${m.caption&&p?`<div class="cc">${esc(m.caption)}</div>`:''}<button type="button" data-act="open" data-id="${w.id}">Cerita kita</button></div></div>`).join('')+'</div>';
    setupTrack();
    return;
  }
  if(!T.innerHTML)T.innerHTML=`<div class="tools"><input type="search" id="search" placeholder="Cari daftar Whislist" aria-label="Cari" value="${esc(S.q)}"><select id="flt" aria-label="Filter"><option value="all">Semua</option>${Object.entries(STAT).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><button data-act="add">+ Tambah daftar Whislist</button><button data-act="reset" class="danger">Atur Ulang Progres</button></div>`;
  $('#flt').value=S.filter;
  const qq=S.q.trim().toLowerCase(),list=S.items.filter(i=>(S.filter==='all'||i.status===S.filter)&&(!qq||i.title.toLowerCase().includes(qq)));
  L.innerHTML=list.length?'<div class="grid">'+list.map(i=>{const n=photosOf(i.id).length,has=!!S.mem[i.id];
    return`<div class="card item st-${i.status}">${i.status==='completed'?'<span class="chk" title="Selesai">✔</span>':''}<span class="num">#${i.position}</span><h3>${esc(i.title)}</h3><p>${esc(i.description)||'<i>Tambahkan deskripsi singkat…</i>'}</p>
    <div><span class="tag">${esc(i.category)}</span> <span class="tag s">${STAT[i.status]}</span> <span class="tag">${has?`📷 ${n} foto`:'Belum ada kenangan'}</span></div>
    ${i.completed_at?`<small>Selesai ${fmt(i.completed_at)}</small>`:''}<button data-act="open" data-id="${i.id}">Lihat detail</button></div>`}).join('')+'</div>':'<div class="empty card">Tidak ada daftar Whislist yang cocok. Coba filter lain atau tambahkan yang baru ❤️</div>';
}
/* ---------- modal ---------- */
function modal(h){const m=$('#modal');m.hidden=false;m.innerHTML=`<div class="card" role="dialog" aria-modal="true">${h}</div>`;m.querySelector('input,textarea,button')?.focus()}
function closeModal(){$('#modal').hidden=true;$('#modal').innerHTML='';S.files=[];S.openId=null;S.newWish=null}
const opts=(arr,v)=>arr.map(x=>`<option value="${x}"${x===v?' selected':''}>${STAT[x]||x}</option>`).join('');
function photoThumbs(ph,del){return ph.length?'<div class="thumbs">'+ph.map(p=>`<div><img src="${esc(p.url)}" alt="Foto kenangan" data-act="zoom" data-src="${esc(p.url)}">${del?`<button type="button" class="danger" data-act="delPhoto" data-id="${p.id}" aria-label="Hapus foto">×</button>`:''}</div>`).join('')+'</div>':''}
function addForm(){
  const next=Math.max(0,...S.items.map(i=>Number(i.position)||0))+1;
  modal(`<h2>Tambah daftar Whislist ❤️</h2><p>Catat hal kecil yang ingin kalian lakukan bersama.</p>
  <form id="wishNewForm">
    <div class="row"><label>Nomor daftar<input id="n-position" type="number" min="1" step="1" value="${next}" required></label><label>Kategori<select id="n-cat">${CATS.map(x=>`<option value="${x}">${x}</option>`).join('')}</select></label></div>
    <label>Judul kegiatan<input id="n-title" maxlength="120" required placeholder="Contoh: Piknik berdua saat matahari terbenam"></label>
    <label>Deskripsi<textarea id="n-desc" rows="3" maxlength="400" placeholder="Ceritakan sedikit rencana kalian…"></textarea></label>
    <div class="row"><label>Status<select id="n-st">${Object.entries(STAT).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>Tanggal target (opsional)<input id="n-tg" type="date"></label></div>
    <div class="actions"><button class="primary" type="submit">Simpan daftar Whislist</button><button type="button" data-act="close">Batal</button></div>
  </form>`);
}
function detail(id){
  const i=S.items.find(x=>x.id===id);if(!i)return closeModal();S.openId=id;S.files=[];
  const m=S.mem[id],cats=CATS.includes(i.category)?CATS:[...CATS,i.category];
  modal(`<h2>Ubah daftar Whislist</h2><p class="modal-sub">Nomor, judul, dan detail kegiatan bisa kamu ubah kapan saja.</p>
  <div class="row"><label>Nomor daftar<input id="f-position" type="number" min="1" step="1" value="${Number(i.position)||1}" required></label><label>Status<select id="f-st">${Object.entries(STAT).map(([k,v])=>`<option value="${k}"${k===i.status?' selected':''}>${v}</option>`).join('')}</select></label></div>
  <label>Judul kegiatan<input id="f-title" value="${esc(i.title)}" maxlength="120" required></label>
  <label>Deskripsi<textarea id="f-desc" rows="3" maxlength="400">${esc(i.description||'')}</textarea></label>
  <div class="row"><label>Kategori<select id="f-cat">${cats.map(x=>`<option value="${esc(x)}"${x===i.category?' selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Tanggal target (opsional)<input type="date" id="f-tg" value="${i.target_date||''}"></label></div>
  ${m?`<div class="mem"><b>Kenangan kita · ${fmt(m.activity_date)}${m.location?' · '+esc(m.location):''}</b>${m.caption?`<blockquote>${esc(m.caption)}</blockquote>`:''}<p>${esc(m.notes||'')}</p>${photoThumbs(photosOf(id),false)}<div class="actions"><button type="button" class="danger" data-act="delMem" data-id="${id}">Hapus kenangan</button></div></div>`:''}
  <div class="actions"><button class="primary" data-act="saveItem" data-id="${id}">Simpan perubahan</button><button data-act="did" data-id="${id}">${m?'Ubah kenangan kita':'Tandai sudah dilakukan ❤️'}</button><button class="danger" data-act="delItem" data-id="${id}">Hapus daftar</button><button data-act="close">Tutup</button></div>`);
}
function memForm(id){
  const i=id==='new'?{title:S.draft}:S.items.find(x=>x.id===id),m=S.mem[id]||{};S.openId=id;
  modal(`<h2>${esc(i.title)}</h2><p>Abadikan momen ini selamanya.</p>
  <label>Foto (JPG, PNG, atau WebP, maks. ${MAXMB} MB per foto)<input type="file" id="m-files" accept="image/jpeg,image/png,image/webp" multiple></label><div id="prev" class="thumbs"></div>${photoThumbs(photosOf(id),true)}
  <div class="row"><label>Tanggal<input type="date" id="m-date" value="${m.activity_date||today()}" required></label><label>Lokasi<input id="m-loc" value="${esc(m.location)}" maxlength="120"></label></div>
  <label>Keterangan romantis<input id="m-cap" value="${esc(m.caption)}" maxlength="160"></label>
  <label>Cerita kita<textarea id="m-notes" rows="4" maxlength="2000">${esc(m.notes)}</textarea></label>
  <div class="actions"><button class="primary" id="saveMem" data-act="saveMem" data-id="${id}">Simpan Album Kenangan</button><button data-act="${id==='new'?'addMem':'open'}" data-id="${id}">Kembali</button></div>`);
  drawPrev();
}
function drawPrev(){const p=$('#prev');if(!p)return;p.innerHTML=S.files.map((f,k)=>`<div><img src="${URL.createObjectURL(f)}" alt="Pratinjau"><button type="button" class="danger" data-act="rmFile" data-id="${k}" aria-label="Hapus">×</button></div>`).join('')}
function addFiles(list){
  const have=photosOf(S.openId).length;
  for(const f of list){
    if(!EXT[f.type]){toast(`${f.name}: hanya foto JPG, PNG, atau WebP`,1);continue}
    if(f.size>MAXMB*1048576){toast(`${f.name} lebih dari ${MAXMB} MB`,1);continue}
    if(have+S.files.length>=MAXPH){toast(`Maksimal ${MAXPH} foto per kenangan`,1);break}
    S.files.push(f);
  }drawPrev()
}
const rmStore=paths=>paths.length?sb.storage.from('memories').remove(paths):null;

function addMemPick(){
  const free=S.items.filter(i=>!S.mem[i.id]);
  modal(`<h2>Tambah kenangan</h2><p>Momen apa yang mau kita simpan?</p>
  <label>Dari daftar Whislist kita<select id="pick"><option value="new">✨ Kegiatan baru, belum ada di daftar kita</option>${free.map(i=>`<option value="${i.id}">#${i.position} ${esc(i.title)}</option>`).join('')}</select></label>
  <label id="ttl">Mau kita beri nama apa?<input id="newt" maxlength="120" placeholder="mis. Jajan di tengah hujan"></label>
  <div class="actions"><button class="primary" data-act="pickGo">Lanjut</button><button data-act="close">Batal</button></div>`);
}
/* ---------- actions ---------- */
const ACT={
  tab(id){S.tab=id;mainView()},
  close:closeModal,
  open:detail,
  out(){run(()=>sb.auth.signOut())},
  authMode(){S.authMode=S.authMode==='in'?'up':'in';authView()},
  copy(){navigator.clipboard?.writeText(S.couple.invite_code).then(()=>toast('Kode undangan disalin'),()=>toast('Gagal menyalin. Pilih kodenya secara manual.',1))},
  zoom(_,b){const l=document.createElement('div');l.className='lb';l.innerHTML=`<img src="${esc(b.dataset.src)}" alt="Foto kenangan">`;l.onclick=()=>l.remove();document.body.append(l);event.stopPropagation()},
  rmFile(k){S.files.splice(+k,1);drawPrev()},
  did:memForm,
  card(id,b){if(S.moved){S.moved=false;return}if(b.classList.contains('is-focus')){b.dataset.src?ACT.zoom(null,b):detail(id)}else b.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})},
  addMem:addMemPick,
  pickGo(){const v=$('#pick').value;S.newWish=null;if(v==='new'){const t=$('#newt').value.trim();if(!t)return toast('Beri nama kenangan ini dulu',1);S.draft=t}else S.draft=null;memForm(v)},
  add(){addForm()},
  async saveNew(){
    const pos=Number($('#n-position').value),title=$('#n-title').value.trim(),category=$('#n-cat').value,st=$('#n-st').value;
    if(!Number.isInteger(pos)||pos<1)return toast('Nomor daftar harus berupa bilangan bulat minimal 1.',1);
    if(!title)return toast('Isi judul kegiatan terlebih dahulu.',1);
    if(S.items.some(i=>Number(i.position)===pos))return toast('Nomor tersebut sudah dipakai. Pilih nomor lain.',1);
    const ok=await run(async()=>{
      const row={couple_id:S.couple.id,position:pos,title,description:$('#n-desc').value.trim(),category,status:st,target_date:$('#n-tg').value||null,completed_at:st==='completed'?today():null};
      const n=await q(sb.from('wishlists').insert(row).select().single());
      await refresh();S.newId=n.id;
   },'Daftar Whislist berhasil ditambahkan ❤️');
    if(ok&&S.newId){const id=S.newId;S.newId=null;detail(id)}
  },
  async saveItem(id){
    const pos=Number($('#f-position').value),st=$('#f-st').value,cur=S.items.find(x=>x.id===id),title=$('#f-title').value.trim();
    if(!Number.isInteger(pos)||pos<1)return toast('Nomor daftar harus berupa bilangan bulat minimal 1.',1);
    if(!title)return toast('Isi judul kegiatan terlebih dahulu.',1);
    if(S.items.some(i=>i.id!==id&&Number(i.position)===pos))return toast('Nomor tersebut sudah dipakai. Pilih nomor lain.',1);
    const ok=await run(async()=>{await q(sb.from('wishlists').update({position:pos,title,description:$('#f-desc').value.trim(),category:$('#f-cat').value,status:st,target_date:$('#f-tg').value||null,completed_at:st==='completed'?(cur.completed_at||today()):null}).eq('id',id));await refresh()},'Perubahan berhasil disimpan ❤️');
    if(ok)detail(id)},
  async saveMem(id,btn){
    const date=$('#m-date').value;if(!date)return toast('Pilih tanggalnya dulu',1);
    btn.disabled=true;let fail=0;
    const ok=await run(async()=>{
      if(id==='new'){if(!S.newWish){const pos=Math.max(0,...S.items.map(i=>i.position))+1;const w=await q(sb.from('wishlists').insert({couple_id:S.couple.id,position:pos,title:S.draft,category:'Kenangan',status:'completed',completed_at:date}).select().single());S.newWish=w.id}id=S.newWish;S.openId=id}
      const row={wishlist_id:id,couple_id:S.couple.id,activity_date:date,location:$('#m-loc').value.trim(),caption:$('#m-cap').value.trim(),notes:$('#m-notes').value.trim(),updated_at:new Date().toISOString()};
      let m=S.mem[id];
      if(m)await q(sb.from('memories').update(row).eq('id',m.id));else m=await q(sb.from('memories').insert(row).select().single());
      for(const f of S.files){
        const path=`${S.couple.id}/${m.id}/${crypto.randomUUID()}.${EXT[f.type]}`;
        const up=await sb.storage.from('memories').upload(path,f,{contentType:f.type});
        if(up.error){fail++;continue}
        const r=await sb.from('memory_photos').insert({memory_id:m.id,couple_id:S.couple.id,path});
        if(r.error){fail++;await rmStore([path])}
      }
      await q(sb.from('wishlists').update({status:'completed',completed_at:date}).eq('id',id));
      S.files=[];await refresh();
    });
    btn.disabled=false;
    if(ok){S.newWish=null;hearts();fail?toast(`Kenangan tersimpan, tetapi ${fail} foto gagal diunggah. Buka lagi untuk mencoba ulang.`,1):toast('Kenangan kita tersimpan ❤️');detail(id)}
    else if(!navigator.onLine)toast('Tidak ada koneksi internet. Coba simpan lagi setelah tersambung.',1)},
  async delPhoto(pid){
    if(!confirm('Hapus foto ini? Tindakan ini tidak dapat dibatalkan.'))return;
    const p=Object.values(S.photos).flat().find(x=>x.id===pid);
    const ok=await run(async()=>{await rmStore([p.path]);await q(sb.from('memory_photos').delete().eq('id',pid));await refresh()},'Foto dihapus');
    if(ok)memForm(S.openId)},
  async delMem(id){
    if(!confirm('Hapus seluruh kenangan ini (cerita dan foto)? Daftar Whislist tetap ada.'))return;
    const m=S.mem[id];
    const ok=await run(async()=>{await rmStore(photosOf(id).map(p=>p.path));await q(sb.from('memories').delete().eq('id',m.id));await refresh()},'Kenangan dihapus');
    if(ok)detail(id)},
  async delItem(id){
    const has=!!S.mem[id];
    if(!confirm(has?'Daftar ini memiliki kenangan tersimpan. Menghapusnya juga akan menghapus cerita dan fotonya. Lanjutkan?':'Hapus daftar Whislist ini?'))return;
    const ok=await run(async()=>{await rmStore(photosOf(id).map(p=>p.path));await q(sb.from('wishlists').delete().eq('id',id));await refresh()},'Daftar Whislist dihapus');
    if(ok)closeModal()},
  async reset(){
    if(!confirm('Kembalikan semua daftar Whislist ke "Belum"? Foto dan cerita yang tersimpan tidak akan dihapus.'))return;
    await run(async()=>{await q(sb.from('wishlists').update({status:'not_yet',completed_at:null}).eq('couple_id',S.couple.id));await refresh()},'Progres direset. Kenangan tetap aman.')}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;if(b.dataset.act!=='zoom'&&b.closest('.polaroid')&&e.target.closest('img')){}ACT[b.dataset.act]?.(b.dataset.id,b)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList?.contains('pcard')){e.preventDefault();e.target.click();return}if(e.key==='Escape'){const l=document.querySelector('.lb');l?l.remove():closeModal()}});
document.addEventListener('input',e=>{if(e.target.id==='search'){S.q=e.target.value;drawList()}});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='flt'){S.filter=t.value;drawList()}
  else if(t.id==='pick'){$('#ttl').hidden=t.value!=='new'}
  else if(t.id==='m-files'){addFiles([...t.files]);t.value=''}
  else if(t.dataset.f){
    let v=t.value.trim();if(t.dataset.f!=='start_date'&&!v){t.value=S.couple[t.dataset.f];return}
    await run(async()=>{await q(sb.from('couples').update({[t.dataset.f]:v||null}).eq('id',S.couple.id));S.couple[t.dataset.f]=v||null;if(t.dataset.f==='start_date')mainView()},'Tersimpan ❤️')}
});
document.addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f)),b=f.querySelector('button.primary');
  if(b)b.disabled=true;
  if(f.id==='wishNewForm'){await ACT.saveNew();if(b&&document.contains(b))b.disabled=false;return}
  if(f.id==='authf'){
    await run(async()=>{
      if(S.authMode==='up'){const{data,error}=await sb.auth.signUp({email:v.email,password:v.pw});if(error)throw error;if(!data.session)toast('Periksa email untuk mengonfirmasi akun, lalu masuk.')}
      else{const{error}=await sb.auth.signInWithPassword({email:v.email,password:v.pw});if(error)throw error}})}
  if(f.id==='createf')await run(async()=>{await q(sb.rpc('create_couple',{p_a:v.a,p_b:v.b,p_start:v.d||null}));await refresh()},'Selamat datang di perjalanan kita ❤️');
  if(f.id==='joinf')await run(async()=>{await q(sb.rpc('join_couple',{p_code:v.code}));await refresh()},'Berhasil bergabung ❤️');
  if(b&&document.contains(b))b.disabled=false;
});
addEventListener('online',()=>toast('Kembali online'));addEventListener('offline',()=>toast('Kamu sedang tidak terhubung internet.',1));

/* ---------- boot ---------- */
async function setUser(session){
  S.user=session?.user||null;S.couple=null;
  if(S.user){await run(load)}
  render();
}
(async()=>{
  if(!configured)return render();
  const{data}=await sb.auth.getSession();await setUser(data.session);
  sb.auth.onAuthStateChange((ev,s)=>{if(ev==='SIGNED_IN'&&S.user&&s?.user?.id===S.user.id)return;if(ev==='TOKEN_REFRESHED'||ev==='INITIAL_SESSION')return;setUser(s)});
})();
