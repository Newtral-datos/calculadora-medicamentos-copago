const medicamentos = [
  { principio:"PARACETAMOL", formato:"Comprimidos",             nombre:"Paracetamol 500 mg · 20 comprimidos",              pvp:0.67 },
  { principio:"PARACETAMOL", formato:"Comprimidos",             nombre:"Paracetamol 650 mg · 20 comprimidos",              pvp:0.86 },
  { principio:"PARACETAMOL", formato:"Comprimidos",             nombre:"Paracetamol 650 mg · 40 comprimidos",              pvp:1.31 },
  { principio:"PARACETAMOL", formato:"Comprimidos",             nombre:"Paracetamol 1000 mg · 20 comprimidos",             pvp:1.90 },
  { principio:"PARACETAMOL", formato:"Comprimidos",             nombre:"Paracetamol 1000 mg · 40 comprimidos",             pvp:2.50 },
  { principio:"PARACETAMOL", formato:"Comprimidos efervescentes",nombre:"Paracetamol 1000 mg · 20 comp. efervescentes",   pvp:2.50 },
  { principio:"PARACETAMOL", formato:"Sobres",                  nombre:"Paracetamol 1000 mg · 20 sobres efervescentes",   pvp:1.90 },
  { principio:"PARACETAMOL", formato:"Sobres",                  nombre:"Paracetamol 1000 mg · 40 sobres efervescentes",   pvp:2.50 },
  { principio:"PARACETAMOL", formato:"Suspensión oral",         nombre:"Paracetamol 100 mg/ml · 30 ml",                   pvp:1.75 },
  { principio:"PARACETAMOL", formato:"Suspensión oral",         nombre:"Paracetamol 100 mg/ml · 60 ml",                   pvp:3.12 },
  { principio:"IBUPROFENO",  formato:"Comprimidos",             nombre:"Ibuprofeno 400 mg · 30 comprimidos",              pvp:2.06 },
  { principio:"IBUPROFENO",  formato:"Comprimidos",             nombre:"Ibuprofeno 600 mg · 40 comprimidos",              pvp:1.97 },
  { principio:"IBUPROFENO",  formato:"Sobres",                  nombre:"Ibuprofeno 200 mg · 20 sobres efervescentes",     pvp:2.50 },
  { principio:"IBUPROFENO",  formato:"Sobres",                  nombre:"Ibuprofeno 600 mg · 20 sobres efervescentes",     pvp:2.50 },
  { principio:"IBUPROFENO",  formato:"Suspensión oral",         nombre:"Ibuprofeno 20 mg/ml · 200 ml",                    pvp:2.50 },
  { principio:"IBUPROFENO",  formato:"Suspensión oral",         nombre:"Ibuprofeno 40 mg/ml · 150 ml",                    pvp:3.75 },
  { principio:"IBUPROFENO",  formato:"Suspensión oral",         nombre:"Ibuprofeno 40 mg/ml · 200 ml",                    pvp:5.00 },
];

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

// Estado
const state = { situacion: null, tramo: null, producto: null };

// Elementos
const steps     = [1,2,3,4].map(n => document.getElementById(`step-${n}`));
const dots      = document.querySelectorAll('.step-dot');
const fill      = document.getElementById('progress-fill');
const rentaList = document.getElementById('renta-list');

const selPA      = document.getElementById('principio-activo');
const selFormato = document.getElementById('formato');
const selProd    = document.getElementById('producto');
const grupoFmt   = document.getElementById('grupo-formato');
const grupoProd  = document.getElementById('grupo-producto');
const btnCalc    = document.getElementById('btn-calcular');

// ── Navegación de pasos ─────────────────────────

function goToStep(n) {
  steps.forEach((s, i) => {
    s.classList.toggle('active', i === n - 1);
  });
  dots.forEach((d, i) => {
    d.classList.remove('active', 'done');
    if (i === n - 1) d.classList.add('active');
    else if (i < n - 1) d.classList.add('done');
  });
  // Barra de progreso: 0% en paso 1, 100% en paso 4
  fill.style.width = `${((n - 1) / 3) * 100}%`;

  setTimeout(() => {
    steps[n-1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

// ── Paso 1: Situación ───────────────────────────

document.querySelectorAll('.choice-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.situacion = card.dataset.value;
    card.querySelector('input').checked = true;

    setTimeout(() => {
      buildRentaList();
      goToStep(2);
    }, 220);
  });
});

// ── Paso 2: Renta ───────────────────────────────

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

// ── Paso 3: Medicamento ─────────────────────────

selPA.addEventListener('change', () => {
  const pa = selPA.value;
  resetSelects();
  if (!pa) return;

  const formatos = [...new Set(medicamentos.filter(m => m.principio === pa).map(m => m.formato))];
  selFormato.innerHTML = '<option value="">— Selecciona —</option>' +
    formatos.map(f => `<option value="${f}">${f}</option>`).join('');
  grupoFmt.classList.remove('hidden');
});

selFormato.addEventListener('change', () => {
  const pa  = selPA.value;
  const fmt = selFormato.value;

  selProd.innerHTML = '<option value="">— Selecciona —</option>';
  grupoProd.classList.add('hidden');
  btnCalc.classList.add('hidden');
  state.producto = null;

  if (!fmt) return;

  const prods = medicamentos.filter(m => m.principio === pa && m.formato === fmt);
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

btnCalc.addEventListener('click', () => {
  mostrarResultado();
  goToStep(4);
});

// ── Resultado ───────────────────────────────────

function mostrarResultado() {
  const { producto, tramo } = state;
  const aportacion = producto.pvp * tramo.pct / 100;

  document.getElementById('res-aportacion').textContent = fmt2(aportacion) + ' €';
  document.getElementById('res-medicamento').textContent = producto.nombre;
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

// ── Volver atrás ────────────────────────────────

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
      state.producto = null;
      selPA.value = '';
      resetSelects();
    }
    goToStep(target);
  });
});

// ── Reiniciar ───────────────────────────────────

document.getElementById('btn-reiniciar').addEventListener('click', () => {
  state.situacion = null;
  state.tramo     = null;
  state.producto  = null;

  document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.choice-card input').forEach(r => r.checked = false);
  rentaList.innerHTML = '';
  selPA.value = '';
  resetSelects();

  goToStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Helpers ─────────────────────────────────────

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
