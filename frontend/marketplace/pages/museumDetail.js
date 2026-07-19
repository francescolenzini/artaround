// Dettaglio / creazione / modifica museo.
import { museums, users, museumContext, auth } from '../api.js';
import { toast } from '../components/toast.js';
import { buildForm, confirmDialog } from '../components/modal.js';
import { pageHeader, spinnerBlock, icons } from '../components/ui.js';
import { MUSEUM_STATUS } from '../constants.js';

export async function init({ params }) {
  const isNew = params.id === 'new';
  const headerEl = document.getElementById('museum-detail-header');
  const bodyEl = document.getElementById('museum-detail-body');

  if (isNew && !auth.isSuperAdmin()) {
    toast.error('Solo gli amministratori possono creare musei.');
    location.hash = '#/museums';
    return;
  }

  bodyEl.appendChild(spinnerBlock());

  let museum = null;
  let curatorOptions = [];
  try {
    if (!isNew) museum = await museums.get(params.id);
    if (auth.isSuperAdmin()) {
      const u = await users.list({ role: 'author', pageSize: 100, status: 'active' });
      curatorOptions = (u.data || []).map((x) => ({ value: x.id, label: `${x.fullName} (${x.username})` }));
    }
  } catch (err) {
    bodyEl.innerHTML = `<p class="text-sm text-red-600">${err.message}</p>`;
    return;
  }

  headerEl.appendChild(
    pageHeader({
      title: isNew ? 'Nuovo museo' : museum.name,
      subtitle: isNew ? 'Compila i dati del museo.' : 'Modifica i dati del museo.',
    })
  );

  const fields = [
    { name: 'name', label: 'Nome', required: true, value: museum?.name },
    { name: 'shortName', label: 'Nome breve', colSpan: 1, value: museum?.shortName },
    { name: 'slug', label: 'Slug', colSpan: 1, required: true, value: museum?.slug, help: 'identificativo url, es. uffizi' },
    { name: 'status', label: 'Stato', type: 'select', required: true, options: MUSEUM_STATUS, value: museum?.status || 'draft', colSpan: 1 },
    { name: 'defaultLanguage', label: 'Lingua predefinita', required: true, value: museum?.defaultLanguage || 'it', colSpan: 1 },
    { name: 'shortDescription', label: 'Descrizione breve', type: 'textarea', required: true, rows: 2, value: museum?.shortDescription },
    { name: 'longDescription', label: 'Descrizione estesa', type: 'richtext', rows: 4, value: museum?.longDescription },
    { name: 'city', label: 'Città', required: true, colSpan: 1, value: museum?.city },
    { name: 'country', label: 'Paese', required: true, colSpan: 1, value: museum?.country },
    { name: 'address', label: 'Indirizzo', required: true, colSpan: 1, value: museum?.address },
    { name: 'postalCode', label: 'CAP', required: true, colSpan: 1, value: museum?.postalCode },
    { name: 'phone', label: 'Telefono', colSpan: 1, value: museum?.phone },
    { name: 'email', label: 'Email', colSpan: 1, value: museum?.email },
    { name: 'website', label: 'Sito web', value: museum?.website },
    { name: 'logo', label: 'URL logo', colSpan: 1, value: museum?.logo },
    { name: 'coverImage', label: 'URL immagine di copertina', colSpan: 1, value: museum?.coverImage },
    { name: 'supportedLanguages', label: 'Lingue supportate', value: (museum?.supportedLanguages || []).join(', '), help: 'separate da virgola, es. it, en' },
    { name: 'services', label: 'Servizi', value: (museum?.services || []).join(', '), help: 'separati da virgola' },
    { name: 'ticketInfo', label: 'Info biglietti', type: 'textarea', rows: 2, value: museum?.ticketInfo },
    { name: 'accessibilityNotes', label: 'Note accessibilità', type: 'textarea', rows: 2, value: museum?.accessibilityNotes },
  ];

  if (auth.isSuperAdmin() && curatorOptions.length) {
    fields.push({
      name: 'assignedCuratorIds',
      label: 'Curatori assegnati',
      type: 'multiselect',
      options: curatorOptions,
      value: museum?.assignedCuratorIds || [],
      help: 'tieni premuto Ctrl/Cmd per selezione multipla',
    });
  }

  const form = buildForm(fields);
  bodyEl.innerHTML = '';
  bodyEl.appendChild(form.node);

  const errBanner = document.createElement('p');
  errBanner.className = 'mt-4 hidden rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600';
  bodyEl.appendChild(errBanner);

  const footer = document.createElement('div');
  footer.className = 'mt-6 flex items-center justify-between border-t border-stone-100 pt-5';

  const right = document.createElement('div');
  right.className = 'flex gap-3';
  const cancel = document.createElement('button');
  cancel.className = 'rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-mute-600 hover:bg-stone-100';
  cancel.textContent = 'Annulla';
  cancel.addEventListener('click', () => (location.hash = '#/museums'));
  const save = document.createElement('button');
  save.className = 'rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60';
  save.textContent = isNew ? 'Crea museo' : 'Salva modifiche';
  right.append(cancel, save);

  // Elimina (solo super_admin, solo in modifica)
  if (!isNew && auth.isSuperAdmin()) {
    const del = document.createElement('button');
    del.className = 'inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50';
    del.innerHTML = icons.trash + '<span>Elimina</span>';
    del.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Elimina museo',
        message: `Eliminare <strong>${museum.name}</strong>? Le opere e le visite collegate potrebbero restare orfane.`,
        confirmLabel: 'Elimina',
        danger: true,
      });
      if (!ok) return;
      try {
        await museums.remove(museum.id);
        if (museumContext.id === museum.id) museumContext.clear();
        toast.success('Museo eliminato.');
        location.hash = '#/museums';
      } catch (err) {
        toast.error(err);
      }
    });
    footer.appendChild(del);
  } else {
    footer.appendChild(document.createElement('span'));
  }
  footer.appendChild(right);
  bodyEl.appendChild(footer);

  save.addEventListener('click', async () => {
    errBanner.classList.add('hidden');
    const v = form.getValues();
    // Validazione campi obbligatori
    const requiredFields = ['name', 'slug', 'status', 'defaultLanguage', 'shortDescription', 'city', 'country', 'address', 'postalCode'];
    const missing = requiredFields.filter((k) => !v[k]);
    if (missing.length) {
      missing.forEach((k) => form.setFieldError(k, 'Campo obbligatorio'));
      errBanner.textContent = 'Compila i campi obbligatori evidenziati.';
      errBanner.classList.remove('hidden');
      return;
    }
    // Normalizza array da CSV
    const payload = {
      ...v,
      supportedLanguages: csv(v.supportedLanguages),
      services: csv(v.services),
    };
    if (!Array.isArray(payload.assignedCuratorIds)) delete payload.assignedCuratorIds;

    save.disabled = true;
    save.textContent = 'Salvataggio…';
    try {
      if (isNew) {
        const created = await museums.create(payload);
        toast.success('Museo creato.');
        museumContext.set(created);
        location.hash = '#/content';
      } else {
        await museums.update(museum.id, payload);
        if (museumContext.id === museum.id) museumContext.set({ ...museum, ...payload });
        toast.success('Modifiche salvate.');
        location.hash = '#/museums';
      }
    } catch (err) {
      errBanner.textContent = err.message || 'Salvataggio non riuscito.';
      errBanner.classList.remove('hidden');
      save.disabled = false;
      save.textContent = isNew ? 'Crea museo' : 'Salva modifiche';
    }
  });
}

function csv(str) {
  if (!str) return [];
  return String(str)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
