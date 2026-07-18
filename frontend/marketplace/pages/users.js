// Gestione utenti (solo super_admin).
import { users, museums } from '../api.js';
import { toast } from '../components/toast.js';
import { renderTable } from '../components/table.js';
import { buildForm, openModal, confirmDialog } from '../components/modal.js';
import {
  pageHeader,
  primaryButton,
  statusBadge,
  badge,
  searchInput,
  filterSelect,
  spinnerBlock,
  emptyState,
  iconButton,
  escapeHtml,
  icons,
} from '../components/ui.js';
import { USER_ROLES, USER_STATUS, ROLE_LABELS } from '../constants.js';

const state = { page: 1, search: '', role: '', status: '' };
let museumOptions = [];

export async function init() {
  Object.assign(state, { page: 1, search: '', role: '', status: '' });

  const headerEl = document.getElementById('users-header');
  const toolbarEl = document.getElementById('users-toolbar');
  const tableEl = document.getElementById('users-table');

  headerEl.appendChild(
    pageHeader({
      title: 'Utenti',
      subtitle: 'Gestione account, ruoli e assegnazione musei.',
      actions: primaryButton('Nuovo utente', () => openUserForm(null, () => load(tableEl)), {
        icon: icons.plus,
      }),
    })
  );

  const search = searchInput('Cerca per nome, username, email…', (v) => {
    state.search = v;
    state.page = 1;
    load(tableEl);
  });
  const role = filterSelect('Tutti i ruoli', USER_ROLES, (v) => {
    state.role = v;
    state.page = 1;
    load(tableEl);
  });
  const status = filterSelect('Tutti gli stati', USER_STATUS, (v) => {
    state.status = v;
    state.page = 1;
    load(tableEl);
  });
  toolbarEl.append(search.node, role.node, status.node);

  // Carica i musei per la multiselect di assegnazione.
  try {
    const m = await museums.list({ pageSize: 200, sortBy: 'name', sortOrder: 'asc' });
    museumOptions = (m.data || []).map((x) => ({ value: x.id, label: x.name }));
  } catch (err) {
    museumOptions = [];
    toast.error('Impossibile caricare i musei per l\'assegnazione: ' + (err.message || ''));
  }

  load(tableEl);
}

async function load(tableEl) {
  tableEl.innerHTML = '';
  tableEl.appendChild(spinnerBlock());
  try {
    const res = await users.list({
      page: state.page,
      pageSize: 20,
      sortBy: 'fullName',
      sortOrder: 'asc',
      search: state.search,
      role: state.role,
      status: state.status,
    });
    renderTable(tableEl, {
      columns: [
        {
          label: 'Utente',
          render: (u) =>
            `<div class="font-medium text-slate-900">${escapeHtml(u.fullName || u.username)}</div>` +
            `<div class="text-xs text-slate-400">@${escapeHtml(u.username)}</div>`,
        },
        { label: 'Email', render: (u) => escapeHtml(u.email || '') },
        {
          label: 'Ruolo',
          render: (u) =>
            u.role === 'super_admin'
              ? badge(ROLE_LABELS[u.role], 'bg-brand-100 text-brand-700')
              : badge(ROLE_LABELS[u.role] || u.role, 'bg-slate-100 text-slate-600'),
        },
        {
          label: 'Musei',
          render: (u) =>
            u.role === 'super_admin'
              ? '<span class="text-xs text-slate-400">tutti</span>'
              : `${(u.assignedMuseumIds || []).length}`,
        },
        { label: 'Stato', render: (u) => statusBadge(u.status) },
      ],
      rows: res.data || [],
      pagination: res.pagination,
      onPageChange: (p) => {
        state.page = p;
        load(tableEl);
      },
      rowActions: (u) => userActions(u, () => load(tableEl)),
      empty: {
        title: 'Nessun utente',
        message: 'Crea un nuovo account per autori o amministratori.',
        actionNode: primaryButton('Nuovo utente', () => openUserForm(null, () => load(tableEl)), {
          icon: icons.plus,
        }),
      },
    });
  } catch (err) {
    tableEl.innerHTML = '';
    tableEl.appendChild(emptyState({ title: 'Errore', message: err.message }));
  }
}

function userActions(u, reload) {
  const wrap = document.createElement('div');
  wrap.className = 'inline-flex gap-1.5';
  wrap.appendChild(iconButton(icons.edit, () => openUserForm(u, reload), { title: 'Modifica' }));

  const suspended = u.status === 'suspended';
  const toggleIcon = suspended
    ? '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
    : '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>';
  wrap.appendChild(
    iconButton(
      toggleIcon,
      async () => {
        const next = suspended ? 'active' : 'suspended';
        const ok = await confirmDialog({
          title: suspended ? 'Riattiva utente' : 'Sospendi utente',
          message: `${suspended ? 'Riattivare' : 'Sospendere'} <strong>${escapeHtml(u.fullName || u.username)}</strong>?`,
          confirmLabel: suspended ? 'Riattiva' : 'Sospendi',
          danger: !suspended,
        });
        if (!ok) return;
        try {
          await users.update(u.id, { status: next });
          toast.success(suspended ? 'Utente riattivato.' : 'Utente sospeso.');
          reload();
        } catch (err) {
          toast.error(err);
        }
      },
      { title: suspended ? 'Riattiva' : 'Sospendi', danger: !suspended }
    )
  );
  return wrap;
}

function openUserForm(user, reload) {
  const isNew = !user;
  const fields = [
    { name: 'fullName', label: 'Nome completo', required: true, value: user?.fullName },
    { name: 'username', label: 'Username', required: true, colSpan: 1, value: user?.username, readonly: !isNew, help: isNew ? '' : 'non modificabile' },
    { name: 'email', label: 'Email', required: true, colSpan: 1, value: user?.email },
    {
      name: 'password',
      label: isNew ? 'Password' : 'Nuova password',
      type: 'password',
      colSpan: 1,
      help: isNew ? 'minimo 8 caratteri' : 'lascia vuoto per non cambiarla',
    },
    { name: 'role', label: 'Ruolo', type: 'select', required: true, options: USER_ROLES, value: user?.role || 'author', colSpan: 1 },
    { name: 'status', label: 'Stato', type: 'select', required: true, options: USER_STATUS, value: user?.status || 'active', colSpan: 1 },
    { name: 'avatar', label: 'URL avatar', colSpan: 1, value: user?.avatar },
    {
      name: 'assignedMuseumIds',
      label: 'Musei assegnati',
      type: 'multiselect',
      options: museumOptions,
      value: user?.assignedMuseumIds || [],
      help: 'ignorato per i super admin (vedono tutti i musei)',
    },
    { name: 'notes', label: 'Note', type: 'textarea', rows: 2, value: user?.notes },
  ];
  const form = buildForm(fields);

  openModal({
    title: isNew ? 'Nuovo utente' : `Modifica ${user.username}`,
    content: form.node,
    submitLabel: isNew ? 'Crea utente' : 'Salva',
    size: 'lg',
    onSubmit: async () => {
      const v = form.getValues();
      if (!v.fullName) {
        form.setFieldError('fullName', 'Campo obbligatorio');
        throw new Error('Inserisci il nome completo.');
      }
      if (!v.email) {
        form.setFieldError('email', 'Campo obbligatorio');
        throw new Error('Inserisci l\'email.');
      }
      if (isNew) {
        if (!v.username) {
          form.setFieldError('username', 'Campo obbligatorio');
          throw new Error('Inserisci lo username.');
        }
        if (!v.password || v.password.length < 8) {
          form.setFieldError('password', 'Minimo 8 caratteri');
          throw new Error('La password deve avere almeno 8 caratteri.');
        }
      }

      const payload = {
        fullName: v.fullName,
        email: v.email,
        role: v.role,
        status: v.status,
        avatar: v.avatar || undefined,
        notes: v.notes || undefined,
        assignedMuseumIds: v.role === 'super_admin' ? [] : v.assignedMuseumIds || [],
      };
      if (v.password) payload.password = v.password;

      if (isNew) {
        payload.username = v.username;
        await users.create(payload);
        toast.success('Utente creato.');
      } else {
        await users.update(user.id, payload);
        toast.success('Utente aggiornato.');
      }
      reload();
    },
  });
}
