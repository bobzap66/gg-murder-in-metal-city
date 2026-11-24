/** Render a read-only evidence card from explicitly selected display data.
 * This is a DOM helper, not a Foundry application or a permissions boundary.
 * Never pass private GM notes or unrevealed evidence to a player-facing card.
 */
export function renderEvidenceCard(template, values = {}, options = {}) {
  const doc = options.document ?? globalThis.document;
  const base = options.assetBase ?? 'modules/gg-murder-in-metal-city/';
  if (!doc || !template || !Array.isArray(template.fields)) throw new TypeError('A template and document are required');
  const element = (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  const card = element('article', 'gg-mimc-evidence-card');
  card.append(element('h2', 'gg-mimc-evidence-card__title', options.title ?? template.title));
  const body = element('div', 'gg-mimc-evidence-card__body');
  const image = element('img', 'gg-mimc-evidence-card__image');
  image.src = `${base.replace(/\/?$/, '/')}${template.image}`;
  image.alt = template.title;
  body.append(image);
  const fields = element('dl', 'gg-mimc-evidence-card__fields');
  for (const field of template.fields) {
    const value = Object.hasOwn(values, field.id) ? values[field.id] : '';
    const entry = element('div', 'gg-mimc-evidence-card__field');
    entry.append(element('dt', '', field.label), element('dd', '', value == null || value === '' ? '—' : value));
    fields.append(entry);
  }
  body.append(fields);
  card.append(body);
  return card;
}
