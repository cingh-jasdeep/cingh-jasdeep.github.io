import { useEffect, useRef, useState, type ReactNode } from 'react'
import siteJson from './data/site.json'
import { formatDate, formatDuration, formatRange, strings, type Lang, type Strings } from './i18n'
import { getProfile } from './profile'
import type { Position, SiteConfig } from './types'

const site = siteJson as SiteConfig

type Theme = 'light' | 'dark'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage unavailable (private mode); the choice just won't persist.
  }
}

function initialLang(): Lang {
  const fromUrl = new URLSearchParams(location.search).get('lang')
  return (fromUrl ?? read('lang')) === 'pa' ? 'pa' : 'en'
}

function initialTheme(): Theme {
  const saved = read('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** "Bank of America" -> "BA", "Storipress" -> "St", "ਜਸਦੀਪ ਸਿੰਘ" -> "ਜਸ". */
function initials(name: string): string {
  if (/^\p{Script=Gurmukhi}/u.test(name)) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
  }
  const words = name.split(/[\s,]+/).filter((w) => /^[A-Z]/.test(w))
  if (words.length >= 2) return words[0][0] + words[1][0]
  const w = words[0] ?? name
  return w[0].toUpperCase() + (w[1] ?? '').toLowerCase()
}

/** Consecutive roles at the same company share one timeline node, as on LinkedIn. */
function groupByCompany(positions: Position[]) {
  const groups: { company: string; roles: Position[] }[] = []
  for (const p of positions) {
    const last = groups.at(-1)
    if (last && last.company === p.company) last.roles.push(p)
    else groups.push({ company: p.company, roles: [p] })
  }
  return groups
}

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const t = strings[lang]
  const p = getProfile(lang)
  const monogram = initials(p.name)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = p.headline ? `${p.name} · ${p.headline}` : p.name
  }, [lang, p.name, p.headline])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleLang = () => {
    const next = lang === 'en' ? 'pa' : 'en'
    setLang(next)
    write('lang', next)
    const url = new URL(location.href)
    url.searchParams.delete('lang')
    history.replaceState(null, '', url)
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    write('theme', next)
  }

  const nav = [
    p.summary && { id: 'about', label: t.about },
    p.positions.length && { id: 'experience', label: t.experience },
    p.projects.length && { id: 'projects', label: t.projects },
    p.education.length && { id: 'education', label: t.education },
    p.certifications.length && { id: 'certifications', label: t.certifications },
  ].filter((x): x is { id: string; label: string } => Boolean(x))

  return (
    <div className="page">
      <nav className="topbar">
        <a href="#top" className="monogram" aria-label={t.home}>
          {monogram}
        </a>
        <div className="topbar-links">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="nav-link">
              {n.label}
            </a>
          ))}
          <button onClick={toggleLang} title={t.switchLang} aria-label={t.switchLang} className="pill-btn lang-btn">
            {t.langLabel}
          </button>
          <button
            onClick={toggleTheme}
            className="pill-btn"
            title={theme === 'dark' ? t.themeToLight : t.themeToDark}
            aria-label={theme === 'dark' ? t.themeToLight : t.themeToDark}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>

      <header id="top" className="hero">
        <div className="avatar-ring">
          {site.photo ? (
            <img src={site.photo} alt={p.name} className="avatar" />
          ) : (
            <div className="avatar avatar-monogram" aria-hidden="true">
              {monogram}
            </div>
          )}
        </div>
        <div className="hero-text">
          {site.gurbani && <Gurbani text={site.gurbani.text} meaning={site.gurbani.meaning} />}
          <h1>{p.name}</h1>
          {p.headline && <p className="headline">{p.headline}</p>}
          {p.location && <p className="muted">{p.location}</p>}
          <div className="hero-actions">
            {site.resumeUrl && (
              <a className="btn btn-primary" href={site.resumeUrl} download>
                {t.resume}
              </a>
            )}
            {p.links.map((l) => (
              <a key={l.url} className="btn" href={l.url} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      </header>

      <main>
        {p.summary && (
          <Section id="about" title={t.about}>
            <Text className="lead">{p.summary}</Text>
          </Section>
        )}

        {p.positions.length > 0 && (
          <Section id="experience" title={t.experience}>
            <ol className="timeline">
              {groupByCompany(p.positions).map((g, i) => (
                <li key={i} className="timeline-item">
                  <span className="timeline-node" aria-hidden="true">
                    {initials(g.company)}
                  </span>
                  {g.roles.length > 1 && <p className="company company-group">{g.company}</p>}
                  {g.roles.map((r, j) => (
                    <div key={j} className="role">
                      <div className="entry-head">
                        <h3>{r.title}</h3>
                        <span className="date">
                          {formatRange(r.start, r.end, lang)}
                          {formatDuration(r.start, r.end, lang) && <> · {formatDuration(r.start, r.end, lang)}</>}
                        </span>
                      </div>
                      {g.roles.length === 1 && <p className="company">{r.company}</p>}
                      {r.location && <p className="muted small">{r.location}</p>}
                      {r.description && <Text>{r.description}</Text>}
                    </div>
                  ))}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {p.projects.length > 0 && (
          <Section id="projects" title={t.projects}>
            <div className="card-grid">
              {p.projects.map((x, i) => {
                const body = (
                  <>
                    {x.images && x.images.length > 0 && (
                      <span className="card-media">
                        {x.images.map((src) => (
                          <img key={src} src={src} alt="" loading="lazy" />
                        ))}
                      </span>
                    )}
                    <span className="card-title">{x.title}</span>
                    {formatRange(x.start, x.end, lang) && <span className="date">{formatRange(x.start, x.end, lang)}</span>}
                    {x.description && <span className="card-body">{x.description}</span>}
                    {x.url && <span className="card-link">{t.view} ↗</span>}
                  </>
                )
                return x.url ? (
                  <a key={i} className="card" href={x.url} target="_blank" rel="noreferrer">
                    {body}
                  </a>
                ) : (
                  <div key={i} className="card">
                    {body}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {p.education.length > 0 && (
          <Section id="education" title={t.education}>
            <div className="stack">
              {p.education.map((x, i) => (
                <article key={i}>
                  <div className="entry-head">
                    <h3>{x.school}</h3>
                    <span className="date">{formatRange(x.start, x.end, lang, false)}</span>
                  </div>
                  {x.degree && <p className="muted">{x.degree}</p>}
                  {x.notes && <Text>{x.notes}</Text>}
                  {x.activities && <Text>{`${t.activities}: ${x.activities}`}</Text>}
                </article>
              ))}
            </div>
          </Section>
        )}

        {p.certifications.length > 0 && (
          <Section id="certifications" title={t.certifications}>
            <div className="card-grid small-cards">
              {p.certifications.map((x, i) => (
                <div key={i} className="card cert">
                  <AwardIcon />
                  <div>
                    <div className="card-title">{x.name}</div>
                    {(x.authority || x.start) && (
                      <div className="muted small">{[x.authority, formatDate(x.start, lang)].filter(Boolean).join(' · ')}</div>
                    )}
                    {x.url && (
                      <a className="card-link" href={x.url} target="_blank" rel="noreferrer">
                        {t.credential} ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {p.volunteering.length > 0 && (
          <Section id="volunteering" title={t.volunteering}>
            <div className="stack">
              {p.volunteering.map((x, i) => (
                <article key={i}>
                  <div className="entry-head">
                    <h3>{x.role}</h3>
                    <span className="date">{formatRange(x.start, x.end, lang)}</span>
                  </div>
                  <p className="company">{[x.organization, x.cause].filter(Boolean).join(' · ')}</p>
                  {x.description && <Text>{x.description}</Text>}
                </article>
              ))}
            </div>
          </Section>
        )}

        {p.honors.length > 0 && (
          <Section id="honors" title={t.honors}>
            <div className="stack">
              {p.honors.map((x, i) => (
                <article key={i}>
                  <div className="entry-head">
                    <h3>{x.title}</h3>
                    <span className="date">{formatDate(x.issued, lang)}</span>
                  </div>
                  {x.description && <Text>{x.description}</Text>}
                </article>
              ))}
            </div>
          </Section>
        )}

        {p.skills.length > 0 && (
          <Section id="skills" title={t.skills}>
            <ul className="tags">
              {p.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Section>
        )}

        {p.languages.length > 0 && (
          <Section id="languages" title={t.languages}>
            <ul className="tags">
              {p.languages.map((l) => (
                <li key={l.name}>
                  {l.name}
                  {l.proficiency && <span className="muted"> · {l.proficiency}</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </main>

      <Footer t={t} name={p.name} />
    </div>
  )
}

/** Fades the section in the first time it scrolls into view (skipped for reduced motion via CSS). */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id={id} ref={ref} className={visible ? 'reveal is-visible' : 'reveal'}>
      <h2>
        <span className="dot" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * Gurbani line with its English meaning in a tooltip. Shows on hover or keyboard focus,
 * and toggles on tap, since touch screens have no hover (the native `title` tooltip is
 * slow on desktop and never shows on phones).
 */
function Gurbani({ text, meaning }: { text: string; meaning: string }) {
  const [open, setOpen] = useState(false)
  return (
    <p className="gurbani">
      <button
        type="button"
        className={open ? 'gurbani-line is-open' : 'gurbani-line'}
        lang="pa"
        aria-describedby="gurbani-meaning"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
      >
        {text}
        <span id="gurbani-meaning" role="tooltip" lang="en" className="gurbani-meaning">
          {meaning}
        </span>
      </button>
    </p>
  )
}

/** Preserves LinkedIn's paragraphs and line breaks. */
function Text({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className ? `text ${className}` : 'text'}>
      {children.split(/\n{2,}/).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  )
}

function Footer({ t, name }: { t: Strings; name: string }) {
  return (
    <footer>
      © {new Date().getFullYear()} {name} · {t.footer}
    </footer>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function AwardIcon() {
  return (
    <svg className="cert-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14 7 22l5-3 5 3-1.5-8" />
    </svg>
  )
}
