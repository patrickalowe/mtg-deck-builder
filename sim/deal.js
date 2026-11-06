// Builds all four decks, shuffles them for real, and deals opening hands plus the top of each library.
// Usage: node deal.js [deck file=jace-updated.txt] > game-deal-<deck>.txt
const fs = require('fs');
const crypto = require('crypto');
const Scry = require('scryfall-sdk');
Scry.setAgent('mtg-commander', '1.0.0');

const DECK_FILE = process.argv[2] ?? 'jace-updated.txt';
const OUT = `game-deal-${DECK_FILE.replace('.txt', '')}`;
const DEPTH = 30;
const BASICS = new Set(['Plains', 'Island', 'Swamp', 'Mountain', 'Forest']);

const fromScryfall = c => {
  const face = c.card_faces?.[0] ?? c;
  return {
    name: c.name,
    cost: c.mana_cost ?? face.mana_cost ?? '',
    type: c.type_line,
    text: c.oracle_text ?? c.card_faces?.map(f => f.oracle_text).join(' // ') ?? '',
    pt: face.power != null ? `${face.power}/${face.toughness}` : face.loyalty != null ? `L${face.loyalty}` : '',
  };
};
const fromMtgjson = c => ({
  name: c.name, cost: c.manaCost ?? '', type: c.type, text: c.text ?? '',
  pt: c.power != null ? `${c.power}/${c.toughness}` : c.loyalty != null ? `L${c.loyalty}` : '',
});

const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const isLand = c => /\bLand\b/.test(c.type);

async function jaceDeck() {
  const lines = fs.readFileSync(DECK_FILE, 'utf8').split('\n').filter(l => /^\d/.test(l));
  const entries = lines.map(l => ({ count: +l.split(' ')[0], name: l.slice(l.indexOf(' ') + 1) }));
  const ids = entries.map(e => Scry.CardIdentifier.byName(e.name));
  const cards = await Scry.Cards.collection(...ids).waitForAll();
  if (cards.not_found?.length) throw new Error('Not found: ' + JSON.stringify(cards.not_found));
  const plain = n => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const byName = new Map(cards.flatMap(c => [[plain(c.name), fromScryfall(c)], [plain(c.name.split(' // ')[0]), fromScryfall(c)]]));
  const lookup = n => byName.get(plain(n));
  const [cmd, ...rest] = entries;
  return { pilot: 'Patrick', commander: lookup(cmd.name), library: rest.flatMap(e => Array(e.count).fill(lookup(e.name))) };
}

function precon(file, pilot) {
  const d = JSON.parse(fs.readFileSync(`data/${file}.json`, 'utf8')).data;
  return {
    pilot,
    commander: fromMtgjson(d.commander[0]),
    library: d.mainBoard.flatMap(c => Array(c.count).fill(fromMtgjson(c))),
  };
}

// London mulligan: keep 7 with 2-5 lands; one mulligan max, bottoming the worst-fit card.
function openingHand(deck) {
  let lib = shuffle([...deck.library]);
  let hand = lib.slice(0, 7);
  const lands = h => h.filter(isLand).length;
  if (lands(hand) >= 2 && lands(hand) <= 5) return { hand, lib: lib.slice(7), mulligans: 0 };
  lib = shuffle([...deck.library]);
  hand = lib.slice(0, 7);
  lib = lib.slice(7);
  const tooMany = lands(hand) > 4;
  const idx = hand.findIndex(c => tooMany ? isLand(c) : !isLand(c));
  const [bottom] = hand.splice(idx >= 0 ? idx : 6, 1);
  return { hand, lib: [...lib, bottom], mulligans: 1 };
}

const short = c => `${c.name} ${c.cost} [${c.type}${c.pt ? ' ' + c.pt : ''}]`;
const text = c => BASICS.has(c.name) ? '' : ` — ${c.text.replace(/\n/g, ' / ').replace(/\(.*?\)/g, '').slice(0, 260)}`;

(async () => {
  const decks = [
    await jaceDeck(),
    precon('AvengersAssemble_MSC', 'Opponent A'),
    precon('WitherbloomPestilence_SOC', 'Opponent B'),
    precon('TramplesaurusRex_FDC', 'Opponent C'),
  ];
  const seats = shuffle(decks);
  const seen = new Map();
  const state = seats.map((d, i) => {
    const { hand, lib, mulligans } = openingHand(d);
    [d.commander, ...hand, ...lib.slice(0, DEPTH)].forEach(c => seen.set(c.name, c));
    return { seat: i + 1, pilot: d.pilot, commander: d.commander.name, mulligans, hand: hand.map(c => c.name), library: lib.map(c => c.name) };
  });
  fs.writeFileSync(`${OUT}.json`, JSON.stringify(state, null, 2));
  for (const s of state) {
    console.log(`\n=== Seat ${s.seat}: ${s.pilot} — ${s.commander} (mulligans: ${s.mulligans}) ===`);
    console.log('HAND: ' + s.hand.join(' | '));
    console.log('DRAWS (in order): ' + s.library.slice(0, DEPTH).map((n, i) => `${i + 1}.${n}`).join(' | '));
  }
  console.log('\n=== CARD TEXT ===');
  for (const c of seen.values()) console.log(short(c) + text(c));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
