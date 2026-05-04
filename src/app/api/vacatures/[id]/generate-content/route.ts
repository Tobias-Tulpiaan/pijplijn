export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/auditLog'
import { callClaude, parseClaudeJson } from '@/lib/anthropic'

type Scope =
  | 'all'
  | 'booleans'
  | 'inmails'
  | 'booleanNiche'
  | 'booleanMedium'
  | 'booleanBreed'
  | 'doorgroeiNiche'
  | 'doorgroeiBreed'
  | 'inmailOpenToWork'
  | 'inmailNietOpen'

interface AnalysisResult {
  functie_bron: string
  functie_geoptimaliseerd: string
  sector: string
  locatie: string
  salaris: string
  uren: string
  bonus: string
  hybride: string
  werkzaamheden: string[]
  vaardigheden: string[]
  arbeidsvoorwaarden: string[]
}

interface ContentResult {
  inmail_open_to_work?: string
  inmail_niet_open?: string
  boolean_niche?: string
  boolean_medium?: string
  boolean_breed?: string
  doorgroei_niche?: string
  doorgroei_breed?: string
}

const SYSTEM_PROMPT_INMAIL = `Je bent een ervaren recruiter die LinkedIn InMails schrijft voor een werving en selectiebureau.

Gebruik de informatie uit de vacature en eventueel aanvullende recruiter input om een LinkedIn InMail te schrijven.

Belangrijke regels:

De InMail moet maximaal 1900 karakters bevatten.

De structuur van de InMail moet exact als volgt zijn opgebouwd:

Hi {firstName},

Voor een organisatie in [branche/sector] zijn wij op zoek naar een [functie], en daarbij kwam ik jouw profiel tegen.

Gebruik vervolgens één van deze twee openingszinnen:

Wanneer de kandidaat open to work is:
Op LinkedIn geef je aan 'Open to Work' te zijn. Gezien jouw ervaring en achtergrond zou ik je graag deze functie willen voorleggen.

Wanneer de kandidaat niet open to work is:
Nu weet ik natuurlijk niet of je open staat voor een andere uitdaging, maar gezien jouw ervaring en achtergrond zou ik je graag deze functie willen voorleggen.

Daarna volgt de functieomschrijving met opsomming:

Als [functie] ga je aan de slag met:
• maximaal 5 bulletpoints met werkzaamheden
• deze mogen uit de vacature komen maar herschreven worden
• elke bullet moet op een nieuwe regel staan

Daarna:

In deze functie:
• maximaal 5 bulletpoints met context van de rol, werkomgeving of manier van werken
• elke bullet moet op een nieuwe regel staan

Daarna:

Wat biedt deze functie?

Schrijf een korte alinea die beschrijft waarom de rol interessant is.

Vermeld daarna:

De salarisindicatie ligt tot [salaris] bruto per maand.

Als salaris niet bekend is, gebruik:
De salarisindicatie ligt tot XXXX bruto per maand.

Vervolgens eventueel voordelen zoals:
• leaseauto
• bonus
• hybride werken
• opleidingsbudget

Sluit altijd af met een lage drempel call-to-action:

Lijkt het je interessant om hier meer over te horen? Laat het me weten, dan stuur ik je graag meer informatie toe.

Met vriendelijke groet,

Extra schrijfrichtlijnen:

De tekst moet makkelijk scanbaar zijn zodat iemand hem binnen 5 seconden kan begrijpen.

Gebruik altijd bulletpoints voor opsommingen.

Na de titels:

Als [functie] ga je aan de slag met:
In deze functie:

moet elke bulletpoint op een nieuwe regel beginnen.

Gebruik maximaal 5 bulletpoints per opsomming.

Gebruik een professionele maar toegankelijke tone of voice zoals een recruiter op LinkedIn.

De tekst moet persoonlijk en uitnodigend zijn maar niet overdreven commercieel.

Gebruik nooit streepjes (– of —) in de tekst.

Gebruik geen emoji's.

Gebruik geen bedrijfsnaam zodat de vacature anoniem blijft.

Gebruik alleen informatie die logisch uit de vacature af te leiden is.

Als informatie ontbreekt, vul deze neutraal in zonder te speculeren.

Controleer voordat je de tekst teruggeeft dat:

• de InMail volledig is
• de opsommingen correct zijn opgebouwd
• de tekst onder de 1900 karakters blijft
• de tekst goed scanbaar is`

async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Tulpiaan-Pijplijn/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.text()
}

async function analyzeVacature(rawInput: string): Promise<AnalysisResult> {
  const prompt1 = `Analyseer de onderstaande HTML van een vacaturepagina.

Gebruik alleen de zichtbare vacature inhoud. Negeer navigatie, menu's, cookie banners, footer, scripts en algemene website onderdelen.

Geef de output uitsluitend terug als geldige JSON met exact deze structuur:
{
  "functie_bron": "",
  "functie_geoptimaliseerd": "",
  "sector": "",
  "locatie": "",
  "salaris": "",
  "uren": "",
  "bonus": "",
  "hybride": "",
  "werkzaamheden": [],
  "vaardigheden": [],
  "arbeidsvoorwaarden": []
}

Regels:
- functie_bron = functietitel zoals gevonden op de pagina
- functie_geoptimaliseerd = heldere en logisch geoptimaliseerde functietitel
- bonus = alleen Ja of nvt
- hybride = alleen Ja of nvt
- salaris leeg laten als niet bekend
- uren leeg laten als niet bekend
- sector logisch afleiden uit de vacature
- werkzaamheden = lijst met belangrijkste werkzaamheden
- vaardigheden = lijst met gewenste vaardigheden of eigenschappen
- arbeidsvoorwaarden = lijst met belangrijkste voorwaarden
- geef geen uitleg buiten de JSON

HTML:
${rawInput.slice(0, 50000)}`

  const text = await callClaude({ userPrompt: prompt1, maxTokens: 8000 })

  try {
    return parseClaudeJson<AnalysisResult>(text)
  } catch {
    // één retry met expliciete JSON-instructie
    const retry = await callClaude({
      userPrompt: `${prompt1}\n\nBelangrijk: geef uitsluitend geldige JSON terug, geen markdown omheen.`,
      maxTokens: 8000,
    })
    return parseClaudeJson<AnalysisResult>(retry)
  }
}

function buildContentPrompt(analysis: AnalysisResult, recruiterInput: string | null, scope: Scope): string {
  const scopeInstruction =
    scope !== 'all' && scope !== 'booleans' && scope !== 'inmails'
      ? `\nGeef alleen het veld "${fieldKey(scope)}" terug in de JSON. Andere velden mag je weglaten of als lege string laten.`
      : ''

  return `Gebruik onderstaande vacature analyse en eventuele recruiter input.

Genereer recruitment content en geef uitsluitend JSON terug met exact deze structuur:
{
  "inmail_open_to_work": "",
  "inmail_niet_open": "",
  "boolean_niche": "",
  "boolean_medium": "",
  "boolean_breed": "",
  "doorgroei_niche": "",
  "doorgroei_breed": ""
}
${scopeInstruction}

REGELS INMAIL
- Maak 2 varianten
- Houd de bedrijfsnaam anoniem
- Maximaal 1900 karakters
- Open to work zin exact gebruiken:
Op LinkedIn geef je aan 'Open to Work' te zijn. Gezien jouw ervaring en achtergrond zou ik je graag deze functie willen voorleggen.
- Niet open zin exact gebruiken:
Nu weet ik natuurlijk niet of je open staat voor een andere uitdaging, maar gezien jouw ervaring en achtergrond zou ik je graag deze functie willen voorleggen.
- Gebruik vaste structuur: intro, Open to Work zin, werkzaamheden, in deze functie, wat biedt deze functie, CTA
- Gebruik als afsluiting: Lijkt het je interessant om hier meer over te horen? Laat het me weten, dan stuur ik je graag meer informatie toe.

REGELS BOOLEAN
- Geef uitsluitend copy paste ready booleans zonder uitleg
- Geen NOT filters
- Gebruik recruiter style
- Gebruik functietitels, creatieve functietitels, Engelse varianten, schrijfvarianten, certificaten en relevante technische termen als logisch
- Structuur per veld:
boolean_niche = DIRECT MATCH – NICHE
boolean_medium = DIRECT MATCH – MEDIUM
boolean_breed = DIRECT MATCH – BREED
doorgroei_niche = POTENTIELE DOORGROEI KANDIDAAT – NICHE
doorgroei_breed = POTENTIELE DOORGROEI – BREED

INPUT VACATURE
Functie bron: ${analysis.functie_bron}
Functie geoptimaliseerd: ${analysis.functie_geoptimaliseerd}
Sector: ${analysis.sector}
Locatie: ${analysis.locatie}
Salaris: ${analysis.salaris}
Uren: ${analysis.uren}
Bonus: ${analysis.bonus}
Hybride: ${analysis.hybride}
Werkzaamheden: ${analysis.werkzaamheden.join(', ')}
Vaardigheden: ${analysis.vaardigheden.join(', ')}
Arbeidsvoorwaarden: ${analysis.arbeidsvoorwaarden.join(', ')}

RECRUITER INPUT (extra context van opdrachtgever, mag leeg zijn — gebruik dit om de content beter af te stemmen op cultuur, werksfeer, of specifieke wensen):
${recruiterInput || '(geen)'}`
}

function fieldKey(scope: Scope): string {
  const map: Record<string, string> = {
    booleanNiche: 'boolean_niche',
    booleanMedium: 'boolean_medium',
    booleanBreed: 'boolean_breed',
    doorgroeiNiche: 'doorgroei_niche',
    doorgroeiBreed: 'doorgroei_breed',
    inmailOpenToWork: 'inmail_open_to_work',
    inmailNietOpen: 'inmail_niet_open',
  }
  return map[scope] ?? scope
}

async function generateContent(
  vacatureId: string,
  scope: Scope,
  userId: string | undefined
): Promise<void> {
  let vacature: {
    werkenbijUrl: string | null
    vacatureTekst: string | null
    recruiterInput: string | null
    content: Array<{
      analysisJson: unknown
      booleanNiche: string | null
      booleanMedium: string | null
      booleanBreed: string | null
      doorgroeiNiche: string | null
      doorgroeiBreed: string | null
      inmailOpenToWork: string | null
      inmailNietOpen: string | null
    }>
  }

  try {
    vacature = await prisma.vacature.findUniqueOrThrow({
      where: { id: vacatureId },
      select: {
        werkenbijUrl: true,
        vacatureTekst: true,
        recruiterInput: true,
        content: {
          where: { isActive: true },
          select: {
            analysisJson: true,
            booleanNiche: true,
            booleanMedium: true,
            booleanBreed: true,
            doorgroeiNiche: true,
            doorgroeiBreed: true,
            inmailOpenToWork: true,
            inmailNietOpen: true,
          },
        },
      },
    })
  } catch (e) {
    console.error('generateContent: vacature ophalen mislukt', e)
    return
  }

  const { werkenbijUrl, vacatureTekst, recruiterInput } = vacature
  const prevContent = vacature.content[0] ?? null

  let rawInput: string
  let inputSource = 'unknown'

  try {
    if (vacatureTekst?.trim()) {
      rawInput = vacatureTekst
      inputSource = 'text'
    } else if (werkenbijUrl?.trim()) {
      inputSource = 'url'
      rawInput = await fetchUrl(werkenbijUrl)
    } else {
      throw new Error('Geen URL of tekst beschikbaar')
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Onbekende fout'
    await saveFailure(vacatureId, scope, inputSource, msg, userId)
    return
  }

  let analysis: AnalysisResult
  try {
    if (scope === 'all' || !prevContent?.analysisJson) {
      analysis = await analyzeVacature(rawInput)
    } else {
      analysis = prevContent.analysisJson as AnalysisResult
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Analyse mislukt'
    await saveFailure(vacatureId, scope, inputSource, msg, userId)
    return
  }

  let contentResult: ContentResult
  try {
    const prompt2 = buildContentPrompt(analysis, recruiterInput, scope)
    const text = await callClaude({
      systemPrompt: SYSTEM_PROMPT_INMAIL,
      userPrompt: prompt2,
      maxTokens: 8000,
    })
    contentResult = parseClaudeJson<ContentResult>(text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Contentgeneratie mislukt'
    await saveFailure(vacatureId, scope, inputSource, msg, userId)
    return
  }

  // Merge met vorige active rij bij partial scope
  const merged = {
    booleanNiche: contentResult.boolean_niche ?? prevContent?.booleanNiche ?? null,
    booleanMedium: contentResult.boolean_medium ?? prevContent?.booleanMedium ?? null,
    booleanBreed: contentResult.boolean_breed ?? prevContent?.booleanBreed ?? null,
    doorgroeiNiche: contentResult.doorgroei_niche ?? prevContent?.doorgroeiNiche ?? null,
    doorgroeiBreed: contentResult.doorgroei_breed ?? prevContent?.doorgroeiBreed ?? null,
    inmailOpenToWork: contentResult.inmail_open_to_work ?? prevContent?.inmailOpenToWork ?? null,
    inmailNietOpen: contentResult.inmail_niet_open ?? prevContent?.inmailNietOpen ?? null,
  }

  try {
    const maxVersionRow = await prisma.vacatureContent.findFirst({
      where: { vacatureId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const nextVersion = (maxVersionRow?.version ?? 0) + 1

    await prisma.$transaction([
      prisma.vacatureContent.updateMany({
        where: { vacatureId, isActive: true },
        data: { isActive: false },
      }),
      prisma.vacatureContent.create({
        data: {
          vacatureId,
          version: nextVersion,
          isActive: true,
          analysisJson: analysis as object,
          booleanNiche: merged.booleanNiche,
          booleanMedium: merged.booleanMedium,
          booleanBreed: merged.booleanBreed,
          doorgroeiNiche: merged.doorgroeiNiche,
          doorgroeiBreed: merged.doorgroeiBreed,
          inmailOpenToWork: merged.inmailOpenToWork,
          inmailNietOpen: merged.inmailNietOpen,
          scope,
          inputSource,
          createdBy: userId ?? null,
        },
      }),
      prisma.vacature.update({
        where: { id: vacatureId },
        data: { contentStatus: 'READY' },
      }),
    ])

    await logAction({
      userId,
      action: 'vacature_content_generated',
      entityType: 'vacature',
      entityId: vacatureId,
      metadata: { scope, version: nextVersion, inputSource },
    })
  } catch (e) {
    console.error('generateContent: schrijven naar DB mislukt', e)
    await saveFailure(vacatureId, scope, inputSource, 'DB schrijven mislukt', userId)
  }
}

async function saveFailure(
  vacatureId: string,
  scope: Scope,
  inputSource: string,
  errorMessage: string,
  userId: string | undefined
) {
  try {
    const maxVersionRow = await prisma.vacatureContent.findFirst({
      where: { vacatureId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const nextVersion = (maxVersionRow?.version ?? 0) + 1

    await prisma.$transaction([
      prisma.vacatureContent.updateMany({
        where: { vacatureId, isActive: true },
        data: { isActive: false },
      }),
      prisma.vacatureContent.create({
        data: {
          vacatureId,
          version: nextVersion,
          isActive: true,
          scope,
          inputSource,
          errorMessage,
          createdBy: userId ?? null,
        },
      }),
      prisma.vacature.update({
        where: { id: vacatureId },
        data: { contentStatus: 'FAILED' },
      }),
    ])

    await logAction({
      userId,
      action: 'vacature_content_failed',
      entityType: 'vacature',
      entityId: vacatureId,
      metadata: { scope, errorMessage },
    })
  } catch (e) {
    console.error('saveFailure: schrijven mislukt', e)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const scope: Scope = body.scope ?? 'all'

  const vacature = await prisma.vacature.findUnique({ where: { id }, select: { id: true } })
  if (!vacature) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  await prisma.vacature.update({
    where: { id },
    data: { contentStatus: 'PENDING' },
  })

  await generateContent(id, scope, session.user.id)

  const updated = await prisma.vacature.findUnique({
    where: { id },
    select: { contentStatus: true },
  })

  return NextResponse.json({ status: updated?.contentStatus?.toLowerCase() ?? 'unknown' })
}
