// Tabella riusabile con paginazione server-side e righe espandibili opzionali.
import { emptyState, paginationBar } from './ui.js';

/**
 * @param {HTMLElement} container  dove montare la tabella (viene svuotato)
 * @param {object} opts
 *   columns: [{ key, label, render?(row), class?, headerClass? }]
 *   rows: array
 *   pagination: { page, pageSize, totalItems, totalPages, hasNextPage, hasPreviousPage }
 *   onPageChange(page)
 *   onRowClick(row)         opzionale
 *   rowActions(row)->Node   opzionale (cella azioni in coda)
 *   expand(row)->Node|null  opzionale: aggiunge colonna chevron e riga espandibile
 *   empty: { icon, title, message }  stato vuoto
 */
export function renderTable(container, opts) {
  const {
    columns,
    rows = [],
    pagination,
    onPageChange,
    onRowClick,
    rowActions,
    expand,
    empty = {},
  } = opts;

  container.innerHTML = '';

  if (!rows.length) {
    container.appendChild(
      emptyState({
        icon: empty.icon,
        title: empty.title || 'Nessun elemento',
        message: empty.message || 'Non ci sono dati da mostrare.',
        actionNode: empty.actionNode,
      })
    );
    return;
  }

  const card = document.createElement('div');
  card.className = 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm';

  const scroll = document.createElement('div');
  scroll.className = 'overflow-x-auto';

  const table = document.createElement('table');
  table.className = 'w-full text-left text-sm';

  // Head
  const thead = document.createElement('thead');
  thead.className = 'border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500';
  const htr = document.createElement('tr');
  if (expand) htr.appendChild(th('', 'w-10'));
  for (const c of columns) htr.appendChild(th(c.label, c.headerClass));
  if (rowActions) htr.appendChild(th('Azioni', 'text-right'));
  thead.appendChild(htr);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  tbody.className = 'divide-y divide-slate-100';

  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.className = 'transition hover:bg-slate-50';
    const clickable = Boolean(onRowClick || expand);
    if (clickable) tr.classList.add('cursor-pointer');

    let expandRow = null;
    let expanded = false;

    if (expand) {
      const td = document.createElement('td');
      td.className = 'px-4 py-3 align-top';
      const chevron = document.createElement('span');
      chevron.className = 'inline-flex text-slate-400 transition-transform';
      chevron.innerHTML =
        '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>';
      td.appendChild(chevron);
      tr.appendChild(td);
      tr._chevron = chevron;
    }

    for (const c of columns) {
      const td = document.createElement('td');
      td.className = 'px-4 py-3 align-top text-slate-700 ' + (c.class || '');
      const content = c.render ? c.render(row) : row[c.key];
      if (content instanceof Node) td.appendChild(content);
      else td.innerHTML = content == null || content === '' ? '<span class="text-slate-300">—</span>' : content;
      tr.appendChild(td);
    }

    if (rowActions) {
      const td = document.createElement('td');
      td.className = 'px-4 py-3 text-right align-top';
      const actions = rowActions(row);
      if (actions) {
        actions.addEventListener('click', (e) => e.stopPropagation());
        td.appendChild(actions);
      }
      tr.appendChild(td);
    }

    tr.addEventListener('click', () => {
      if (expand) {
        expanded = !expanded;
        if (tr._chevron) tr._chevron.style.transform = expanded ? 'rotate(90deg)' : '';
        if (expanded) {
          if (!expandRow) {
            expandRow = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = columns.length + (expand ? 1 : 0) + (rowActions ? 1 : 0);
            td.className = 'bg-slate-50/70 px-4 py-4';
            const node = expand(row);
            if (node) td.appendChild(node);
            expandRow.appendChild(td);
          }
          tr.after(expandRow);
        } else if (expandRow) {
          expandRow.remove();
        }
      } else if (onRowClick) {
        onRowClick(row);
      }
    });

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  scroll.appendChild(table);
  card.appendChild(scroll);

  if (pagination) card.appendChild(paginationBar(pagination, onPageChange));

  container.appendChild(card);
}

function th(label, cls) {
  const el = document.createElement('th');
  el.className = 'px-4 py-3 font-medium ' + (cls || '');
  el.textContent = label;
  return el;
}
