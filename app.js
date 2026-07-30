// app.js — Lógica de la app de Onces Probables (pre-plataforma de VDC ENGINE)

let currentTeam = EQUIPOS[0];
let unsubscribe = null;
let teamData = null;          // { jugadores:[], formacion, slots:{ "1":{...}, ... "11":{...} } }
let currentSlotNum = null;    // slot que se está editando en el modal
let editingPlayerId = null;   // jugador que se está editando en el modal (null = nuevo)
let pendingFotoFile = null;   // fichero de foto elegido en el modal, pendiente de subir
let pendingFotoRemoved = false; // true si se ha pulsado "Quitar foto"

// Convierte "MARCOS_LLORENTE.png" o "iñaki-williams.jpg" en "Marcos Llorente".
function nombreDesdeArchivo(filename) {
  let n = filename.replace(/\.[^.]+$/, "");
  n = n.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
  return n.split(" ").map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");
}

// Redimensiona y comprime una foto a una miniatura pequeña (base64), para
// poder guardarla directamente dentro del documento de Firestore sin
// necesitar Storage (que exige tarjeta de facturación).
function comprimirFoto(file, maxSize = 160, calidad = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se ha podido leer el fichero"));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Fichero de imagen no válido"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultSlot() {
  return { jugador_main_id: null, duda_ids: [null, null, null], porcentaje: 95, on_fire: false };
}

function defaultTeamData() {
  const slots = {};
  for (let n = 1; n <= 11; n++) slots[n] = defaultSlot();
  return { jugadores: [], formacion: Object.keys(FORMACIONES)[0], slots };
}

function ensureSlots() {
  if (!teamData.jugadores) teamData.jugadores = [];
  if (!teamData.formacion || !FORMACIONES[teamData.formacion]) teamData.formacion = Object.keys(FORMACIONES)[0];
  if (!teamData.slots) teamData.slots = {};
  for (let n = 1; n <= 11; n++) if (!teamData.slots[n]) teamData.slots[n] = defaultSlot();
}

function getPlayer(id) {
  return (teamData.jugadores || []).find(p => p.id === id) || null;
}

// ── ESTADO / STATUS ─────────────────────────────────────────
function setStatus(text, cls) {
  const el = document.getElementById("status");
  el.textContent = text;
  el.className = "topbar-status" + (cls ? " " + cls : "");
}

// ── FIRESTORE ────────────────────────────────────────────────
function saveTeamData() {
  db.collection("equipos").doc(currentTeam).set(teamData).catch(err => {
    console.error(err);
    setStatus("Error guardando — revisa la consola", "err");
  });
}

function subscribeTeam(team) {
  if (unsubscribe) unsubscribe();
  currentTeam = team;
  setStatus("conectando…");
  unsubscribe = db.collection("equipos").doc(team).onSnapshot(
    doc => {
      teamData = doc.exists ? doc.data() : defaultTeamData();
      ensureSlots();
      renderAll();
      setStatus("sincronizado ✓", "ok");
    },
    err => {
      console.error(err);
      teamData = defaultTeamData();
      renderAll();
      setStatus("sin conexión — revisa firebase-config.js", "err");
    }
  );
}

// ── LAYOUT DEL CAMPO ─────────────────────────────────────────
// Lee las coordenadas fijas de la formación (definidas a mano en data.js) y
// las empareja con el número de slot (1..11).
function computeLayout(formationKey) {
  const coords = FORMACIONES[formationKey];
  return coords.map((c, i) => ({ slot: i + 1, top: c.top, left: c.left }));
}

// ── RENDER ───────────────────────────────────────────────────
function renderTabs() {
  const sel = document.getElementById("teamSelect");
  if (!sel.options.length) {
    EQUIPOS.forEach(eq => {
      const opt = document.createElement("option");
      opt.value = eq; opt.textContent = eq;
      sel.appendChild(opt);
    });
    sel.onchange = () => { if (sel.value !== currentTeam) subscribeTeam(sel.value); };
  }
  sel.value = currentTeam;
}

function usedPlayerIds() {
  const used = new Set();
  for (let n = 1; n <= 11; n++) {
    const s = teamData.slots[n];
    if (!s) continue;
    if (s.jugador_main_id) used.add(s.jugador_main_id);
    (s.duda_ids || []).forEach(id => { if (id) used.add(id); });
  }
  return used;
}

function renderRoster() {
  const list = document.getElementById("rosterList");
  const query = (document.getElementById("searchInput").value || "").trim().toLowerCase();
  const used = usedPlayerIds();
  list.innerHTML = "";
  const jugadores = [...(teamData.jugadores || [])].sort((a, b) => a.nombre.localeCompare(b.nombre));
  jugadores
    .filter(p => !query || p.nombre.toLowerCase().includes(query))
    .forEach(p => {
      const card = document.createElement("div");
      card.className = "player-card" + (used.has(p.id) ? " used" : "");
      card.innerHTML = `
        <div class="pc-handle" title="Arrastra a una posición del campo">⠿</div>
        ${p.foto
          ? `<img src="${escapeAttr(p.foto)}" onerror="this.style.display='none'">`
          : `<div class="player-card-noimg">👤</div>`}
        <div class="pc-info">
          <div class="pc-name">${escapeHtml(p.nombre)}</div>
          <div class="pc-pos">${escapeHtml(p.posicion)}</div>
        </div>
        <div class="pc-edit">✎</div>`;
      card.onclick = () => openPlayerModal(p.id);
      const handle = card.querySelector(".pc-handle");
      handle.onclick = e => e.stopPropagation();
      handle.addEventListener("pointerdown", e => startPlayerDrag(e, p.id, card));
      list.appendChild(card);
    });
  if (!jugadores.length) {
    list.innerHTML = `<p class="hint">Sin jugadores todavía — usa "+ Jugador" para añadir la plantilla.</p>`;
  }
}

function renderField() {
  const field = document.getElementById("field");
  field.innerHTML = "";
  const layout = computeLayout(teamData.formacion);
  layout.forEach(pos => {
    const state = teamData.slots[pos.slot] || defaultSlot();
    const player = state.jugador_main_id ? getPlayer(state.jugador_main_id) : null;
    const div = document.createElement("div");
    div.className = "slot" + (player ? " filled" : "");
    div.dataset.slot = pos.slot;
    div.style.left = pos.left + "%";
    div.style.top = pos.top + "%";
    div.innerHTML = `
      ${state.on_fire ? `<div class="slot-fuego">🔥</div>` : ""}
      ${player && player.foto
        ? `<img class="slot-photo" src="${escapeAttr(player.foto)}" onerror="this.outerHTML='<div class=\\'slot-photo\\'>👤</div>'">`
        : `<div class="slot-photo">${player ? "👤" : "+"}</div>`}
      ${player ? `<div class="slot-pct" style="background:${(PCT_COLORS[state.porcentaje] || PCT_COLORS[95]).bg};color:${(PCT_COLORS[state.porcentaje] || PCT_COLORS[95]).text}">${state.porcentaje}%</div>` : ""}
    `;
    div.title = player ? player.nombre : "Vacío — toca para asignar";
    div.addEventListener("pointerdown", e => startSlotDrag(e, pos.slot, div));
    field.appendChild(div);
  });
}

function swapSlots(slotA, slotB) {
  const sa = teamData.slots[slotA] || defaultSlot();
  const sb = teamData.slots[slotB] || defaultSlot();
  teamData.slots[slotA] = { ...sa, jugador_main_id: sb.jugador_main_id };
  teamData.slots[slotB] = { ...sb, jugador_main_id: sa.jugador_main_id };
  saveTeamData();
  renderAll();
}

// Tocar una posición abre el modal (asignar %, dudas, racha...). Arrastrarla
// hasta otra posición ya ocupada intercambia los dos jugadores entre sí; si
// se suelta sobre una posición vacía, simplemente se mueve.
function startSlotDrag(e, slotNum, div) {
  e.preventDefault();
  const startX = e.clientX, startY = e.clientY;
  let dragging = false, ghost = null;

  function onMove(ev) {
    const dx = ev.clientX - startX, dy = ev.clientY - startY;
    if (!dragging && Math.hypot(dx, dy) > 8) {
      const state = teamData.slots[slotNum];
      const player = state && state.jugador_main_id ? getPlayer(state.jugador_main_id) : null;
      if (!player) return; // no hay nada que arrastrar desde una posición vacía
      dragging = true;
      div.classList.add("dragging");
      ghost = document.createElement("div");
      ghost.className = "drag-ghost";
      ghost.innerHTML = player.foto ? `<img src="${escapeAttr(player.foto)}">` : "👤";
      document.body.appendChild(ghost);
    }
    if (dragging) {
      ev.preventDefault();
      ghost.style.left = (ev.clientX - 22) + "px";
      ghost.style.top = (ev.clientY - 22) + "px";
      document.querySelectorAll(".slot.drag-over").forEach(s => s.classList.remove("drag-over"));
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const target = el && el.closest(".slot");
      if (target && target !== div) target.classList.add("drag-over");
    }
  }
  function cleanup() {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onCancel);
    document.querySelectorAll(".slot.drag-over").forEach(s => s.classList.remove("drag-over"));
    div.classList.remove("dragging");
    if (ghost) { ghost.remove(); ghost = null; }
  }
  function onUp(ev) {
    const wasDragging = dragging;
    const el = wasDragging ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
    cleanup();
    if (wasDragging) {
      const target = el && el.closest(".slot");
      if (target && target.dataset.slot && +target.dataset.slot !== slotNum) {
        swapSlots(slotNum, +target.dataset.slot);
      }
    } else {
      openSlotModal(slotNum);
    }
  }
  function onCancel() { cleanup(); }
  document.addEventListener("pointermove", onMove, { passive: false });
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onCancel);
}

function assignMainToSlot(slotNum, playerId) {
  const s = teamData.slots[slotNum] || defaultSlot();
  teamData.slots[slotNum] = { ...s, jugador_main_id: playerId };
  saveTeamData();
  renderAll();
}

function startPlayerDrag(e, playerId, cardEl) {
  e.preventDefault();
  const player = getPlayer(playerId);
  cardEl.classList.add("dragging");
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.innerHTML = player && player.foto ? `<img src="${escapeAttr(player.foto)}">` : "👤";
  document.body.appendChild(ghost);

  const place = (x, y) => { ghost.style.left = (x - 22) + "px"; ghost.style.top = (y - 22) + "px"; };
  place(e.clientX, e.clientY);

  function clearDragOver() {
    document.querySelectorAll(".slot.drag-over").forEach(s => s.classList.remove("drag-over"));
  }
  function slotUnder(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && el.closest(".slot");
  }
  function onMove(ev) {
    ev.preventDefault();
    place(ev.clientX, ev.clientY);
    clearDragOver();
    const slotEl = slotUnder(ev.clientX, ev.clientY);
    if (slotEl) slotEl.classList.add("drag-over");
  }
  function cleanup() {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onCancel);
    ghost.remove();
    cardEl.classList.remove("dragging");
    clearDragOver();
  }
  function onUp(ev) {
    const slotEl = slotUnder(ev.clientX, ev.clientY);
    cleanup();
    if (slotEl && slotEl.dataset.slot) assignMainToSlot(+slotEl.dataset.slot, playerId);
  }
  function onCancel() { cleanup(); }
  document.addEventListener("pointermove", onMove, { passive: false });
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onCancel);
}

function renderFormacionSelect() {
  const sel = document.getElementById("formacionSelect");
  if (!sel.options.length) {
    Object.keys(FORMACIONES).forEach(f => {
      const opt = document.createElement("option");
      opt.value = f; opt.textContent = f;
      sel.appendChild(opt);
    });
  }
  sel.value = teamData.formacion;
}

function renderAll() {
  renderTabs();
  renderFormacionSelect();
  renderRoster();
  renderField();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

async function importarFotos(files) {
  const statusEl = document.getElementById("importStatus");
  statusEl.style.display = "";
  const existentes = new Set((teamData.jugadores || []).map(p => p.nombre.toLowerCase()));
  let importados = 0, saltados = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    statusEl.textContent = `Procesando ${i + 1}/${files.length}…`;
    const nombre = nombreDesdeArchivo(file.name);
    if (!nombre || existentes.has(nombre.toLowerCase())) { saltados++; continue; }
    try {
      const foto = await comprimirFoto(file);
      teamData.jugadores.push({ id: uid(), nombre, posicion: POSICIONES[0], foto });
      existentes.add(nombre.toLowerCase());
      importados++;
    } catch (err) {
      console.error("Error importando", file.name, err);
      saltados++;
    }
  }

  statusEl.textContent = `Importados ${importados} jugador(es)` + (saltados ? `, ${saltados} omitido(s) (ya existían o no eran imagen válida)` : "") + `. Revisa/ajusta la posición de cada uno.`;
  saveTeamData();
  renderAll();
  setTimeout(() => { statusEl.style.display = "none"; }, 6000);
}

// ── MODAL: JUGADOR (plantilla) ───────────────────────────────
function openPlayerModal(id) {
  editingPlayerId = id;
  const posSel = document.getElementById("pmPosicion");
  if (!posSel.options.length) {
    POSICIONES.forEach(p => {
      const o = document.createElement("option"); o.value = p; o.textContent = p;
      posSel.appendChild(o);
    });
  }
  const nombreEl = document.getElementById("pmNombre");
  const fileEl = document.getElementById("pmFotoFile");
  const previewWrap = document.getElementById("pmFotoPreviewWrap");
  const preview = document.getElementById("pmFotoPreview");
  const titleEl = document.getElementById("playerModalTitle");
  const borrarBtn = document.getElementById("pmBorrar");

  pendingFotoFile = null;
  pendingFotoRemoved = false;
  fileEl.value = "";

  if (id) {
    const p = getPlayer(id);
    titleEl.textContent = "Editar jugador";
    nombreEl.value = p.nombre;
    posSel.value = p.posicion;
    borrarBtn.style.display = "";
    if (p.foto) { preview.src = p.foto; previewWrap.style.display = ""; }
    else { previewWrap.style.display = "none"; }
  } else {
    titleEl.textContent = "Nuevo jugador";
    nombreEl.value = "";
    posSel.value = POSICIONES[0];
    borrarBtn.style.display = "none";
    previewWrap.style.display = "none";
  }
  openModal("playerModalOverlay");
}

function closePlayerModal() { closeModal("playerModalOverlay"); }

async function savePlayer() {
  const nombre = document.getElementById("pmNombre").value.trim();
  if (!nombre) { alert("Ponle un nombre al jugador."); return; }
  const posicion = document.getElementById("pmPosicion").value;
  const guardarBtn = document.getElementById("pmGuardar");

  let foto = editingPlayerId ? (getPlayer(editingPlayerId).foto || "") : "";
  if (pendingFotoRemoved) foto = "";

  if (pendingFotoFile) {
    guardarBtn.disabled = true;
    guardarBtn.textContent = "Procesando foto…";
    try {
      foto = await comprimirFoto(pendingFotoFile);
    } catch (err) {
      console.error(err);
      alert("No se ha podido procesar la foto — prueba con otra imagen.");
      guardarBtn.disabled = false;
      guardarBtn.textContent = "Guardar";
      return;
    }
    guardarBtn.disabled = false;
    guardarBtn.textContent = "Guardar";
  }

  if (editingPlayerId) {
    const p = getPlayer(editingPlayerId);
    p.nombre = nombre; p.posicion = posicion; p.foto = foto;
  } else {
    teamData.jugadores.push({ id: uid(), nombre, posicion, foto });
  }
  saveTeamData();
  renderAll();
  closePlayerModal();
}

function deletePlayer() {
  if (!editingPlayerId) return;
  if (!confirm("¿Borrar este jugador de la plantilla? También se quitará de cualquier posición donde esté asignado.")) return;
  teamData.jugadores = teamData.jugadores.filter(p => p.id !== editingPlayerId);
  for (let n = 1; n <= 11; n++) {
    const s = teamData.slots[n];
    if (!s) continue;
    if (s.jugador_main_id === editingPlayerId) s.jugador_main_id = null;
    s.duda_ids = (s.duda_ids || []).map(id => id === editingPlayerId ? null : id);
  }
  saveTeamData();
  renderAll();
  closePlayerModal();
}

// ── MODAL: SLOT (asignar posición del campo) ──────────────────
function populatePlayerSelect(selectEl, selectedId) {
  selectEl.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = ""; empty.textContent = "— vacío —";
  selectEl.appendChild(empty);
  [...(teamData.jugadores || [])].sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach(p => {
    const o = document.createElement("option");
    o.value = p.id; o.textContent = `${p.nombre} (${p.posicion})`;
    selectEl.appendChild(o);
  });
  selectEl.value = selectedId || "";
}

function openSlotModal(n) {
  currentSlotNum = n;
  const s = teamData.slots[n] || defaultSlot();

  populatePlayerSelect(document.getElementById("slotMain"), s.jugador_main_id);
  populatePlayerSelect(document.getElementById("slotDuda1"), s.duda_ids[0]);
  populatePlayerSelect(document.getElementById("slotDuda2"), s.duda_ids[1]);
  populatePlayerSelect(document.getElementById("slotDuda3"), s.duda_ids[2]);

  const pctSel = document.getElementById("slotPorcentaje");
  if (!pctSel.options.length) {
    PORCENTAJES.forEach(p => {
      const o = document.createElement("option"); o.value = p; o.textContent = p + "%";
      o.style.backgroundColor = PCT_COLORS[p].bg;
      o.style.color = PCT_COLORS[p].text;
      pctSel.appendChild(o);
    });
  }
  pctSel.value = s.porcentaje;
  aplicarColorPorcentaje();
  document.getElementById("slotFuego").checked = !!s.on_fire;
  actualizarVisibilidadDudas();

  openModal("slotModalOverlay");
}

function aplicarColorPorcentaje() {
  const pctSel = document.getElementById("slotPorcentaje");
  const c = PCT_COLORS[+pctSel.value] || PCT_COLORS[95];
  pctSel.style.backgroundColor = c.bg;
  pctSel.style.color = c.text;
}

// Las alternativas (duda) solo tienen sentido cuando hay dudas de verdad
// sobre la titularidad — a partir de 50% se despliegan los huecos extra
// para añadir alternativas, igual que en VDC ENGINE.
function actualizarVisibilidadDudas() {
  const pct = +document.getElementById("slotPorcentaje").value;
  document.querySelector(".dudas-block").style.display = pct <= 50 ? "" : "none";
}

function closeSlotModal() { closeModal("slotModalOverlay"); }

function countFuegoActuales(excludeSlot) {
  let count = 0;
  for (let n = 1; n <= 11; n++) {
    if (n === excludeSlot) continue;
    if (teamData.slots[n] && teamData.slots[n].on_fire) count++;
  }
  return count;
}

function saveSlot() {
  const mainId = document.getElementById("slotMain").value || null;
  const dudaIds = [
    document.getElementById("slotDuda1").value || null,
    document.getElementById("slotDuda2").value || null,
    document.getElementById("slotDuda3").value || null,
  ];
  const porcentaje = +document.getElementById("slotPorcentaje").value;
  const fuego = document.getElementById("slotFuego").checked;

  if (fuego && countFuegoActuales(currentSlotNum) >= 3) {
    alert("Ya tienes 3 jugadores en racha 🔥 — quita uno antes de añadir otro.");
    return;
  }

  teamData.slots[currentSlotNum] = { jugador_main_id: mainId, duda_ids: dudaIds, porcentaje, on_fire: fuego };
  saveTeamData();
  renderAll();
  closeSlotModal();
}

function clearSlot() {
  teamData.slots[currentSlotNum] = defaultSlot();
  saveTeamData();
  renderAll();
  closeSlotModal();
}

function resetOnce() {
  if (!confirm(`¿Resetear el once de ${currentTeam}? Se vaciarán las 11 posiciones.`)) return;
  for (let n = 1; n <= 11; n++) teamData.slots[n] = defaultSlot();
  saveTeamData();
  renderAll();
}

// ── EXPORTAR JSON (mismo formato que vdc_save.json) ───────────
function emptyExportTeam() {
  const slots = {};
  for (let n = 1; n <= 11; n++) {
    slots[n] = { jugador_main: null, jugadores_duda: [null, null, null], porcentaje: 95, on_fire: false };
  }
  return { formacion: Object.keys(FORMACIONES)[0], slots };
}

async function exportAll() {
  const out = {};
  EQUIPOS.forEach(eq => { out[eq] = emptyExportTeam(); });
  try {
    const snap = await db.collection("equipos").get();
    snap.forEach(doc => {
      const d = doc.data();
      const jugadores = d.jugadores || [];
      const getP = id => jugadores.find(p => p.id === id);
      const slotsOut = {};
      for (let n = 1; n <= 11; n++) {
        const s = (d.slots && d.slots[n]) || defaultSlot();
        const main = s.jugador_main_id ? getP(s.jugador_main_id) : null;
        const dudas = (s.duda_ids || [null, null, null]).map(id => (id ? getP(id) : null));
        slotsOut[n] = {
          jugador_main: main ? [main.nombre, main.foto || ""] : null,
          jugadores_duda: dudas.map(p => (p ? [p.nombre, p.foto || ""] : null)),
          porcentaje: s.porcentaje || 95,
          on_fire: !!s.on_fire,
        };
      }
      out[doc.id] = { formacion: d.formacion || Object.keys(FORMACIONES)[0], slots: slotsOut };
    });
  } catch (err) {
    console.error(err);
    alert("No se ha podido leer de Firestore — revisa la conexión / firebase-config.js");
    return;
  }
  document.getElementById("exportText").value = JSON.stringify(out, null, 2);
  openModal("exportModalOverlay");
}

// ── MODALES genéricos ──────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

// ── EVENTOS ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnAddPlayer").onclick = () => openPlayerModal(null);
  document.getElementById("btnImportFotos").onclick = () => document.getElementById("importFotosInput").click();
  document.getElementById("importFotosInput").onchange = e => {
    const files = [...e.target.files];
    e.target.value = "";
    if (files.length) importarFotos(files);
  };
  document.getElementById("searchInput").oninput = renderRoster;
  document.getElementById("formacionSelect").onchange = e => {
    teamData.formacion = e.target.value;
    saveTeamData();
    renderField();
  };
  document.getElementById("btnResetOnce").onclick = resetOnce;
  document.getElementById("btnExport").onclick = exportAll;

  document.getElementById("pmCancelar").onclick = closePlayerModal;
  document.getElementById("pmGuardar").onclick = savePlayer;
  document.getElementById("pmBorrar").onclick = deletePlayer;
  document.getElementById("pmFotoFile").onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    pendingFotoFile = file;
    pendingFotoRemoved = false;
    const preview = document.getElementById("pmFotoPreview");
    preview.src = URL.createObjectURL(file);
    document.getElementById("pmFotoPreviewWrap").style.display = "";
  };
  document.getElementById("pmFotoQuitar").onclick = () => {
    pendingFotoFile = null;
    pendingFotoRemoved = true;
    document.getElementById("pmFotoFile").value = "";
    document.getElementById("pmFotoPreviewWrap").style.display = "none";
  };

  document.getElementById("smCancelar").onclick = closeSlotModal;
  document.getElementById("smGuardar").onclick = saveSlot;
  document.getElementById("smVaciar").onclick = clearSlot;
  document.getElementById("slotPorcentaje").onchange = () => { actualizarVisibilidadDudas(); aplicarColorPorcentaje(); };

  document.getElementById("emCerrar").onclick = () => closeModal("exportModalOverlay");
  document.getElementById("emCopiar").onclick = () => {
    const ta = document.getElementById("exportText");
    ta.select();
    navigator.clipboard.writeText(ta.value).then(() => alert("Copiado ✓")).catch(() => document.execCommand("copy"));
  };

  const emailField = document.getElementById("loginEmail");
  const rememberedEmail = localStorage.getItem("onces_email");
  if (rememberedEmail) emailField.value = rememberedEmail;

  document.getElementById("loginBtn").onclick = () => {
    const email = emailField.value.trim();
    const pass = document.getElementById("loginPass").value;
    const errEl = document.getElementById("loginError");
    errEl.style.display = "none";
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => auth.signInWithEmailAndPassword(email, pass))
      .then(() => localStorage.setItem("onces_email", email))
      .catch(err => {
        errEl.textContent = "No se ha podido entrar: " + err.message;
        errEl.style.display = "";
      });
  };
  document.getElementById("logoutBtn").onclick = () => auth.signOut();

  auth.onAuthStateChanged(user => {
    if (user) {
      closeModal("loginOverlay");
      subscribeTeam(currentTeam);
    } else {
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
      openModal("loginOverlay");
    }
  });
});
