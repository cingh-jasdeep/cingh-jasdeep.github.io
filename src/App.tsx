import { useEffect, useState, type ReactNode } from 'react'
import { formatDate, formatRange, strings, type Lang, type Strings } from './i18n'
import { getProfile } from './profile'

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

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const t = strings[lang]
  const p = getProfile(lang)

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

  return (
    <div className="page">
      <nav className="controls">
        <button onClick={toggleLang} title={t.switchLang} aria-label={t.switchLang} className="lang-btn">
          {t.langLabel}
        </button>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? t.themeToLight : t.themeToDark}
          aria-label={theme === 'dark' ? t.themeToLight : t.themeToDark}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </nav>

      <header className="hero">
        <h1>{p.name}</h1>
        {p.headline && <p className="headline">{p.headline}</p>}
        {p.location && <p className="muted">{p.location}</p>}
        {p.links.length > 0 && (
          <ul className="links">
            {p.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>

      <main>
        {p.summary && (
          <Section title={t.about}>
            <Text>{p.summary}</Text>
          </Section>
        )}

        {p.positions.length > 0 && (
          <Section title={t.experience}>
            {p.positions.map((x, i) => (
              <Entry
                key={i}
                title={x.title}
                subtitle={[x.company, x.location].filter(Boolean).join(' · ')}
                date={formatRange(x.start, x.end, lang)}
                body={x.description}
              />
            ))}
          </Section>
        )}

        {p.education.length > 0 && (
          <Section title={t.education}>
            {p.education.map((x, i) => (
              <Entry
                key={i}
                title={x.school}
                subtitle={x.degree}
                date={formatRange(x.start, x.end, lang, false)}
                body={[x.notes, x.activities && `${t.activities}: ${x.activities}`].filter(Boolean).join('\n\n')}
              />
            ))}
          </Section>
        )}

        {p.projects.length > 0 && (
          <Section title={t.projects}>
            {p.projects.map((x, i) => (
              <Entry
                key={i}
                title={x.title}
                href={x.url}
                date={formatRange(x.start, x.end, lang)}
                body={x.description}
              />
            ))}
          </Section>
        )}

        {p.certifications.length > 0 && (
          <Section title={t.certifications}>
            {p.certifications.map((x, i) => (
              <Entry
                key={i}
                title={x.name}
                subtitle={x.authority}
                date={formatDate(x.start, lang)}
                link={x.url ? { url: x.url, label: t.credential } : undefined}
              />
            ))}
          </Section>
        )}

        {p.volunteering.length > 0 && (
          <Section title={t.volunteering}>
            {p.volunteering.map((x, i) => (
              <Entry
                key={i}
                title={x.role}
                subtitle={[x.organization, x.cause].filter(Boolean).join(' · ')}
                date={formatRange(x.start, x.end, lang)}
                body={x.description}
              />
            ))}
          </Section>
        )}

        {p.honors.length > 0 && (
          <Section title={t.honors}>
            {p.honors.map((x, i) => (
              <Entry key={i} title={x.title} date={formatDate(x.issued, lang)} body={x.description} />
            ))}
          </Section>
        )}

        {p.skills.length > 0 && (
          <Section title={t.skills}>
            <ul className="tags">
              {p.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Section>
        )}

        {p.languages.length > 0 && (
          <Section title={t.languages}>
            <ul className="plain">
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="section-body">{children}</div>
    </section>
  )
}

function Entry(props: {
  title: string
  subtitle?: string
  date?: string
  body?: string
  href?: string
  link?: { url: string; label: string }
}) {
  const { title, subtitle, date, body, href, link } = props
  return (
    <article className="entry">
      <div className="entry-head">
        <h3>
          {href ? (
            <a href={href} target="_blank" rel="noreferrer">
              {title} ↗
            </a>
          ) : (
            title
          )}
        </h3>
        {date && <span className="date">{date}</span>}
      </div>
      {subtitle && <p className="muted">{subtitle}</p>}
      {body && <Text>{body}</Text>}
      {link && (
        <a className="small-link" href={link.url} target="_blank" rel="noreferrer">
          {link.label} ↗
        </a>
      )}
    </article>
  )
}

/** Preserves LinkedIn's line breaks and bullet lines. */
function Text({ children }: { children: string }) {
  return (
    <div className="text">
      {children
        .split(/\n{2,}/)
        .map((para, i) => (
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
