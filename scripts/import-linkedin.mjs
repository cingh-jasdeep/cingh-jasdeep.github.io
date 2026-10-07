#!/usr/bin/env node
// Converts LinkedIn's "Get a copy of your data" export into src/data/profile.json.
//
//   npm run import:linkedin -- path/to/Basic_LinkedInDataExport.zip
//   npm run import:linkedin -- path/to/extracted-folder
//
// Only public-profile fields are read; addresses, birth date, connections and
// messages in the export are ignored.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync, strFromU8 } from 'fflate'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'src/data/profile.json')

const input = process.argv[2]
if (!input || !existsSync(input)) {
  console.error('Usage: npm run import:linkedin -- <LinkedIn export .zip or folder>')
  process.exit(1)
}

/** Map of lowercased CSV basename -> file text. */
function loadFiles(path) {
  const files = new Map()
  if (statSync(path).isDirectory()) {
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) walk(full)
        else if (name.toLowerCase().endsWith('.csv')) files.set(name.toLowerCase(), readFileSync(full, 'utf8'))
      }
    }
    walk(path)
  } else {
    for (const [name, data] of Object.entries(unzipSync(readFileSync(path)))) {
      if (name.toLowerCase().endsWith('.csv')) files.set(basename(name).toLowerCase(), strFromU8(data))
    }
  }
  return files
}

/** RFC 4180 CSV parser (handles quoted commas, quotes and newlines). */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  text = text.replace(/^﻿/, '')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (field += '"'), i++
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') row.push(field), (field = '')
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field), rows.push(row), (row = []), (field = '')
    } else field += c
  }
  if (field || row.length) row.push(field), rows.push(row)
  return rows.filter((r) => r.some((v) => v.trim()))
}

/** Rows as objects. Skips any "Notes:" preamble LinkedIn puts above the header. */
function table(files, name, requiredColumn) {
  const text = files.get(name.toLowerCase())
  if (!text) return []
  const rows = parseCsv(text)
  const h = rows.findIndex((r) => r.includes(requiredColumn))
  if (h < 0) return []
  const header = rows[h].map((s) => s.trim())
  return rows.slice(h + 1).map((r) => Object.fromEntries(header.map((k, i) => [k, (r[i] ?? '').trim()])))
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** "Jan 2020" | "2020" | "1/15/20" | "2020-01-15" -> "2020-01" | "2020" | undefined */
function date(value) {
  const v = (value ?? '').trim()
  if (!v) return undefined
  let m = v.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/)
  if (m) return `${m[2]}-${String(MONTHS.indexOf(m[1].toLowerCase()) + 1).padStart(2, '0')}`
  if ((m = v.match(/^(\d{4})$/))) return m[1]
  if ((m = v.match(/^(\d{4})-(\d{2})/))) return `${m[1]}-${m[2]}`
  if ((m = v.match(/^(\d{1,2})\/\d{1,2}\/(\d{2,4})/))) {
    const y = m[2].length === 2 ? `20${m[2]}` : m[2]
    return `${y}-${m[1].padStart(2, '0')}`
  }
  return undefined
}

/** Drops empty strings/undefined so the JSON stays tidy. */
function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''))
}

/** Most recent first; ongoing entries (no end) on top. */
const byRecency = (a, b) =>
  (b.end ? 0 : 1) - (a.end ? 0 : 1) || (b.end ?? '').localeCompare(a.end ?? '') || (b.start ?? '').localeCompare(a.start ?? '')

const files = loadFiles(input)
if (!files.size) {
  console.error('No CSV files found in', input)
  process.exit(1)
}

const existing = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {}
const [info = {}] = table(files, 'Profile.csv', 'First Name')

// Websites look like "[PORTFOLIO:https://a.com,OTHER:https://b.com]".
const websites = [...(info['Websites'] ?? '').matchAll(/(?:([A-Z_ ]+):)?(https?:\/\/[^,\]\s]+)/g)].map((m) => ({
  label: m[1] ? m[1].charAt(0) + m[1].slice(1).toLowerCase().replace(/_/g, ' ') : new URL(m[2]).hostname,
  url: m[2],
}))
const links = [...(existing.links ?? [])]
for (const w of websites) if (!links.some((l) => l.url.replace(/\/$/, '') === w.url.replace(/\/$/, ''))) links.push(w)

const profile = clean({
  name: [info['First Name'], info['Last Name']].filter(Boolean).join(' ') || existing.name,
  headline: info['Headline'],
  location: info['Geo Location'],
  summary: info['Summary'],
  links,
  positions: table(files, 'Positions.csv', 'Title')
    .map((r) =>
      clean({
        title: r['Title'],
        company: r['Company Name'],
        location: r['Location'],
        start: date(r['Started On']),
        end: date(r['Finished On']),
        description: r['Description'],
      }),
    )
    .sort(byRecency),
  education: table(files, 'Education.csv', 'School Name')
    .map((r) =>
      clean({
        school: r['School Name'],
        degree: r['Degree Name'],
        start: date(r['Start Date']),
        end: date(r['End Date']),
        notes: r['Notes'],
        activities: r['Activities'],
      }),
    )
    .sort(byRecency),
  projects: table(files, 'Projects.csv', 'Title').map((r) =>
    clean({
      title: r['Title'],
      description: r['Description'],
      url: r['Url'],
      start: date(r['Started On']),
      end: date(r['Finished On']),
    }),
  ),
  certifications: table(files, 'Certifications.csv', 'Name').map((r) =>
    clean({
      name: r['Name'],
      authority: r['Authority'],
      url: r['Url'],
      licenseNumber: r['License Number'],
      start: date(r['Started On']),
      end: date(r['Finished On']),
    }),
  ),
  volunteering: table(files, 'Volunteering.csv', 'Role')
    .map((r) =>
      clean({
        role: r['Role'],
        organization: r['Company Name'],
        cause: r['Cause'],
        start: date(r['Started On']),
        end: date(r['Finished On']),
        description: r['Description'],
      }),
    )
    .sort(byRecency),
  honors: table(files, 'Honors.csv', 'Title').map((r) =>
    clean({ title: r['Title'], issued: date(r['Issued On']), description: r['Description'] }),
  ),
  skills: table(files, 'Skills.csv', 'Name').map((r) => r['Name']).filter(Boolean),
  languages: table(files, 'Languages.csv', 'Name').map((r) => clean({ name: r['Name'], proficiency: r['Proficiency'] })),
})

writeFileSync(outFile, JSON.stringify(profile, null, 2) + '\n')
const counts = ['positions', 'education', 'projects', 'certifications', 'volunteering', 'honors', 'skills', 'languages']
  .map((k) => `${k}: ${profile[k]?.length ?? 0}`)
  .join(', ')
console.log(`Wrote ${outFile}\n${counts}`)
