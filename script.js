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

const state = { situacion: null, tramo: null, producto: null, principio: null };

// ── Elementos ────────────────────────────────────

const steps     = [1,2,3,4].map(n => document.getElementById(`step-${n}`));
const dots      = document.querySelectorAll('.step-dot');
const fill      = document.getElementById('progress-fill');
const rentaList = document.getElementById('renta-list');

const inputPA    = document.getElementById('principio-activo');
const suggsList  = document.getElementById('suggestions');
const btnCalc    = document.getElementById('btn-calcular');

const labelBusqueda        = document.getElementById('label-busqueda');
const labelHintMedicamento = document.getElementById('label-hint-medicamento');
const labelHintPrincipio   = document.getElementById('label-hint-principio');

const grupoFormato      = document.getElementById('grupo-formato');
const grupoPresent      = document.getElementById('grupo-presentacion');
const selFormato        = document.getElementById('sel-formato');
const selPresentacion   = document.getElementById('sel-presentacion');

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

    inputPA.value  = '';
    state.producto = null;
    state.principio = null;
    grupoFormato.classList.add('hidden');
    grupoPresent.classList.add('hidden');
    btnCalc.classList.add('hidden');
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
  state.producto = null;
  btnCalc.classList.add('hidden');

  if (searchMode === 'principio') {
    state.principio = null;
    grupoFormato.classList.add('hidden');
    grupoPresent.classList.add('hidden');
  }

  if (!q) { hideSugg(); return; }

  if (searchMode === 'principio') {
    const seen = new Set();
    const principios = [];
    for (const m of medicamentos) {
      if (!m.principio) continue;
      const np = normalize(m.principio);
      if (np.includes(q) && !seen.has(m.principio)) {
        seen.add(m.principio);
        principios.push(m.principio);
      }
    }
    principios.sort((a, b) => {
      const na = normalize(a), nb = normalize(b);
      const sa = na === q ? 0 : na.startsWith(q) ? 1 : 2;
      const sb = nb === q ? 0 : nb.startsWith(q) ? 1 : 2;
      return sa - sb || a.localeCompare(b);
    });

    if (!principios.length) {
      suggsList.innerHTML = '<li class="no-results">Sin resultados</li>';
      showSugg();
      return;
    }

    suggsList.innerHTML = principios
      .map(p => `<li tabindex="-1" data-principio="${p.replace(/"/g, '&quot;')}">${hlMark(p, q)}</li>`)
      .join('');
    showSugg();

  } else {
    const matches = medicamentos
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.medicamento && normalize(m.medicamento).includes(q))
      .sort((a, b) => {
        const fa = normalize(a.m.medicamento);
        const fb = normalize(b.m.medicamento);
        const sa = fa === q ? 0 : fa.startsWith(q) ? 1 : 2;
        const sb = fb === q ? 0 : fb.startsWith(q) ? 1 : 2;
        return sa - sb || a.m.nombre.localeCompare(b.m.nombre);
      });

    if (!matches.length) {
      suggsList.innerHTML = '<li class="no-results">Sin resultados</li>';
      showSugg();
      return;
    }

    suggsList.innerHTML = matches
      .map(({ m, i }) => `<li tabindex="-1" data-idx="${i}">${hlMark(toTitleCase(m.nombre), q)}</li>`)
      .join('');
    showSugg();
  }
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
  if (!li) return;

  if (searchMode === 'principio') {
    const principio = li.dataset.principio;
    state.principio = principio;
    inputPA.value   = principio;
    hideSugg();
    populateFormatos(principio);
    grupoFormato.classList.remove('hidden');
    grupoPresent.classList.add('hidden');
    selFormato.value = '';
    selPresentacion.innerHTML = '<option value="">Selecciona la presentación...</option>';
    btnCalc.classList.add('hidden');
  } else {
    const m = medicamentos[parseInt(li.dataset.idx)];
    state.producto = m;
    inputPA.value  = toTitleCase(m.nombre);
    hideSugg();
    btnCalc.classList.remove('hidden');
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('#grupo-principio')) hideSugg();
});

function showSugg() { suggsList.hidden = false; }
function hideSugg() { suggsList.hidden = true; }

// ── Paso 3: Formato y Presentación (modo principio) ──

function populateFormatos(principio) {
  const formatos = [...new Set(
    medicamentos
      .filter(m => m.principio === principio)
      .map(m => m.formato)
      .filter(Boolean)
  )].sort();
  selFormato.innerHTML = '<option value="">Selecciona el formato...</option>' +
    formatos.map(f => `<option value="${f}">${f}</option>`).join('');
}

function populatePresentaciones(principio, formato) {
  const productos = medicamentos
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.principio === principio && m.formato === formato)
    .sort((a, b) => a.m.nombre.localeCompare(b.m.nombre));
  selPresentacion.innerHTML = '<option value="">Selecciona la presentación...</option>' +
    productos.map(({ m, i }) => `<option value="${i}">${toTitleCase(m.nombre)}</option>`).join('');
}

selFormato.addEventListener('change', () => {
  const formato = selFormato.value;
  state.producto = null;
  btnCalc.classList.add('hidden');
  if (!formato) {
    grupoPresent.classList.add('hidden');
    return;
  }
  populatePresentaciones(state.principio, formato);
  grupoPresent.classList.remove('hidden');
  selPresentacion.value = '';
});

selPresentacion.addEventListener('change', () => {
  const idx = selPresentacion.value;
  if (!idx) {
    state.producto = null;
    btnCalc.classList.add('hidden');
    return;
  }
  state.producto = medicamentos[parseInt(idx)];
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
      state.producto  = null;
      state.principio = null;
      inputPA.value   = '';
      btnCalc.classList.add('hidden');
      grupoFormato.classList.add('hidden');
      grupoPresent.classList.add('hidden');
      hideSugg();
    }
    goToStep(target);
  });
});

// ── Reiniciar ─────────────────────────────────────

document.getElementById('btn-reiniciar').addEventListener('click', () => {
  state.situacion  = null;
  state.tramo      = null;
  state.producto   = null;
  state.principio  = null;
  document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.choice-card input').forEach(r => r.checked = false);
  rentaList.innerHTML = '';
  inputPA.value = '';
  btnCalc.classList.add('hidden');
  grupoFormato.classList.add('hidden');
  grupoPresent.classList.add('hidden');
  hideSugg();
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
