# Combos and play sequences in Patrick’s current Jace deck

Checked against `gauntlet/versions/jace/v0.1-real/deck.dck` and local Forge card text, with current Scryfall Oracle data/rulings checked for the main loop pieces. All cards below are already in that physical baseline. Dreadhorde Invasion, Skrelv’s Hive and Darksteel Angel are owned spares, not assumed installed. No Oath of Teferi, Spark Double, Cyclonic Rift or proposed purchases are needed for these sequences.

This is a practical guide to the main combinations, not a complete catalog of every possible game state. “Infinite” means a loop you can repeat an arbitrarily large chosen number of times, with opponents able to respond. Most entries are useful combinations rather than infinite loops.

## 1. Aminatou + Nicol Bolas + Ajani: arbitrarily many Cadets, then haste

**Cards:** Aminatou, the Fateshifter; Nicol Bolas, Dragon-God; Ajani Unrelenting.

**Setup:** all three on your battlefield, on your main phase with the stack empty. Aminatou and Bolas must be able to activate; each needs at least two loyalty for the first −1 so it survives the cost. Fresh Aminatou (3) and Bolas (4) satisfy this. Ajani stays on the battlefield throughout.

1. Bolas has Aminatou’s −1 because he gains the loyalty abilities of other planeswalkers on the battlefield.
2. Activate Aminatou’s −1 targeting Bolas. Ajani’s triggered ability creates a 2/2 Cadet; then Bolas is exiled and immediately returns with four loyalty.
3. Activate the returned Bolas’s borrowed −1 targeting Aminatou. Ajani makes another Cadet; Aminatou leaves and returns with three loyalty.
4. Both are reset. Repeat steps 2–3 to make as many Cadets as you choose, without additional mana after setup.
5. End with Bolas freshly returned and unused, then activate his borrowed **Ajani +1**, giving your creatures haste and +1 power for the turn. Or use Ajani’s own +1 if it is still available. Your Cadets can attack as 3/2s that turn.

This is a potential combat finish, not an unavoidable win: removal, counters to relevant abilities, combat prevention and attack restrictions can disrupt it. **Aminatou + Bolas alone give the repeatable blink loop; Ajani turns those activations into tokens.** Without a payoff, repeating the two-card loop does not itself win.

Why it works: the blinked planeswalker is a new permanent and may activate again. Bolas gains loyalty abilities, not Ajani’s token-making triggered ability; the original Ajani supplies the token triggers. [Aminatou’s official rulings](https://magic.wizards.com/en/news/feature/double-masters-2022-release-notes-2022-06-24), [Bolas’s official rulings](https://magic.wizards.com/en/news/feature/war-spark-release-notes-2019-04-19), [Ajani’s Oracle text](https://scryfall.com/card/fra/242/ajani-unrelenting).

## 2. Ajani + Jace: make replacement fodder

Ajani creates a Cadet whenever you activate any loyalty ability, including his own.

- If you have no fodder, activate Ajani’s +1 first to get a Cadet.
- Activate Jace’s −3 targeting that existing Cadet.
- Ajani’s trigger makes a replacement Cadet before Jace’s ability resolves.
- Jace exiles the originally targeted Cadet and reveals a creature/planeswalker. The replacement remains for blocking or a future activation.

**You must already have a legal target when you activate Jace.** The Cadet created by that same −3 activation cannot retroactively become its target. This is a recurring engine, not unlimited Jace activations by itself.

## 3. Way of the Healer + Jace: planeswalker tokens are fodder too

Way of the Healer supplies a Jace planeswalker token with five loyalty if you have none to empower, and gives your planeswalkers a −2 that produces a Cadet and surveils.

You can either use that token’s new −2 to make creature fodder, or have Jace, Multiverse Architect’s −3 exile the **Jace planeswalker token itself**. Other planeswalkers you control can also spend two loyalty to make Cadets. With Ajani present, such an activation generates an additional Cadet from Ajani.

Plan for All Outcomes and Fatehold Charm can also create/empower Jace tokens. **Empower Jace affects a Jace token; it does not put those counters on your nontoken commander.** Jace’s real −3 can exile another creature OR planeswalker you control; it is not limited to creature tokens or power 2.

## 4. Saheeli + noncreature spells: create fodder while developing

With Saheeli, Sublime Artificer out, casting a rock, instant, sorcery, enchantment or planeswalker creates a Servo. Casting Jace himself triggers Saheeli, so the Servo can arrive before Jace resolves and be ready for his first −3. Saheeli does not trigger for her own cast before she is on the battlefield.

This is one of the current deck’s most useful ways to avoid spending an entire extra card solely for a token. The Servo is also a blocker if you do not need to exile it.

## 5. Arrange the top of your library, then use Jace

**Aminatou +1 → Jace −3:** put a desired creature/planeswalker from your hand on top, then exile an expendable creature/planeswalker with Jace. The arranged card is revealed first and enters without paying its mana cost.

**Brainstorm or Brainsurge → Jace −3:** put desired payoffs on top in the chosen order, then use Jace. Two creature/planeswalker cards on top can set up two consecutive −3 hits if you have a legal reset/second activation and fodder, with no intervening draw, shuffle or mill.

**Loyal Tutor → Jace −3:** in this deck, Loyal Tutor finds a **planeswalker**, so fetch Aminatou, Ajani or another walker and put it on top. It does not find Serra’s Emissary or another ordinary creature.

These are controlled reveals, not free casts: “when you cast” abilities do not trigger from the card merely entering via Jace.

## 6. Aminatou −1 resets Jace for a second activation

With Jace at four loyalty and two fodder permanents:

1. Jace −3 uses the first fodder; he remains at one loyalty.
2. Aminatou −1 blinks Jace; he returns at four loyalty.
3. The returned Jace −3 uses the second fodder.

Aminatou normally cannot use both her +1 top-deck setup and her −1 blink that turn. Brainstorm/Brainsurge can provide the top-deck setup while Aminatou is reserved for blinking. Resetting a walker removes the old counters, so do not blink a high-loyalty walker if you want to keep those counters.

## 7. Aminatou + entering-creature abilities

Her −1 can blink a creature you own to repeat its entry effect:

- **Archon of Cruelty:** another sacrifice/discard/life-loss trigger, plus your draw/life gain.
- **Galactus:** another permanent exiled.
- **Memnarch:** two more Myr.
- **Overlord of the Mistmoors:** two more flying Insects.

A particularly useful Overlord sequence: pay its four-mana impending cost, receive the entry Insects, then blink it with Aminatou. It returns without being impending, as a creature immediately, and creates another pair of Insects. It still needs haste or a later turn to attack. This is a four-mana route to the full creature plus four tokens when Aminatou is available.

Aminatou cannot blink a token and bring it back; it will not return. Her ability can recover a permanent you own that an opponent has taken, returning it under your control.

## 8. Cursed Mirror + Archon of Cruelty: entry plus hasty attack

While any player controls an Archon of Cruelty, cast Cursed Mirror as its copy. You get the Archon entry trigger, and haste lets the Mirror attack for a second trigger that turn if combat is available. After the turn it becomes the red mana rock again.

Aminatou can later blink your Mirror so you can choose a creature to copy again and repeat an entry effect. Copying your own legendary creature can invoke the legend rule; Archon is nonlegendary and avoids that problem.

Alternatively, Mirror can copy **Serra’s Emissary**, which is also nonlegendary. Because Mirror actually enters as that copy, you choose a card type for the new copy; it can grant a second protection type for that turn. Saheeli merely turning an existing artifact into an Emissary copy does not create a new entry or a new card-type choice, so do not assume the same result.

## 9. Avacyn, Angel of Hope + your destroy wipes

With Angel of Hope protecting your permanents, the destroy portions of **Martial Coup** or **White Sun’s Twilight** (X at least 5), or **Elspeth’s −3**, can clear vulnerable opposing creatures while your creatures survive through indestructible. Your token-production and planeswalker infrastructure can remain in place.

This does not work against **Sunfall or Overwrite the Multiverse**, which exile creatures. Indestructible also does not prevent sacrifice or death from zero toughness.

## 10. Avacyn, Angel of Horror + Triplicate Titan + Staff of Compleation

With all three under your control:

1. Tap Staff and pay one life to destroy your Titan.
2. Titan’s death creates three Golems.
3. Angel of Horror schedules the Titan to return at the beginning of the next end step.
4. Titan returns; you keep the Golems. The Staff can do it again when untapped, generally next turn.

This is repeatable token production, not free unlimited tokens. If you kill Titan after an end step has begun, its scheduled return waits for the following end step. Exiling Titan with Jace does **not** trigger either death ability. The Golems are valid real-life Jace fodder despite being 3/3; the sim’s power-2 limit is a custom AI restriction.

Angel of Horror also returns other nontoken creatures that die, allowing recovery after destroy wipes. Tokens do not return through this effect.

## 11. Flux Channeler + Tekuthal: two proliferations per noncreature spell

A noncreature spell triggers Flux Channeler’s proliferate; Tekuthal replaces that event with two proliferations. Choose your planeswalkers to add two loyalty in total to each eligible walker. These events also can increase story counters on Staff of the Storyteller, counters on creatures and time counters on Dreamtide Whale.

Whale’s second-spell trigger also gets doubled by Tekuthal. Adding a time counter before Whale loses its last one can extend its life. Once vanishing’s sacrifice trigger is already on the stack, simply adding a counter does not cancel it.

This is fast loyalty growth, not permission to activate the same permanent twice. Bolas also gains your other walkers’ loyalty abilities but still normally gets only one activation per permanent each turn. Build counters before an unused activation if you want an ultimate that turn.

## 12. Synthetic Destiny + token board: convert small bodies into payoffs

Cast Synthetic Destiny with several creatures/tokens out. It exiles your creature board and, at the next end step, reveals that many creature cards from your library and puts them onto the battlefield, if enough remain there.

Five expendable creatures can become five creature payoffs. You can cast it in response to many destroy/exile wipes to move the creatures away before the wipe resolves, but assess the exact spell: it is not blanket protection from every effect. It also exiles your valuable creatures along with tokens; the exiled nontoken cards do not return through Avacyn, Angel of Horror.

Important: Destiny looks for **creatures only**, unlike commander Jace, which can reveal creatures or planeswalkers. It needs a preexisting board and six mana, so it cannot fix a token-free opening. This genuine human-play line is why zero AI casts do not prove the card is bad.

## 13. Saheeli + Archfiend of Despair: multiply end-step life loss

Control Archfiend and an artifact. Use Saheeli’s −2 to make the artifact an Archfiend copy until end of turn. It is nonlegendary, so you can have both. Both must remain copies through the beginning of the end step to trigger.

If an opponent lost 10 life earlier that turn:

- First Archfiend trigger makes them lose another 10 (20 lost so far).
- The second sees 20 lost and makes them lose another 20.
- Total life lost that turn is **40**, assuming nothing changes the arithmetic or prevents relevant losses.

Saheeli’s copy effect is still active at the end step; it ends later in cleanup. Cursed Mirror entering as an Archfiend copy can supply the second Archfiend too. Copying an existing artifact does not retrigger entry abilities; this line works because the copied end-step ability can trigger later.

Archfiend also removes the life-gain drawback of Swords to Plowshares when used on an opponent’s creature: opponents cannot gain that life while Archfiend’s restriction applies.

## 14. Nissa + Fabled Passage: two creature reveals over different turns

With Nissa, Leyline Tamer out, play Fabled Passage during your turn. Her first landfall resolution that turn draws a card, then reveals into a creature.

If you can wait, sacrifice Passage on an opponent’s turn and find a basic land. That land gives Nissa a landfall on a different turn: another draw and creature reveal. This requires a basic remaining and Nissa still present. Multiple landfalls on the same turn still draw cards, but only the first resolution that turn gives the creature reveal.

Nissa draws **before** her creature reveal. If arranging her hit with Brainstorm, put an expendable card first and the desired creature second; putting the creature first just draws it. Fetching shuffles, so do not expect a previously stacked library to survive the Passage search.

## 15. Staff of the Storyteller + token production: fodder plus cards

The Staff supplies a Spirit on entry, and your later creature-token batches add story counters. You can spend a counter, white mana and a tap to draw. Proliferation can grow the story-counter supply.

One event creating three Soldiers gives one story-counter trigger, not three. This is a reason to value repeated token-making events and not treat the Staff as merely its first Spirit.

## 16. Serra’s Emissary + Avacyn, Angel of Hope: combat protection plus destroy protection

Choose **creature** as Emissary enters. You and your creatures have protection from creatures: creature damage is prevented, and your protected creatures cannot normally be blocked by creatures. Angel of Hope adds indestructible to your permanents, covering many destroy effects that protection alone would not stop. This is a strong protected-board pairing, not a complete lock; untargeted exile, sacrifice and toughness reduction remain relevant answers.

## The three sequences I would practice first

1. **Saheeli or Ajani supplies fodder → top-deck setup → Jace −3.** This directly addresses the last game’s token shortage.
2. **Aminatou blinks an entry-effect payoff or resets Jace.** Choose which job you need before spending her activation.
3. **Aminatou/Bolas/Ajani Cadet loop**, when all three are present and the initial loyalty/activation conditions are met.

Rules checks for this guide use real card text, not Forge’s AI shortcuts. Your commander can exile another creature or planeswalker of any power/loyalty. Check opponents’ responses and applicable restrictions; these sequences are not protected from interaction.

Evidence: the exact physical baseline, local card scripts, `analysis/jace-combos/cards.json` (current Oracle snapshot), the official Aminatou/Bolas release-note rulings linked above, and [Archfiend Oracle text](https://scryfall.com/card/frc/46/archfiend-of-despair). No claim is made that the existing AI executes these human lines or that this is an exhaustive Commander Spellbook audit.
