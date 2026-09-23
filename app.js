/* Static inventory snapshot enriched with verified, locally bundled workbook photos. */
(() => {
  'use strict';
  const data = window.DEMO_INVENTORY;
  const $ = (id) => document.getElementById(id);
  const ui = { search: $('search'), year: $('year'), status: $('status'), owner: $('owner'), photoFilter: $('photoFilter'), cards: $('cards'), empty: $('empty'), drawer: $('drawer'), overlay: $('overlay'), lightbox: $('lightbox') };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const term = s => String(s ?? '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
  const number = n => Number(n).toLocaleString('th-TH');
  const label = g => g.demo || g.asset || g.model || `ชุด ${g.number}`;
  const groupStatus = g => (g.status === 'NG' || g.checkStatus === 'NG' || g.checkNg || g.items.some(i => i.status === 'NG' || i.checkStatus === 'NG')) ? 'NG' : (g.status === 'OK' || g.checkStatus === 'OK' || g.items.some(i => i.status === 'OK' || i.checkStatus === 'OK')) ? 'OK' : 'UNKNOWN';
  const badge = status => `<span class="pill ${status === 'NG' ? 'ng' : status === 'OK' ? 'ok' : 'unknown'}">${status === 'NG' ? 'พบ NG' : status === 'OK' ? 'OK' : 'ไม่ระบุ'}</span>`;
  const years = [...new Set(data.groups.map(g => g.year))];
  const owners = [...new Set(data.groups.map(g => g.owner).filter(Boolean))].sort();
  for (const y of years) ui.year.add(new Option(/^20\d\d$/.test(y) ? `ปี ${y}` : y, y));
  for (const o of owners) ui.owner.add(new Option(o, o));
  $('totalGroups').textContent = number(data.groups.length);
  $('totalItems').textContent = number(data.groups.reduce((a,g) => a + g.items.length, 0));
  $('totalNg').textContent = number(data.groups.filter(g => groupStatus(g) === 'NG').length);
  $('sources').textContent = [data.meta.actual,data.meta.recheck,data.meta.photoSource,data.meta.additionalSource].filter(Boolean).join(' / ');

  function searchText(g) {
    return term([g.name,g.demo,g.asset,g.model,g.serial,g.note,g.remark,g.owner,g.location,g.year,g.number,
      ...g.items.flatMap(i => [i.name,i.model,i.serial,i.asset,i.remark,i.owner,i.location]),
      ...(g.photos || []).flatMap(p => [p.caption,p.model,p.serial])].join(' '));
  }
  function render() {
    const q = term(ui.search.value);
    const matches = data.groups.filter(g => (ui.year.value === 'all' || g.year === ui.year.value) &&
      (ui.status.value === 'all' || groupStatus(g) === ui.status.value) &&
      (ui.owner.value === 'all' || g.owner === ui.owner.value) &&
      (ui.photoFilter.value === 'all' || !!g.cover) &&
      (!q || searchText(g).includes(q)));
    $('shownCount').textContent = number(matches.length);
    $('resultInfo').textContent = `แสดง ${number(matches.length)} จาก ${number(data.groups.length)} ชุด · ${number(data.meta.photos)} รูปใน ${number(data.groups.filter(g => g.cover).length)} ชุด`;
    ui.empty.hidden = matches.length > 0;
    ui.cards.hidden = matches.length === 0;
    ui.cards.innerHTML = matches.map(g => `<button class="card" type="button" data-id="${esc(g.id)}" aria-label="ดูรายละเอียด ${esc(g.name)}">
      <div class="card-media">${g.cover ? `<img src="${esc(g.cover)}" alt="${esc(g.name)}" loading="lazy" />` : `<span class="no-photo">ไม่มีรูปในไฟล์แนบ</span>`}${g.photos?.length ? `<span class="photo-count">${number(g.photos.length)} รูป</span>` : ''}</div>
      <div class="card-head"><span class="card-code">${esc(label(g))}</span>${badge(groupStatus(g))}</div>
      <h3>${esc(g.name)}</h3><div class="card-meta">${esc(g.model || g.serial ? [g.model,g.serial && `S/N ${g.serial}`].filter(Boolean).join(' · ') : `Asset ${g.asset || '—'}`)}</div>
      <div class="card-bottom"><span>${esc(g.year)} · ${esc(g.owner || g.location || 'ไม่ระบุผู้รับผิดชอบ')}</span><strong>${number(g.items.length)} รายการย่อย &nbsp;→</strong></div>
    </button>`).join('');
  }
  function show(g) {
    const facts = [['รหัส Demo',g.demo],['Asset No.',g.asset],['Model',g.model],['Serial No.',g.serial],['จำนวน',g.qty],['ผู้รับผิดชอบ',g.owner],['สถานที่เก็บ',g.location],['สถานะในทะเบียนหลัก',g.status || 'ไม่ระบุ'],['ผลตรวจที่บันทึก',g.checkStatus || 'ไม่ระบุ'],['หมายเหตุ',g.note || g.remark]];
    $('drawerContent').innerHTML = `<div class="drawer-top"><span class="drawer-kicker">${esc(g.year)} · ${esc(label(g))}</span><button class="close" id="closeDrawer" type="button" aria-label="ปิดรายละเอียด">×</button></div>
      <div class="drawer-body">${badge(groupStatus(g))}<h2 class="drawer-title">${esc(g.name)}</h2>
      <p class="drawer-sub">${g.id.startsWith('photo-') ? 'รายการเพิ่มเติมจากสมุดภาพและรายการตรวจนับ โดยจับคู่จากรุ่น, Serial No. และ Asset No.' : 'ข้อมูลชุดตามทะเบียนหลัก พร้อมรายการตรวจนับและภาพที่จับคู่จากรุ่น, Serial No. หรือ Asset No.'}</p>
      <div class="drawer-stats"><span>${number(g.items.length)} รายการย่อย</span><span>${number(g.checkCount)} รายการมีผลตรวจ</span>${g.photos?.length ? `<span>${number(g.photos.length)} รูป</span>` : ''}${g.checkNg ? `<span>${number(g.checkNg)} รายการ NG</span>` : ''}</div>
      ${g.photos?.length ? `<h3>ภาพอุปกรณ์</h3><div class="gallery">${g.photos.map((p,index) => `<button class="photo-tile" type="button" data-photo="${index}" aria-label="เปิดภาพ ${esc(p.caption)}"><img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy" /><span>${esc(p.caption)}</span></button>`).join('')}</div>` : '<p class="no-gallery">ไม่พบรูปของชุดนี้ในสมุดภาพที่แนบ</p>'}
      <dl class="info-grid">${facts.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v || '—')}</dd></div>`).join('')}</dl>
      <h3>รายการภายในชุด</h3>${g.items.length ? g.items.map(i => `<div class="item-row">${i.photo ? `<img class="item-thumb" src="${esc(i.photo)}" alt="${esc(i.name)}" loading="lazy" />` : ''}<div class="item-top"><strong>${esc(i.no)} &nbsp; ${esc(i.name)}</strong>${badge(i.checkStatus || i.status || '')}</div>
      <div class="item-line">${esc([i.model && `Model ${i.model}`,i.serial && `S/N ${i.serial}`,i.asset && `Asset ${i.asset}`,i.qty && `Qty ${i.qty}`].filter(Boolean).join(' · ') || 'ไม่มีรหัสเพิ่มเติม')}</div>
      ${i.remark ? `<div class="item-line">หมายเหตุ: ${esc(i.remark)}</div>` : ''}<div class="item-source">${esc(i.source)}${i.checkSource ? ` · ${esc(i.checkSource)}` : ''}</div></div>`).join('') : '<p class="drawer-sub">ไม่มีรายการย่อยในทะเบียนหลัก</p>'}
      <div class="source-note">ที่มา: ${esc(g.source)}${g.photos?.length ? ` · ภาพ: ${esc(g.photoSource || data.meta.photoSource)}` : ''} · สถานะในทะเบียนหลักและผลตรวจเก็บแยกกัน; เครื่องหมาย O/Ο ในผลตรวจแสดงเป็น OK ข้อมูลไม่อัปเดตอัตโนมัติ</div></div>`;
    activeGroup=g;ui.drawer.hidden = false;ui.overlay.hidden = false;document.body.style.overflow = 'hidden';$('closeDrawer').focus();
  }
  function close() {closePhoto();ui.drawer.hidden = true;ui.overlay.hidden = true;document.body.style.overflow = '';ui.cards.querySelector(`[data-id="${CSS.escape(activeId)}"]`)?.focus();}
  let activeId = '';
  let activeGroup = null;
  function closePhoto() {ui.lightbox.hidden=true;}
  function openPhoto(photo) {$('lightboxImage').src=photo.src;$('lightboxImage').alt=photo.caption;$('lightboxCaption').textContent=`${photo.caption} · ${photo.source}`;ui.lightbox.hidden=false;$('closeLightbox').focus();}
  ui.cards.addEventListener('click', e => {const card = e.target.closest('[data-id]');if(!card)return;activeId = card.dataset.id;const g=data.groups.find(x=>x.id===activeId);if(g)show(g);});
  ui.drawer.addEventListener('click', e => {if(e.target.closest('#closeDrawer'))close();const tile=e.target.closest('[data-photo]');if(tile&&activeGroup)openPhoto(activeGroup.photos[Number(tile.dataset.photo)]);});
  ui.overlay.addEventListener('click',close);
  $('closeLightbox').addEventListener('click',closePhoto);
  ui.lightbox.addEventListener('click',e=>{if(e.target===ui.lightbox)closePhoto();});
  document.addEventListener('keydown', e => {if(e.key==='Escape'&&!ui.lightbox.hidden)closePhoto();else if(e.key==='Escape'&&!ui.drawer.hidden)close();else if(e.key==='/'&&ui.drawer.hidden&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();ui.search.focus();}});
  function clear() {ui.search.value='';ui.year.value='all';ui.status.value='all';ui.owner.value='all';ui.photoFilter.value='all';render();ui.search.focus();}
  $('clear').addEventListener('click',clear);$('emptyClear').addEventListener('click',clear);
  ui.search.addEventListener('input',render);
  [ui.year,ui.status,ui.owner,ui.photoFilter].forEach(x=>x.addEventListener('change',render));
  render();
})();
