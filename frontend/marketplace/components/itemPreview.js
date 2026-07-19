// Preview in sola lettura di un ArtworkItem + modal di scelta tra candidati.
// Usata dal Visit Builder quando più item coprono la stessa coppia
// (opera, registro), ma riusabile ovunque serva mostrare un item senza editarlo.
import { openModal } from './modal.js';
import { escapeHtml } from './ui.js';
import { REGISTER_LABELS, LENGTH_LABELS } from '../constants.js';

/**
 * Card di sola lettura con i metadati e i testi di un item.
 * @param {object} item ArtworkItem
 * @returns {HTMLElement}
 */
export function itemPreviewCard(item) {
  const cls = item.classification || {};
  const content = item.content || {};

  const card = document.createElement('div');
  card.className = 'space-y-3 rounded-xl border border-stone-200 bg-white p-4';

  const badges = [
    { label: REGISTER_LABELS[cls.languageRegister] || cls.languageRegister, cls: 'bg-brand-light text-brand-dark' },
    cls.fruitionLength && { label: LENGTH_LABELS[cls.fruitionLength] || cls.fruitionLength, cls: 'bg-stone-100 text-mute-600' },
    { label: item.license || (item.isFree ? 'Gratuito' : 'Licenza non indicata'), cls: 'bg-stone-100 text-mute-600' },
  ].filter(Boolean);

  card.innerHTML = `
    <div>
      <p class="font-medium text-graphite">${escapeHtml(content.title || item.id)}</p>
      <div class="mt-1.5 flex flex-wrap gap-1.5">
        ${badges
          .map((b) => `<span class="rounded-full px-2.5 py-0.5 text-xs font-medium ${b.cls}">${escapeHtml(b.label)}</span>`)
          .join('')}
      </div>
    </div>
    ${previewText('Testo a schermo', content.screenText)}
    ${previewText('Testo per la sintesi vocale', content.ttsText)}`;
  return card;
}

function previewText(label, text) {
  return `
    <div>
      <p class="text-xs font-semibold uppercase tracking-wide text-mute-400">${label}</p>
      <p class="mt-1 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-lg bg-canvas px-3 py-2 text-sm leading-relaxed text-mute-600">${
        text ? escapeHtml(text) : '<span class="italic text-mute-400">Non presente</span>'
      }</p>
    </div>`;
}

/**
 * Modal di scelta tra più item candidati per lo stesso slot: elenco a sinistra
 * (radio), preview completa del candidato selezionato sotto.
 * @param {{candidates: object[], initialId?: string, title?: string, subtitle?: string}} opts
 * @returns {Promise<object|null>} l'item scelto, o null se annullato
 */
export function chooseItemWithPreview({ candidates, initialId, title = 'Scegli il contenuto', subtitle }) {
  return new Promise((resolve) => {
    let selected = candidates.find((c) => c.id === initialId) || candidates[0];
    let settled = false;

    const wrap = document.createElement('div');
    wrap.className = 'space-y-3';

    if (subtitle) {
      const p = document.createElement('p');
      p.className = 'text-sm text-mute-600';
      p.textContent = subtitle;
      wrap.appendChild(p);
    }

    const list = document.createElement('div');
    list.className = 'flex flex-wrap gap-2';
    const previewSlot = document.createElement('div');

    function renderChoices() {
      list.innerHTML = '';
      for (const c of candidates) {
        const active = c.id === selected.id;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = active
          ? 'rounded-lg border-2 border-brand bg-brand-light px-3 py-1.5 text-sm font-medium text-brand-dark'
          : 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-mute-600 transition hover:border-brand';
        btn.textContent = (c.content && c.content.title) || c.id;
        btn.addEventListener('click', () => {
          selected = c;
          renderChoices();
        });
        list.appendChild(btn);
      }
      previewSlot.innerHTML = '';
      previewSlot.appendChild(itemPreviewCard(selected));
    }
    renderChoices();

    wrap.append(list, previewSlot);

    openModal({
      title,
      content: wrap,
      size: 'lg',
      submitLabel: 'Assegna alla tappa',
      onSubmit: () => {
        settled = true;
        resolve(selected);
      },
    });

    // Chiusura senza conferma (X, ESC, backdrop) -> null.
    const observer = new MutationObserver(() => {
      if (!document.body.contains(wrap)) {
        if (!settled) resolve(null);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
