// Lista visite del museo selezionato + creazione/modifica metadati.
import { visits, museumContext, auth } from '../api.js';
import { toast } from '../components/toast.js';
import { renderTable } from '../components/table.js';
import { buildForm, openModal, confirmDialog } from '../components/modal.js';
import {
  pageHeader,
  primaryButton,
  statusBadge,
  searchInput,
  filterSelect,
  spinnerBlock,
  emptyState,
  iconButton,
  escapeHtml,
  icons,
} from '../components/ui.js';
import { VISIT_STATUS } from '../constants.js';

const state = { page: 1, search: '', status: '' };

export async function init() {
  Object.assign(state, { page: 1, search: '', status: '' });

  const headerEl = document.getElementById('visits-header');
  const toolbarEl = document.getElementById('visits-toolbar');
  const tableEl = document.getElementById('visits-table');

  headerEl.appendChild(
    pageHeader({
      title: 'Visite',
      subtitle: `Percorsi di visita di ${escapeHtml(museumContext.get()?.name || 'questo museo')}.`,
      actions: primaryButton('Nuova visita', () => openVisitForm(null), { icon: icons.plus }),
    })
  );

  const search = searchInput('Cerca per titolo…', (v) => {
    state.search = v;
    state.page = 1;
    load(tableEl);
  });
  const status = filterSelect('Tutti gli stati', VISIT_STATUS, (v) => {
    state.status = v;
    state.page = 1;
    load(tableEl);
  });
  toolbarEl.append(search.node, status.node);

  load(tableEl);
}

async function load(tableEl) {
  tableEl.innerHTML = '';
  tableEl.appendChild(spinnerBlock());
  try {
    const res = await visits.list({
      museumId: museumContext.id,
      page: state.page,
      pageSize: 20,
      sortBy: 'title',
      sortOrder: 'asc',
      search: state.search,
      status: state.status,
    });
    renderTable(tableEl, {
      columns: [
        {
          label: 'Visita',
          render: (v) =>
            `<div class="font-medium text-graphite">${escapeHtml(v.title)}</div>` +
            (v.subtitle ? `<div class="text-xs text-mute-400">${escapeHtml(v.subtitle)}</div>` : ''),
        },
        { label: 'Pubblico', render: (v) => escapeHtml(v.targetAudience || '') },
        { label: 'Durata', render: (v) => (v.estimatedDurationMinutes ? `${v.estimatedDurationMinutes} min` : '') },
        { label: 'Tappe', render: (v) => `${(v.steps || []).length}` },
        { label: 'Stato', render: (v) => statusBadge(v.status) },
      ],
      rows: res.data || [],
      pagination: res.pagination,
      onPageChange: (p) => {
        state.page = p;
        load(tableEl);
      },
      onRowClick: (v) => (location.hash = `#/visits/${v.id}`),
      rowActions: (v) => visitActions(v, () => load(tableEl)),
      empty: {
        title: 'Nessuna visita',
        message: 'Crea la prima visita: definisci i metadati e poi componi le tappe nel builder.',
        actionNode: primaryButton('Nuova visita', () => openVisitForm(null), { icon: icons.plus }),
      },
    });
  } catch (err) {
    tableEl.innerHTML = '';
    tableEl.appendChild(emptyState({ title: 'Errore', message: err.message }));
  }
}

function visitActions(v, reload) {
  const wrap = document.createElement('div');
  wrap.className = 'inline-flex gap-1.5';
  wrap.appendChild(
    iconButton(
      '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>',
      () => (location.hash = `#/visits/${v.id}`),
      { title: 'Apri builder' }
    )
  );
  wrap.appendChild(iconButton(icons.edit, () => openVisitForm(v), { title: 'Modifica metadati' }));
  wrap.appendChild(
    iconButton(
      icons.trash,
      async () => {
        const ok = await confirmDialog({
          title: 'Elimina visita',
          message: `Eliminare la visita <strong>${escapeHtml(v.title)}</strong>?`,
          confirmLabel: 'Elimina',
          danger: true,
        });
        if (!ok) return;
        try {
          await visits.remove(v.id);
          toast.success('Visita eliminata.');
          reload();
        } catch (err) {
          toast.error(err);
        }
      },
      { title: 'Elimina visita', danger: true }
    )
  );
  return wrap;
}

export function openVisitForm(visit) {
  const isNew = !visit;
  const form = buildForm([
    { name: 'title', label: 'Titolo', required: true, value: visit?.title },
    { name: 'subtitle', label: 'Sottotitolo', value: visit?.subtitle },
    { name: 'targetAudience', label: 'Pubblico target', colSpan: 1, value: visit?.targetAudience, placeholder: 'es. famiglie, esperti…' },
    { name: 'estimatedDurationMinutes', label: 'Durata stimata (min)', type: 'number', required: true, colSpan: 1, value: visit?.estimatedDurationMinutes, min: 0 },
    { name: 'status', label: 'Stato', type: 'select', required: true, options: VISIT_STATUS, value: visit?.status || 'draft', colSpan: 1 },
    { name: 'description', label: 'Descrizione', type: 'textarea', rows: 3, value: visit?.description },
  ]);

  openModal({
    title: isNew ? 'Nuova visita' : 'Modifica visita',
    content: form.node,
    submitLabel: isNew ? 'Crea e componi' : 'Salva',
    onSubmit: async () => {
      const v = form.getValues();
      if (!v.title) {
        form.setFieldError('title', 'Campo obbligatorio');
        throw new Error('Inserisci il titolo.');
      }
      if (v.estimatedDurationMinutes == null) {
        form.setFieldError('estimatedDurationMinutes', 'Campo obbligatorio');
        throw new Error('Inserisci la durata stimata.');
      }
      const payload = {
        title: v.title,
        subtitle: v.subtitle || undefined,
        targetAudience: v.targetAudience || undefined,
        estimatedDurationMinutes: v.estimatedDurationMinutes,
        status: v.status,
        description: v.description || undefined,
      };
      if (isNew) {
        payload.museumId = museumContext.id;
        payload.steps = [];
        const created = await visits.create(payload);
        toast.success('Visita creata. Aggiungi le tappe.');
        location.hash = `#/visits/${created.id}`;
      } else {
        await visits.update(visit.id, payload);
        toast.success('Visita aggiornata.');
        location.hash = '#/visits';
      }
    },
  });
}
