// Simplified 4-player Commander simulator: one of Patrick's decks vs. three precons.
// Every seat is played by the same fixed heuristics. See README section in game results for what is modeled.
// Usage: node sim.js [games=10] [deck file=jace-updated.txt] [--bracket3-1v1]
//   --bracket3-1v1: each game is 1v1 vs. a random deck from data/bracket3/ (built by fetch-bracket3.js).
const fs = require('fs');
const crypto = require('crypto');
const Scry = require('scryfall-sdk');
Scry.setAgent('mtg-commander', '1.0.0');

const DECK_FILE = process.argv[3] ?? 'jace-updated.txt';
const CACHE = `decks-cache-${DECK_FILE.replace(/\W/g, '_')}.json`;
const MAX_ROUNDS = 25;
const POOL_DIR = process.env.POOL_DIR ?? 'data/bracket3';
const OPPONENTS = [
  ['AvengersAssemble_MSC', 'Captain America'],
  ['WitherbloomPestilence_SOC', 'Dina'],
  ['TramplesaurusRex_FDC', 'Ghalta'],
];

// ---------- deck loading ----------

const toInt = v => (v == null || isNaN(parseInt(v)) ? 0 : parseInt(v));

const fromScryfall = c => {
  const face = c.card_faces?.[0] ?? c;
  return {
    name: c.name, mv: c.cmc, cost: c.mana_cost ?? face.mana_cost ?? '', type: c.type_line,
    text: c.oracle_text ?? face.oracle_text ?? '',
    power: toInt(face.power), toughness: toInt(face.toughness), loyalty: toInt(face.loyalty),
  };
};
const fromMtgjson = c => ({
  name: c.name, mv: c.manaValue ?? 0, cost: c.manaCost ?? '', type: c.type, text: c.text ?? '',
  power: toInt(c.power), toughness: toInt(c.toughness), loyalty: toInt(c.loyalty),
});

async function loadDecks() {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const lines = fs.readFileSync(DECK_FILE, 'utf8').split('\n').filter(l => /^\d/.test(l));
  const entries = lines.map(l => ({ count: +l.split(' ')[0], name: l.slice(l.indexOf(' ') + 1) }));
  const cards = await Scry.Cards.collection(...entries.map(e => Scry.CardIdentifier.byName(e.name))).waitForAll();
  const plain = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (cards.not_found?.length) throw new Error('Not on Scryfall: ' + cards.not_found.map(n => n.name).join(', '));
  // Index two-sided cards under their front-face name too ("Thousand Moons Smithy").
  const byName = new Map(cards.flatMap(c => [[plain(c.name), fromScryfall(c)], [plain(c.name.split(' // ')[0]), fromScryfall(c)]]));
  const [cmd, ...rest] = entries;
  const decks = [{
    pilot: `Patrick (${cmd.name.split(/[ ,]/)[0]})`, commander: byName.get(plain(cmd.name)),
    library: rest.flatMap(e => Array(e.count).fill(byName.get(plain(e.name)))),
  }];
  for (const [file, label] of OPPONENTS) {
    const d = JSON.parse(fs.readFileSync(`data/${file}.json`, 'utf8')).data;
    decks.push({
      pilot: label, commander: fromMtgjson(d.commander[0]),
      library: d.mainBoard.flatMap(c => Array(c.count).fill(fromMtgjson(c))),
    });
  }
  fs.writeFileSync(CACHE, JSON.stringify(decks));
  return decks;
}

// ---------- card profiles (rules text -> what the simulator understands) ----------

const WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, x: 'X' };
const count = w => WORDS[w.toLowerCase()] ?? (isNaN(+w) ? 1 : +w);
const KEYWORDS = ['flying', 'reach', 'trample', 'deathtouch', 'menace', 'haste', 'vigilance', 'indestructible',
  'lifelink', 'double strike', 'first strike', 'shadow', 'hexproof'];

function effectsOf(line) {
  const e = {};
  let m;
  if ((m = line.match(/draws? (a|one|two|three|four|\d+|X) cards?/i))) e.draw = count(m[1]);
  if (/then put (a|two) cards? from your hand/i.test(line) && e.draw) e.draw = Math.max(e.draw - 1, 1);
  if (/for each opponent, destroy up to one target creature/i.test(line)) e.removal = { mode: 'destroy', each: true };
  else if ((m = line.match(/(destroy|exile) (?:up to one )?(?:another )?target (creature|nonland permanent|permanent|artifact, enchantment, or creature|creature or planeswalker|planeswalker or creature)/i)))
    e.removal = { mode: m[1].toLowerCase() };
  else if (/return target (nonland permanent|creature|spell or creature)/i.test(line)) e.removal = { mode: 'bounce' };
  else if (/deals damage equal to its power to target creature/i.test(line)) e.removal = { mode: 'fight' };
  if ((m = line.match(/(destroy|exile) all (?:other )?creatures(?: with power (\d) or greater)?/i)))
    e.wipe = { mode: m[1].toLowerCase(), minPower: m[2] ? +m[2] : 0 };
  else if ((m = line.match(/deals (\d+) damage to each creature except for tokens you control/i)))
    e.wipe = { mode: 'damage', amount: +m[1], sparesOwnTokens: true };
  if ((m = line.match(/create (a|one|two|three|four|five|X|\d+) ([^.]*?)(\d+)\/(\d+)([^.]*)/i)))
    e.tokens = { n: count(m[1]), power: +m[3], toughness: +m[4], flying: /flying/i.test(m[5] + m[2]) };
  if (/search your library for (?:up to (?:two|one) )?(?:a )?basic land/i.test(line)) e.ramp = 1;
  return e;
}

function profile(card) {
  const text = card.text.replace(/\(.*?\)/g, '');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const p = { ...card, kw: new Set(), effects: [], abilities: [] };
  p.isLand = /\bLand\b/.test(card.type) && !/Creature/.test(card.type);
  // Vehicles are treated as creatures (crew is not modeled).
  p.isCreature = /Creature/.test(card.type) || (/Vehicle/.test(card.type) && card.power > 0);
  p.isArtifact = /Artifact/.test(card.type);
  p.isPlaneswalker = /Planeswalker/.test(card.type);
  p.isInstantOrSorcery = /Instant|Sorcery/.test(card.type);
  p.hasX = /\{X\}/.test(card.cost);
  p.affinity = /Affinity for artifacts/.test(card.text);

  if (p.isLand) {
    p.tapMode = /enters tapped/.test(text) ? (/unless/.test(text) ? 'conditional' : 'always') : 'never';
    return p;
  }
  for (const l of lines) for (const part of l.toLowerCase().split(',').map(s => s.trim())) if (KEYWORDS.includes(part)) p.kw.add(part);
  if (/can't be blocked/i.test(text)) p.kw.add('unblockable');

  const manaLine = lines.find(l => /\{T\}[^:]*: Add/.test(l));
  if (manaLine) {
    const add = manaLine.split('Add')[1].split(/ or |, /)[0];
    let n = /two mana/.test(add) ? 2 : /one mana/.test(add) ? 1 : (add.match(/\{[WUBRGC]\}/g) || []).length;
    if (/^\{\d\}, \{T\}/.test(manaLine)) n -= 1;
    p.mana = Math.max(n, 0);
  }

  for (const l of lines) {
    if (p.isPlaneswalker) {
      const m = l.match(/^([+−-]?\d+): (.*)$/);
      if (m) { p.abilities.push({ cost: +m[1].replace('−', '-'), effects: effectsOf(m[2]) }); continue; }
    }
    const isTrigger = /^(Whenever|At the beginning)/.test(l);
    const isEtb = /^When .* enters/.test(l);
    if (/^At the beginning of (each|your) upkeep, .*create/i.test(l)) p.upkeepTokens = effectsOf(l).tokens;
    if (p.isInstantOrSorcery ? !isTrigger && !/^(Cycling|Overload|Flashback)/.test(l) : isEtb) p.effects.push(effectsOf(l));
    if (/you become the monarch/i.test(l) && (isEtb || /^When .* enters, if there is no monarch/.test(l))) p.monarchOnEnter = true;
    if (/^Whenever your commander enters, you become the monarch/.test(l)) p.monarchOnCommander = true;
    const vib = l.match(/create (a|two) tapped Vibranium tokens?/i);
    if (vib && /enters/.test(l)) p.vibraniumOnEnter = count(vib[1]);
    if (vib && /attacks/.test(l)) p.vibraniumOnAttack = count(vib[1]);
    if (/^Whenever you cast an artifact spell with mana value 4 or greater, put two \+1\/\+1 counters on/.test(l)) p.bigArtifactSelf = 2;
    if (/^Whenever you cast an artifact spell with mana value 4 or greater, put a \+1\/\+1 counter on each creature you control/.test(l)) p.bigArtifactTeam = 1;
    if (/^Lieutenant — At the beginning of combat on your turn, if you control your commander, put a \+1\/\+1 counter on each creature/.test(l)) p.lieutenantCounters = true;
    let m;
    if ((m = l.match(/^Equipped creature gets \+(\d+)\/\+(\d+)/))) p.equip = { power: +m[1], toughness: +m[2] };
    if ((m = l.match(/^Equip \{(\d+)\}/))) p.equipCost = +m[1];
  }

  // Cards whose key effect the text parser can't express.
  switch (card.name) {
    case 'Ghalta, Primal Hunger': p.reducedByPower = true; break;
    case 'Metalwork Colossus': p.reducedByArtifactMV = true; break;
    case 'Vanquish the Horde': p.reducedPerCreature = 6; break;
    case "Serra's Emissary": p.protectionFromCreatures = true; break;
    case 'Cyclonic Rift': p.overload = { cost: 7, mode: 'bounce' }; break;
    case 'Winds of Abandon': p.overload = { cost: 6, mode: 'exile-creatures' }; break;
    case 'Ghostly Prison': p.attackTax = 2; break;
    case 'Divine Visitation': p.angelTokens = true; break;
    case "Chandra's Ignition": p.ignition = true; p.effects = []; break;
    case 'Massacre Wurm': p.massacre = true; break;
    case 'Martial Coup': p.effects = [{ wipe: { mode: 'destroy', minPower: 0, minX: 5 }, tokens: { n: 'X', power: 1, toughness: 1 } }]; break;
    case 'Tangleweave Armor': p.germ = true; p.equip = null; break;
    case 'Hulkbuster Armor': p.equip = { setBase: 9, flying: true }; p.equipCost = 3; break;
    case 'Jhoira, Weatherlight Corsair': p.effects = [{ steal: true }]; break;
  }
  return p;
}

// ---------- game engine ----------

const rand = n => crypto.randomInt(n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

let uid = 0;
const permanent = (card, owner, extra = {}) => ({
  id: ++uid, card, owner, controller: owner, tapped: false, sick: true, damage: 0,
  power: card.power, toughness: card.toughness, loyalty: card.loyalty, counters: 0, token: false, equippedBy: [], ...extra,
});

function newPlayer(deck, seat) {
  const cards = deck.library.map(profile);
  const lands = h => h.filter(c => c.isLand).length;
  let lib = shuffle([...cards]);
  let hand = lib.splice(0, 7);
  let mulligans = 0;
  if (lands(hand) < 2 || lands(hand) > 5) {
    mulligans = 1;
    lib = shuffle([...cards]);
    hand = lib.splice(0, 7);
    const tooMany = lands(hand) > 4;
    const idx = hand.findIndex(c => (tooMany ? c.isLand : !c.isLand));
    lib.push(...hand.splice(idx >= 0 ? idx : 6, 1));
  }
  return {
    seat, name: deck.pilot, commander: profile(deck.commander), commanderZone: true, commanderCasts: 0,
    life: 40, library: lib, hand, battlefield: [], graveyard: [], alive: true, landPlayed: false,
    commanderDamage: {}, mulligans, early: [...hand, ...lib.slice(0, 8)].map(c => c.name), eliminatedRound: null, eliminatedBy: null, isPatrick: seat === 0,
  };
}

class Game {
  constructor(decks) {
    const players = decks.map((d, i) => newPlayer(d, i));
    this.players = shuffle(players);
    this.round = 0;
    this.log = [];
    this.stats = { cardsCast: {} };
  }

  get alive() { return this.players.filter(p => p.alive); }
  opponents(p) { return this.alive.filter(o => o !== p); }
  creatures(p) { return p.battlefield.filter(x => x.card.isCreature || x.animated); }
  walkers(p) { return p.battlefield.filter(x => x.card.isPlaneswalker); }
  hasProtection(p) { return p.battlefield.some(x => x.card.protectionFromCreatures); }
  note(s) { this.log.push(`R${this.round} ${s}`); }

  power(x) {
    let pw = x.power + x.counters;
    for (const eq of x.equippedBy) {
      if (eq.card.equip?.setBase) pw = eq.card.equip.setBase + x.counters;
      else if (eq.card.equip) pw += eq.card.equip.power;
    }
    return Math.max(pw, 0);
  }
  toughness(x) {
    let t = x.toughness + x.counters;
    for (const eq of x.equippedBy) {
      if (eq.card.equip?.setBase) t = eq.card.equip.setBase + x.counters;
      else if (eq.card.equip) t += eq.card.equip.toughness;
    }
    return t;
  }
  has(x, kw) { return x.card.kw.has(kw) || (kw === 'flying' && x.equippedBy.some(e => e.card.equip?.flying)) || x.extraKw?.has(kw); }
  threat(x) { return this.power(x) + (x.isCommander ? 3 : 0) + (this.has(x, 'flying') ? 2 : 0) + (x.card.protectionFromCreatures ? 6 : 0) + (x.card.upkeepTokens ? 2 : 0); }

  draw(p, n = 1) {
    for (let i = 0; i < n; i++) {
      if (!p.library.length) return this.eliminate(p, null, 'decked');
      p.hand.push(p.library.shift());
    }
  }

  eliminate(p, by, how) {
    if (!p.alive) return;
    p.alive = false;
    p.eliminatedRound = this.round;
    p.eliminatedBy = by?.name ?? how;
    this.note(`${p.name} eliminated (${how}${by ? ' by ' + by.name : ''})`);
    for (const x of p.battlefield) if (x.controller !== p) continue;
    p.battlefield = [];
    for (const o of this.alive) o.battlefield = o.battlefield.filter(x => x.owner !== p);
  }

  checkDeaths() {
    for (const p of this.players) {
      if (!p.alive) continue;
      for (const x of [...p.battlefield]) {
        const dead = (x.card.isCreature && (x.destroyed || (!this.has(x, 'indestructible') && (x.damage >= this.toughness(x) || x.deathtouched)))) ||
          (x.card.isPlaneswalker && x.loyalty <= 0) || (x.card.isCreature && this.toughness(x) <= 0);
        if (dead) this.leave(x, 'dies');
        else { x.destroyed = false; x.deathtouched = false; }
      }
      if (p.life <= 0) this.eliminate(p, p.lastHitBy, 'life');
    }
  }

  // Moves a permanent off the battlefield. Commanders go to the command zone (or hand when bounced).
  leave(x, how) {
    const ctrl = this.players.find(p => p.battlefield.includes(x));
    if (!ctrl) return;
    ctrl.battlefield = ctrl.battlefield.filter(y => y !== x);
    for (const eq of x.equippedBy) eq.attachedTo = null;
    if (x.attachedTo) x.attachedTo.equippedBy = x.attachedTo.equippedBy.filter(e => e !== x);
    for (const p of this.players) for (const y of p.battlefield) if (y.attachedTo === x) y.attachedTo = null;
    if (x.token) return;
    const owner = x.owner;
    if (x.isCommander) {
      if (how === 'bounce') owner.hand.push(owner.commander), (owner.commanderInHand = true);
      else owner.commanderZone = true;
      return;
    }
    if (how === 'bounce') owner.hand.push(x.card);
    else if (how === 'dies') owner.graveyard.push(x.card);
  }

  // Vibranium: indestructible artifact token that taps for {C} (its artifact-only restriction is ignored).
  vibranium(p, n) {
    for (let i = 0; i < n; i++) this.enter(p, { name: 'Vibranium', isArtifact: true, mana: 1, mv: 0, kw: new Set(['indestructible']), effects: [], abilities: [] }, { token: true, tapped: true });
  }

  enter(p, card, extra = {}) {
    const x = permanent(card, p, extra);
    p.battlefield.push(x);
    return x;
  }

  makeTokens(p, t, xValue = 0) {
    // Divine Visitation turns every creature token into a 4/4 flying, vigilant Angel.
    const n = t.n === 'X' ? xValue : t.n;
    if (p.battlefield.some(x => x.card.angelTokens)) t = { power: 4, toughness: 4, flying: true };
    for (let i = 0; i < n; i++) {
      const card = { name: 'Token', isCreature: true, kw: new Set(t.flying ? ['flying', 'vigilance'].slice(0, t.power === 4 ? 2 : 1) : []), power: t.power, toughness: t.toughness, effects: [], abilities: [] };
      this.enter(p, card, { token: true });
    }
  }

  // ----- mana -----
  manaSources(p) {
    return p.battlefield.filter(x => !x.tapped && ((x.card.isLand) || (x.card.mana && (!x.card.isCreature || !x.sick))));
  }
  availableMana(p) { return this.manaSources(p).reduce((s, x) => s + (x.card.isLand ? 1 : x.card.mana), 0); }
  pay(p, amount) {
    const sources = this.manaSources(p).sort((a, b) => (a.card.isLand ? 0 : 1) - (b.card.isLand ? 0 : 1));
    for (const x of sources) {
      if (amount <= 0) break;
      x.tapped = true;
      amount -= x.card.isLand ? 1 : x.card.mana;
    }
  }

  costOf(p, card) {
    if (card === p.commander) {
      const base = card.reducedByPower ? Math.max(card.mv - this.creatures(p).reduce((s, x) => s + this.power(x), 0), 2) : card.mv;
      return base + (p.commanderInHand ? 0 : 2 * p.commanderCasts);
    }
    const artifacts = p.battlefield.filter(x => x.card.isArtifact);
    if (card.affinity) return Math.max(card.mv - artifacts.length, 0);
    if (card.reducedByArtifactMV) return Math.max(card.mv - artifacts.filter(x => !x.card.isCreature).reduce((s, x) => s + (x.card.mv ?? 0), 0), 0);
    if (card.reducedPerCreature) return Math.max(card.mv - this.alive.reduce((s, q) => s + this.creatures(q).length, 0), card.mv - card.reducedPerCreature);
    return card.mv;
  }

  // ----- choosing targets -----
  bestEnemyCreature(p, filter = () => true) {
    let best = null;
    for (const o of this.opponents(p)) for (const x of this.creatures(o)) {
      if (this.has(x, 'hexproof') || !filter(x)) continue;
      if (!best || this.threat(x) > this.threat(best)) best = x;
    }
    return best;
  }
  boardPower(p) { return this.creatures(p).reduce((s, x) => s + this.power(x), 0); }
  enemyPower(p) { return this.opponents(p).reduce((s, o) => s + this.boardPower(o), 0); }

  removal(p, r) {
    const targets = r.each ? this.opponents(p).map(o => this.bestEnemyCreature(p, x => x.controller === o)).filter(Boolean) : [this.bestEnemyCreature(p)].filter(Boolean);
    for (const t of targets) {
      if (r.mode === 'destroy' && this.has(t, 'indestructible')) continue;
      if (r.mode === 'fight') {
        const mine = this.creatures(p).sort((a, b) => this.power(b) - this.power(a))[0];
        if (!mine) continue;
        t.damage += this.power(mine);
        if (this.has(mine, 'deathtouch')) t.deathtouched = true;
      } else if (r.mode === 'bounce') this.leave(t, 'bounce');
      else if (r.mode === 'exile') this.leave(t, 'exile');
      else t.destroyed = true;
      this.note(`${p.name} removes ${t.card.name}`);
    }
    this.checkDeaths();
  }

  wipe(p, w) {
    for (const o of this.alive) for (const x of this.creatures(o)) {
      if (w.minPower && this.power(x) < w.minPower) continue;
      if (w.mode === 'damage') { if (!(w.sparesOwnTokens && x.token && o === p)) x.damage += w.amount; continue; }
      if (w.mode === 'destroy' && this.has(x, 'indestructible')) continue;
      if (w.mode === 'exile') this.leave(x, 'exile'); else x.destroyed = true;
    }
    this.checkDeaths();
  }

  wipeIsGood(p, w) {
    const affected = q => this.creatures(q).filter(x => !w.minPower || this.power(x) >= w.minPower).reduce((s, x) => s + this.threat(x), 0);
    const theirs = this.opponents(p).reduce((s, o) => s + affected(o), 0);
    return theirs >= 12 && theirs >= 2 * affected(p) + 4;
  }

  // ----- casting -----
  resolve(p, card, xValue) {
    for (const e of card.effects) {
      if (e.wipe && (!e.wipe.minX || xValue >= e.wipe.minX)) this.wipe(p, e.wipe);
      if (e.removal) this.removal(p, e.removal);
      if (e.draw) this.draw(p, e.draw === 'X' ? xValue : e.draw);
      if (e.tokens) this.makeTokens(p, e.tokens, xValue);
      if (e.ramp) { const basic = this.enter(p, { name: 'Basic Land', isLand: true, kw: new Set(), effects: [], abilities: [] }); basic.tapped = true; }
      if (e.steal) { const o = this.opponents(p).sort((a, b) => b.life - a.life)[0]; const idx = o?.library.findIndex(c => /Artifact|Legendary/.test(c.type) && !c.isLand && !c.isInstantOrSorcery); if (idx >= 0) { const [c] = o.library.splice(idx, 1); this.enter(p, c); p.life -= c.mv; } }
    }
    if (card.ignition) {
      const src = this.creatures(p).sort((a, b) => this.power(b) - this.power(a))[0];
      if (src) {
        const dmg = this.power(src);
        for (const o of this.alive) for (const x of this.creatures(o)) if (x !== src) x.damage += dmg;
        for (const o of this.opponents(p)) { o.life -= dmg; o.lastHitBy = p; }
      }
      this.checkDeaths();
    }
    if (card.massacre) {
      for (const o of this.opponents(p)) for (const x of this.creatures(o)) if (this.toughness(x) <= 2) { x.destroyed = true; o.life -= 2; o.lastHitBy = p; }
      this.checkDeaths();
    }
  }

  cast(p, card, cost, xValue = 0, overload = false) {
    this.pay(p, cost);
    this.stats.cardsCast[card.name] = (this.stats.cardsCast[card.name] ?? 0) + 1;
    if (card === p.commander) {
      if (p.commanderInHand) { p.hand = p.hand.filter(c => c !== card); p.commanderInHand = false; } else { p.commanderZone = false; p.commanderCasts++; }
    } else p.hand.splice(p.hand.indexOf(card), 1);
    this.note(`${p.name} casts ${card.name}${overload ? ' (overload)' : ''}`);
    if (overload) {
      if (card.overload.mode === 'bounce') for (const o of this.opponents(p)) for (const x of o.battlefield.filter(y => !y.card.isLand)) this.leave(x, 'bounce');
      else for (const o of this.opponents(p)) for (const x of this.creatures(o)) this.leave(x, 'exile');
      p.graveyard.push(card);
      return;
    }
    if (card.isInstantOrSorcery) { this.resolve(p, card, xValue); p.graveyard.push(card); return; }
    if (card.isArtifact && card.mv >= 4) for (const y of p.battlefield) {
      if (y.card.bigArtifactSelf) y.counters += y.card.bigArtifactSelf;
      if (y.card.bigArtifactTeam) for (const c of this.creatures(p)) c.counters += y.card.bigArtifactTeam;
    }
    const x = this.enter(p, card, { isCommander: card === p.commander });
    if (card.monarchOnEnter) this.monarch = p;
    if (card === p.commander && p.battlefield.some(y => y.card.monarchOnCommander)) this.monarch = p;
    if (card.vibraniumOnEnter) this.vibranium(p, card.vibraniumOnEnter);
    if (card.germ) {
      const top = Math.max(...this.players.filter(q => q === p).map(q => q.commander.mv));
      this.enter(p, { name: 'Germ', isCreature: true, kw: new Set(), effects: [], abilities: [] }, { token: true, power: top, toughness: top });
    }
    if (card.equip && card.equipCost != null) this.autoEquip(p, x, true);
    this.resolve(p, card, xValue);
  }

  autoEquip(p, eq, free = false) {
    const target = this.creatures(p).filter(c => !c.token || true).sort((a, b) => this.threat(b) - this.threat(a))[0];
    if (!target || eq.attachedTo === target) return;
    if (!free) { if (this.availableMana(p) < eq.card.equipCost) return; this.pay(p, eq.card.equipCost); }
    if (eq.attachedTo) eq.attachedTo.equippedBy = eq.attachedTo.equippedBy.filter(e => e !== eq);
    eq.attachedTo = target;
    target.equippedBy.push(eq);
  }

  mainPhase(p) {
    // Land: prefer untapped.
    const lands = p.hand.filter(c => c.isLand);
    if (lands.length) {
      const landCount = p.battlefield.filter(x => x.card.isLand).length;
      const untapped = lands.find(c => c.tapMode === 'never' || (c.tapMode === 'conditional' && landCount >= 3));
      const land = untapped ?? lands[0];
      p.hand.splice(p.hand.indexOf(land), 1);
      const x = this.enter(p, land);
      x.tapped = land.tapMode === 'always' || (land.tapMode === 'conditional' && landCount < 3);
    }

    for (let guard = 0; guard < 20; guard++) {
      const mana = this.availableMana(p);
      const options = [...p.hand.filter(c => !c.isLand), ...(p.commanderZone ? [p.commander] : [])];
      let choice = null, best = -Infinity, xValue = 0, overload = false;
      for (const c of options) {
        const cost = this.costOf(p, c);
        if (cost > mana) continue;
        let score = cost;
        const x = c.hasX ? mana - cost : 0;
        if (c.hasX && x < 3) continue;
        if (c.overload && mana >= c.overload.cost) {
          const theirs = this.opponents(p).reduce((s, o) => s + o.battlefield.filter(y => !y.card.isLand).reduce((t, y) => t + (this.creatures(o).includes(y) ? this.threat(y) : (c.overload.mode === 'bounce' ? 2 : 0)), 0), 0);
          if (theirs >= 20) { score = 100; if (score > best) { best = score; choice = c; xValue = 0; overload = true; } continue; }
        }
        const wipe = c.effects.find(e => e.wipe)?.wipe;
        if (wipe) { if (!this.wipeIsGood(p, wipe)) continue; score = 90; }
        if (c.ignition) { const src = Math.max(0, ...this.creatures(p).map(x => this.power(x))); if (src < 4) continue; score = 80; }
        const rem = c.effects.find(e => e.removal)?.removal;
        if (rem && !c.isCreature) { const t = this.bestEnemyCreature(p); if (!t || this.threat(t) < 4) continue; score = 50 + this.threat(t); }
        if (c.mana && this.round <= 6) score += 20;
        if (c.effects.some(e => e.ramp) && this.round <= 6) score += 20;
        if (c === p.commander) score += 5;
        if (score > best) { best = score; choice = c; xValue = x; overload = false; }
      }
      if (!choice) break;
      this.cast(p, choice, choice.overload && overload ? choice.overload.cost : this.costOf(p, choice) + xValue, xValue, overload);
      if (!p.alive) return;
    }
    for (const eq of p.battlefield.filter(x => x.card.equip && x.card.equipCost != null && !x.attachedTo)) this.autoEquip(p, eq);
  }

  walkerPhase(p) {
    for (const w of this.walkers(p)) {
      const minus = w.card.abilities.filter(a => a.cost < 0 && w.loyalty + a.cost > 0)
        .find(a => (a.effects.removal && this.bestEnemyCreature(p) && this.threat(this.bestEnemyCreature(p)) >= 6) || (a.effects.wipe && this.wipeIsGood(p, a.effects.wipe)));
      const plus = w.card.abilities.find(a => a.cost >= 0);
      const use = minus ?? plus;
      if (!use) continue;
      w.loyalty += use.cost;
      const e = use.effects;
      if (e.removal) this.removal(p, e.removal);
      if (e.wipe) this.wipe(p, e.wipe);
      if (e.draw) this.draw(p, e.draw === 'X' ? 1 : e.draw);
      if (e.tokens) this.makeTokens(p, e.tokens, 1);
      this.checkDeaths();
    }
  }

  // ----- combat -----
  canBlock(blocker, attacker) {
    if (this.has(attacker, 'shadow') || this.has(attacker, 'unblockable')) return false;
    if (attacker.card.protectionFromCreatures) return false;
    if (this.has(attacker, 'flying') && !this.has(blocker, 'flying') && !this.has(blocker, 'reach')) return false;
    return true;
  }

  combat(p) {
    if (p.battlefield.some(x => x.isCommander)) for (const y of p.battlefield.filter(y => y.card.lieutenantCounters)) for (const c of this.creatures(p)) c.counters++;
    const ready = this.creatures(p).filter(x => !x.tapped && (!x.sick || this.has(x, 'haste')) && this.power(x) > 0);
    if (!ready.length) return;
    const targets = this.opponents(p).filter(o => !this.hasProtection(o));
    if (!targets.length) return;
    const blockersOf = o => this.creatures(o).filter(x => !x.tapped);
    const taxOf = o => o.battlefield.filter(x => x.card.attackTax).reduce((s, x) => s + x.card.attackTax, 0);
    const score = o => o.life + blockersOf(o).reduce((s, x) => s + this.toughness(x), 0) + 15 * taxOf(o);
    const target = targets.sort((a, b) => score(a) - score(b))[0];
    const blockers = blockersOf(target);

    const killsIt = (b, a) => this.has(b, 'deathtouch') || this.power(b) >= this.toughness(a) - a.damage;
    const safe = a => this.has(a, 'indestructible') || !blockers.some(b => this.canBlock(b, a) && killsIt(b, a));
    const totalPower = ready.reduce((s, a) => s + this.power(a) * (this.has(a, 'double strike') ? 2 : 1), 0);
    const allIn = totalPower - blockers.length * 4 >= target.life;
    let attackers = ready.filter(a => allIn || safe(a));
    const tax = taxOf(target);
    if (tax) {
      attackers = attackers.sort((a, b) => this.power(b) - this.power(a)).slice(0, Math.floor(this.availableMana(p) / tax));
      this.pay(p, attackers.length * tax);
    }
    if (!attackers.length) return;
    for (const a of attackers) if (!this.has(a, 'vigilance')) a.tapped = true;
    for (const a of attackers) if (a.card.vibraniumOnAttack) this.vibranium(p, a.card.vibraniumOnAttack);

    // Defender blocks: good blocks first, then chump if facing lethal.
    const blocks = new Map();
    const free = [...blockers];
    const sorted = [...attackers].sort((a, b) => this.power(b) - this.power(a));
    for (const a of sorted) {
      const good = free.find(b => this.canBlock(b, a) && !this.has(a, 'menace') && (killsIt(b, a) || this.toughness(b) > this.power(a)) && !(this.has(a, 'deathtouch') && !this.has(b, 'indestructible')));
      if (good) { blocks.set(a, good); free.splice(free.indexOf(good), 1); }
    }
    const unblockedDamage = () => sorted.filter(a => !blocks.has(a)).reduce((s, a) => s + this.power(a) * (this.has(a, 'double strike') ? 2 : 1), 0);
    for (const a of sorted) {
      if (unblockedDamage() < target.life) break;
      if (blocks.has(a)) continue;
      const chump = free.find(b => this.canBlock(b, a) && !this.has(a, 'menace'));
      if (chump) { blocks.set(a, chump); free.splice(free.indexOf(chump), 1); }
    }

    let toPlayer = 0;
    for (const a of sorted) {
      const mult = this.has(a, 'double strike') ? 2 : 1;
      const b = blocks.get(a);
      if (b) {
        const lethal = Math.max(this.toughness(b) - b.damage, 1);
        b.damage += this.power(a) * mult;
        if (this.has(a, 'deathtouch')) b.deathtouched = true;
        if (this.has(a, 'trample')) toPlayer += Math.max(this.power(a) * mult - (this.has(a, 'deathtouch') ? 1 : lethal), 0);
        const firstStrikeKill = (this.has(a, 'double strike') || this.has(a, 'first strike')) && !this.has(b, 'first strike') && this.power(a) >= lethal && !this.has(b, 'indestructible');
        if (!firstStrikeKill) { a.damage += this.power(b); if (this.has(b, 'deathtouch')) a.deathtouched = true; }
      } else {
        let dmg = this.power(a) * mult;
        // Unblocked attackers kill planeswalkers they can finish, then hit the player.
        const w = this.walkers(target).sort((x, y) => x.loyalty - y.loyalty).find(x => x.loyalty <= dmg && x.loyalty > 0);
        if (w) { w.loyalty -= dmg; dmg = 0; }
        toPlayer += dmg;
        if (a.isCommander) target.commanderDamage[p.name] = (target.commanderDamage[p.name] ?? 0) + this.power(a) * mult;
      }
      if (this.has(a, 'lifelink')) p.life += this.power(a) * mult;
    }
    target.life -= toPlayer;
    target.lastHitBy = p;
    if (toPlayer > 0 && this.monarch === target) this.monarch = p;
    if (Object.values(target.commanderDamage).some(d => d >= 21)) target.life = 0;
    this.checkDeaths();
  }

  turn(p) {
    p.landPlayed = false;
    for (const x of p.battlefield) { x.tapped = false; x.sick = false; }
    for (const q of this.players) for (const x of q.battlefield) x.damage = 0;
    for (const x of p.battlefield) if (x.card.upkeepTokens) this.makeTokens(p, x.card.upkeepTokens, 1);
    this.draw(p);
    if (!p.alive) return;
    this.mainPhase(p);
    if (!p.alive) return;
    this.walkerPhase(p);
    if (!p.alive) return;
    this.combat(p);
    if (!p.alive) return;
    if (this.monarch === p) this.draw(p);
    if (this.monarch && !this.monarch.alive) this.monarch = p;
    while (p.hand.length > 7) p.graveyard.push(p.hand.shift());
  }

  play() {
    while (this.alive.length > 1 && this.round < MAX_ROUNDS) {
      this.round++;
      for (const p of this.players) {
        if (!p.alive) continue;
        this.turn(p);
        if (this.alive.length <= 1) break;
      }
    }
    const winner = this.alive.length === 1 ? this.alive[0] : [...this.alive].sort((a, b) => b.life - a.life)[0];
    return { winner: winner.name, timeout: this.alive.length > 1, rounds: this.round, seat: this.players.findIndex(p => p.isPatrick) + 1,
      patrick: this.players.find(p => p.isPatrick), players: this.players };
  }
}

// ---------- run ----------

(async () => {
  const games = +(process.argv[2] ?? 10);
  const decks = await loadDecks();
  const oneVsOne = process.argv[4] === '--bracket3-1v1';
  const pool = oneVsOne ? fs.readdirSync(POOL_DIR).map(f => {
    const d = JSON.parse(fs.readFileSync(`${POOL_DIR}/${f}`, 'utf8')).data;
    return { pilot: d.commander[0].name, source: d.source, deckName: d.name, commander: fromMtgjson(d.commander[0]),
      library: d.mainBoard.flatMap(c => Array(c.count).fill(fromMtgjson(c))) };
  }) : null;
  const results = [];
  for (let g = 0; g < games; g++) {
    const opponent = oneVsOne ? pool[rand(pool.length)] : null;
    const game = new Game(oneVsOne ? [decks[0], opponent] : decks);
    const r = game.play();
    results.push({
      game: g + 1, opponent: opponent ? `${opponent.pilot} (${opponent.source})` : undefined, winner: r.winner, rounds: r.rounds, timeout: r.timeout, patrickSeat: r.seat,
      patrickFinish: r.patrick.alive ? (r.winner === r.patrick.name ? 'won' : 'alive at timeout') : `out R${r.patrick.eliminatedRound} (${r.patrick.eliminatedBy})`,
      log: game.log,
      patrickEarly: r.patrick.early,
      patrickCasts: [...new Set(game.log.filter(l => l.includes(`${r.patrick.name} casts `)).map(l => l.split(' casts ')[1].replace(' (overload)', '')))],
    });
  }
  const wins = {};
  for (const r of results) wins[r.winner] = (wins[r.winner] ?? 0) + 1;
  const out = { games, wins, results: games <= 20 ? results : results.map(({ log, ...r }) => r) };
  fs.writeFileSync(`results-${DECK_FILE.replace('.txt', '')}${oneVsOne ? '-bracket3-1v1' : ''}-${games}.json`, JSON.stringify(out, null, 2));
  const patrickWins = results.filter(r => r.patrickFinish === 'won').length;
  console.log(oneVsOne ? `Patrick won ${patrickWins}/${games} (${(100 * patrickWins / games).toFixed(1)}%) 1v1 vs. ${pool.length} bracket-3 decks` : JSON.stringify({ games, wins }, null, 1));
  if (games <= 20) for (const r of results) console.log(`Game ${r.game}: winner ${r.winner} in ${r.rounds} rounds${r.timeout ? ' (timeout, most life)' : ''} | Patrick seat ${r.patrickSeat}, ${r.patrickFinish}`);
})().catch(e => { console.error(e); process.exit(1); });
