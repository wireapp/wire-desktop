window.locStrings = window.locStrings || {};
window.locStringsDefault = window.locStringsDefault || {};

export const getText = id => locStrings[id] || locStringsDefault[id] || id;
