export function encodeWord(word: string): string {
  if (word.length === 0) return ''
  if (word.length <= 2) return word.toUpperCase()
  const first = word[0].toUpperCase()
  const last = word[word.length - 1].toUpperCase()
  const middleCount = word.length - 2
  return `${first}${middleCount}${last}`
}

export function encodeCompanyName(name: string): string {
  if (!name) return ''
  return name
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(encodeWord)
    .join(' ')
}

export function getCompanyCode(company: { name: string; customCode?: string | null }): string {
  if (company.customCode && company.customCode.trim() !== '') {
    return company.customCode.toUpperCase()
  }
  return encodeCompanyName(company.name)
}
