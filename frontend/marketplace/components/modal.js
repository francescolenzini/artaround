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
    'fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-graphite/40 p-4 py-10 backdrop-blur-sm';

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
  header.className = 'flex items-center justify-between border-b border-stone-100 px-6 py-4';
  header.innerHTML = `<h2 class="font-display text-lg font-semibold text-graphite">${escapeHtml(title || '')}</h2>`;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'rounded-lg p-1.5 text-mute-400 transition hover:bg-stone-100 hover:text-mute-600';
  closeBtn.innerHTML =
    '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
  header.appendChild(closeBtn);

  panel.appendChild(header);
  panel.appendChild(bodyWrap);

  let submitBtn;
  if (!hideFooter) {
    const footer = document.createElement('div');
    footer.className = 'flex justify-end gap-3 border-t border-stone-100 px-6 py-4';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className =
      'rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-mute-600 transition hover:bg-stone-100';
    cancelBtn.textContent = cancelLabel;
    cancelBtn.addEventListener('click', () => close());

    submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = danger
      ? 'flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60'
      : 'flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60';
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
    wrap.className = 'text-sm leading-relaxed text-mute-600';
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
 * fields: [{ name, label, type, options, required, placeholder, help, value, colSpan, min, max, step, rows, readonly, onChange, onInput }]
 * type: text | textarea | number | select | multiselect | checkbox | password | tags | selectAddable
 * `onChange(value, formApi)` è supportato sui checkbox, per campi dipendenti;
 * `onInput(value, formApi)` sugli altri campi, per ricalcoli live.
 * @returns {{ node: HTMLElement, getValues: Function, setFieldError: Function, setDisabled: Function, setHidden: Function, setValue: Function }}
 */
export function buildForm(fields, values = {}) {
  const form = document.createElement('form');
  form.className = 'grid grid-cols-2 gap-4';
  form.addEventListener('submit', (e) => e.preventDefault());

  const refs = {};
  const formApi = {};

  for (const f of fields) {
    const col = document.createElement('div');
    col.className = (f.colSpan === 1 ? 'col-span-2 sm:col-span-1' : 'col-span-2') + ' space-y-1.5';

    const current = values[f.name] !== undefined ? values[f.name] : f.value;

    if (f.type === 'checkbox') {
      const label = document.createElement('label');
      label.className =
        'flex cursor-pointer items-center gap-2.5 rounded-lg border border-stone-200 px-3.5 py-2.5';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'h-4 w-4 rounded border-stone-300 text-brand focus:ring-brand';
      input.checked = Boolean(current);
      if (f.onChange) input.addEventListener('change', () => f.onChange(input.checked, formApi));
      const span = document.createElement('span');
      span.className = 'text-sm font-medium text-mute-600';
      span.textContent = f.label;
      label.appendChild(input);
      label.appendChild(span);
      col.appendChild(label);
      refs[f.name] = { input, field: f, col };
      form.appendChild(col);
      continue;
    }

    const labelEl = document.createElement('label');
    labelEl.className = 'block text-sm font-medium text-mute-600';
    labelEl.textContent = f.label + (f.required ? ' *' : '');
    col.appendChild(labelEl);

    let input;
    const baseCls =
      'w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';

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
    } else if (f.type === 'tags') {
      input = buildTagsInput(f, current);
    } else if (f.type === 'selectAddable') {
      input = buildSelectAddable(f, current, baseCls);
    } else {
      input = document.createElement('input');
      input.type = f.type === 'password' ? 'password' : f.type === 'number' ? 'number' : 'text';
      input.className = baseCls + (f.readonly ? ' bg-canvas text-mute-400' : '');
      if (f.readonly) input.readOnly = true;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.min != null) input.min = f.min;
      if (f.max != null) input.max = f.max;
      if (f.step != null) input.step = f.step;
      if (current != null) input.value = current;
      if (input.type === 'number') {
        // Normalizza al blur input parziali tipo "0." che il browser espone
        // come stringa vuota/badInput e resterebbero non parsabili al submit.
        input.addEventListener('blur', () => {
          const n = input.valueAsNumber;
          input.value = Number.isFinite(n) ? String(n) : '';
        });
      }
    }

    if (typeof f.onInput === 'function') {
      input.addEventListener('input', (e) => f.onInput(e.target.value, formApi));
    }

    col.appendChild(input);

    if (f.help) {
      const help = document.createElement('p');
      help.className = 'text-xs text-mute-400';
      help.textContent = f.help;
      col.appendChild(help);
    }

    const errEl = document.createElement('p');
    errEl.className = 'hidden text-xs text-red-500';
    col.appendChild(errEl);

    refs[f.name] = { input, field: f, errEl, col };
    form.appendChild(col);
  }

  function getValues() {
    const out = {};
    for (const [name, { input, field }] of Object.entries(refs)) {
      if (field.type === 'checkbox') {
        out[name] = input.checked;
      } else if (field.type === 'number') {
        const n = input.valueAsNumber;
        out[name] = Number.isFinite(n) ? n : null;
      } else if (field.type === 'multiselect') {
        out[name] = Array.from(input.selectedOptions).map((o) => o.value);
      } else if (field.type === 'tags') {
        out[name] = input.getTags();
      } else if (field.type === 'selectAddable') {
        out[name] = input.getValue();
      } else {
        const v = input.value.trim();
        out[name] = v === '' ? '' : v;
      }
    }
    return out;
  }

  // Abilita/disabilita un campo. I tipi compositi espongono un proprio
  // setDisabled.
  function setDisabled(name, disabled) {
    const ref = refs[name];
    if (!ref) return;
    if (typeof ref.input.setDisabled === 'function') {
      ref.input.setDisabled(disabled);
      return;
    }
    ref.input.disabled = disabled;
    ref.input.classList.toggle('bg-stone-100', disabled);
    ref.input.classList.toggle('text-mute-400', disabled);
    ref.input.classList.toggle('cursor-not-allowed', disabled);
  }

  // Mostra/nasconde un campo intero, label e help compresi (usato per
  // dipendenze da checkbox, es. prezzo/valuta visibili solo se non gratuito).
  function setHidden(name, hidden) {
    const ref = refs[name];
    if (ref) ref.col.classList.toggle('hidden', hidden);
  }

  // Imposta programmaticamente il valore di un campo (es. campi calcolati).
  function setValue(name, value) {
    const ref = refs[name];
    if (!ref) return;
    if (ref.field.type === 'checkbox') ref.input.checked = Boolean(value);
    else if ('value' in ref.input) ref.input.value = value == null ? '' : value;
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

  Object.assign(formApi, { node: form, getValues, setFieldError, setDisabled, setHidden, setValue });
  return formApi;
}

// --- Campi compositi di buildForm --------------------------------------------

const CHIP_X_SVG =
  '<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';

/**
 * Input multi-valore a chip: Invio o virgola aggiungono un valore, la X lo
 * rimuove. getTags() ritorna l'array di stringhe.
 */
function buildTagsInput(f, current) {
  const wrap = document.createElement('div');
  wrap.className =
    'flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 px-2 py-1.5 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20';
  const entry = document.createElement('input');
  entry.type = 'text';
  entry.placeholder = f.placeholder || 'Aggiungi e premi Invio…';
  entry.className = 'min-w-[8rem] flex-1 border-0 bg-transparent px-1.5 py-1 text-sm outline-none';
  wrap.appendChild(entry);

  const tags = Array.isArray(current) ? current.filter(Boolean).map(String) : [];

  function renderChips() {
    wrap.querySelectorAll('[data-chip]').forEach((c) => c.remove());
    tags.forEach((tag, i) => {
      const chip = document.createElement('span');
      chip.dataset.chip = '';
      chip.className =
        'inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark';
      const text = document.createElement('span');
      text.textContent = tag;
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'text-brand-dark/60 transition hover:text-brand-dark';
      rm.innerHTML = CHIP_X_SVG;
      rm.addEventListener('click', () => {
        tags.splice(i, 1);
        renderChips();
      });
      chip.append(text, rm);
      wrap.insertBefore(chip, entry);
    });
  }

  function commit() {
    const parts = entry.value.split(',').map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (!tags.includes(p)) tags.push(p);
    }
    entry.value = '';
    renderChips();
  }

  entry.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && entry.value === '' && tags.length) {
      tags.pop();
      renderChips();
    }
  });
  entry.addEventListener('blur', commit);

  renderChips();

  wrap.getTags = () => {
    commit();
    return [...tags];
  };
  wrap.setDisabled = (disabled) => {
    entry.disabled = disabled;
    wrap.classList.toggle('pointer-events-none', disabled);
    wrap.classList.toggle('bg-stone-100', disabled);
    wrap.classList.toggle('opacity-60', disabled);
  };
  return wrap;
}

/**
 * Select sui valori esistenti con "+" per aggiungere al volo un nuovo valore
 * tramite input inline. getValue() ritorna la stringa scelta o digitata.
 */
function buildSelectAddable(f, current, baseCls) {
  const wrap = document.createElement('div');
  wrap.className = 'flex items-stretch gap-2';

  const select = document.createElement('select');
  select.className = baseCls;
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = f.placeholder || '—';
  select.appendChild(empty);
  const options = [...(f.options || [])];
  if (current && !options.some((o) => String(o.value) === String(current))) {
    options.push({ value: current, label: current });
  }
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    if (String(current) === String(o.value)) opt.selected = true;
    select.appendChild(opt);
  }

  const entry = document.createElement('input');
  entry.type = 'text';
  entry.placeholder = 'Nuovo valore…';
  entry.className = baseCls + ' hidden';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.title = 'Aggiungi nuovo valore';
  toggle.className =
    'shrink-0 rounded-lg border border-stone-300 px-3 text-sm font-semibold text-mute-600 transition hover:bg-stone-100';
  toggle.textContent = '+';

  let addingNew = false;
  toggle.addEventListener('click', () => {
    addingNew = !addingNew;
    select.classList.toggle('hidden', addingNew);
    entry.classList.toggle('hidden', !addingNew);
    toggle.textContent = addingNew ? '×' : '+';
    toggle.title = addingNew ? 'Torna ai valori esistenti' : 'Aggiungi nuovo valore';
    if (addingNew) entry.focus();
  });

  wrap.append(select, entry, toggle);

  wrap.getValue = () => (addingNew ? entry.value.trim() : select.value);
  wrap.setDisabled = (disabled) => {
    select.disabled = disabled;
    entry.disabled = disabled;
    toggle.disabled = disabled;
    wrap.classList.toggle('opacity-60', disabled);
  };
  return wrap;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
