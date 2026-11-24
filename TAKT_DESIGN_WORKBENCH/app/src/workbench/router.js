// Router-Helfer (Hash-Routing) – getrennt von app.js, damit Views ohne Zirkelimport navigieren können.
export const navigate = (hash) => { if (location.hash !== hash) location.hash = hash; };
export const featureHref = (id, tab) => `#/features/${encodeURIComponent(id)}${tab ? '/' + tab : ''}`;
export const moduleHref = (id) => `#/modules/${encodeURIComponent(id)}`;
export const studioHref = (id, variantId) => `#/studio/${encodeURIComponent(id)}${variantId ? '/' + encodeURIComponent(variantId) : ''}`;
