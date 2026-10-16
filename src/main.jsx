import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './pages/pages.css'
import App from './App'
import { I18nProvider } from './i18n'
import { installCursors } from './components/cursors'

installCursors()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
