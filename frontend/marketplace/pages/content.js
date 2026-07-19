// Catalogo contenuti: opere del museo selezionato con item subordinati.
import { artworks, items, museumContext, activities, auth } from '../api.js';
import { toast } from '../components/toast.js';
import { renderTable } from '../components/table.js';
import { buildForm, openModal, confirmDialog } from '../components/modal.js';
import {
  pageHeader,
  primaryButton,
  statusBadge,
  freeBadge,
  searchInput,
  filterSelect,
  spinnerBlock,
  emptyState,
  iconButton,
  escapeHtml,
  icons,
} from '../components/ui.js';
import {
  ARTWORK_STATUS,
  ITEM_STATUS,
  FRUITION_LENGTH,
  LANGUAGE_REGISTER,
  LANGUAGES,
  CURRENCIES,
  REGISTER_LABELS,
  LENGTH_LABELS,
  LANGUAGE_LABELS,
  clientId,
} from '../constants.js';

const state = { page: 1, search: '', status: '', isFree: '' };

export async function init() {
  // I moduli ES sono singleton: azzero lo stato dei filtri a ogni ingresso,
  // così gli input (ricreati vuoti) restano coerenti con lo state.
  Object.assign(state, { page: 1, search: '', status: '', isFree: '' });

  const headerEl = document.getElementById('content-header');
  const toolbarEl = document.getElementById('content-toolbar');
  const tableEl = document.getElementById('content-table');

  headerEl.appendChild(
    pageHeader({
      title: 'Contenuti',
      subtitle: `Opere e item di ${escapeHtml(museumContext.get()?.name || 'questo museo')}.`,
      actions: primaryButton('Nuova opera', () => openArtworkForm(null, reload), { icon: icons.plus }),
    })
  );

  const search = searchInput('Cerca per titolo, artista, stile, testo degli item…', (v) => {
    state.search = v;
    state.page = 1;
    reload();
  });
  const status = filterSelect('Tutti gli stati', ARTWORK_STATUS, (v) => {
    state.status = v;
    state.page = 1;
    reload();
  });
  const free = filterSelect(
    'Tutti gli item',
    [
      { value: 'true', label: 'Solo gratuiti' },
      { value: 'false', label: 'Solo a pagamento' },
    ],
    (v) => {
      state.isFree = v;
      reload();
    }
  );
  toolbarEl.append(search.node, status.node, free.node);

  function reload() {
    load(tableEl);
  }
  reload();
}

async function load(tableEl) {
  tableEl.innerHTML = '';
  tableEl.appendChild(spinnerBlock());
  try {
    const res = await artworks.list({
      museumId: museumContext.id,
      page: state.page,
      pageSize: 20,
      sortBy: 'title',
      sortOrder: 'asc',
      search: state.search,
      status: state.status,
    });
    let rows = res.data || [];
    // Filtro gratuiti/a pagamento: nasconde le opere prive di item che
    // corrispondono al filtro (isFree è una proprietà degli item, non
    // dell'opera). Agisce sulla pagina corrente di opere.
    if (state.isFree !== '') {
      const itemsRes = await items.list({
        museumId: museumContext.id,
        isFree: state.isFree,
        pageSize: 200,
      });
      const matchingArtworkIds = new Set((itemsRes.data || []).map((i) => i.artworkId));
      rows = rows.filter((a) => matchingArtworkIds.has(a.id));
    }
    renderTable(tableEl, {
      columns: [
        {
          label: 'Opera',
          render: (a) =>
            `<div class="font-medium text-graphite">${escapeHtml(a.title)}</div>` +
            `<div class="text-xs text-mute-400">${escapeHtml(a.year || '')}</div>`,
        },
        { label: 'Artista', render: (a) => escapeHtml(a.artist || '') },
        { label: 'Stile', render: (a) => escapeHtml(a.style || '') },
        { label: 'Stato', render: (a) => `<span data-aw-status="${a.id}">${statusBadge(a.status)}</span>` },
      ],
      rows,
      pagination: state.isFree === '' ? res.pagination : null,
      onPageChange: (p) => {
        state.page = p;
        load(tableEl);
      },
      expand: (a) => buildExpand(a),
      rowActions: (a) => artworkActions(a, () => load(tableEl)),
      empty: {
        title: 'Nessuna opera',
        message: 'Crea la prima opera di questo museo per iniziare a popolare il catalogo.',
        actionNode: primaryButton('Nuova opera', () => openArtworkForm(null, () => load(tableEl)), {
          icon: icons.plus,
        }),
      },
    });
  } catch (err) {
    tableEl.innerHTML = '';
    tableEl.appendChild(emptyState({ title: 'Errore', message: err.message }));
  }
}

function artworkActions(a, reload) {
  const wrap = document.createElement('div');
  wrap.className = 'inline-flex gap-1.5';
  wrap.appendChild(
    iconButton(
      '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>',
      () => (location.hash = `#/content/${a.id}`),
      { title: 'Apri dettaglio' }
    )
  );
  wrap.appendChild(
    iconButton(icons.edit, () => openArtworkForm(a, reload), { title: 'Modifica opera' })
  );
  wrap.appendChild(
    iconButton(
      icons.trash,
      async () => {
        let itemsRes;
        try {
          itemsRes = await items.list({ artworkId: a.id, pageSize: 100 });
        } catch (err) {
          toast.error(err);
          return;
        }
        const count = (itemsRes.data || []).length;
        const ok = await confirmDialog({
          title: 'Elimina opera',
          message:
            `Eliminare <strong>${escapeHtml(a.title)}</strong>?` +
            (count ? ` Verranno eliminati anche <strong>${count}</strong> item collegati.` : ''),
          confirmLabel: 'Elimina',
          danger: true,
        });
        if (!ok) return;
        try {
          // Cascata client-side: prima gli item, poi l'opera.
          for (const it of itemsRes.data || []) await items.remove(it.id);
          await artworks.remove(a.id);
          logActivity('delete', 'artwork', a.id, a.title);
          toast.success('Opera eliminata.');
          reload();
        } catch (err) {
          toast.error(err);
        }
      },
      { title: 'Elimina opera', danger: true }
    )
  );
  return wrap;
}

// --- Pannello espandibile con gli item dell'opera ---------------------------

function buildExpand(artwork) {
  const container = document.createElement('div');
  loadItemsInto(container, artwork);
  return container;
}

async function loadItemsInto(container, artwork) {
  // Dopo ogni operazione su un item: ricarica la sotto-lista E aggiorna la
  // cella "Stato" della riga opera (senza una load() completa della tabella).
  const onItemsChanged = () => {
    loadItemsInto(container, artwork);
    refreshArtworkStatus(artwork.id);
  };

  container.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'mb-3 flex items-center justify-between';
  head.innerHTML = `<h4 class="text-sm font-semibold text-mute-600">Item di "${escapeHtml(artwork.title)}"</h4>`;
  const addBtn = primaryButton('Aggiungi item', () =>
    openItemForm(artwork, null, onItemsChanged),
    { icon: icons.plus }
  );
  addBtn.className = addBtn.className.replace('px-4 py-2', 'px-3 py-1.5');
  head.appendChild(addBtn);
  container.appendChild(head);

  const list = document.createElement('div');
  list.appendChild(spinnerBlock('Caricamento item…'));
  container.appendChild(list);

  try {
    const query = { artworkId: artwork.id, pageSize: 100, sortBy: 'createdAt', sortOrder: 'asc' };
    if (state.isFree !== '') query.isFree = state.isFree;
    const res = await items.list(query);
    const rows = res.data || [];
    list.innerHTML = '';
    if (!rows.length) {
      list.innerHTML = `<p class="rounded-lg border border-dashed border-stone-300 bg-white px-4 py-6 text-center text-sm text-mute-400">Nessun item${state.isFree !== '' ? ' con questo filtro' : ''}. Aggiungine uno per poter pubblicare l'opera.</p>`;
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'space-y-2';
    for (const it of rows) {
      grid.appendChild(itemRow(it, artwork, onItemsChanged));
    }
    list.appendChild(grid);
  } catch (err) {
    list.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(err.message)}</p>`;
  }
}

function itemRow(it, artwork, reloadItems) {
  const row = document.createElement('div');
  row.className =
    'flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-2.5';
  const title = (it.content && it.content.title) || '(senza titolo)';
  row.innerHTML = `
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="truncate text-sm font-medium text-graphite">${escapeHtml(title)}</span>
        ${statusBadge(it.status)}
        ${freeBadge(it.isFree, it.price)}
      </div>
      <div class="mt-0.5 flex flex-wrap gap-2 text-xs text-mute-400">
        <span>Registro: ${escapeHtml(REGISTER_LABELS[it.classification?.languageRegister] || '—')}</span>
        <span>· Durata: ${escapeHtml(LENGTH_LABELS[it.classification?.fruitionLength] || '—')}</span>
        ${it.classification?.languageCode ? `<span>· Lingua: ${escapeHtml(LANGUAGE_LABELS[it.classification.languageCode] || it.classification.languageCode)}</span>` : ''}
      </div>
    </div>`;
  const actions = document.createElement('div');
  actions.className = 'flex shrink-0 gap-1.5';
  actions.appendChild(
    iconButton(icons.edit, () => openItemForm(artwork, it, reloadItems), { title: 'Modifica item' })
  );
  actions.appendChild(
    iconButton(
      icons.trash,
      async () => {
        const ok = await confirmDialog({
          title: 'Elimina item',
          message: `Eliminare l'item <strong>${escapeHtml(title)}</strong>?`,
          confirmLabel: 'Elimina',
          danger: true,
        });
        if (!ok) return;
        try {
          await items.remove(it.id);
          toast.success('Item eliminato.');
          reloadItems();
        } catch (err) {
          toast.error(err);
        }
      },
      { title: 'Elimina item', danger: true }
    )
  );
  row.appendChild(actions);
  return row;
}

// --- Form opera -------------------------------------------------------------

export async function openArtworkForm(artwork, reload) {
  const isNew = !artwork;
  // Valori di categoria/stile già usati nel museo, per le select con "+"
  // di aggiunta rapida (nessun endpoint dedicato: bastano le opere esistenti).
  let categoryOptions = [];
  let styleOptions = [];
  try {
    const res = await artworks.list({ museumId: museumContext.id, pageSize: 200 });
    const distinct = (field) =>
      [...new Set((res.data || []).map((a) => a[field]).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ value: v, label: v }));
    categoryOptions = distinct('category');
    styleOptions = distinct('style');
  } catch {
    /* senza lookup si può comunque inserire un nuovo valore col "+" */
  }
  const form = buildForm([
    { name: 'title', label: 'Titolo', required: true, value: artwork?.title },
    { name: 'artist', label: 'Artista', colSpan: 1, value: artwork?.artist },
    { name: 'year', label: 'Anno', colSpan: 1, value: artwork?.year },
    { name: 'category', label: 'Categoria', type: 'selectAddable', options: categoryOptions, colSpan: 1, value: artwork?.category },
    { name: 'style', label: 'Stile', type: 'selectAddable', options: styleOptions, colSpan: 1, value: artwork?.style },
    { name: 'status', label: 'Stato', type: 'select', required: true, options: ARTWORK_STATUS, value: artwork?.status || 'draft', colSpan: 1 },
    { name: 'universalObjectId', label: 'ID universale (opz.)', colSpan: 1, value: artwork?.universalObjectId },
    { name: 'materials', label: 'Materiali', type: 'tags', value: artwork?.materials || [], help: 'Invio o virgola per aggiungere' },
    { name: 'tags', label: 'Tag', type: 'tags', value: artwork?.tags || [], help: 'Invio o virgola per aggiungere' },
    { name: 'description', label: 'Descrizione', type: 'textarea', rows: 3, value: artwork?.description },
  ]);

  openModal({
    title: isNew ? 'Nuova opera' : 'Modifica opera',
    content: form.node,
    submitLabel: isNew ? 'Crea opera' : 'Salva',
    size: 'lg',
    onSubmit: async () => {
      const v = form.getValues();
      if (!v.title) {
        form.setFieldError('title', 'Campo obbligatorio');
        throw new Error('Inserisci il titolo.');
      }
      // Regola: pubblicabile solo se ha almeno un item.
      if (v.status === 'published') {
        if (isNew) throw new Error('Non puoi pubblicare un\'opera senza item. Creala come bozza e aggiungi item.');
        const itemsRes = await items.list({ artworkId: artwork.id, pageSize: 1 });
        if (!(itemsRes.data || []).length)
          throw new Error('Per pubblicare l\'opera serve almeno un item.');
      }
      const payload = {
        title: v.title,
        artist: v.artist,
        year: v.year,
        category: v.category,
        style: v.style,
        status: v.status,
        materials: v.materials,
        tags: v.tags,
        description: v.description,
      };
      if (isNew) {
        payload.museumId = museumContext.id;
        // Il backend ha un indice unique (non sparse) su universalObjectId:
        // un valore assente diventa null e collide tra opere diverse. Quindi
        // generiamo un id univoco quando l'utente non lo fornisce.
        payload.universalObjectId = v.universalObjectId || clientId('UO');
        const created = await artworks.create(payload);
        logActivity('create', 'artwork', created.id, created.title);
        toast.success('Opera creata.');
      } else {
        if (v.universalObjectId) payload.universalObjectId = v.universalObjectId;
        await artworks.update(artwork.id, payload);
        logActivity('update', 'artwork', artwork.id, payload.title);
        toast.success('Opera aggiornata.');
      }
      reload();
    },
  });
}

// --- Form item --------------------------------------------------------------

export function openItemForm(artwork, item, reload) {
  const isNew = !item;
  const c = item?.classification || {};
  const ct = item?.content || {};
  const rnd = ct.rendering || {};
  const price = item?.price || {};

  const isFreeInitial = item ? item.isFree : true;
  const supportsScreenInitial = rnd.supportsScreen !== false;
  const supportsTTSInitial = rnd.supportsTTS !== false;

  const form = buildForm([
    { name: 'title', label: 'Titolo item', required: true, value: ct.title },
    { name: 'languageRegister', label: 'Registro linguistico', type: 'select', required: true, options: LANGUAGE_REGISTER, value: c.languageRegister || 'medio', colSpan: 1 },
    { name: 'fruitionLength', label: 'Durata fruizione', type: 'select', required: true, options: FRUITION_LENGTH, value: c.fruitionLength || '1min', colSpan: 1 },
    { name: 'languageCode', label: 'Lingua', type: 'select', required: true, options: LANGUAGES, value: c.languageCode || 'it', colSpan: 1 },
    { name: 'targetDurationSeconds', label: 'Durata target (s)', type: 'number', colSpan: 1, value: c.targetDurationSeconds, min: 0 },
    { name: 'status', label: 'Stato', type: 'select', required: true, options: ITEM_STATUS, value: item?.status || 'draft', colSpan: 1 },
    { name: 'license', label: 'Licenza', colSpan: 1, value: item?.license, placeholder: 'es. CC BY-SA 4.0' },
    {
      name: 'isFree', label: 'Gratuito', type: 'checkbox', value: isFreeInitial, colSpan: 1,
      onChange: (checked, f) => {
        f.setDisabled('priceValue', checked);
        f.setDisabled('priceCurrency', checked);
      },
    },
    { name: 'priceValue', label: 'Prezzo', type: 'number', colSpan: 1, value: price.value, min: 0, step: 0.5, help: 'solo se a pagamento' },
    { name: 'priceCurrency', label: 'Valuta', type: 'select', required: true, options: CURRENCIES, value: price.currency || 'EUR', colSpan: 1 },
    {
      name: 'supportsScreen', label: 'Supporta schermo', type: 'checkbox', value: supportsScreenInitial,
      onChange: (checked, f) => f.setDisabled('screenText', !checked),
    },
    { name: 'screenText', label: 'Testo a schermo', type: 'textarea', rows: 4, value: ct.screenText },
    {
      name: 'supportsTTS', label: 'Supporta TTS', type: 'checkbox', value: supportsTTSInitial,
      onChange: (checked, f) => f.setDisabled('ttsText', !checked),
    },
    { name: 'ttsText', label: 'Testo per sintesi vocale (TTS)', type: 'textarea', rows: 4, value: ct.ttsText },
  ]);
  // Stato iniziale dei campi dipendenti dai checkbox.
  form.setDisabled('priceValue', isFreeInitial);
  form.setDisabled('priceCurrency', isFreeInitial);
  form.setDisabled('screenText', !supportsScreenInitial);
  form.setDisabled('ttsText', !supportsTTSInitial);

  openModal({
    title: isNew ? `Nuovo item — ${artwork.title}` : 'Modifica item',
    content: form.node,
    submitLabel: isNew ? 'Crea item' : 'Salva',
    size: 'lg',
    onSubmit: async () => {
      const v = form.getValues();
      if (!v.title) {
        form.setFieldError('title', 'Campo obbligatorio');
        throw new Error('Inserisci il titolo dell\'item.');
      }
      const payload = {
        artworkId: artwork.id,
        classification: {
          fruitionLength: v.fruitionLength,
          languageRegister: v.languageRegister,
          languageCode: v.languageCode || undefined,
          targetDurationSeconds: v.targetDurationSeconds ?? undefined,
        },
        content: {
          title: v.title,
          screenText: v.screenText || undefined,
          ttsText: v.ttsText || undefined,
          rendering: { supportsScreen: v.supportsScreen, supportsTTS: v.supportsTTS },
        },
        license: v.license || undefined,
        isFree: v.isFree,
        status: v.status,
      };
      if (!v.isFree && v.priceValue != null) {
        payload.price = { value: v.priceValue, currency: v.priceCurrency || 'EUR' };
      }
      if (isNew) {
        await items.create(payload);
        toast.success('Item creato.');
      } else {
        await items.update(item.id, payload);
        toast.success('Item aggiornato.');
      }
      reload();
    },
  });
}

// Rilegge una singola opera e aggiorna solo la cella "Stato" della sua riga,
// senza ricostruire l'intera tabella.
async function refreshArtworkStatus(artworkId) {
  try {
    const fresh = await artworks.get(artworkId);
    const cell = document.querySelector(`[data-aw-status="${artworkId}"]`);
    if (cell) cell.innerHTML = statusBadge(fresh.status);
  } catch {
    /* in caso di errore la cella resta invariata */
  }
}

function logActivity(action, entityType, entityId, entityName) {
  // Best-effort: registra l'attivita' ma non bloccare l'operazione se fallisce.
  activities
    .create({
      action,
      entityType,
      entityId,
      entityName,
      museumId: museumContext.id,
      userId: auth.user?.id,
    })
    .catch(() => {});
}
