import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './locales/en.json'
import es from './locales/es.json'
import { createTranslator } from './translate'
import { load, save } from '../hooks/storage'

// Every language the site speaks: one dictionary file each in ./locales.
// `name` is written in its own language, so visitors can find theirs
// whichever one the page is in. `intl` is the regional variant used to
// format numbers and dates (es-MX writes prices as "$6", plain es as "6 $").
export const LOCALES = {
  en: { name: 'English', intl: 'en-US', messages: en },
  es: { name: 'Español', intl: 'es-MX', messages: es },
}

// Also the fallback for anything a dictionary is missing.
export const DEFAULT_LOCALE = 'en'

const STORAGE_KEY = 'pj:lang'

// The visitor's earlier pick, else the first of their browser languages we speak.
function detectLocale() {
  const saved = load(STORAGE_KEY, null)
  if (Object.hasOwn(LOCALES, saved ?? '')) return saved
  const wanted = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of wanted) {
    const base = tag?.toLowerCase().split('-')[0]
    if (Object.hasOwn(LOCALES, base ?? '')) return base
  }
  return DEFAULT_LOCALE
}

// Say so (once per key) when a dictionary is missing something, while developing.
const reported = new Set()
const reportMissing = (locale) => (key) => {
  if (!import.meta.env.DEV || reported.has(`${locale}:${key}`)) return
  reported.add(`${locale}:${key}`)
  console.warn(`[i18n] "${key}" is missing from ${locale}.json, showing ${DEFAULT_LOCALE}`)
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale)

  const setLocale = useCallback((next) => {
    if (!Object.hasOwn(LOCALES, next)) return
    setLocaleState(next)
    save(STORAGE_KEY, next)
  }, [])

  const value = useMemo(() => {
    const { intl, messages } = LOCALES[locale]
    const t = createTranslator(messages, LOCALES[DEFAULT_LOCALE].messages, reportMissing(locale))
    const formatPrice = (amount, currency) =>
      new Intl.NumberFormat(intl, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        trailingZeroDisplay: 'stripIfInteger',
      }).format(amount)
    const formatDate = (date, options) => new Intl.DateTimeFormat(intl, options).format(date)
    const formatDateParts = (date, options) => new Intl.DateTimeFormat(intl, options).formatToParts(date)
    return { locale, setLocale, t, formatPrice, formatDate, formatDateParts }
  }, [locale, setLocale])

  // Let the browser, search engines and screen readers know too.
  useEffect(() => {
    document.documentElement.lang = locale
    document.title = value.t('meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', value.t('meta.description'))
  }, [locale, value])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** { locale, setLocale, t, formatPrice, formatDate, formatDateParts } */
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n() needs an <I18nProvider> above it')
  return ctx
}
