// Notifiche di feedback (toast). Uso: toast.success('...'), toast.error(err).

const ICONS = {
  success:
    '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
  error:
    '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
  info:
    '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
};

const STYLES = {
  success: 'bg-white border-emerald-200 text-emerald-700',
  error: 'bg-white border-red-200 text-red-700',
  info: 'bg-white border-stone-200 text-mute-600',
};

function show(message, type = 'info', timeout = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast-enter pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${STYLES[type] || STYLES.info}`;
  el.innerHTML = `${ICONS[type] || ICONS.info}<span class="leading-snug">${escapeHtml(message)}</span>`;

  container.appendChild(el);

  const remove = () => {
    el.style.transition = 'opacity 0.2s, transform 0.2s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    setTimeout(() => el.remove(), 200);
  };
  const timer = setTimeout(remove, timeout);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const toast = {
  success: (msg) => show(msg, 'success'),
  error: (msgOrErr) => show(msgOrErr && msgOrErr.message ? msgOrErr.message : msgOrErr, 'error', 5000),
  info: (msg) => show(msg, 'info'),
};

export default toast;
