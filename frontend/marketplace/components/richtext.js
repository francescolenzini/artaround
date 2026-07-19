// Editor rich text minimale e helper condivisi per i campi editoriali
// (descrizioni di museo/opera/visita, testo a schermo degli item).
//
// Formato persistito: HTML minimo sanitizzato (p, br, strong, em, ul, li, a).
// I valori legacy in testo semplice restano validi: vengono convertiti in
// paragrafi al caricamento nell'editor e renderizzati con nl2br in lettura.
// Il campo TTS degli item resta testo semplice e NON usa questo componente.
import { escapeHtml } from './ui.js';

// Tag ammessi dopo la sanitizzazione; ogni altro tag viene "unwrappato"
// (si tengono i figli, si scarta il tag) così incolli da Word/web degradano
// con grazia invece di rompere il layout.
const ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'EM', 'UL', 'LI', 'A']);
const TAG_ALIASES = { B: 'STRONG', I: 'EM', DIV: 'P', OL: 'UL' };

// Classi per la resa tipografica del markup minimo (editor e viste in lettura
// condividono la stessa resa, così l'editing è davvero WYSIWYG).
export const RICH_TEXT_CLASS =
  '[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 ' +
  '[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 ' +
  '[&_a]:text-brand [&_a]:underline [&_strong]:font-semibold';

/** True se il valore contiene markup rich text (vs. testo semplice legacy). */
export function isRichText(value) {
  return /<(p|br|strong|em|ul|li|a)[\s/>]/i.test(String(value || ''));
}

/** Riduce HTML arbitrario al vocabolario minimo ammesso. */
export function sanitizeRichText(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html || '');
  const out = document.createElement('template');
  copySanitized(tpl.content, out.content);
  return out.innerHTML;
}

function copySanitized(source, target) {
  for (const child of source.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(child.nodeValue));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = TAG_ALIASES[child.tagName] || child.tagName;
    if (!ALLOWED_TAGS.has(tag)) {
      copySanitized(child, target); // unwrap: tieni il contenuto, scarta il tag
      continue;
    }
    const el = document.createElement(tag);
    if (tag === 'A') {
      const href = child.getAttribute('href') || '';
      if (/^(https?:|mailto:)/i.test(href)) {
        el.setAttribute('href', href);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
    }
    copySanitized(child, el);
    target.appendChild(el);
  }
}

/** Testo semplice dal valore (rich o legacy), per snippet, conteggi, TTS. */
export function richTextToPlain(value) {
  const s = String(value || '');
  if (!/[<>&]/.test(s)) return s;
  const tpl = document.createElement('template');
  // Chiusure di blocco -> newline, così i paragrafi non si incollano.
  tpl.innerHTML = s.replace(/<\/(p|li|ul)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
  return (tpl.content.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * HTML sicuro da iniettare nelle viste in lettura: sanitizza i valori rich,
 * fa escape + nl2br dei valori legacy in testo semplice.
 */
export function renderRichText(value) {
  const s = String(value || '');
  if (!s) return '';
  if (isRichText(s)) return sanitizeRichText(s);
  return escapeHtml(s).replace(/\n/g, '<br>');
}

const TOOLBAR_BTN_CLS =
  'rounded px-2 py-1 text-xs font-semibold text-mute-600 transition hover:bg-stone-200';
const TOOLBAR_BTN_ACTIVE_CLS = 'bg-stone-200 text-graphite';

/**
 * Editor WYSIWYG minimale su contenteditable (niente librerie, niente build):
 * grassetto, corsivo, lista puntata, link. Espone la stessa interfaccia dei
 * campi compositi di buildForm: getValue() / setValue() / setDisabled().
 * getValue() ritorna HTML sanitizzato, o '' se il contenuto è vuoto.
 */
export function buildRichTextEditor(f, current) {
  const wrap = document.createElement('div');
  wrap.className =
    'w-full rounded-lg border border-stone-300 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20';

  const toolbar = document.createElement('div');
  toolbar.className = 'flex items-center gap-1 border-b border-stone-200 bg-canvas px-2 py-1.5 rounded-t-lg';

  const editor = document.createElement('div');
  editor.contentEditable = 'true';
  editor.className = `w-full overflow-y-auto px-3.5 py-2.5 text-sm outline-none ${RICH_TEXT_CLASS}`;
  editor.style.minHeight = `${(f.rows || 3) * 1.75}rem`;
  editor.style.maxHeight = '20rem';
  if (f.placeholder) editor.dataset.placeholder = f.placeholder;
  editor.innerHTML = renderRichText(current);

  // A capo = nuovo <p> (non <div>); il fallback DIV->P della sanitizzazione
  // copre i browser che ignorano questo setting.
  document.execCommand('defaultParagraphSeparator', false, 'p');

  const buttons = [];
  function toolBtn({ label, title, command, queryState, run }) {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = title;
    b.className = TOOLBAR_BTN_CLS;
    b.innerHTML = label;
    // mousedown + preventDefault: non rubare la selezione all'editor.
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => {
      editor.focus();
      if (run) run();
      else document.execCommand(command);
      updateToolbar();
    });
    buttons.push({ node: b, queryState, command });
    toolbar.appendChild(b);
    return b;
  }

  toolBtn({ label: '<span class="font-bold">G</span>', title: 'Grassetto', command: 'bold', queryState: 'bold' });
  toolBtn({ label: '<span class="italic font-serif">C</span>', title: 'Corsivo', command: 'italic', queryState: 'italic' });
  toolBtn({
    label:
      '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12"/></svg>',
    title: 'Lista puntata',
    command: 'insertUnorderedList',
    queryState: 'insertUnorderedList',
  });
  toolBtn({
    label:
      '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m7.156-7.156l1.5-1.5a4 4 0 015.656 5.656l-3 3a4 4 0 01-5.656 0"/></svg>',
    title: 'Link (seleziona il testo, poi incolla l’URL)',
    run: () => {
      // Se la selezione è già in un link, il bottone lo rimuove.
      const anchor = currentAnchor();
      if (anchor) {
        document.execCommand('unlink');
        return;
      }
      const url = window.prompt('URL del link (https://…):');
      if (!url) return;
      const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
      document.execCommand('createLink', false, href);
    },
  });

  function currentAnchor() {
    const sel = window.getSelection();
    const node = sel && sel.anchorNode;
    if (!node || !editor.contains(node)) return null;
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return el ? el.closest('a') : null;
  }

  function updateToolbar() {
    for (const { node, queryState } of buttons) {
      let active = false;
      if (queryState) {
        try {
          active = document.queryCommandState(queryState);
        } catch {
          active = false;
        }
      }
      for (const cls of TOOLBAR_BTN_ACTIVE_CLS.split(' ')) node.classList.toggle(cls, active);
    }
  }
  // Niente listener su document (leak nelle modali): basta aggiornare lo stato
  // della toolbar sugli eventi locali dell'editor.
  for (const ev of ['keyup', 'mouseup', 'focus', 'input']) {
    editor.addEventListener(ev, updateToolbar);
  }

  // Incolla sempre come contenuto sanitizzato, mai HTML arbitrario.
  editor.addEventListener('paste', (e) => {
    const html = e.clipboardData && e.clipboardData.getData('text/html');
    if (!html) return; // testo semplice: lascia fare al browser
    e.preventDefault();
    document.execCommand('insertHTML', false, sanitizeRichText(html));
  });

  wrap.append(toolbar, editor);

  wrap.getValue = () => {
    const html = sanitizeRichText(editor.innerHTML);
    return richTextToPlain(html) === '' ? '' : html;
  };
  wrap.setValue = (v) => {
    editor.innerHTML = renderRichText(v);
  };
  wrap.setDisabled = (disabled) => {
    editor.contentEditable = disabled ? 'false' : 'true';
    for (const { node } of buttons) node.disabled = disabled;
    wrap.classList.toggle('bg-stone-100', disabled);
    wrap.classList.toggle('opacity-60', disabled);
    wrap.classList.toggle('pointer-events-none', disabled);
  };
  return wrap;
}
