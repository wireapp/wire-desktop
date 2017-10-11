window.locStrings = window.locStrings || {};
window.locStringsDefault = window.locStringsDefault || {};

export function getText(id) {
  return locStrings[id] || locStringsDefault[id] || id;
}
