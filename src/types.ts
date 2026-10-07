/** Dates are "YYYY" or "YYYY-MM". A missing end date means "present". */
export interface Position {
  title: string
  company: string
  location?: string
  start?: string
  end?: string
  description?: string
}

export interface Education {
  school: string
  degree?: string
  start?: string
  end?: string
  notes?: string
  activities?: string
}

export interface Project {
  title: string
  description?: string
  url?: string
  start?: string
  end?: string
}

export interface Certification {
  name: string
  authority?: string
  url?: string
  licenseNumber?: string
  start?: string
  end?: string
}

export interface Volunteering {
  role: string
  organization: string
  cause?: string
  start?: string
  end?: string
  description?: string
}

export interface Honor {
  title: string
  issued?: string
  description?: string
}

export interface Language {
  name: string
  proficiency?: string
}

export interface Link {
  label: string
  url: string
}

export interface Profile {
  name: string
  headline?: string
  location?: string
  summary?: string
  links: Link[]
  positions: Position[]
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  volunteering: Volunteering[]
  honors: Honor[]
  skills: string[]
  languages: Language[]
}

/** Site-only extras that aren't on LinkedIn (src/data/site.json). */
export interface SiteConfig {
  gurbani?: { text: string; meaning: string } | null
  /** Path under public/, e.g. "photo.jpg". */
  photo?: string | null
  /** Path under public/, e.g. "resume.pdf". */
  resumeUrl?: string | null
}

type DeepPartial<T> = T extends (infer U)[]
  ? (DeepPartial<U> | null)[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

/** Optional Punjabi overrides, same shape as Profile; anything missing falls back to English. */
export type ProfileTranslation = DeepPartial<Profile>
