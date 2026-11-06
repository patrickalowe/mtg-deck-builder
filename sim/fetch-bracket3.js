// Builds a pool of random bracket-3 Commander decks from Archidekt's public API.
// Usage: node fetch-bracket3.js [pool size=60]
const fs = require('fs');
const crypto = require('crypto');

const POOL = +(process.argv[2] ?? 60);
const PAGES = 4;
const OUT = 'data/bracket3';
const UA = { 'User-Agent': 'mtg-commander/1.0 (personal deck sim)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res.json();
    await sleep(2000 * (attempt + 1));
  }
  throw new Error(`Failed: ${url}`);
}

// Archidekt oracle card -> the same shape sim.js reads from MTGJSON.
function toSimCard(oc) {
  const faceText = (oc.faces ?? []).map(f => f.text).filter(Boolean).join('\n');
  const type = [...(oc.superTypes ?? []), ...(oc.types ?? [])].join(' ') + (oc.subTypes?.length ? ' — ' + oc.subTypes.join(' ') : '');
  return {
    name: oc.name, manaValue: oc.cmc ?? 0, manaCost: oc.manaCost ?? '', type,
    text: oc.text || faceText || '', power: oc.power, toughness: oc.toughness, loyalty: oc.loyalty,
  };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const listings = [];
  for (let page = 1; page <= PAGES; page++) {
    const d = await getJson(`https://archidekt.com/api/decks/v3/?deckFormat=3&edhBracket=3&orderBy=-viewCount&page=${page}`).catch(() => null);
    if (!d) break;
    listings.push(...d.results.filter(r => r.size === 100 && r.edhBracket === 3));
    await sleep(500);
  }
  const candidates = listings.sort(() => crypto.randomInt(3) - 1);
  const kept = [];
  for (const listing of candidates) {
    if (kept.length >= POOL) break;
    const deck = await getJson(`https://archidekt.com/api/decks/${listing.id}/`);
    await sleep(400);
    const excluded = new Set(deck.categories.filter(c => !c.includedInDeck).map(c => c.name));
    const inDeck = deck.cards.filter(c => !(c.categories ?? []).some(cat => excluded.has(cat)));
    const commanders = inDeck.filter(c => (c.categories ?? []).includes('Commander'));
    const main = inDeck.filter(c => !(c.categories ?? []).includes('Commander'));
    const total = inDeck.reduce((s, c) => s + c.quantity, 0);
    if (commanders.length !== 1 || total !== 100) continue;
    const out = {
      source: `https://archidekt.com/decks/${deck.id}`, name: deck.name, bracket: deck.edhBracket,
      commander: [toSimCard(commanders[0].card.oracleCard)],
      mainBoard: main.map(c => ({ ...toSimCard(c.card.oracleCard), count: c.quantity })),
    };
    fs.writeFileSync(`${OUT}/${deck.id}.json`, JSON.stringify({ data: out }));
    kept.push(`${deck.id}  ${out.commander[0].name}  —  ${deck.name}`);
  }
  console.log(`Kept ${kept.length} of ${listings.length} bracket-3 listings:\n` + kept.join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
