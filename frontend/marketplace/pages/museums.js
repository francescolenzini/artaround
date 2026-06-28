// Pagina Musei: selezione del museo di contesto + CRUD (super_admin).
import { museums, museumContext, auth } from '../api.js';
import { toast } from '../components/toast.js';
import {
  pageHeader,
  primaryButton,
  spinnerBlock,
  emptyState,
  paginationBar,
  statusBadge,
  searchInput,
  filterSelect,
  escapeHtml,
  icons,
} from '../components/ui.js';
import { MUSEUM_STATUS } from '../constants.js';

const state = { page: 1, search: '', status: '' };

export async function init() {
  Object.assign(state, { page: 1, search: '', status: '' });

  const headerEl = document.getElementById('museums-header');
  const filtersEl = document.getElementById('museums-filters');
  const gridEl = document.getElementById('museums-grid');

  const actions = [];
  if (auth.isSuperAdmin()) {
    actions.push(
      primaryButton('Nuovo museo', () => (location.hash = '#/museums/new'), { icon: icons.plus })
    );
  }
  headerEl.appendChild(
    pageHeader({
      title: 'Musei',
      subtitle: 'Seleziona un museo per gestirne contenuti e visite.',
      actions,
    })
  );

  const search = searchInput('Cerca per nome o città…', (v) => {
    state.search = v;
    state.page = 1;
    load();
  });
  const status = filterSelect('Tutti gli stati', MUSEUM_STATUS, (v) => {
    state.status = v;
    state.page = 1;
    load();
  });
  filtersEl.append(search.node, status.node);

  async function load() {
    gridEl.innerHTML = '';
    gridEl.appendChild(spinnerBlock());
    try {
      const res = await museums.list({
        page: state.page,
        pageSize: 12,
        sortBy: 'name',
        sortOrder: 'asc',
        search: state.search,
        status: state.status,
      });
      renderGrid(gridEl, res, load);
    } catch (err) {
      gridEl.innerHTML = '';
      gridEl.appendChild(
        emptyState({ title: 'Errore', message: err.message || 'Impossibile caricare i musei.' })
      );
    }
  }

  load();
}

function renderGrid(gridEl, res, reload) {
  gridEl.innerHTML = '';
  const list = res.data || [];

  if (!list.length) {
    gridEl.appendChild(
      emptyState({
        title: 'Nessun museo',
        message: auth.isSuperAdmin()
          ? 'Crea il primo museo per iniziare.'
          : 'Non ti sono ancora stati assegnati musei. Contatta un amministratore.',
        actionNode: auth.isSuperAdmin()
          ? primaryButton('Nuovo museo', () => (location.hash = '#/museums/new'), { icon: icons.plus })
          : null,
      })
    );
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3';
  const activeId = museumContext.id;

  for (const m of list) {
    grid.appendChild(museumCard(m, activeId, reload));
  }
  gridEl.appendChild(grid);

  if (res.pagination) {
    const pager = document.createElement('div');
    pager.className = 'mt-5 rounded-xl border border-slate-200 bg-white';
    pager.appendChild(
      paginationBar(res.pagination, (p) => {
        state.page = p;
        reload();
      })
    );
    gridEl.appendChild(pager);
  }
}

function museumCard(m, activeId, reload) {
  const isActive = m.id === activeId;
  const card = document.createElement('div');
  card.className =
    'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ' +
    (isActive ? 'border-brand-400 ring-2 ring-brand-200' : 'border-slate-200');

  const cover = m.coverImage || m.logo;
  card.innerHTML = `
    <div class="relative h-28 bg-gradient-to-br from-brand-500 to-brand-700">
      ${cover ? `<img src="${escapeHtml(cover)}" alt="" class="h-full w-full object-cover" onerror="this.style.display='none'">` : ''}
      <div class="absolute right-3 top-3">${statusBadge(m.status)}</div>
      ${isActive ? '<div class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Attivo</div>' : ''}
    </div>
    <div class="flex flex-1 flex-col p-4">
      <h3 class="text-base font-semibold text-slate-900">${escapeHtml(m.name)}</h3>
      <p class="mt-0.5 text-sm text-slate-500">${escapeHtml([m.city, m.country].filter(Boolean).join(', '))}</p>
      <p class="mt-2 line-clamp-2 text-sm text-slate-400">${escapeHtml(m.shortDescription || '')}</p>
      <div class="mt-3 flex gap-4 text-xs text-slate-400">
        <span><strong class="text-slate-600">${m.itemsCount ?? 0}</strong> item</span>
        <span><strong class="text-slate-600">${m.visitsCount ?? 0}</strong> visite</span>
        <span><strong class="text-slate-600">${m.publishedCount ?? 0}</strong> pubblicati</span>
      </div>
    </div>`;

  const footer = document.createElement('div');
  footer.className = 'flex items-center gap-2 border-t border-slate-100 p-3';

  const selectBtn = document.createElement('button');
  selectBtn.className =
    'flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700';
  selectBtn.textContent = isActive ? 'Gestisci contenuti' : 'Seleziona';
  selectBtn.addEventListener('click', () => {
    museumContext.set(m);
    location.hash = '#/content';
  });
  footer.appendChild(selectBtn);

  // Modifica: super_admin o curatore assegnato
  const canEdit = auth.isSuperAdmin() || (auth.user && (auth.user.assignedMuseumIds || []).includes(m.id));
  if (canEdit) {
    const editBtn = document.createElement('button');
    editBtn.title = 'Modifica museo';
    editBtn.className =
      'rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800';
    editBtn.innerHTML = icons.edit;
    editBtn.addEventListener('click', () => (location.hash = `#/museums/${m.id}`));
    footer.appendChild(editBtn);
  }

  card.appendChild(footer);
  return card;
}
