#!/usr/bin/env node
// Runs before 'npm run dev' — verifies DATABASE_URL is valid in both .env files.
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
let allOk = true

function check(filename) {
  const filePath = path.join(root, filename)
  if (!fs.existsSync(filePath)) {
    console.error(`❌  ${filename}: bestand niet gevonden`)
    allOk = false
    return
  }
  const content = fs.readFileSync(filePath, 'utf8')
  const line = content.split('\n').find((l) => l.trimStart().startsWith('DATABASE_URL='))
  if (!line) {
    console.error(`❌  ${filename}: DATABASE_URL regel ontbreekt`)
    allOk = false
    return
  }
  // Strip quotes and carriage returns from value
  const raw = line.replace(/^DATABASE_URL=/, '').replace(/^["']/, '').replace(/["']\r?$/, '').replace(/\r$/, '')
  if (!raw.startsWith('postgresql://')) {
    console.error(`❌  ${filename}: DATABASE_URL begint niet met postgresql:// (waarde: "${raw.slice(0, 30)}…")`)
    allOk = false
    return
  }
  console.log(`✅  ${filename}: DATABASE_URL OK`)
}

check('.env')
check('.env.local')

if (!allOk) {
  console.error('\nOPLOSSING:')
  console.error('  .env.local corrupt? → Kopieer de DATABASE_URL handmatig uit het Neon dashboard (dev-branch).')
  console.error('  Nooit "vercel env pull" zonder: vercel env pull .env.production.local --environment=production')
  process.exit(1)
}
