const Scry = require('scryfall-sdk');
Scry.setAgent('mtg-commander', '1.0.0');
const names = process.argv.slice(2);
(async () => {
  for (const n of names) {
    try {
      const c = await Scry.Cards.byName(n, true);
      console.log(`${c.name} | ${c.type_line} | CI ${c.color_identity.join('') || 'C'} | cmc ${c.cmc} | $${c.prices.usd ?? '-'}`);
    } catch (e) { console.log(`NOT FOUND: ${n} (${e.message})`); }
  }
  process.exit(0);
})();
