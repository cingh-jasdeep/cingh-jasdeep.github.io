import base from './data/profile.json'
import paOverrides from './data/profile.pa.json'
import type { Lang } from './i18n'
import type { Profile, ProfileTranslation } from './types'

const en = base as Profile

/** Deep-merges translated fields over the English profile; arrays merge by index. */
function merge<T>(target: T, patch: unknown): T {
  if (patch == null) return target
  if (Array.isArray(target)) {
    const p = Array.isArray(patch) ? patch : []
    return target.map((item, i) => merge(item, p[i])) as T
  }
  if (typeof target === 'object' && target !== null && typeof patch === 'object') {
    const out = { ...target } as Record<string, unknown>
    for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
      out[k] = k in out ? merge(out[k], v) : v
    }
    return out as T
  }
  return (patch === '' ? target : patch) as T
}

const pa = merge(en, paOverrides as ProfileTranslation)

export function getProfile(lang: Lang): Profile {
  return lang === 'pa' ? pa : en
}
