import { html } from './html.js';
import { ICONS } from './icon-data.js';

/** <Icon name="calendar" size=18 /> – Lucide-Icon als Inline-SVG (currentColor). */
export function Icon({ name, size = 18, stroke = 2, class: cls = '', title }) {
  const inner = ICONS[name] || ICONS['circle-help'];
  return html`<svg class=${'icon ' + cls} width=${size} height=${size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width=${stroke} stroke-linecap="round" stroke-linejoin="round"
    aria-hidden=${title ? undefined : 'true'} role=${title ? 'img' : undefined}
    dangerouslySetInnerHTML=${{ __html: (title ? `<title>${title}</title>` : '') + inner }}></svg>`;
}
export const ICON_NAMES = Object.keys(ICONS);
