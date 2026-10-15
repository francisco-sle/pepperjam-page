import { createContext, useContext } from 'react'

// Shared state that page contents need. Page components get re-mounted while a
// leaf turns, so anything that should survive a flip lives up here instead.
export const SiteContext = createContext(null)

export const useSite = () => useContext(SiteContext)
