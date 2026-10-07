export type Lang = 'en' | 'pa'

const en = {
  about: 'About',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  volunteering: 'Volunteering',
  honors: 'Honors & awards',
  skills: 'Skills',
  languages: 'Languages',
  present: 'Present',
  credential: 'Credential',
  view: 'View',
  activities: 'Activities',
  resume: 'Download résumé',
  themeToLight: 'Switch to light mode',
  themeToDark: 'Switch to dark mode',
  switchLang: 'ਪੰਜਾਬੀ ਵਿੱਚ ਪੜ੍ਹੋ',
  langLabel: 'ਪੰ',
  home: 'Home',
  footer: 'Synced from LinkedIn',
  yr: (n: number) => `${n} ${n === 1 ? 'yr' : 'yrs'}`,
  mo: (n: number) => `${n} ${n === 1 ? 'mo' : 'mos'}`,
}

const pa: typeof en = {
  about: 'ਬਾਰੇ',
  experience: 'ਤਜਰਬਾ',
  education: 'ਸਿੱਖਿਆ',
  projects: 'ਪ੍ਰੋਜੈਕਟ',
  certifications: 'ਸਰਟੀਫਿਕੇਟ',
  volunteering: 'ਸੇਵਾ',
  honors: 'ਸਨਮਾਨ ਅਤੇ ਇਨਾਮ',
  skills: 'ਹੁਨਰ',
  languages: 'ਭਾਸ਼ਾਵਾਂ',
  present: 'ਹੁਣ ਤੱਕ',
  credential: 'ਸਰਟੀਫਿਕੇਟ ਵੇਖੋ',
  view: 'ਵੇਖੋ',
  activities: 'ਗਤੀਵਿਧੀਆਂ',
  resume: 'ਰੈਜ਼ਿਊਮੇ ਡਾਊਨਲੋਡ ਕਰੋ',
  themeToLight: 'ਲਾਈਟ ਮੋਡ',
  themeToDark: 'ਡਾਰਕ ਮੋਡ',
  switchLang: 'Read in English',
  langLabel: 'EN',
  home: 'ਮੁੱਖ ਪੰਨਾ',
  footer: 'LinkedIn ਤੋਂ ਲਿਆ ਗਿਆ',
  yr: (n: number) => `${n} ਸਾਲ`,
  mo: (n: number) => `${n} ${n === 1 ? 'ਮਹੀਨਾ' : 'ਮਹੀਨੇ'}`,
}

export const strings = { en, pa }
export type Strings = typeof en

// Hard-coded rather than Intl: browsers ship patchy Punjabi locale data.
const months: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  pa: ['ਜਨ', 'ਫ਼ਰ', 'ਮਾਰਚ', 'ਅਪ੍ਰੈ', 'ਮਈ', 'ਜੂਨ', 'ਜੁਲਾ', 'ਅਗ', 'ਸਤੰ', 'ਅਕਤੂ', 'ਨਵੰ', 'ਦਸੰ'],
}

/** Formats "YYYY" or "YYYY-MM" for the given language. */
export function formatDate(value: string | undefined, lang: Lang): string {
  if (!value) return ''
  const [y, m] = value.split('-').map(Number)
  if (!m) return String(y)
  return `${months[lang][m - 1]} ${y}`
}

export function formatRange(start: string | undefined, end: string | undefined, lang: Lang, ongoing = true): string {
  const s = formatDate(start, lang)
  const e = end ? formatDate(end, lang) : ongoing && s ? strings[lang].present : ''
  if (s && e && s !== e) return `${s} – ${e}`
  return s || e
}

/** LinkedIn-style duration ("3 yrs 4 mos"), counting both end months. Needs month precision. */
export function formatDuration(start: string | undefined, end: string | undefined, lang: Lang): string {
  const parse = (v: string) => v.split('-').map(Number)
  if (!start?.includes('-') || (end && !end.includes('-'))) return ''
  const [sy, sm] = parse(start)
  const now = new Date()
  const [ey, em] = end ? parse(end) : [now.getFullYear(), now.getMonth() + 1]
  const total = (ey - sy) * 12 + (em - sm) + 1
  if (total < 1) return ''
  const t = strings[lang]
  const y = Math.floor(total / 12)
  const m = total % 12
  return [y && t.yr(y), m && t.mo(m)].filter(Boolean).join(' ')
}
