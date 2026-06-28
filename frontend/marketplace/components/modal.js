// Modale riusabile + builder di form + dialog di conferma.

// Registro delle modali aperte, per poterle chiudere tutte al cambio rotta
// (altrimenti backdrop e listener su document resterebbero orfani).
const openModals = new Set();

export function closeAllModals() {
  for (const close of [...openModals]) close();
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

/**
 * Apre una modale con contenuto arbitrario e footer (Annulla / Salva).
 * onSubmit e' una funzione async: se va a buon fine la modale si chiude,
 * se lancia un Error il messaggio viene mostrato e la modale resta aperta.
 * @returns {{ close: Function, setBusy: Function, setError: Function, body: HTMLElement }}
 */
export function openModal({
  title,
  content,
  submitLabel = 'Salva',
  cancelLabel = 'Annulla',
  onSubmit,
  size = 'md',
  hideFooter = false,
  danger = false,
}) {
  const backdrop = document.createElement('div');
  backdrop.className =
    'fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 py-10 backdrop-blur-sm';

  const panel = document.createElement('div');
  panel.className = `modal-panel-enter w-full ${SIZES[size] || SIZES.md} rounded-2xl bg-white shadow-2xl`;

  const errorBanner = document.createElement('p');
  errorBanner.className = 'hidden rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600';

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'space-y-4 px-6 py-5';
  bodyWrap.appendChild(errorBanner);
  if (typeof content === 'string') {
    const div = document.createElement('div');
    div.innerHTML = content;
    bodyWrap.appendChild(div);
  } else if (content instanceof Node) {
    bodyWrap.appendChild(content);
  }

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between border-b border-slate-100 px-6 py-4';
  header.innerHTML = `<h2 class="text-lg font-semibold text-slate-900">${escapeHtml(title || '')}</h2>`;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600';
  closeBtn.innerHTML =
    '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
  header.appendChild(closeBtn);

  panel.appendChild(header);
  panel.appendChild(bodyWrap);

  let submitBtn;
  if (!hideFooter) {
    const footer = document.createElement('div');
    footer.className = 'flex justify-end gap-3 border-t border-slate-100 px-6 py-4';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className =
      'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50';
    cancelBtn.textContent = cancelLabel;
    cancelBtn.addEventListener('click', () => close());

    submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = danger
      ? 'flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60'
      : 'flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60';
    submitBtn.textContent = submitLabel;
    submitBtn.addEventListener('click', handleSubmit);

    footer.appendChild(cancelBtn);
    footer.appendChild(submitBtn);
    panel.appendChild(footer);
  }

  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  // Chiusura: click su backdrop, ESC, X
  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) close();
  });
  closeBtn.addEventListener('click', () => close());
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };
  document.addEventListener('keydown', onKey);

  // Focus primo campo
  setTimeout(() => {
    const first = bodyWrap.querySelector('input, textarea, select');
    if (first) first.focus();
  }, 50);

  function setBusy(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.innerHTML = busy
      ? '<svg class="spinner h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg> Attendere…'
      : submitLabel;
  }

  function setError(message) {
    if (!message) {
      errorBanner.classList.add('hidden');
      errorBanner.textContent = '';
    } else {
      errorBanner.textContent = message;
      errorBanner.classList.remove('hidden');
    }
  }

  async function handleSubmit() {
    if (!onSubmit) return close();
    setError('');
    setBusy(true);
    try {
      await onSubmit({ close, setError, setBusy });
      close();
    } catch (err) {
      setError(err && err.message ? err.message : 'Operazione non riuscita.');
      setBusy(false);
    }
  }

  function close() {
    openModals.delete(close);
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = '';
    backdrop.remove();
  }

  openModals.add(close);
  return { close, setBusy, setError, body: bodyWrap };
}

/** Dialog di conferma. @returns {Promise<boolean>} */
export function confirmDialog({
  title = 'Conferma',
  message = 'Procedere?',
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  danger = false,
}) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'text-sm leading-relaxed text-slate-600';
    wrap.innerHTML = message;
    let decided = false;
    const modal = openModal({
      title,
      content: wrap,
      submitLabel: confirmLabel,
      cancelLabel,
      danger,
      size: 'sm',
      onSubmit: () => {
        decided = true;
        resolve(true);
      },
    });
    // Se chiusa senza conferma -> false
    const origClose = modal.close;
    const observer = new MutationObserver(() => {
      if (!document.body.contains(wrap)) {
        if (!decided) resolve(false);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    void origClose;
  });
}

/**
 * Costruisce un form da una descrizione di campi.
 * fields: [{ name, label, type, options, required, placeholder, help, value, colSpan, min, max, step, rows }]
 * type: text | textarea | number | select | multiselect | checkbox | password
 * @returns {{ node: HTMLElement, getValues: Function, setFieldError: Function }}
 */
export function buildForm(fields, values = {}) {
  const form = document.createElement('form');
  form.className = 'grid grid-cols-2 gap-4';
  form.addEventListener('submit', (e) => e.preventDefault());

  const refs = {};

  for (const f of fields) {
    const col = document.createElement('div');
    col.className = (f.colSpan === 1 ? 'col-span-2 sm:col-span-1' : 'col-span-2') + ' space-y-1.5';

    const current = values[f.name] !== undefined ? values[f.name] : f.value;

    if (f.type === 'checkbox') {
      const label = document.createElement('label');
      label.className =
        'flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3.5 py-2.5';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500';
      input.checked = Boolean(current);
      const span = document.createElement('span');
      span.className = 'text-sm font-medium text-slate-700';
      span.textContent = f.label;
      label.appendChild(input);
      label.appendChild(span);
      col.appendChild(label);
      refs[f.name] = { input, field: f };
      form.appendChild(col);
      continue;
    }

    const labelEl = document.createElement('label');
    labelEl.className = 'block text-sm font-medium text-slate-700';
    labelEl.textContent = f.label + (f.required ? ' *' : '');
    col.appendChild(labelEl);

    let input;
    const baseCls =
      'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

    if (f.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = f.rows || 3;
      input.className = baseCls + ' resize-y';
      if (current != null) input.value = current;
    } else if (f.type === 'select') {
      input = document.createElement('select');
      input.className = baseCls;
      if (!f.required) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = f.placeholder || '—';
        input.appendChild(opt);
      }
      for (const o of f.options || []) {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        if (String(current) === String(o.value)) opt.selected = true;
        input.appendChild(opt);
      }
    } else if (f.type === 'multiselect') {
      input = document.createElement('select');
      input.multiple = true;
      input.size = Math.min((f.options || []).length || 3, 6);
      input.className = baseCls;
      const selected = Array.isArray(current) ? current.map(String) : [];
      for (const o of f.options || []) {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        if (selected.includes(String(o.value))) opt.selected = true;
        input.appendChild(opt);
      }
    } else {
      input = document.createElement('input');
      input.type = f.type === 'password' ? 'password' : f.type === 'number' ? 'number' : 'text';
      input.className = baseCls + (f.readonly ? ' bg-slate-50 text-slate-500' : '');
      if (f.readonly) input.readOnly = true;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.min != null) input.min = f.min;
      if (f.max != null) input.max = f.max;
      if (f.step != null) input.step = f.step;
      if (current != null) input.value = current;
    }

    col.appendChild(input);

    if (f.help) {
      const help = document.createElement('p');
      help.className = 'text-xs text-slate-400';
      help.textContent = f.help;
      col.appendChild(help);
    }

    const errEl = document.createElement('p');
    errEl.className = 'hidden text-xs text-red-500';
    col.appendChild(errEl);

    refs[f.name] = { input, field: f, errEl };
    form.appendChild(col);
  }

  function getValues() {
    const out = {};
    for (const [name, { input, field }] of Object.entries(refs)) {
      if (field.type === 'checkbox') {
        out[name] = input.checked;
      } else if (field.type === 'number') {
        out[name] = input.value === '' ? null : Number(input.value);
      } else if (field.type === 'multiselect') {
        out[name] = Array.from(input.selectedOptions).map((o) => o.value);
      } else {
        const v = input.value.trim();
        out[name] = v === '' ? '' : v;
      }
    }
    return out;
  }

  function setFieldError(name, message) {
    const ref = refs[name];
    if (!ref || !ref.errEl) return;
    if (message) {
      ref.errEl.textContent = message;
      ref.errEl.classList.remove('hidden');
      ref.input.classList.add('border-red-400');
    } else {
      ref.errEl.classList.add('hidden');
      ref.input.classList.remove('border-red-400');
    }
  }

  return { node: form, getValues, setFieldError };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
