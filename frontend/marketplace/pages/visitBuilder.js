// Visit builder: composizione delle tappe a due colonne.
import { visits, artworks, items, museumContext } from '../api.js';
import { toast } from '../components/toast.js';
import { buildForm } from '../components/modal.js';
import {
  pageHeader,
  primaryButton,
  statusBadge,
  searchInput,
  filterSelect,
  spinnerBlock,
  iconButton,
  escapeHtml,
  icons,
} from '../components/ui.js';
import { chooseItemWithPreview } from '../components/itemPreview.js';
import {
  VISIT_STATUS,
  LANGUAGE_REGISTER,
  STEP_TYPE_LABELS,
  REGISTER_LABELS,
  REGISTER_ORDER,
  clientId,
} from '../constants.js';

let visit = null;
let steps = [];
let itemsById = {};
let artList = [];
let itemList = [];
let infoForm = null;
let els = {};

// Filtri di ricerca del catalogo (colonna sinistra), tutti client-side sui
// dati già caricati in init.
const catalogFilters = { search: '', register: '', category: '', style: '' };

// Tipo assegnato alle nuove tappe create cliccando un item dal catalogo.
// È l'unico punto in cui si sceglie tra tappa principale e opzionale: dopo
// la creazione il tipo dello step non è più modificabile.
let newItemStepType = 'main_item';

// Step logistici generati automaticamente alla creazione della visita
// (apertura/chiusura): riconoscibili dal prefisso dell'id, non eliminabili.
function isProtectedStep(step) {
  return /^step-(intro|outro)-/.test(step.id || '');
}

export async function init({ params }) {
  const headerEl = document.getElementById('builder-header');
  const infoEl = document.getElementById('builder-info');
  const catalogToolsEl = document.getElementById('builder-catalog-tools');
  const catalogEl = document.getElementById('builder-catalog');
  const stepsEl = document.getElementById('builder-steps');
  const toolsEl = document.getElementById('builder-step-tools');
  els = { headerEl, infoEl, catalogToolsEl, catalogEl, stepsEl, toolsEl };

  Object.assign(catalogFilters, { search: '', register: '', category: '', style: '' });
  newItemStepType = 'main_item';

  headerEl.appendChild(spinnerBlock('Caricamento visita…'));
  catalogEl.appendChild(spinnerBlock());

  try {
    const [v, artRes, itemRes] = await Promise.all([
      visits.get(params.id),
      artworks.list({ museumId: museumContext.id, pageSize: 200, sortBy: 'title', sortOrder: 'asc' }),
      items.list({ museumId: museumContext.id, pageSize: 200 }),
    ]);
    visit = v;
    steps = (v.steps || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    artList = artRes.data || [];
    itemList = itemRes.data || [];
    itemsById = Object.fromEntries(itemList.map((it) => [it.id, it]));

    renderHeader(headerEl);
    renderInfo(infoEl);
    renderCatalogTools(catalogToolsEl);
    renderTools(toolsEl);
    rerenderAll();
  } catch (err) {
    headerEl.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(err.message)}</p>`;
    catalogEl.innerHTML = '';
  }
}

// Catalogo e sequenza vanno sempre ridisegnati insieme: lo stato "già in
// visita" delle card del catalogo dipende dagli step correnti.
function rerenderAll() {
  renderCatalog(els.catalogEl);
  renderSteps(els.stepsEl);
}

// Inserisce un nuovo step prima dello step di chiusura protetto, se presente
// in coda, così la sequenza resta racchiusa tra apertura e chiusura.
function addStep(step) {
  const last = steps[steps.length - 1];
  if (last && isProtectedStep(last)) {
    steps.splice(steps.length - 1, 0, step);
  } else {
    steps.push(step);
  }
}

function renderHeader(headerEl) {
  headerEl.innerHTML = '';
  const saveBtn = primaryButton('Salva visita', save, {
    icon: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
  });
  headerEl.appendChild(
    pageHeader({
      title: visit.title,
      subtitle: `${visit.estimatedDurationMinutes || 0} min · ${steps.length} tappe`,
      actions: [statusBadgeNode(visit.status), saveBtn],
    })
  );
}

function statusBadgeNode(status) {
  const span = document.createElement('span');
  span.innerHTML = statusBadge(status);
  return span.firstChild;
}

// --- Informazioni generali (sopra le due colonne) ----------------------------

// Espone tutti i metadati del modello Visit modificabili dall'autore, non solo
// quelli del modale rapido della lista visite. Museo e tappe restano fuori dal
// form: il museo è il contesto corrente (le visite non si spostano tra musei),
// le tappe si compongono sotto.
function renderInfo(infoEl) {
  infoEl.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'rounded-2xl border border-stone-200 bg-white shadow-sm';
  card.innerHTML = `
    <div class="border-b border-stone-100 px-5 py-3">
      <h3 class="text-sm font-semibold text-mute-600">Informazioni generali della visita</h3>
      <p class="text-xs text-mute-400">I metadati mostrati ai visitatori: si salvano insieme alle tappe con “Salva visita”.</p>
    </div>`;
  infoForm = buildForm([
    { name: 'title', label: 'Titolo', required: true, value: visit.title, colSpan: 1 },
    { name: 'subtitle', label: 'Sottotitolo', value: visit.subtitle, colSpan: 1 },
    {
      name: 'museum',
      label: 'Museo',
      value: museumContext.get()?.name || visit.museumId,
      colSpan: 1,
      help: 'La visita appartiene al museo selezionato e non può essere spostata.',
    },
    { name: 'status', label: 'Stato', type: 'select', required: true, options: VISIT_STATUS, value: visit.status || 'draft', colSpan: 1 },
    { name: 'targetAudience', label: 'Pubblico target', value: visit.targetAudience, placeholder: 'es. famiglie, esperti…', colSpan: 1 },
    { name: 'estimatedDurationMinutes', label: 'Durata stimata (min)', type: 'number', required: true, min: 0, value: visit.estimatedDurationMinutes, colSpan: 1 },
    {
      name: 'slug',
      label: 'Slug',
      value: visit.slug,
      placeholder: 'es. capolavori-in-un-ora',
      colSpan: 1,
      help: 'Identificativo leggibile della visita (facoltativo).',
    },
    { name: 'coverImage', label: 'Immagine di copertina (URL)', value: visit.coverImage, placeholder: 'https://…', colSpan: 1 },
    { name: 'description', label: 'Descrizione', type: 'richtext', rows: 3, value: visit.description },
  ]);
  // Il museo è il contesto corrente, non un valore del form: disabled (non
  // focusabile né selezionabile), non solo readonly. Niente cursore di
  // divieto: è un'informazione di contesto, non un'azione negata.
  infoForm.setDisabled('museum', true);
  infoForm.node.querySelector('input:disabled')?.classList.remove('cursor-not-allowed');
  const body = document.createElement('div');
  body.className = 'p-5';
  body.appendChild(infoForm.node);
  card.appendChild(body);
  infoEl.appendChild(card);
}

// --- Strumenti sequenza (destra) ---------------------------------------------

function renderTools(toolsEl) {
  toolsEl.innerHTML = '';
  const addLogistics = smallBtn('+ Logistica', () => {
    addStep(newStep('logistics_intro', 'Introduzione'));
    rerenderAll();
  });
  const addTransition = smallBtn('+ Transizione', () => {
    addStep(newStep('transition', 'Spostamento'));
    rerenderAll();
  });
  toolsEl.append(addLogistics, addTransition);
}

function smallBtn(label, onClick) {
  const b = document.createElement('button');
  b.className =
    'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-mute-600 transition hover:bg-stone-100';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function newStep(type, title, itemsByRegister) {
  return { id: clientId('step'), type, title, itemsByRegister, directionsFromPrevious: '', description: '' };
}

function isItemStep(step) {
  return step.type === 'main_item' || step.type === 'optional_item';
}

// Id di tutti gli item già assegnati a uno slot di uno step (qualunque registro).
function assignedItemIds() {
  return new Set(steps.flatMap((s) => Object.values(s.itemsByRegister || {})));
}

// Step-tappa già in sequenza per un'opera: uno step item i cui slot puntano a
// item di quell'opera (concettualmente uno step = una tappa/opera).
function findStepForArtwork(artworkId) {
  return steps.find(
    (s) =>
      isItemStep(s) &&
      Object.values(s.itemsByRegister || {}).some((id) => itemsById[id] && itemsById[id].artworkId === artworkId)
  );
}

// Assegna un item allo slot del suo registro: riusa lo step esistente
// dell'opera oppure ne crea uno nuovo (col tipo scelto nel toggle del
// catalogo); con più candidati per la coppia (opera, registro) fa scegliere
// dalla preview.
async function assignItem(artwork, item) {
  const register = item.classification && item.classification.languageRegister;
  if (!register) {
    toast.error('Questo item non ha un registro linguistico.');
    return;
  }
  const candidates = itemList.filter(
    (it) => it.artworkId === artwork.id && it.classification && it.classification.languageRegister === register
  );
  let chosen = item;
  if (candidates.length > 1) {
    const picked = await chooseItemWithPreview({
      candidates,
      initialId: item.id,
      title: `${artwork.title} — registro ${REGISTER_LABELS[register] || register}`,
      subtitle: 'Più contenuti coprono questo registro: confrontali e scegli quale assegnare alla tappa.',
    });
    if (!picked) return;
    chosen = picked;
  }
  const existing = findStepForArtwork(artwork.id);
  if (existing) {
    existing.itemsByRegister = { ...(existing.itemsByRegister || {}), [register]: chosen.id };
    toast.success(`Registro "${REGISTER_LABELS[register] || register}" assegnato alla tappa esistente.`);
  } else {
    addStep(newStep(newItemStepType, artwork.title, { [register]: chosen.id }));
    toast.success('Tappa aggiunta.');
  }
  rerenderAll();
}

// --- Catalogo (sinistra) ----------------------------------------------------

function distinctValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it'));
}

// Ricerca avanzata del catalogo: testo libero + filtri sui metadati già
// visibili nelle card (registro dell'item, categoria/stile dell'opera).
function renderCatalogTools(toolsEl) {
  toolsEl.innerHTML = '';

  const search = searchInput('Cerca opera, artista, item, tag…', (v) => {
    catalogFilters.search = v;
    renderCatalog(els.catalogEl);
  });
  search.input.classList.remove('w-64');
  search.input.classList.add('w-full');
  toolsEl.appendChild(search.node);

  const selRow = document.createElement('div');
  selRow.className = 'grid grid-cols-2 gap-2';
  const addFilter = (allLabel, options, key) => {
    const f = filterSelect(allLabel, options, (v) => {
      catalogFilters[key] = v;
      renderCatalog(els.catalogEl);
    });
    f.select.classList.add('w-full');
    selRow.appendChild(f.node);
  };
  addFilter('Tutti i registri', LANGUAGE_REGISTER, 'register');
  addFilter(
    'Tutte le categorie',
    distinctValues(artList.map((a) => a.category)).map((v) => ({ value: v, label: v })),
    'category'
  );
  addFilter(
    'Tutti gli stili',
    distinctValues(artList.map((a) => a.style)).map((v) => ({ value: v, label: v })),
    'style'
  );
  toolsEl.appendChild(selRow);

  // Toggle principale/opzionale: decide il tipo delle nuove tappe create dal
  // catalogo, unico punto in cui il tipo di una tappa-item viene stabilito.
  const segWrap = document.createElement('div');
  segWrap.className = 'flex items-center justify-between gap-2 pt-1';
  segWrap.title = 'Il tipo si sceglie qui, alla creazione della tappa: dopo non è più modificabile.';
  const segLabel = document.createElement('span');
  segLabel.className = 'text-xs text-mute-400';
  segLabel.textContent = 'Aggiungi come:';
  const seg = document.createElement('div');
  seg.className = 'inline-flex rounded-lg border border-stone-300 bg-white p-0.5';
  const segBtns = [];
  const mkSegBtn = (value, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.value = value;
    b.textContent = label;
    b.addEventListener('click', () => {
      newItemStepType = value;
      syncSeg();
    });
    seg.appendChild(b);
    segBtns.push(b);
  };
  const syncSeg = () => {
    for (const b of segBtns) {
      const active = b.dataset.value === newItemStepType;
      b.className =
        'rounded-md px-2.5 py-1 text-xs font-medium transition ' +
        (active ? 'bg-brand text-white' : 'text-mute-600 hover:bg-stone-100');
    }
  };
  mkSegBtn('main_item', 'Tappa principale');
  mkSegBtn('optional_item', 'Tappa opzionale');
  syncSeg();
  segWrap.append(segLabel, seg);
  toolsEl.appendChild(segWrap);
}

// Applica i filtri correnti: ritorna coppie [opera, item visibili]. Se il
// testo cerca l'opera (titolo/artista/categoria/stile/tag) restano visibili
// tutti i suoi item; altrimenti restano solo gli item il cui titolo combacia.
function filteredCatalog(byArtwork) {
  const q = catalogFilters.search.trim().toLowerCase();
  const groups = [];
  for (const a of artList) {
    let its = byArtwork[a.id] || [];
    if (!its.length) continue;
    if (catalogFilters.category && (a.category || '') !== catalogFilters.category) continue;
    if (catalogFilters.style && (a.style || '') !== catalogFilters.style) continue;
    if (catalogFilters.register) {
      its = its.filter((it) => it.classification && it.classification.languageRegister === catalogFilters.register);
    }
    if (q) {
      const artworkMatch = [a.title, a.artist, a.category, a.style, ...(a.tags || [])].some(
        (v) => v && String(v).toLowerCase().includes(q)
      );
      if (!artworkMatch) {
        its = its.filter((it) => ((it.content && it.content.title) || '').toLowerCase().includes(q));
      }
    }
    if (its.length) groups.push([a, its]);
  }
  return groups;
}

function renderCatalog(catalogEl) {
  catalogEl.innerHTML = '';
  const byArtwork = {};
  for (const it of itemList) {
    (byArtwork[it.artworkId] = byArtwork[it.artworkId] || []).push(it);
  }

  if (!artList.some((a) => (byArtwork[a.id] || []).length)) {
    catalogEl.innerHTML =
      '<p class="px-2 py-8 text-center text-sm text-mute-400">Nessun item disponibile in questo museo. Crea prima opere e item dalla sezione Contenuti.</p>';
    return;
  }

  const groups = filteredCatalog(byArtwork);
  if (!groups.length) {
    catalogEl.innerHTML =
      '<p class="px-2 py-8 text-center text-sm text-mute-400">Nessun risultato per la ricerca o i filtri correnti.</p>';
    return;
  }

  const usedItemIds = assignedItemIds();

  for (const [a, its] of groups) {
    const group = document.createElement('div');
    group.className = 'mb-3';
    group.innerHTML = `<p class="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-mute-400">${escapeHtml(a.title)}</p>`;
    for (const it of its) {
      const used = usedItemIds.has(it.id);
      const btn = document.createElement('button');
      btn.className = used
        ? 'mb-1 flex w-full cursor-default items-center justify-between gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-left text-sm opacity-60'
        : 'mb-1 flex w-full items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 text-left text-sm transition hover:border-brand hover:bg-brand-light';
      btn.disabled = used;
      const title = (it.content && it.content.title) || a.title;
      btn.innerHTML = `
        <span class="min-w-0">
          <span class="block truncate font-medium text-mute-600">${escapeHtml(title)}</span>
          <span class="block text-xs text-mute-400">${escapeHtml(REGISTER_LABELS[it.classification?.languageRegister] || '')}</span>
        </span>
        <span class="shrink-0 ${used ? 'text-mute-400' : 'text-brand'}">${used ? icons.check : icons.arrowRight}</span>`;
      if (!used) {
        btn.addEventListener('click', () => assignItem(a, it));
      }
      group.appendChild(btn);
    }
    catalogEl.appendChild(group);
  }
}

// --- Steps (destra) ---------------------------------------------------------

function renderSteps(stepsEl) {
  stepsEl.innerHTML = '';
  if (!steps.length) {
    stepsEl.innerHTML =
      '<div class="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center text-sm text-mute-400">Nessuna tappa. Aggiungi item dal catalogo a sinistra o usa i pulsanti sopra per tappe logistiche.</div>';
    return;
  }

  steps.forEach((step, idx) => {
    const protectedStep = isProtectedStep(step);
    const card = document.createElement('div');
    card.className = 'rounded-xl border border-stone-200 bg-white p-4 shadow-sm';

    const top = document.createElement('div');
    top.className = 'flex items-start gap-3';

    // Numero + frecce (gli step protetti restano ancorati a inizio/fine)
    const ctrl = document.createElement('div');
    ctrl.className = 'flex flex-col items-center gap-1';
    ctrl.innerHTML = `<span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">${idx + 1}</span>`;
    const up = iconButton(icons.arrowUp, () => move(idx, -1, stepsEl), { title: 'Sposta su' });
    const down = iconButton(icons.arrowDown, () => move(idx, 1, stepsEl), { title: 'Sposta giù' });
    up.disabled = protectedStep || idx === 0;
    down.disabled = protectedStep || idx === steps.length - 1;
    up.classList.add('disabled:opacity-30');
    down.classList.add('disabled:opacity-30');
    ctrl.append(up, down);
    top.appendChild(ctrl);

    // Corpo
    const body = document.createElement('div');
    body.className = 'min-w-0 flex-1 space-y-2';

    const rowTop = document.createElement('div');
    rowTop.className = 'flex flex-wrap items-center gap-2';

    // Il tipo è deciso alla creazione dello step (dal catalogo o dai pulsanti
    // logistica/transizione) e da lì in poi è un'etichetta fissa.
    const typeBadge = document.createElement('span');
    typeBadge.className =
      'rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-1.5 text-xs font-medium text-mute-600';
    typeBadge.textContent = STEP_TYPE_LABELS[step.type] || step.type;
    typeBadge.title = 'Il tipo di tappa si definisce alla creazione e non è modificabile.';
    rowTop.appendChild(typeBadge);

    if (protectedStep) {
      const lock = document.createElement('span');
      lock.className = 'rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700';
      lock.textContent = step.id.startsWith('step-intro') ? 'Apertura — non eliminabile' : 'Chiusura — non eliminabile';
      rowTop.appendChild(lock);
    }

    body.appendChild(rowTop);

    // Riepilogo registri della tappa: chip pieno = coperto (tooltip col titolo
    // dell'item, X per liberare lo slot), chip tratteggiato = mancante.
    if (isItemStep(step)) {
      const regRow = document.createElement('div');
      regRow.className = 'flex flex-wrap gap-1.5';
      for (const reg of REGISTER_ORDER) {
        const itemId = (step.itemsByRegister || {})[reg];
        if (itemId) {
          const it = itemsById[itemId];
          const chip = document.createElement('span');
          chip.className =
            'inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark';
          chip.title = `Item: ${(it && it.content && it.content.title) || itemId}`;
          const label = document.createElement('span');
          label.textContent = REGISTER_LABELS[reg] || reg;
          const rm = document.createElement('button');
          rm.type = 'button';
          rm.className = 'text-brand-dark/60 transition hover:text-brand-dark';
          rm.title = 'Libera questo registro';
          rm.innerHTML =
            '<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
          rm.addEventListener('click', () => {
            delete step.itemsByRegister[reg];
            rerenderAll();
          });
          chip.append(label, rm);
          regRow.appendChild(chip);
        } else {
          const chip = document.createElement('span');
          chip.className = 'rounded-full border border-dashed border-stone-300 px-2.5 py-1 text-xs text-mute-400';
          chip.textContent = REGISTER_LABELS[reg] || reg;
          chip.title = 'Registro non coperto: clicca un item di questo registro nel catalogo';
          regRow.appendChild(chip);
        }
      }
      body.appendChild(regRow);
    }

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = step.title || '';
    titleInput.placeholder = 'Titolo della tappa';
    titleInput.className =
      'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
    titleInput.addEventListener('input', (e) => (step.title = e.target.value));
    body.appendChild(titleInput);

    const desc = document.createElement('textarea');
    desc.rows = 2;
    desc.value = step.description || '';
    desc.placeholder = 'Testo/descrizione della tappa…';
    desc.className =
      'w-full resize-y rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
    desc.addEventListener('input', (e) => (step.description = e.target.value));
    body.appendChild(desc);

    const dir = document.createElement('textarea');
    dir.rows = 2;
    dir.value = step.directionsFromPrevious || '';
    dir.placeholder = 'Indicazioni dalla tappa precedente (es. “gira a destra, sala 3”)…';
    dir.className =
      'w-full resize-y rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
    dir.addEventListener('input', (e) => (step.directionsFromPrevious = e.target.value));
    body.appendChild(dir);

    top.appendChild(body);

    // Rimuovi (con la X): non disponibile per gli step protetti
    if (!protectedStep) {
      const remove = iconButton(icons.x, () => {
        steps.splice(idx, 1);
        rerenderAll();
      }, { title: 'Rimuovi tappa', danger: true });
      top.appendChild(remove);
    }

    card.appendChild(top);
    stepsEl.appendChild(card);
  });
}

function move(idx, delta, stepsEl) {
  const target = idx + delta;
  if (target < 0 || target >= steps.length) return;
  // Gli step protetti (apertura/chiusura) non si spostano né vengono scavalcati.
  if (isProtectedStep(steps[idx]) || isProtectedStep(steps[target])) return;
  [steps[idx], steps[target]] = [steps[target], steps[idx]];
  renderSteps(stepsEl);
}

async function save() {
  // Valida i metadati della sezione informazioni generali.
  const info = infoForm.getValues();
  infoForm.setFieldError('title', '');
  infoForm.setFieldError('estimatedDurationMinutes', '');
  if (!info.title) {
    infoForm.setFieldError('title', 'Campo obbligatorio');
    toast.error('Inserisci il titolo della visita.');
    return;
  }
  if (info.estimatedDurationMinutes == null) {
    infoForm.setFieldError('estimatedDurationMinutes', 'Campo obbligatorio');
    toast.error('Inserisci la durata stimata.');
    return;
  }

  // Reindicizza order e valida i titoli.
  const payloadSteps = steps.map((s, i) => ({
    id: s.id || clientId('step'),
    type: s.type,
    title: (s.title && s.title.trim()) || STEP_TYPE_LABELS[s.type] || 'Tappa',
    description: s.description || undefined,
    directionsFromPrevious: s.directionsFromPrevious || undefined,
    itemsByRegister:
      s.itemsByRegister && Object.keys(s.itemsByRegister).length ? s.itemsByRegister : undefined,
    order: i + 1,
  }));
  const payload = {
    title: info.title,
    subtitle: info.subtitle || undefined,
    slug: info.slug || undefined,
    description: info.description || undefined,
    targetAudience: info.targetAudience || undefined,
    coverImage: info.coverImage || undefined,
    estimatedDurationMinutes: info.estimatedDurationMinutes,
    status: info.status,
    steps: payloadSteps,
  };
  try {
    await visits.update(visit.id, payload);
    Object.assign(visit, payload);
    renderHeader(els.headerEl);
    rerenderAll();
    toast.success('Visita salvata.');
  } catch (err) {
    toast.error(err);
  }
}
