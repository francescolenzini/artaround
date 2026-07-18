// Visit builder: composizione delle tappe a due colonne.
import { visits, artworks, items, museumContext } from '../api.js';
import { toast } from '../components/toast.js';
import {
  pageHeader,
  primaryButton,
  statusBadge,
  spinnerBlock,
  iconButton,
  escapeHtml,
  icons,
} from '../components/ui.js';
import { STEP_TYPE, STEP_TYPE_LABELS, REGISTER_LABELS, clientId } from '../constants.js';

let visit = null;
let steps = [];
let itemsById = {};

export async function init({ params }) {
  const headerEl = document.getElementById('builder-header');
  const catalogEl = document.getElementById('builder-catalog');
  const stepsEl = document.getElementById('builder-steps');
  const toolsEl = document.getElementById('builder-step-tools');

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
    const artList = artRes.data || [];
    const itemList = itemRes.data || [];
    itemsById = Object.fromEntries(itemList.map((it) => [it.id, it]));

    renderHeader(headerEl);
    renderTools(toolsEl, () => renderSteps(stepsEl));
    renderCatalog(catalogEl, artList, itemList, () => renderSteps(stepsEl));
    renderSteps(stepsEl);
  } catch (err) {
    headerEl.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(err.message)}</p>`;
    catalogEl.innerHTML = '';
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
      subtitle: `${visit.estimatedDurationMinutes || 0} min · ${(visit.steps || []).length} tappe iniziali`,
      actions: [statusBadgeNode(visit.status), saveBtn],
    })
  );
}

function statusBadgeNode(status) {
  const span = document.createElement('span');
  span.innerHTML = statusBadge(status);
  return span.firstChild;
}

function renderTools(toolsEl, rerender) {
  toolsEl.innerHTML = '';
  const addLogistics = smallBtn('+ Logistica', () => {
    steps.push(newStep('logistics_intro', 'Introduzione'));
    rerender();
  });
  const addTransition = smallBtn('+ Transizione', () => {
    steps.push(newStep('transition', 'Spostamento'));
    rerender();
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

function newStep(type, title, itemId) {
  return { id: clientId('step'), type, title, itemId, directionsFromPrevious: '', description: '' };
}

// --- Catalogo (sinistra) ----------------------------------------------------

function renderCatalog(catalogEl, artList, itemList, rerender) {
  catalogEl.innerHTML = '';
  const byArtwork = {};
  for (const it of itemList) {
    (byArtwork[it.artworkId] = byArtwork[it.artworkId] || []).push(it);
  }

  const withItems = artList.filter((a) => (byArtwork[a.id] || []).length);
  if (!withItems.length) {
    catalogEl.innerHTML =
      '<p class="px-2 py-8 text-center text-sm text-mute-400">Nessun item disponibile in questo museo. Crea prima opere e item dalla sezione Contenuti.</p>';
    return;
  }

  for (const a of withItems) {
    const group = document.createElement('div');
    group.className = 'mb-3';
    group.innerHTML = `<p class="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-mute-400">${escapeHtml(a.title)}</p>`;
    for (const it of byArtwork[a.id]) {
      const btn = document.createElement('button');
      btn.className =
        'mb-1 flex w-full items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 text-left text-sm transition hover:border-brand hover:bg-brand-light';
      const title = (it.content && it.content.title) || a.title;
      btn.innerHTML = `
        <span class="min-w-0">
          <span class="block truncate font-medium text-mute-600">${escapeHtml(title)}</span>
          <span class="block text-xs text-mute-400">${escapeHtml(REGISTER_LABELS[it.classification?.languageRegister] || '')}</span>
        </span>
        <span class="shrink-0 text-brand">${icons.plus}</span>`;
      btn.addEventListener('click', () => {
        steps.push(newStep('main_item', title, it.id));
        rerender();
        toast.success('Tappa aggiunta.');
      });
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
    const card = document.createElement('div');
    card.className = 'rounded-xl border border-stone-200 bg-white p-4 shadow-sm';

    const top = document.createElement('div');
    top.className = 'flex items-start gap-3';

    // Numero + frecce
    const ctrl = document.createElement('div');
    ctrl.className = 'flex flex-col items-center gap-1';
    ctrl.innerHTML = `<span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">${idx + 1}</span>`;
    const up = iconButton(icons.arrowUp, () => move(idx, -1, stepsEl), { title: 'Sposta su' });
    const down = iconButton(icons.arrowDown, () => move(idx, 1, stepsEl), { title: 'Sposta giù' });
    up.disabled = idx === 0;
    down.disabled = idx === steps.length - 1;
    up.classList.add('disabled:opacity-30');
    down.classList.add('disabled:opacity-30');
    ctrl.append(up, down);
    top.appendChild(ctrl);

    // Corpo
    const body = document.createElement('div');
    body.className = 'min-w-0 flex-1 space-y-2';

    const rowTop = document.createElement('div');
    rowTop.className = 'flex flex-wrap items-center gap-2';

    const typeSel = document.createElement('select');
    typeSel.className =
      'rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-medium outline-none focus:border-brand';
    for (const t of STEP_TYPE) {
      const o = document.createElement('option');
      o.value = t.value;
      o.textContent = t.label;
      if (t.value === step.type) o.selected = true;
      typeSel.appendChild(o);
    }
    typeSel.addEventListener('change', (e) => {
      step.type = e.target.value;
      // Le tappe non-item non devono trascinarsi dietro un itemId.
      const isItemType = step.type === 'main_item' || step.type === 'optional_item';
      if (!isItemType && step.itemId) {
        step.itemId = undefined;
        renderSteps(stepsEl);
      }
    });
    rowTop.appendChild(typeSel);

    if (step.itemId) {
      const ref = document.createElement('span');
      ref.className = 'rounded-md bg-stone-100 px-2 py-1 text-xs text-mute-400';
      const it = itemsById[step.itemId];
      ref.textContent = it ? `Item: ${(it.content && it.content.title) || step.itemId}` : `Item: ${step.itemId}`;
      rowTop.appendChild(ref);
    }
    body.appendChild(rowTop);

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = step.title || '';
    titleInput.placeholder = 'Titolo della tappa';
    titleInput.className =
      'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
    titleInput.addEventListener('input', (e) => (step.title = e.target.value));
    body.appendChild(titleInput);

    const dir = document.createElement('textarea');
    dir.rows = 2;
    dir.value = step.directionsFromPrevious || '';
    dir.placeholder = 'Indicazioni dalla tappa precedente (es. “gira a destra, sala 3”)…';
    dir.className =
      'w-full resize-y rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
    dir.addEventListener('input', (e) => (step.directionsFromPrevious = e.target.value));
    body.appendChild(dir);

    top.appendChild(body);

    // Rimuovi
    const remove = iconButton(icons.trash, () => {
      steps.splice(idx, 1);
      renderSteps(stepsEl);
    }, { title: 'Rimuovi tappa', danger: true });
    top.appendChild(remove);

    card.appendChild(top);
    stepsEl.appendChild(card);
  });
}

function move(idx, delta, stepsEl) {
  const target = idx + delta;
  if (target < 0 || target >= steps.length) return;
  [steps[idx], steps[target]] = [steps[target], steps[idx]];
  renderSteps(stepsEl);
}

async function save() {
  // Reindicizza order e valida i titoli.
  const payloadSteps = steps.map((s, i) => ({
    id: s.id || clientId('step'),
    type: s.type,
    title: (s.title && s.title.trim()) || STEP_TYPE_LABELS[s.type] || 'Tappa',
    description: s.description || undefined,
    directionsFromPrevious: s.directionsFromPrevious || undefined,
    itemId: s.itemId || undefined,
    order: i + 1,
  }));
  try {
    await visits.update(visit.id, { steps: payloadSteps });
    toast.success('Visita salvata.');
  } catch (err) {
    toast.error(err);
  }
}
