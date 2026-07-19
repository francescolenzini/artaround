// Helper UI condivisi tra le pagine: badge di stato, empty state, loading,
// intestazioni, escaping. Tengono le pagine asciutte e coerenti.

export function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STATUS_COLORS = {
  // generici
  draft: 'bg-stone-100 text-mute-600',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  invited: 'bg-blue-100 text-blue-700',
  suspended: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  draft: 'Bozza',
  published: 'Pubblicato',
  archived: 'Archiviato',
  active: 'Attivo',
  invited: 'Invitato',
  suspended: 'Sospeso',
};

/** Badge testuale colorato. */
export function badge(text, colorCls = 'bg-stone-100 text-mute-600') {
  return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorCls}">${escapeHtml(text)}</span>`;
}

/** Badge per uno stato noto (draft/published/active/...). */
export function statusBadge(status) {
  if (!status) return '<span class="text-stone-300">—</span>';
  return badge(STATUS_LABELS[status] || status, STATUS_COLORS[status] || 'bg-stone-100 text-mute-600');
}

/** Prezzo in formato italiano (separatore decimale ","), es. "2,50". */
export function formatPrice(value) {
  if (value == null || isNaN(value)) return '';
  return Number(value).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Badge gratuito / a pagamento. */
export function freeBadge(isFree, price) {
  if (isFree) return badge('Gratuito', 'bg-emerald-100 text-emerald-700');
  const label =
    price && price.value != null ? `${formatPrice(price.value)} ${price.currency || ''}`.trim() : 'A pagamento';
  return badge(label, 'bg-stone-100 text-graphite');
}

/** Blocco di caricamento centrato. */
export function spinnerBlock(message = 'Caricamento…') {
  const div = document.createElement('div');
  div.className = 'flex flex-col items-center justify-center gap-3 py-16 text-mute-400';
  div.innerHTML = `
    <svg class="spinner h-8 w-8 text-brand" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"></path>
    </svg>
    <span class="text-sm">${escapeHtml(message)}</span>`;
  return div;
}

/** Stato vuoto esplicativo, con eventuale azione. */
export function emptyState({ icon, title, message, actionNode }) {
  const div = document.createElement('div');
  div.className =
    'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center';
  div.innerHTML = `
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-mute-400">
      ${icon || '<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>'}
    </div>
    <h3 class="text-base font-semibold text-mute-600">${escapeHtml(title || 'Nessun elemento')}</h3>
    <p class="max-w-sm text-sm text-mute-400">${escapeHtml(message || '')}</p>`;
  if (actionNode) {
    const wrap = document.createElement('div');
    wrap.className = 'mt-2';
    wrap.appendChild(actionNode);
    div.appendChild(wrap);
  }
  return div;
}

/** Bottone primario riusabile. */
export function primaryButton(label, onClick, { icon } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className =
    'inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark';
  b.innerHTML = (icon || '') + `<span>${escapeHtml(label)}</span>`;
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

/** Icona-bottone compatto (per azioni di riga). */
export function iconButton(svg, onClick, { title, danger } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  if (title) b.title = title;
  b.className =
    'inline-flex items-center justify-center rounded-lg border border-stone-200 p-1.5 text-mute-400 transition hover:bg-stone-100 ' +
    (danger ? 'hover:border-red-300 hover:text-red-600' : 'hover:text-graphite');
  b.innerHTML = svg;
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

/** Intestazione di pagina con titolo, sottotitolo e azioni a destra. */
export function pageHeader({ title, subtitle, actions }) {
  const wrap = document.createElement('div');
  wrap.className = 'mb-6 flex flex-wrap items-start justify-between gap-4';
  const left = document.createElement('div');
  left.innerHTML = `
    <h1 class="font-display text-2xl font-bold tracking-tight text-graphite">${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="mt-1 text-sm text-mute-400">${escapeHtml(subtitle)}</p>` : ''}`;
  wrap.appendChild(left);
  if (actions) {
    const right = document.createElement('div');
    right.className = 'flex items-center gap-2';
    (Array.isArray(actions) ? actions : [actions]).forEach((a) => a && right.appendChild(a));
    wrap.appendChild(right);
  }
  return wrap;
}

/** Barra di paginazione riusabile (tabelle e griglie). */
export function paginationBar(p, onPageChange) {
  const totalPages = p.totalPages || 1;
  const wrap = document.createElement('div');
  wrap.className =
    'flex flex-col items-center justify-between gap-3 border-t border-stone-200 px-4 py-3 text-sm text-mute-400 sm:flex-row';

  const from = p.totalItems === 0 ? 0 : (p.page - 1) * p.pageSize + 1;
  const to = Math.min(p.page * p.pageSize, p.totalItems);
  const info = document.createElement('span');
  info.innerHTML = `<span class="font-medium text-mute-600">${from}–${to}</span> di <span class="font-medium text-mute-600">${p.totalItems}</span>`;
  wrap.appendChild(info);

  const nav = document.createElement('div');
  nav.className = 'flex items-center gap-1';
  const btn = (label, disabled, page) => {
    const b = document.createElement('button');
    b.className =
      'rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-mute-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40';
    b.innerHTML = label;
    b.disabled = disabled;
    if (!disabled && onPageChange) b.addEventListener('click', () => onPageChange(page));
    return b;
  };
  nav.appendChild(btn('‹ Prec', !p.hasPreviousPage, p.page - 1));
  const pageInfo = document.createElement('span');
  pageInfo.className = 'px-2';
  pageInfo.textContent = `Pagina ${p.page} / ${totalPages}`;
  nav.appendChild(pageInfo);
  nav.appendChild(btn('Succ ›', !p.hasNextPage, p.page + 1));
  wrap.appendChild(nav);
  return wrap;
}

/** Debounce semplice per gli input di ricerca. */
export function debounce(fn, ms = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Input di ricerca con icona, ritorna {node, input}. */
export function searchInput(placeholder, onInput) {
  const wrap = document.createElement('div');
  wrap.className = 'relative';
  wrap.innerHTML = `<svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>`;
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = placeholder || 'Cerca…';
  input.className =
    'w-64 rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';
  if (onInput) input.addEventListener('input', debounce((e) => onInput(e.target.value), 350));
  wrap.appendChild(input);
  return { node: wrap, input };
}

/** Select di filtro (con etichetta "tutti"). Ritorna {node, select}. */
export function filterSelect(allLabel, options, onChange, value = '') {
  const select = document.createElement('select');
  select.className =
    'rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';
  const all = document.createElement('option');
  all.value = '';
  all.textContent = allLabel;
  select.appendChild(all);
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (String(value) === String(o.value)) opt.selected = true;
    select.appendChild(opt);
  }
  if (onChange) select.addEventListener('change', (e) => onChange(e.target.value));
  return { node: select, select };
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Icone SVG comuni (stringhe) riusate nelle azioni.
export const icons = {
  plus: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>',
  edit: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>',
  trash:
    '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
  check:
    '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
  arrowRight:
    '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>',
  x: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
  arrowUp:
    '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>',
  arrowDown:
    '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>',
};
