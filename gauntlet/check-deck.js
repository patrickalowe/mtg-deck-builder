// Bracket 3 compliance + mana base check for a deck version (spec 4d/4e).
// Usage: node check-deck.js <deck> <version> [--vs <version>]
//   Bracket 3: ≤3 Game Changers (Scryfall's official flag), no mass land destruction, no extra-turn cards
//   (flagged for review), two-card combos from Commander Spellbook (flagged for review).
//   Mana: colored pips vs. sources per color, curve, land count. With --vs, rejects swaps that make
//   the deck's colors harder to cast.
const fs = require('fs');
const path = require('path');
const Scry = require('scryfall-sdk');
Scry.setAgent('mtg-commander', '1.0.0');

const ROOT = __dirname;
const CACHE = path.join(ROOT, 'cache-cards.json');
const COLORS = ['W', 'U', 'B', 'R', 'G'];

function readDck(deck, version) {
  const text = fs.readFileSync(path.join(ROOT, 'versions', deck, version, 'deck.dck'), 'utf8');
  let section = '';
  const out = { commander: null, cards: [] };
  for (const l of text.split('\n')) {
    if (l.startsWith('[')) { section = l.trim(); continue; }
    const m = l.match(/^(\d+) (.+)$/);
    if (!m) continue;
    if (section === '[Commander]') out.commander = m[2];
    else if (section === '[Main]') out.cards.push({ n: +m[1], name: m[2] });
  }
  return out;
}

async function cardData(names) {
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  const missing = names.filter(n => !(n in cache));
  if (missing.length) {
    const found = await Scry.Cards.collection(...missing.map(n => Scry.CardIdentifier.byName(n))).waitForAll();
    for (const c of found) {
      const face = c.card_faces?.[0] ?? c;
      const entry = {
        name: c.name, cmc: c.cmc, type: c.type_line, cost: c.mana_cost ?? face.mana_cost ?? '',
        text: c.oracle_text ?? (c.card_faces ?? []).map(f => f.oracle_text).join('\n'),
        produced: c.produced_mana ?? [], identity: c.color_identity, gameChanger: !!c.game_changer,
        usd: c.prices?.usd ? +c.prices.usd : null,
      };
      cache[c.name] = entry;
      cache[c.name.split(' // ')[0]] = entry;
    }
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  }
  return cache;
}

async function combos(d) {
  const res = await fetch('https://backend.commanderspellbook.com/find-my-combos/', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'mtg-commander/1.0' },
    body: JSON.stringify({ main: d.cards.map(c => ({ card: c.name, quantity: c.n })), commanders: [{ card: d.commander, quantity: 1 }] }),
  });
  if (!res.ok) return { error: `Commander Spellbook ${res.status}` };
  const j = await res.json();
  return (j.results?.included ?? []).map(c => ({ cards: c.uses.map(u => u.card.name), results: c.produces.map(p => p.feature.name).slice(0, 3), bracketTag: c.bracketTag ?? null }));
}

async function check(deck, version) {
  const d = readDck(deck, version);
  const cards = await cardData([d.commander, ...d.cards.map(c => c.name)]);
  const all = [{ n: 1, name: d.commander }, ...d.cards];
  const get = n => cards[n] ?? cards[n.split(' // ')[0]];
  const gameChangers = all.filter(c => get(c.name)?.gameChanger).map(c => c.name);
  const mld = all.filter(c => /destroy all lands|destroy all nonbasic lands|each player sacrifices (?:all|half|.*) lands|exile all lands/i.test(get(c.name)?.text ?? '')).map(c => c.name);
  const extraTurns = all.filter(c => /take an extra turn|takes an extra turn/i.test(get(c.name)?.text ?? '')).map(c => c.name);
  const cmb = await combos(d);
  const twoCard = Array.isArray(cmb) ? cmb.filter(c => c.cards.length <= 2) : [];

  const pips = Object.fromEntries(COLORS.map(c => [c, 0]));
  const sources = Object.fromEntries(COLORS.map(c => [c, 0]));
  const curve = {};
  let lands = 0, nonlandCmc = 0, nonlands = 0;
  for (const { n, name } of all) {
    const c = get(name);
    if (!c) continue;
    const front = c.type.split(' // ')[0]; // two-sided cards count as their front face (Thousand Moons Smithy isn't a land)
    const isLand = /\bLand\b/.test(front) && !/Creature/.test(front);
    if (isLand) lands += n;
    else {
      nonlands += n;
      nonlandCmc += c.cmc * n;
      const b = c.cmc >= 7 ? '7+' : String(Math.floor(c.cmc));
      curve[b] = (curve[b] ?? 0) + n;
      for (const col of COLORS) pips[col] += ((c.cost.match(new RegExp(`\\{${col}\\}`, 'g')) ?? []).length + (c.cost.match(new RegExp(`\\{${col}\\/|\\/${col}\\}`, 'g')) ?? []).length * 0.5) * n;
    }
    // A source = a land or a mana rock/dork that can produce the color.
    if (isLand || /\{T\}[^.]*: Add/.test(c.text)) for (const col of c.produced) if (COLORS.includes(col)) sources[col] += n;
  }
  const identity = get(d.commander)?.identity ?? COLORS;
  return { deck, version, commander: d.commander, gameChangers, mld, extraTurns, combos: cmb, twoCard, pips, sources, curve,
    lands, avgCmc: +(nonlandCmc / nonlands).toFixed(2), identity, priceOf: n => get(n)?.usd ?? null };
}

function report(r) {
  const ok = r.gameChangers.length <= 3 && r.mld.length === 0;
  console.log(`\n== ${r.deck} ${r.version} (${r.commander}) — bracket 3 ${ok ? 'OK' : 'FAIL'}`);
  console.log(`  Game Changers (${r.gameChangers.length}/3): ${r.gameChangers.join(', ') || 'none'}`);
  console.log(`  Mass land destruction: ${r.mld.join(', ') || 'none'}   Extra turns: ${r.extraTurns.join(', ') || 'none'}`);
  console.log(`  Two-card combos (review): ${Array.isArray(r.combos) ? (r.twoCard.map(c => c.cards.join(' + ') + ' → ' + c.results.join('; ')).join(' | ') || 'none') : r.combos.error}`);
  console.log(`  Lands ${r.lands}, avg nonland MV ${r.avgCmc}, curve ${Object.entries(r.curve).sort().map(([k, v]) => `${k}:${v}`).join(' ')}`);
  console.log(`  Pips/sources: ${r.identity.map(c => `${c} ${r.pips[c]}/${r.sources[c]}`).join('  ')}`);
  return ok;
}

(async () => {
  const [deck, version] = process.argv.slice(2);
  const vsIdx = process.argv.indexOf('--vs');
  const r = await check(deck, version);
  let ok = report(r);
  if (vsIdx > 0) {
    const base = await check(deck, process.argv[vsIdx + 1]);
    report(base);
    const problems = [];
    for (const c of r.identity) {
      const before = base.sources[c] ? base.pips[c] / base.sources[c] : 0, after = r.sources[c] ? r.pips[c] / r.sources[c] : 0;
      if (r.sources[c] < base.sources[c] && after > before * 1.1) problems.push(`${c}: sources ${base.sources[c]}→${r.sources[c]} while demand per source rises ${before.toFixed(2)}→${after.toFixed(2)}`);
    }
    if (r.lands < base.lands) problems.push(`land count ${base.lands}→${r.lands}`);
    if (r.avgCmc > base.avgCmc + 0.15) problems.push(`avg MV ${base.avgCmc}→${r.avgCmc}`);
    console.log(`\n  Mana check vs ${base.version}: ${problems.length ? 'REVIEW — ' + problems.join('; ') : 'OK'}`);
    ok = ok && !problems.length;
  }
  console.log(`\nVERDICT: ${ok ? 'PASS' : 'REVIEW/REJECT'}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
