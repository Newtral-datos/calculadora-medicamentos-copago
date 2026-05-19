// Índices de búsqueda derivados de medicamentos[] (cargado desde medicamentos.js)
const principios       = [...new Set(medicamentos.map(m => m.principio))].sort();
const medicamentoNames = [...new Set(medicamentos.map(m => m.medicamento).filter(Boolean))].sort();

let searchMode = 'medicamento';

// ── Tramos ───────────────────────────────────────

const tramosActivo = [
  { label:"Menos de 9.000 €",          pct:40, tope:8.23  },
  { label:"Entre 9.000 € y 17.999 €",  pct:40, tope:18.52 },
  { label:"Entre 18.000 € y 34.999 €", pct:45, tope:61.75 },
  { label:"Entre 35.000 € y 59.999 €", pct:45, tope:null  },
  { label:"Entre 60.000 € y 99.999 €", pct:50, tope:null  },
  { label:"100.000 € o más",            pct:60, tope:null  },
];

const tramosPensionista = [
  { label:"Menos de 18.000 €",          pct:10, tope:8.23  },
  { label:"Entre 18.000 € y 59.999 €",  pct:10, tope:13.37 },
  { label:"Entre 60.000 € y 99.999 €",  pct:10, tope:18.52 },
  { label:"100.000 € o más",             pct:60, tope:61.75 },
];

// ── Estado ───────────────────────────────────────

const state = { situacion: null, tramo: null, principio: null, producto: null };

// ── Elementos ────────────────────────────────────

const steps     = [1,2,3,4].map(n => document.getElementById(`step-${n}`));
const dots      = document.querySelectorAll('.step-dot');
const fill      = document.getElementById('progress-fill');
const rentaList = document.getElementById('renta-list');

const inputPA    = document.getElementById('principio-activo');
const suggsList  = document.getElementById('suggestions');
const selFormato = document.getElementById('formato');
const selProd    = document.getElementById('producto');
const grupoFmt   = document.getElementById('grupo-formato');
const grupoProd  = document.getElementById('grupo-producto');
const btnCalc    = document.getElementById('btn-calcular');

// ── Navegación ───────────────────────────────────

function goToStep(n) {
  steps.forEach((s, i) => s.classList.toggle('active', i === n - 1));
  dots.forEach((d, i) => {
    d.classList.remove('active', 'done');
    if (i === n - 1) d.classList.add('active');
    else if (i < n - 1) d.classList.add('done');
  });
  fill.style.width = `${((n - 1) / 3) * 100}%`;
  setTimeout(() => steps[n - 1].scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

// ── Paso 1: Situación ─────────────────────────────

document.querySelectorAll('.choice-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    card.querySelector('input').checked = true;
    state.situacion = card.dataset.value;
    setTimeout(() => { buildRentaList(); goToStep(2); }, 220);
  });
});

// ── Paso 2: Renta ─────────────────────────────────

function buildRentaList() {
  const tramos = state.situacion === 'activo' ? tramosActivo : tramosPensionista;
  rentaList.innerHTML = tramos.map((t, i) =>
    `<div class="renta-item" data-idx="${i}">
      <span class="renta-label">${t.label} al año</span>
      <span class="renta-badge">${t.pct}%</span>
    </div>`
  ).join('');
  rentaList.querySelectorAll('.renta-item').forEach(item => {
    item.addEventListener('click', () => {
      rentaList.querySelectorAll('.renta-item').forEach(r => r.classList.remove('selected'));
      item.classList.add('selected');
      const tramos = state.situacion === 'activo' ? tramosActivo : tramosPensionista;
      state.tramo = tramos[parseInt(item.dataset.idx)];
      setTimeout(() => goToStep(3), 220);
    });
  });
}

// ── Paso 3: Pills de modo ─────────────────────────

const labelBusqueda      = document.getElementById('label-busqueda');
const labelHintMedicamento = document.getElementById('label-hint-medicamento');
const labelHintPrincipio   = document.getElementById('label-hint-principio');

document.querySelectorAll('.mode-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    if (pill.dataset.mode === searchMode) return;
    document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    searchMode = pill.dataset.mode;

    if (searchMode === 'principio') {
      labelBusqueda.firstChild.textContent = 'Principio activo ';
      inputPA.placeholder = 'Escribe el principio activo...';
      labelHintPrincipio.hidden   = false;
      labelHintMedicamento.hidden = true;
    } else {
      labelBusqueda.firstChild.textContent = 'Medicamento ';
      inputPA.placeholder = 'Escribe el nombre del medicamento...';
      labelHintMedicamento.hidden = false;
      labelHintPrincipio.hidden   = true;
    }

    inputPA.value   = '';
    state.principio = null;
    resetSelects();
    hideSugg();
  });
});

// ── Paso 3: Autocomplete ──────────────────────────

inputPA.addEventListener('input', onInput);
inputPA.addEventListener('keydown', onKeydown);

function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

function onInput() {
  const q = normalize(inputPA.value.trim());
  state.principio = null;
  resetSelects();

  if (!q) { hideSugg(); return; }

  const pool    = searchMode === 'principio' ? principios : medicamentoNames;
  const matches = pool
    .filter(p => normalize(p).includes(q))
    .sort((a, b) => {
      const na = normalize(a), nb = normalize(b);
      const scoreA = na === q ? 0 : na.startsWith(q) ? 1 : 2;
      const scoreB = nb === q ? 0 : nb.startsWith(q) ? 1 : 2;
      return scoreA - scoreB || a.localeCompare(b);
    });

  if (!matches.length) {
    suggsList.innerHTML = '<li class="no-results">Sin resultados</li>';
    showSugg();
    return;
  }

  suggsList.innerHTML = matches
    .map((p, i) => `<li tabindex="-1" data-value="${p}" data-idx="${i}">${hlMark(toTitleCase(p), q)}</li>`)
    .join('');
  showSugg();
}

function hlMark(display, query) {
  const idx = normalize(display).indexOf(query);
  if (idx < 0) return display;
  return display.slice(0, idx) +
    `<mark>${display.slice(idx, idx + query.length)}</mark>` +
    display.slice(idx + query.length);
}

function onKeydown(e) {
  if (suggsList.hidden) return;
  const items = suggsList.querySelectorAll('li:not(.no-results)');
  if (e.key === 'ArrowDown') { e.preventDefault(); items[0]?.focus(); }
  else if (e.key === 'Escape') { hideSugg(); }
}

suggsList.addEventListener('keydown', e => {
  const items = [...suggsList.querySelectorAll('li:not(.no-results)')];
  const idx   = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown')    { e.preventDefault(); items[idx + 1]?.focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); idx === 0 ? inputPA.focus() : items[idx - 1]?.focus(); }
  else if (e.key === 'Enter')   { e.preventDefault(); items[idx]?.click(); }
  else if (e.key === 'Escape')  { hideSugg(); inputPA.focus(); }
});

suggsList.addEventListener('click', e => {
  const li = e.target.closest('li:not(.no-results)');
  if (li) selectPA(li.dataset.value);
});

document.addEventListener('click', e => {
  if (!e.target.closest('#grupo-principio')) hideSugg();
});

function showSugg() { suggsList.hidden = false; }
function hideSugg() { suggsList.hidden = true; }

function selectPA(value) {
  state.principio = value;
  inputPA.value   = toTitleCase(value);
  hideSugg();

  const pool = searchMode === 'principio'
    ? medicamentos.filter(m => m.principio === value)
    : medicamentos.filter(m => m.medicamento === value);

  const formatos = [...new Set(pool.map(m => m.formato))];
  selFormato.innerHTML = '<option value="">— Selecciona —</option>' +
    formatos.map(f => `<option value="${f}">${f}</option>`).join('');
  grupoFmt.classList.remove('hidden');
}

// ── Formato ───────────────────────────────────────

selFormato.addEventListener('change', () => {
  const fmt = selFormato.value;
  selProd.innerHTML = '<option value="">— Selecciona —</option>';
  grupoProd.classList.add('hidden');
  btnCalc.classList.add('hidden');
  state.producto = null;
  if (!fmt) return;

  const prods = searchMode === 'principio'
    ? medicamentos.filter(m => m.principio   === state.principio && m.formato === fmt)
    : medicamentos.filter(m => m.medicamento === state.principio && m.formato === fmt);
  selProd.innerHTML = '<option value="">— Selecciona —</option>' +
    prods.map(m => {
      const idx = medicamentos.indexOf(m);
      return `<option value="${idx}">${m.nombre}</option>`;
    }).join('');
  grupoProd.classList.remove('hidden');
});

selProd.addEventListener('change', () => {
  const idx = parseInt(selProd.value);
  if (isNaN(idx)) { btnCalc.classList.add('hidden'); return; }
  state.producto = medicamentos[idx];
  btnCalc.classList.remove('hidden');
});

btnCalc.addEventListener('click', () => { mostrarResultado(); goToStep(4); });

// ── Resultado ─────────────────────────────────────

function mostrarResultado() {
  const { producto, tramo } = state;
  const aportacion = producto.pvp * tramo.pct / 100;
  document.getElementById('res-aportacion').textContent = fmt2(aportacion) + ' €';
  document.getElementById('res-medicamento').textContent = producto.nombre;
  document.getElementById('res-codigo').textContent = producto.codigo || '—';
  document.getElementById('res-pvp').textContent = fmt2(producto.pvp) + ' €';
  document.getElementById('res-pct').textContent = tramo.pct + '%';
  const topeRow = document.getElementById('res-tope-row');
  if (tramo.tope !== null) {
    document.getElementById('res-tope').textContent = fmt2(tramo.tope) + ' €/mes';
    topeRow.style.display = 'flex';
  } else {
    topeRow.style.display = 'none';
  }
}

// ── Volver ────────────────────────────────────────

document.querySelectorAll('.btn-back').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = parseInt(btn.dataset.target);
    if (target === 1) {
      state.situacion = null;
      state.tramo = null;
      document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
      document.querySelectorAll('.choice-card input').forEach(r => r.checked = false);
      rentaList.innerHTML = '';
    }
    if (target === 2) {
      state.tramo = null;
      rentaList.querySelectorAll('.renta-item').forEach(r => r.classList.remove('selected'));
    }
    if (target === 3) {
      state.principio = null;
      state.producto  = null;
      inputPA.value   = '';
      resetSelects();
    }
    goToStep(target);
  });
});

// ── Reiniciar ─────────────────────────────────────

document.getElementById('btn-reiniciar').addEventListener('click', () => {
  state.situacion = null;
  state.tramo     = null;
  state.principio = null;
  state.producto  = null;
  document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.choice-card input').forEach(r => r.checked = false);
  rentaList.innerHTML = '';
  inputPA.value = '';
  resetSelects();
  searchMode = 'medicamento';
  document.querySelectorAll('.mode-pill').forEach(p => p.classList.toggle('active', p.dataset.mode === 'medicamento'));
  labelBusqueda.firstChild.textContent = 'Medicamento ';
  inputPA.placeholder = 'Escribe el nombre del medicamento...';
  labelHintMedicamento.hidden = false;
  labelHintPrincipio.hidden   = true;
  goToStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Helpers ───────────────────────────────────────

function toTitleCase(s) {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function fmt2(n) {
  return n.toFixed(2).replace('.', ',');
}

function resetSelects() {
  selFormato.innerHTML = '<option value="">— Selecciona —</option>';
  selProd.innerHTML    = '<option value="">— Selecciona —</option>';
  grupoFmt.classList.add('hidden');
  grupoProd.classList.add('hidden');
  btnCalc.classList.add('hidden');
  state.producto = null;
}
