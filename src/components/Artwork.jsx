import Doodle from './Doodle'
import { useI18n } from '../i18n'
import './Artwork.css'

// Shows the real image when `src` is set; otherwise a cute placeholder
// in the same color family so the layout still feels finished.
// The placeholder says "art coming soon" unless given another `label`
// (or `label={null}` for none).
export default function Artwork({ src, alt = '', tint = 'matcha', doodle = 'flower', label, className = '' }) {
  const { t } = useI18n()
  if (label === undefined) label = t('artwork.comingSoon')
  if (src) {
    return (
      <div className={`artwork ${className}`}>
        <img src={src} alt={alt} loading="lazy" draggable="false" />
      </div>
    )
  }
  return (
    <div className={`artwork artwork--placeholder tint-${tint} ${className}`} role="img" aria-label={alt || label}>
      <Doodle kind={doodle} className="artwork__doodle" />
      {label && <span className="artwork__label">{label}</span>}
    </div>
  )
}
