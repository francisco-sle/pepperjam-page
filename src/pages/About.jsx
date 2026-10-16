import { about } from '../content/about'
import Artwork from '../components/Artwork'
import Doodle from '../components/Doodle'
import { Mount, Scrap } from '../components/Scrapbook'
import './About.css'

export function AboutPortrait() {
  return (
    <div className="about-portrait">
      <h2 className="page-title">
        <Doodle kind="jar" size={30} /> About me
      </h2>
      <figure className="polaroid polaroid--big">
        <Mount kind="corners" color="var(--matcha)" />
        <Mount kind="tape" color="var(--cocoa)" />
        <Artwork src={about.image} alt="Portrait of Pepperjam" tint="peach" doodle="jar" label="your photo here" />
        <figcaption>{about.portraitCaption}</figcaption>
      </figure>
      <Doodle kind="frog" size={56} sticker className="sticker sticker--frog" />
      <Doodle kind="strawberry" size={40} sticker className="sticker sticker--berry" />
      <Doodle kind="sparkle" size={26} className="sticker sticker--spark1" />
      <Doodle kind="sparkle" size={18} className="sticker sticker--spark2" />
    </div>
  )
}

export function AboutBio() {
  return (
    <div className="about-bio">
      <Scrap
        kind="grid"
        torn={['top']}
        seed={7}
        className="dialogue"
        label={
          <div className="dialogue__head">
            <span className="name-plate">{about.name}</span>
            <span className="dialogue__role">{about.role}</span>
          </div>
        }
      >
        <h3 className="dialogue__greeting">{about.greeting}</h3>
        {about.bio.map((p) => (
          <p key={p.slice(0, 16)} className="dialogue__text">{p}</p>
        ))}

        <ul className="skills" aria-label="Skills">
          {about.skills.map((s) => (
            <li key={s.label}>
              <span className="skills__label">{s.label}</span>
              <span className="skills__hearts" aria-label={`${s.hearts} out of 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Heart key={i} filled={i < s.hearts} />
                ))}
              </span>
            </li>
          ))}
        </ul>

        <dl className="facts">
          {about.facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </Scrap>

      <a className="game-btn game-btn--rust about-cta" href={about.cta.href}>
        <Doodle kind="heart" size={22} /> {about.cta.label}
      </a>
    </div>
  )
}

function Heart({ filled }) {
  return (
    <svg viewBox="0 0 16 14" className={`heart ${filled ? 'is-filled' : ''}`} aria-hidden="true">
      <path d="M8 13 C8 13 1 8.5 1 4.5 A3.5 3.5 0 0 1 8 3 A3.5 3.5 0 0 1 15 4.5 C15 8.5 8 13 8 13Z" />
    </svg>
  )
}
