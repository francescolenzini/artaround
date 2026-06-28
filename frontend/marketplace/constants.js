// Enum del backend riusati nelle select dell'editor. Allineati ai modelli
// Mongoose (vedi backend/src/models). Etichette in italiano per la UI.

export const ARTWORK_STATUS = [
  { value: 'draft', label: 'Bozza' },
  { value: 'published', label: 'Pubblicato' },
  { value: 'archived', label: 'Archiviato' },
];

export const ITEM_STATUS = [
  { value: 'draft', label: 'Bozza' },
  { value: 'published', label: 'Pubblicato' },
];

export const VISIT_STATUS = [
  { value: 'draft', label: 'Bozza' },
  { value: 'published', label: 'Pubblicato' },
  { value: 'archived', label: 'Archiviato' },
];

export const MUSEUM_STATUS = [
  { value: 'draft', label: 'Bozza' },
  { value: 'active', label: 'Attivo' },
  { value: 'archived', label: 'Archiviato' },
];

export const USER_ROLES = [
  { value: 'super_admin', label: 'Super admin' },
  { value: 'museum_curator', label: 'Curatore museo' },
];

export const USER_STATUS = [
  { value: 'active', label: 'Attivo' },
  { value: 'invited', label: 'Invitato' },
  { value: 'suspended', label: 'Sospeso' },
  { value: 'archived', label: 'Archiviato' },
];

export const FRUITION_LENGTH = [
  { value: '3s', label: '3 secondi' },
  { value: '15s', label: '15 secondi' },
  { value: '40s', label: '40 secondi' },
  { value: '1min', label: '1 minuto' },
  { value: '4min', label: '4 minuti' },
];

export const LANGUAGE_REGISTER = [
  { value: 'infantile', label: 'Infantile' },
  { value: 'elementare', label: 'Elementare' },
  { value: 'medio', label: 'Medio' },
  { value: 'avanzato', label: 'Avanzato' },
  { value: 'specialistico', label: 'Specialistico' },
];

export const STEP_TYPE = [
  { value: 'logistics_intro', label: 'Introduzione / logistica' },
  { value: 'main_item', label: 'Tappa principale' },
  { value: 'optional_item', label: 'Tappa opzionale' },
  { value: 'transition', label: 'Transizione' },
];

export const ROLE_LABELS = Object.fromEntries(USER_ROLES.map((r) => [r.value, r.label]));
export const REGISTER_LABELS = Object.fromEntries(LANGUAGE_REGISTER.map((r) => [r.value, r.label]));
export const LENGTH_LABELS = Object.fromEntries(FRUITION_LENGTH.map((r) => [r.value, r.label]));
export const STEP_TYPE_LABELS = Object.fromEntries(STEP_TYPE.map((r) => [r.value, r.label]));

export function labelFor(list, value) {
  const found = list.find((o) => o.value === value);
  return found ? found.label : value;
}

// Genera un id client-side per gli step delle visite (il backend li richiede).
export function clientId(prefix = 'step') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
