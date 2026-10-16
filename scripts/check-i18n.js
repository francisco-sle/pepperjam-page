// Checks that every dictionary in src/i18n/locales says the same things as
// en.json (same keys, same {placeholders}, same number of list items), and
// that every gallery piece, shop item, market, skill, fact, section and
// social link in src/content has its words in each of them.
//
//   npm run i18n:check
import { readFileSync, readdirSync } from 'node:fs'
import { about } from '../src/content/about.js'
import { gallery } from '../src/content/gallery.js'
import { markets, merch } from '../src/content/merch.js'
import { sections, site } from '../src/content/site.js'
import { lookup, placeholders } from '../src/i18n/translate.js'

const DIR = new URL('../src/i18n/locales/', import.meta.url)
const BASE = 'en'

const dicts = Object.fromEntries(
  readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace('.json', ''), JSON.parse(readFileSync(new URL(f, DIR), 'utf8'))]),
)

// every message in a dictionary, as { 'about.bio.0': 'I draw…' }
function flatten(node, prefix = '', out = {}) {
  if (node !== null && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
  } else {
    out[prefix] = node
  }
  return out
}

// keys the content files expect to find
const needed = [
  ...gallery.flatMap((g) => ['title', 'medium', 'note'].map((f) => `gallery.items.${g.id}.${f}`)),
  ...merch.flatMap((m) => ['name', 'kind', 'description'].map((f) => `merch.items.${m.id}.${f}`)),
  ...markets.flatMap((m) => ['name', 'place'].map((f) => `merch.markets.${m.id}.${f}`)),
  ...about.skills.map((s) => `about.skills.${s.id}`),
  ...about.facts.flatMap((id) => [`about.facts.${id}.label`, `about.facts.${id}.value`]),
  ...sections.map((s) => `sections.${s.id}`),
  ...site.socials.map((s) => `menu.social.${s.id}`),
]

const base = flatten(dicts[BASE])
let problems = 0
const report = (locale, msg) => {
  problems++
  console.error(`  ${locale}.json: ${msg}`)
}

for (const [locale, dict] of Object.entries(dicts)) {
  const flat = flatten(dict)
  for (const key of needed) {
    if (typeof lookup(dict, key) !== 'string') report(locale, `missing "${key}" (used in src/content)`)
  }
  if (locale === BASE) continue
  for (const [key, value] of Object.entries(base)) {
    if (!(key in flat)) report(locale, `missing "${key}"`)
    else if (typeof flat[key] !== typeof value) report(locale, `"${key}" should be a ${typeof value}`)
    else if (typeof value === 'string' && placeholders(value).join() !== placeholders(flat[key]).join()) {
      report(locale, `"${key}" should use {${placeholders(value).join('}, {')}}`)
    }
  }
  for (const key of Object.keys(flat)) {
    if (!(key in base)) report(locale, `"${key}" isn't in ${BASE}.json`)
  }
}

if (problems) {
  console.error(`\n${problems} problem${problems === 1 ? '' : 's'} in the dictionaries`)
  process.exit(1)
}
console.log(`Dictionaries OK: ${Object.keys(dicts).join(', ')} (${Object.keys(base).length} messages each)`)
