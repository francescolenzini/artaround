// Dettaglio di una singola opera con i suoi item. Riusa i form di content.js.
import { artworks, items, museumContext } from '../api.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/modal.js';
import {
  pageHeader,
  primaryButton,
  statusBadge,
  freeBadge,
  spinnerBlock,
  iconButton,
  escapeHtml,
  icons,
} from '../components/ui.js';
import { REGISTER_LABELS, fruitionLabel } from '../constants.js';
import { openArtworkForm, openItemForm } from './content.js';

export async function init({ params }) {
  const headerEl = document.getElementById('artwork-detail-header');
  const metaEl = document.getElementById('artwork-detail-meta');
  const itemsEl = document.getElementById('artwork-detail-items');

  headerEl.appendChild(spinnerBlock());

  let artwork;
  try {
    artwork = await artworks.get(params.id);
  } catch (err) {
    headerEl.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(err.message)}</p>`;
    return;
  }

  headerEl.innerHTML = '';
  headerEl.appendChild(
    pageHeader({
      title: artwork.title,
      subtitle: [artwork.artist, artwork.year].filter(Boolean).join(' · '),
      actions: [
        statusBadgeNode(artwork.status),
        primaryButton('Modifica', () => openArtworkForm(artwork, () => init({ params })), {
          icon: icons.edit,
        }),
      ],
    })
  );

  renderMeta(metaEl, artwork);
  await renderItems(itemsEl, artwork);
}

function statusBadgeNode(status) {
  const span = document.createElement('span');
  span.innerHTML = statusBadge(status);
  return span.firstChild;
}

function renderMeta(metaEl, a) {
  const rows = [
    ['Categoria', a.category],
    ['Stile', a.style],
    ['Materiali', (a.materials || []).join(', ')],
    ['Tag', (a.tags || []).join(', ')],
    ['ID universale', a.universalObjectId],
  ].filter(([, v]) => v);
  metaEl.innerHTML = `
    <div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      ${a.description ? `<p class="mb-4 text-sm leading-relaxed text-mute-600">${escapeHtml(a.description)}</p>` : ''}
      <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        ${rows
          .map(
            ([k, v]) =>
              `<div><dt class="text-xs uppercase tracking-wide text-mute-400">${k}</dt><dd class="text-mute-600">${escapeHtml(v)}</dd></div>`
          )
          .join('')}
      </dl>
    </div>`;
}

async function renderItems(itemsEl, artwork) {
  itemsEl.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'mb-3 flex items-center justify-between';
  head.innerHTML = '<h3 class="text-base font-semibold text-graphite">Item</h3>';
  head.appendChild(
    primaryButton('Aggiungi item', () => openItemForm(artwork, null, () => renderItems(itemsEl, artwork)), {
      icon: icons.plus,
    })
  );
  itemsEl.appendChild(head);

  const list = document.createElement('div');
  list.appendChild(spinnerBlock('Caricamento item…'));
  itemsEl.appendChild(list);

  try {
    const res = await items.list({ artworkId: artwork.id, pageSize: 100, sortBy: 'createdAt', sortOrder: 'asc' });
    const rows = res.data || [];
    list.innerHTML = '';
    if (!rows.length) {
      list.innerHTML =
        '<p class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-mute-400">Nessun item. Aggiungine uno per poter pubblicare l\'opera.</p>';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'space-y-2';
    for (const it of rows) grid.appendChild(itemCard(it, artwork, () => renderItems(itemsEl, artwork)));
    list.appendChild(grid);
  } catch (err) {
    list.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(err.message)}</p>`;
  }
}

function itemCard(it, artwork, reload) {
  const card = document.createElement('div');
  card.className = 'flex items-start justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4';
  const title = (it.content && it.content.title) || '(senza titolo)';
  card.innerHTML = `
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-medium text-graphite">${escapeHtml(title)}</span>
        ${statusBadge(it.status)}
        ${freeBadge(it.isFree, it.price)}
      </div>
      <div class="mt-1 flex flex-wrap gap-2 text-xs text-mute-400">
        <span>Registro: ${escapeHtml(REGISTER_LABELS[it.classification?.languageRegister] || '—')}</span>
        <span>· Durata: ${escapeHtml(fruitionLabel(it.classification?.fruitionLength) || '—')}</span>
      </div>
      ${it.content?.screenText ? `<p class="mt-2 line-clamp-2 text-sm text-mute-400">${escapeHtml(it.content.screenText)}</p>` : ''}
    </div>`;
  const actions = document.createElement('div');
  actions.className = 'flex shrink-0 gap-1.5';
  actions.appendChild(iconButton(icons.edit, () => openItemForm(artwork, it, reload), { title: 'Modifica' }));
  actions.appendChild(
    iconButton(
      icons.trash,
      async () => {
        const ok = await confirmDialog({
          title: 'Elimina item',
          message: `Eliminare <strong>${escapeHtml(title)}</strong>?`,
          confirmLabel: 'Elimina',
          danger: true,
        });
        if (!ok) return;
        try {
          await items.remove(it.id);
          toast.success('Item eliminato.');
          reload();
        } catch (err) {
          toast.error(err);
        }
      },
      { title: 'Elimina', danger: true }
    )
  );
  card.appendChild(actions);
  return card;
}
