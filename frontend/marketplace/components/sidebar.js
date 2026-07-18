// Sidebar di navigazione. Mostra le sezioni; "Utenti" solo al super_admin.
import { auth, museumContext } from '../api.js';
import { escapeHtml } from './ui.js';

const NAV = [
  {
    name: 'museums',
    href: '#/museums',
    label: 'Musei',
    icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/></svg>',
  },
  {
    name: 'content',
    href: '#/content',
    label: 'Contenuti',
    needsMuseum: true,
    icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M14 3v6h6"/></svg>',
  },
  {
    name: 'visits',
    href: '#/visits',
    label: 'Visite',
    needsMuseum: true,
    icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>',
  },
  {
    name: 'users',
    href: '#/users',
    label: 'Utenti',
    superAdmin: true,
    icon: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-6.65"/></svg>',
  },
];

export function renderSidebar(activeName) {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const isAdmin = auth.isSuperAdmin();
  const hasMuseum = Boolean(museumContext.id);

  const links = NAV.filter((n) => !n.superAdmin || isAdmin)
    .map((n) => {
      const active = n.name === activeName;
      const disabled = n.needsMuseum && !hasMuseum;
      const base =
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition';
      const cls = active
        ? `${base} bg-brand-light text-brand-dark`
        : disabled
        ? `${base} text-stone-300 cursor-not-allowed`
        : `${base} text-mute-600 hover:bg-stone-100 hover:text-graphite`;
      const href = disabled ? 'javascript:void 0' : n.href;
      return `<a href="${href}" class="${cls}" ${disabled ? 'data-disabled="1" title="Seleziona prima un museo"' : ''}>${n.icon}<span>${n.label}</span></a>`;
    })
    .join('');

  el.innerHTML = `
    <div class="flex items-center gap-2.5 border-b border-stone-200 px-5 py-4">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">A</div>
      <div>
        <p class="font-display text-sm font-bold leading-tight text-graphite">ArtAround</p>
        <p class="text-xs leading-tight text-mute-400">Marketplace / Editor</p>
      </div>
    </div>
    <nav class="flex-1 space-y-1 p-3">${links}</nav>
    <div class="border-t border-stone-200 p-4 text-xs text-mute-400">
      ${escapeHtml(auth.user ? auth.user.username : '')}
      ${auth.isSuperAdmin() ? '· super admin' : '· curatore'}
    </div>`;

  el.querySelectorAll('a[data-disabled="1"]').forEach((a) =>
    a.addEventListener('click', (e) => e.preventDefault())
  );
}
