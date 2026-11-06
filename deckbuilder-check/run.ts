// Runs flegars/mtg-deckbuilder's own deck logic (validation, stats, Commander Spellbook combos)
// on Patrick's decklists, without the Electron app. Usage: npx tsx run.ts <deck file>...
import fs from 'fs'
import path from 'path'
import * as Scry from 'scryfall-sdk'
import type { Card, Deck } from '@shared/types'
import { validateDeck } from '../external/mtg-deckbuilder/src/main/domain/deck-validation'
import { computeDeckStats } from '../external/mtg-deckbuilder/src/main/domain/deck-stats'
import { findMyCombos } from '../external/mtg-deckbuilder/src/main/spellbook/client'

Scry.setAgent('mtg-commander', '1.0.0')

const SIM = path.resolve('../sim')
const plain = (n: string) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function toCard(c: Scry.Card): Card {
  const face = c.card_faces?.[0]
  return {
    id: c.id,
    name: c.name,
    manaCost: c.mana_cost ?? face?.mana_cost ?? null,
    cmc: c.cmc,
    typeLine: c.type_line,
    oracleText: c.oracle_text ?? c.card_faces?.map((f) => f.oracle_text).join('\n') ?? null,
    colors: (c.colors ?? face?.colors ?? []) as Card['colors'],
    colorIdentity: c.color_identity as Card['colorIdentity'],
    keywords: c.keywords ?? [],
    imageUriNormal: null,
    imageUriSmall: null,
    edhrecRank: c.edhrec_rank ?? null,
    commanderLegal: c.legalities.commander === 'legal',
    standardLegal: c.legalities.standard === 'legal'
  }
}

async function loadDeck(file: string): Promise<Deck> {
  const entries = fs
    .readFileSync(path.join(SIM, file), 'utf8')
    .split('\n')
    .filter((l) => /^\d/.test(l))
    .map((l) => ({ quantity: +l.split(' ')[0], name: l.slice(l.indexOf(' ') + 1) }))
  const unique = [...new Set(entries.map((e) => e.name))]
  const found = await Scry.Cards.collection(...unique.map((n) => Scry.CardIdentifier.byName(n))).waitForAll()
  if (found.not_found?.length) throw new Error('Not on Scryfall: ' + JSON.stringify(found.not_found))
  const byName = new Map<string, Card>()
  for (const c of found) {
    byName.set(plain(c.name), toCard(c))
    byName.set(plain(c.name.split(' // ')[0]), toCard(c))
  }
  const [cmd, ...rest] = entries
  return {
    id: file,
    name: file,
    format: 'commander',
    commander: byName.get(plain(cmd.name))!,
    cards: rest.map((e) => ({ card: byName.get(plain(e.name))!, quantity: e.quantity })),
    strategy: null,
    notes: null,
    createdAt: 0,
    updatedAt: 0
  }
}

async function main() {
  const report: Record<string, unknown> = {}
  for (const file of process.argv.slice(2)) {
    const deck = await loadDeck(file)
    const validation = validateDeck(deck)
    const stats = computeDeckStats(deck)
    const combos = await findMyCombos({
      main: deck.cards.map((e) => ({ card: e.card.name, quantity: e.quantity })),
      commanders: [{ card: deck.commander!.name, quantity: 1 }]
    })
    const shape = (c: (typeof combos.results.included)[number]) => ({
      cards: c.uses.map((u) => u.card.name),
      missing: c.uses.filter((u) => !deck.cards.some((e) => plain(e.card.name) === plain(u.card.name)) && plain(u.card.name) !== plain(deck.commander!.name)).map((u) => u.card.name),
      results: c.produces.map((p) => p.feature.name).slice(0, 4),
      popularity: c.popularity ?? null
    })
    const almost = combos.results.almostIncluded
      .filter((c) => c.legalities?.commander !== false && !c.spoiler)
      .map(shape)
      .filter((c) => c.missing.length === 1)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    report[file] = {
      validation: {
        totalCards: validation.totalCards,
        isValid: validation.isValid,
        errors: validation.errors.map((e) => ({ type: e.type, card: 'card' in e ? (e.card as Card).name : undefined }))
      },
      stats: {
        manaCurve: stats.manaCurve,
        averageCmcNonLand: stats.averageCmcNonLand,
        typeDistribution: stats.typeDistribution,
        manaBase: stats.manaBase,
        pipsVsSources: stats.pipsVsSources,
        edhrecTopRanked: stats.edhrecTopRanked.map((c) => `${c.card.name} (#${c.rank})`),
        edhrecBottomOrUnranked: stats.edhrecBottomOrUnranked.map((c) => `${c.card.name} (${c.rank ?? 'unranked'})`)
      },
      combos: {
        included: combos.results.included.map(shape),
        almostIncludedOneCardAway: almost.slice(0, 8),
        almostIncludedTotal: combos.results.almostIncluded.length
      }
    }
  }
  fs.writeFileSync('report.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 1))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
