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
  { value: 'author', label: 'Autore' },
  { value: 'visitor', label: 'Visitatore' },
];

export const USER_STATUS = [
  { value: 'active', label: 'Attivo' },
  { value: 'invited', label: 'Invitato' },
  { value: 'suspended', label: 'Sospeso' },
  { value: 'archived', label: 'Archiviato' },
];

// La durata di fruizione è persistita come stringa '{n}min' a minuti interi;
// nell'editor si inserisce come numero di minuti. I valori legacy in secondi
// ('15s', '40s'…) vengono ancora letti (arrotondati al minuto, minimo 1).
const FRUITION_RE = /^(\d+(?:\.\d+)?)(s|min)$/;

export function fruitionToMinutes(value) {
  const m = FRUITION_RE.exec(String(value || '').trim());
  if (!m) return null;
  const n = Number(m[1]);
  return Math.max(1, Math.round(m[2] === 's' ? n / 60 : n));
}

export function minutesToFruition(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return undefined;
  const n = Math.round(minutes);
  return n >= 1 ? `${n}min` : undefined;
}

export function fruitionLabel(value) {
  const m = FRUITION_RE.exec(String(value || '').trim());
  if (!m) return value ? String(value) : '';
  const n = Number(m[1]);
  const num = String(n).replace('.', ',');
  if (m[2] === 's') return n === 1 ? '1 secondo' : `${num} secondi`;
  return n === 1 ? '1 minuto' : `${num} minuti`;
}

export const LANGUAGE_REGISTER = [
  { value: 'infantile', label: 'Infantile' },
  { value: 'elementare', label: 'Elementare' },
  { value: 'medio', label: 'Medio' },
  { value: 'avanzato', label: 'Avanzato' },
  { value: 'specialistico', label: 'Specialistico' },
];

// Lingue dei contenuti (codice ISO 639-1 → nome leggibile per la UI).
// Set pragmatico per contenuti museali multilingua — le principali lingue dei
// visitatori internazionali, non l'intera ISO 639-1, per tenere la tendina
// usabile: it/en in testa, il resto in ordine alfabetico di etichetta.
export const LANGUAGES = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'Inglese' },
  { value: 'ar', label: 'Arabo' },
  { value: 'bg', label: 'Bulgaro' },
  { value: 'cs', label: 'Ceco' },
  { value: 'zh', label: 'Cinese' },
  { value: 'ko', label: 'Coreano' },
  { value: 'hr', label: 'Croato' },
  { value: 'da', label: 'Danese' },
  { value: 'he', label: 'Ebraico' },
  { value: 'fi', label: 'Finlandese' },
  { value: 'fr', label: 'Francese' },
  { value: 'ja', label: 'Giapponese' },
  { value: 'el', label: 'Greco' },
  { value: 'hi', label: 'Hindi' },
  { value: 'no', label: 'Norvegese' },
  { value: 'nl', label: 'Olandese' },
  { value: 'pl', label: 'Polacco' },
  { value: 'pt', label: 'Portoghese' },
  { value: 'ro', label: 'Rumeno' },
  { value: 'ru', label: 'Russo' },
  { value: 'sk', label: 'Slovacco' },
  { value: 'sl', label: 'Sloveno' },
  { value: 'es', label: 'Spagnolo' },
  { value: 'sv', label: 'Svedese' },
  { value: 'de', label: 'Tedesco' },
  { value: 'tr', label: 'Turco' },
  { value: 'uk', label: 'Ucraino' },
  { value: 'hu', label: 'Ungherese' },
];

// Valute supportate per il prezzo degli item (ISO 4217): principali valute
// internazionali più le europee extra-euro, EUR in testa.
export const CURRENCIES = [
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — Dollaro USA' },
  { value: 'GBP', label: 'GBP — Sterlina britannica' },
  { value: 'CHF', label: 'CHF — Franco svizzero' },
  { value: 'JPY', label: 'JPY — Yen giapponese' },
  { value: 'CNY', label: 'CNY — Renminbi cinese' },
  { value: 'AUD', label: 'AUD — Dollaro australiano' },
  { value: 'CAD', label: 'CAD — Dollaro canadese' },
  { value: 'SEK', label: 'SEK — Corona svedese' },
  { value: 'NOK', label: 'NOK — Corona norvegese' },
  { value: 'DKK', label: 'DKK — Corona danese' },
  { value: 'PLN', label: 'PLN — Złoty polacco' },
  { value: 'CZK', label: 'CZK — Corona ceca' },
  { value: 'HUF', label: 'HUF — Fiorino ungherese' },
  { value: 'RON', label: 'RON — Leu rumeno' },
  { value: 'TRY', label: 'TRY — Lira turca' },
  { value: 'AED', label: 'AED — Dirham EAU' },
  { value: 'INR', label: 'INR — Rupia indiana' },
  { value: 'KRW', label: 'KRW — Won sudcoreano' },
  { value: 'BRL', label: 'BRL — Real brasiliano' },
  { value: 'MXN', label: 'MXN — Peso messicano' },
  { value: 'ZAR', label: 'ZAR — Rand sudafricano' },
];

export const STEP_TYPE = [
  { value: 'logistics_intro', label: 'Introduzione / logistica' },
  { value: 'main_item', label: 'Tappa principale' },
  { value: 'optional_item', label: 'Tappa opzionale' },
  { value: 'transition', label: 'Transizione' },
];

// Scala ordinata dei registri (dal più semplice al più specialistico): è
// l'ordine di LANGUAGE_REGISTER, riusato da builder e riepiloghi.
export const REGISTER_ORDER = LANGUAGE_REGISTER.map((r) => r.value);

export const ROLE_LABELS = Object.fromEntries(USER_ROLES.map((r) => [r.value, r.label]));
export const REGISTER_LABELS = Object.fromEntries(LANGUAGE_REGISTER.map((r) => [r.value, r.label]));
export const STEP_TYPE_LABELS = Object.fromEntries(STEP_TYPE.map((r) => [r.value, r.label]));
export const LANGUAGE_LABELS = Object.fromEntries(LANGUAGES.map((r) => [r.value, r.label]));

export function labelFor(list, value) {
  const found = list.find((o) => o.value === value);
  return found ? found.label : value;
}

// Genera un id client-side per gli step delle visite (il backend li richiede).
export function clientId(prefix = 'step') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
