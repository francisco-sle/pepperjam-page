// Looking up messages in a language's dictionary (src/i18n/locales/*.json).
// Plain functions, no React, so the key checker script can share them.

/** The value at a dotted key such as 'about.skills.comics' (undefined if there isn't one). */
export function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

/** Fills the {placeholders} in a message: interpolate('Hi {name}', { name: 'Pep' }). */
export function interpolate(message, vars) {
  if (!vars) return message
  return message.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

/** The {placeholders} a message uses, sorted. */
export function placeholders(message) {
  return [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
}

/**
 * A `t(key, vars)` function for one dictionary. Keys it doesn't have come
 * from `fallback` (the default language) and are reported to `onMissing`;
 * keys neither has come back as the key itself, so they're easy to spot.
 * Strings get their placeholders filled; lists and groups of messages
 * (e.g. the paragraphs of the bio) are returned as they are.
 */
export function createTranslator(dict, fallback, onMissing) {
  return (key, vars) => {
    let value = lookup(dict, key)
    if (value === undefined) {
      onMissing?.(key)
      value = lookup(fallback, key)
    }
    if (value === undefined) return key
    return typeof value === 'string' ? interpolate(value, vars) : value
  }
}
