package forge.view;

import java.io.File;
import java.io.PrintWriter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import com.google.common.eventbus.Subscribe;

import forge.GuiDesktop;
import forge.ai.LobbyPlayerAi;
import forge.ai.PlayerControllerAi;
import forge.deck.Deck;
import forge.deck.io.DeckSerializer;
import forge.game.*;
import forge.game.card.Card;
import forge.game.card.CardCollection;
import forge.game.card.CardCollectionView;
import forge.game.player.DelayedReveal;
import forge.game.combat.Combat;
import forge.game.combat.CombatUtil;
import forge.game.spellability.SpellAbility;
import forge.game.ability.ApiType;
import forge.game.keyword.Keyword;
import forge.ai.ComputerUtilMana;
import forge.game.event.GameEvent;
import forge.game.player.Player;
import forge.game.player.RegisteredPlayer;
import forge.game.zone.ZoneType;
import forge.gui.GuiBase;
import forge.model.FModel;
import forge.util.MyRandom;

/**
 * Commander pod simulator for deck testing (2- or 4-player). Differences from `forge sim`:
 *  - Every player follows the spec's mulligan rule: keep a 7-card hand only with 3 or 4 lands
 *    (Commander's free first mulligan still applies; a hand is kept once it would drop to 4 cards).
 *  - Each game uses seed (base seed + game number), so every deck version sees the same shuffles and pods.
 *  - Writes per game: <out>/<tag>-g<n>.log (Forge game log) and <out>/<tag>-g<n>.hand.jsonl (player 1's hand
 *    after every change, for per-card drawn/cast stats).
 *  - SMART_AI=1 installs SmartAi's extra card logic for player 1, plus T'Challa-first sequencing: whenever T'Challa
 *    is in the command zone and castable, he's cast before any other spell the AI picked.
 *  - HOLD_MANA=1 (player 1, with SMART_AI): once the board is developed (commander out, 5+ lands, round 5+) and
 *    you're under threat (an opponent with 10+ creature power, a runaway leader that isn't you, or you at ≤ 20 life),
 *    don't cast a spell on your turn that would leave less mana than your cheapest protection/removal instant costs.
 *  - COMMANDER_FIRST=1 (player 1, with SMART_AI): any commander (e.g. Jace) waiting in the command zone is cast before
 *    anything else as soon as its cost plus commander tax is payable (T'Challa already gets this from SMART_AI).
 *  - JACE_REAL_RULES / JACE_COMBO_AI / JACE_TELEMETRY / FIXTURE: Jace test support, see JaceCombo.java (C7).
 *  - KEEP_TOKENS=1 (player 1, with SMART_AI): creature tokens with power ≤ 2 never attack unless the attack is lethal to
 *    the defending player; they stay home to block and as exile fodder for Jace's −3.
 *  - ARTIFACTS_FIRST=1 (player 1, with SMART_AI): with T'Challa on the battlefield, cast an affordable artifact
 *    with MV 4+ in the first main phase so his +1/+1 counters (and the Rhino trigger) land before he attacks.
 *  - SAFE_ATTACK=1 (player 1, with SMART_AI): T'Challa doesn't attack into untapped blockers that could kill him
 *    (summed power or deathtouch) unless he's indestructible or the attack is lethal.
 *  - POLITICS=1: when one player is "really powerful" (creature power ≥ 12 and ≥ 1.5× the next strongest player),
 *    every other player redirects its attackers at that player and commits its other untapped creatures to the attack
 *    (keeping one blocker home at 10 life or less). Applies to all players, including Patrick.
 *  - FULL_STATE=1 also writes <tag>-g<n>.state.jsonl for the replay viewer.
 *
 * Usage: PodSim <deck dir> <out dir> <tag> <games> <base seed> <deck1.dck> <deck2.dck> [<deck3.dck> <deck4.dck>]
 */
public final class PodSim {

    /** Mulligan rule from the spec, applied to every player. */
    public static final class RuleController extends PlayerControllerAi {
        public RuleController(Game game, Player p, LobbyPlayerAi lobby) {
            super(game, p, lobby);
        }

        @Override
        public Card chooseSingleCardForZoneChange(ZoneType destination, List<ZoneType> origin, SpellAbility sa, CardCollection fetchList,
                DelayedReveal delayedReveal, String selectPrompt, boolean isOptional, Player decider) {
            Card pick = jaceChoice(destination, origin, sa, fetchList);
            return pick != null ? pick : super.chooseSingleCardForZoneChange(destination, origin, sa, fetchList, delayedReveal, selectPrompt, isOptional, decider);
        }

        @Override
        public List<Card> chooseCardsForZoneChange(ZoneType destination, List<ZoneType> origin, SpellAbility sa, CardCollection fetchList,
                int min, int max, DelayedReveal delayedReveal, String selectPrompt, Player decider) {
            List<Card> pick = super.chooseCardsForZoneChange(destination, origin, sa, fetchList, min, max, delayedReveal, selectPrompt, decider);
            Card top = jaceChoice(destination, origin, sa, fetchList);
            if (top != null && pick != null && !pick.contains(top)) {
                List<Card> fixed = new ArrayList<>(pick);
                if (!fixed.isEmpty() && fixed.size() >= max) fixed.remove(fixed.size() - 1);
                fixed.add(top);
                return fixed;
            }
            return pick;
        }

        /** JACE_COMBO_AI: put the chosen payoff where Jace's −3 will reveal it (moved last = ends on top). */
        @Override
        public CardCollectionView orderMoveToZoneList(CardCollectionView cards, ZoneType destinationZone, SpellAbility source) {
            CardCollectionView order = super.orderMoveToZoneList(cards, destinationZone, source);
            if (!JaceCombo.COMBO || destinationZone != ZoneType.Library || !getPlayer().getName().startsWith("Ai(1)")) return order;
            Card top = JaceCombo.chooseTopFromHand(getPlayer(), source, new ArrayList<>(cards));
            if (top == null || !order.contains(top)) return order;
            CardCollection fixed = new CardCollection(order);
            fixed.remove(top);
            fixed.add(top);
            return fixed;
        }

        private Card jaceChoice(ZoneType destination, List<ZoneType> origin, SpellAbility sa, CardCollection fetchList) {
            Player me = getPlayer();
            if (!JaceCombo.COMBO || !me.getName().startsWith("Ai(1)") || destination != ZoneType.Library || origin == null) return null;
            List<Card> options = new ArrayList<>(fetchList);
            if (origin.contains(ZoneType.Hand)) return JaceCombo.chooseTopFromHand(me, sa, options);
            if (origin.contains(ZoneType.Library)) return JaceCombo.chooseTutorTarget(me, sa, options);
            return null;
        }

        /** PROLIF_DEBUG=1 (C13 diagnostic): log every proliferate decision — who decides, options offered, chosen. */
        @Override
        public <T extends forge.game.GameEntity> List<T> chooseEntitiesForEffect(forge.util.collect.FCollectionView<T> optionList, int min, int max,
                DelayedReveal delayedReveal, SpellAbility sa, String title, Player targetedPlayer, java.util.Map<String, Object> params) {
            List<T> r = super.chooseEntitiesForEffect(optionList, min, max, delayedReveal, sa, title, targetedPlayer, params);
            if (System.getenv("PROLIF_DEBUG") != null && sa != null && sa.getApi() == ApiType.Proliferate) {
                System.out.println("PROLIF host=" + (sa.getHostCard() == null ? "?" : sa.getHostCard().getName()) + " decider=" + getPlayer().getName()
                        + " activator=" + (sa.getActivatingPlayer() == null ? "null" : sa.getActivatingPlayer().getName())
                        + " options=" + optionList.size() + " " + optionList + " chosen=" + r);
            }
            return r;
        }

        @Override
        public boolean mulliganKeepHand(Player firstPlayer, int cardsToReturn) {
            Player me = getPlayer();
            long lands = me.getCardsIn(ZoneType.Hand).stream().filter(Card::isLand).count();
            int keptSize = me.getCardsIn(ZoneType.Hand).size() - cardsToReturn;
            return (lands >= 3 && lands <= 4) || keptSize <= 4;
        }

        /** T'Challa first: if he's waiting in the command zone and castable now, cast him before anything else. */
        @Override
        public List<SpellAbility> chooseSpellAbilityToPlay() {
            Player me = getPlayer();
            if (FIXTURE != null && !fixtureApplied && me.getName().startsWith("Ai(1)") && me.getGame().getPhaseHandler().isPlayerTurn(me)
                    && me.getGame().getPhaseHandler().is(forge.game.phase.PhaseType.MAIN1)) {
                applyFixture(me);
            }
            if (JaceCombo.COMBO && SMART && me.getName().startsWith("Ai(1)")) {
                SpellAbility combo = JaceCombo.next(me);
                if (combo != null) return new ArrayList<>(List.of(combo));
            }
            List<SpellAbility> pick = super.chooseSpellAbilityToPlay();
            if (SMART && me.getName().startsWith("Ai(1)") && pick != null && !pick.isEmpty()) {
                SpellAbility first = pick.get(0);
                boolean alreadyTchalla = first.getHostCard() != null && SmartAi.TCHALLA.equals(first.getHostCard().getName());
                if (!alreadyTchalla && first.isSpell() && SmartAi.tchallaWaiting(me)) {
                    for (Card c : me.getCardsIn(ZoneType.Command)) {
                        if (!SmartAi.TCHALLA.equals(c.getName())) continue;
                        SpellAbility cast = c.getFirstSpellAbility();
                        cast.setActivatingPlayer(me);
                        if (cast.canPlay()) {
                            if (DEBUG) System.out.println("PodSim: casting T'Challa before " + first.getHostCard().getName());
                            return new ArrayList<>(List.of(cast));
                        }
                    }
                }
            }
            if (COMMANDER_FIRST && SMART && me.getName().startsWith("Ai(1)") && pick != null && !pick.isEmpty()) {
                SpellAbility recast = commanderWaiting(me);
                Card first = pick.get(0).getHostCard();
                if (recast != null && (first == null || !first.getName().equals(recast.getHostCard().getName()))) {
                    if (DEBUG) System.out.println("PodSim: recasting " + recast.getHostCard().getName() + " before " + (first == null ? "?" : first.getName()));
                    return new ArrayList<>(List.of(recast));
                }
            }
            if (ARTIFACTS_FIRST && SMART && me.getName().startsWith("Ai(1)")) {
                SpellAbility early = bigArtifactBeforeCombat(me);
                if (early != null) return new ArrayList<>(List.of(early));
            }
            if (HOLD_MANA && SMART && me.getName().startsWith("Ai(1)") && pick != null && !pick.isEmpty() && shouldHoldMana(me, pick.get(0))) {
                return new ArrayList<>();
            }
            return pick;
        }

        /** Commander first: a commander of mine in the command zone (and none of mine on the battlefield) that I can pay for now. */
        private SpellAbility commanderWaiting(Player me) {
            Set<String> names = new HashSet<>();
            for (Card c : me.getCommanders()) names.add(c.getName());
            if (DEBUG) System.out.println("PodSim commander-first: commanders=" + names + " command zone=" + me.getCardsIn(ZoneType.Command).stream().map(Card::getName).toList());
            if (me.getCardsIn(ZoneType.Battlefield).anyMatch(c -> names.contains(c.getName()))) return null;
            for (Card c : me.getCardsIn(ZoneType.Command)) {
                if (!names.contains(c.getName())) continue;
                if (JaceCombo.JACE.equals(c.getName()) && JaceCombo.holdJace(me)) return null;
                // Casting from the command zone is granted by the "Commander Effect" may-play permission, so ask Forge for
                // the castable versions (getAllPossibleAbilities) instead of the card's plain spell ability.
                for (SpellAbility cast : c.getAllPossibleAbilities(me, true)) {
                    if (!cast.isSpell()) continue;
                    cast.setActivatingPlayer(me);
                    boolean canPlay = cast.canPlay(), canPay = ComputerUtilMana.canPayManaCost(cast, me, 0, false);
                    if (DEBUG) System.out.println("PodSim commander-first: " + c.getName() + " canPlay=" + canPlay + " canPay=" + canPay + " tax=" + 2 * me.getCommanderCast(c));
                    if (canPlay && canPay) return cast;
                }
            }
            return null;
        }

        /** Artifacts first: in main phase 1 with T'Challa out, pick the priciest affordable MV 4+ artifact in hand. */
        private SpellAbility bigArtifactBeforeCombat(Player me) {
            Game game = me.getGame();
            if (!game.getPhaseHandler().isPlayerTurn(me) || !game.getPhaseHandler().is(forge.game.phase.PhaseType.MAIN1)) return null;
            if (!me.getCardsIn(ZoneType.Battlefield).anyMatch(c -> SmartAi.TCHALLA.equals(c.getName()))) return null;
            SpellAbility best = null;
            for (Card c : me.getCardsIn(ZoneType.Hand)) {
                if (!c.isArtifact() || c.getCMC() < 4) continue;
                SpellAbility cast = c.getFirstSpellAbility();
                if (cast == null) continue;
                cast.setActivatingPlayer(me);
                if (!cast.canPlay() || !ComputerUtilMana.canPayManaCost(cast, me, 0, false)) continue;
                if (best == null || c.getCMC() > best.getHostCard().getCMC()) best = cast;
            }
            if (best != null && DEBUG) System.out.println("PodSim: casting " + best.getHostCard().getName() + " before combat");
            return best;
        }

        /** Hold-up mana: keep enough open for the cheapest protection/removal instant in hand. */
        private boolean shouldHoldMana(Player me, SpellAbility chosen) {
            Card host = chosen.getHostCard();
            Game game = me.getGame();
            if (host == null || !chosen.isSpell() || host.isLand() || !game.getPhaseHandler().isPlayerTurn(me)) return false;
            if (isReactive(host)) return false; // casting the reactive card itself is fine
            if (SmartAi.TCHALLA.equals(host.getName())) return false;
            int round = (game.getPhaseHandler().getTurn() + game.getPlayers().size() - 1) / game.getPlayers().size();
            boolean developed = round >= 5 && me.getLandsInPlay().size() >= 5
                    && me.getCardsIn(ZoneType.Battlefield).anyMatch(c -> c.isCommander());
            Player leader = runawayLeader(game);
            boolean threatened = me.getLife() <= 20 || (leader != null && leader != me)
                    || me.getOpponents().stream().anyMatch(o -> strength(o) >= 10);
            int reserve = Integer.MAX_VALUE;
            String held = null;
            for (Card c : me.getCardsIn(ZoneType.Hand)) {
                if (isReactive(c) && c.getCMC() < reserve) { reserve = c.getCMC(); held = c.getName(); }
            }
            if (DEBUG && round >= 5) System.out.println("PodSim hold-mana check: round=" + round + " lands=" + me.getLandsInPlay().size() + " commanderOut=" + me.getCardsIn(ZoneType.Battlefield).anyMatch(c -> c.isCommander()) + " developed=" + developed + " threatened=" + threatened + " reactive=" + held);
            if (!developed || !threatened || held == null) return false;
            int available = ComputerUtilMana.getAvailableManaEstimate(me, false);
            boolean hold = available - host.getCMC() < reserve;
            if (hold && DEBUG) System.out.println("PodSim hold-mana: skip " + host.getName() + " to keep " + reserve + " up for " + held);
            return hold;
        }

        /** Safe attack: pull T'Challa out of an attack where the defender's untapped creatures could kill him. */
        private void keepTchallaSafe(Player me, Combat combat) {
            for (Card t : new ArrayList<>(combat.getAttackers())) {
                if (!SmartAi.TCHALLA.equals(t.getName()) || t.hasKeyword(Keyword.INDESTRUCTIBLE)) continue;
                if (!(combat.getDefenderByAttacker(t) instanceof Player defender)) continue;
                int toughnessLeft = t.getNetToughness() - t.getDamage();
                int blockPower = 0;
                boolean deathtouch = false;
                for (Card b : defender.getCreaturesInPlay()) {
                    if (!b.isUntapped() || !CombatUtil.canBlock(t, b)) continue;
                    blockPower += Math.max(0, b.getNetPower());
                    deathtouch |= b.hasKeyword(Keyword.DEATHTOUCH);
                }
                // Attack anyway if the whole attack is lethal to the defender.
                int attackPower = combat.getAttackersOf(defender).stream().mapToInt(c -> Math.max(0, c.getNetCombatDamage())).sum();
                boolean lethal = attackPower >= defender.getLife();
                if ((deathtouch || blockPower >= toughnessLeft) && !lethal) {
                    combat.removeFromCombat(t);
                    if (DEBUG) System.out.println("PodSim safe-attack: kept T'Challa home (" + t.getNetPower() + "/" + t.getNetToughness() + " vs blockers with " + blockPower + " power" + (deathtouch ? ", deathtouch" : "") + ")");
                }
            }
        }

        /** Instants/flash cards whose job is protection or removal. */
        private static boolean isReactive(Card c) {
            if (!(c.isInstant() || c.hasKeyword(Keyword.FLASH))) return false;
            SpellAbility sa = c.getFirstSpellAbility();
            if (sa == null || sa.getApi() == null) return false;
            return switch (sa.getApi()) {
                case Destroy, DestroyAll, ChangeZone, ChangeZoneAll, PumpAll, Pump, Protection, Phases, Charm, Counter, Tap -> true;
                default -> false;
            };
        }

        /** Politics: everyone else gangs up on a runaway leader. */
        /** Pilot v4: after the stock block assignment, chump attackers of our planeswalkers with spare tokens. */
        @Override
        public void declareBlockers(Player defender, Combat combat) {
            super.declareBlockers(defender, combat);
            if (defender.getName().startsWith("Ai(1)")) JaceCombo.blockForWalkers(defender, combat);
        }

        @Override
        public void declareAttackers(Player attacker, Combat combat) {
            super.declareAttackers(attacker, combat);
            if (SAFE_ATTACK && SMART && attacker.getName().startsWith("Ai(1)")) keepTchallaSafe(attacker, combat);
            applyPolitics(attacker, combat);
            if (KEEP_TOKENS && SMART && attacker.getName().startsWith("Ai(1)")) keepTokensHome(attacker, combat);
        }

        /** Keep tokens: small creature tokens stay home as blockers and Jace −3 fodder unless the attack is lethal. */
        private void keepTokensHome(Player me, Combat combat) {
            for (Card t : new ArrayList<>(combat.getAttackers())) {
                if (!t.isToken() || t.getNetPower() > 2) continue;
                if (!(combat.getDefenderByAttacker(t) instanceof Player defender)) continue;
                int attackPower = combat.getAttackersOf(defender).stream().mapToInt(c -> Math.max(0, c.getNetCombatDamage())).sum();
                if (attackPower >= defender.getLife()) continue;
                combat.removeFromCombat(t);
                if (DEBUG) System.out.println("PodSim keep-tokens: kept " + t.getName() + " home");
            }
        }

        private void applyPolitics(Player attacker, Combat combat) {
            if (!POLITICS) return;
            Player leader = runawayLeader(attacker.getGame());
            if (DEBUG && leader != null) System.out.println("PodSim politics: leader " + leader.getName() + " (power " + strength(leader) + "), " + attacker.getName() + " is attacking");
            if (leader == null || leader == attacker || leader.hasLost()) return;
            for (Card a : new ArrayList<>(combat.getAttackers())) {
                if (combat.getDefenderByAttacker(a) instanceof Player target && target != leader && CombatUtil.canAttack(a, leader)) {
                    combat.removeFromCombat(a);
                    combat.addAttacker(a, leader);
                    if (DEBUG) System.out.println("PodSim politics: " + attacker.getName() + " sends " + a.getName() + " at leader " + leader.getName());
                }
            }
            // Team up: commit every other creature that can legally attack the leader. A player at 10 life or less
            // keeps its best blocker home.
            List<Card> idle = new ArrayList<>();
            for (Card c : attacker.getCreaturesInPlay()) {
                if (!combat.isAttacking(c) && c.getNetPower() > 0 && CombatUtil.canAttack(c, leader)) idle.add(c);
            }
            if (attacker.getLife() <= 10 && !idle.isEmpty()) {
                idle.sort(Comparator.comparingInt(Card::getNetToughness));
                idle.remove(idle.size() - 1);
            }
            for (Card c : idle) {
                combat.addAttacker(c, leader);
                if (DEBUG) System.out.println("PodSim politics: " + attacker.getName() + " adds " + c.getName() + " to the attack on leader " + leader.getName());
            }
        }
    }

    static final boolean SMART = System.getenv("SMART_AI") != null;
    static final boolean POLITICS = System.getenv("POLITICS") != null;
    static final boolean HOLD_MANA = System.getenv("HOLD_MANA") != null;
    static final boolean ARTIFACTS_FIRST = System.getenv("ARTIFACTS_FIRST") != null;
    static final boolean COMMANDER_FIRST = System.getenv("COMMANDER_FIRST") != null;
    static final boolean KEEP_TOKENS = System.getenv("KEEP_TOKENS") != null;
    /** FIXTURE=<GameState file>: diagnostic position applied at player 1's first main phase (never in win-rate runs). */
    static final String FIXTURE = System.getenv("FIXTURE");
    static boolean fixtureApplied;
    static int fixtureTurn = -1;

    /** Applies a GameState synchronously on the calling (decision) thread; applyToGame() can run it concurrently. */
    static final class SyncState extends forge.game.GameState {
        void applyNow(Game game) { applyGameOnThread(game); }
    }

    /** Ends a fixture game once the fixture turn is over, so diagnostics stay short. */
    public static final class FixtureStopper {
        private final Game game;
        FixtureStopper(Game game) { this.game = game; }
        @Subscribe
        public void onEvent(forge.game.event.GameEventTurnBegan ev) {
            int extra = System.getenv("FIXTURE_EXTRA_TURNS") == null ? 0 : Integer.parseInt(System.getenv("FIXTURE_EXTRA_TURNS"));
            if (fixtureApplied && fixtureTurn > 0 && ev.turnNumber() > fixtureTurn + extra) game.setGameOver(GameEndReason.Draw);
        }
    }

    static void applyFixture(Player me) {
        fixtureApplied = true;
        try {
            SyncState gs = new SyncState();
            gs.parse(java.nio.file.Files.readAllLines(java.nio.file.Path.of(FIXTURE)));
            gs.applyNow(me.getGame());
            fixtureTurn = me.getGame().getPhaseHandler().getTurn();
            JaceCombo.Telemetry.note(me, "{\"ev\":\"fixture_applied\",\"file\":" + JaceCombo.Telemetry.q(FIXTURE) + "}");
            System.out.println("PodSim: fixture applied " + FIXTURE);
        } catch (Exception e) {
            System.out.println("PodSim: fixture failed " + e);
            e.printStackTrace();
        }
    }
    static final boolean SAFE_ATTACK = System.getenv("SAFE_ATTACK") != null;
    static final boolean DEBUG = System.getenv("SMART_AI_DEBUG") != null;

    /** Total power of a player's creatures. */
    static int strength(Player p) {
        int s = 0;
        for (Card c : p.getCreaturesInPlay()) s += Math.max(0, c.getNetPower());
        return s;
    }

    /** The player with the most creature power, if it's ≥ 12 and ≥ 1.5× the next strongest living player. */
    static Player runawayLeader(Game game) {
        Player best = null;
        int top = -1, second = 0;
        for (Player p : game.getPlayers()) {
            if (p.hasLost()) continue;
            int s = strength(p);
            if (s > top) { second = Math.max(second, top); top = s; best = p; }
            else second = Math.max(second, s);
        }
        return top >= 12 && top >= 1.5 * Math.max(second, 1) ? best : null;
    }

    public static final class RuleLobbyPlayer extends LobbyPlayerAi {
        public RuleLobbyPlayer(String name) {
            super(name, null);
        }

        @Override
        public Player createIngamePlayer(Game game, int id) {
            Player p = new Player(getName(), game, id);
            p.setFirstController(new RuleController(game, p, this));
            return p;
        }
    }

    public static void main(String[] args) throws Exception {
        System.setProperty("java.awt.headless", "true");
        System.setProperty("java.util.Arrays.useLegacyMergeSort", "true");
        GuiBase.setInterface(new GuiDesktop());
        FModel.initialize(null, null);
        if (System.getenv("SMART_AI") != null) SmartAi.install();
        if (JaceCombo.REAL || JaceCombo.TELEMETRY || JaceCombo.SAFE) JaceCombo.install();

        String deckDir = args[0], outDir = args[1], tag = args[2];
        int games = Integer.parseInt(args[3]);
        long seed = Long.parseLong(args[4]);
        new File(outDir).mkdirs();

        GameRules rules = new GameRules(GameType.Commander);
        rules.setAppliedVariants(EnumSet.of(GameType.Commander));
        rules.setSimTimeout(600);

        List<RegisteredPlayer> players = new ArrayList<>();
        for (int i = 5; i < args.length; i++) {
            Deck deck = DeckSerializer.fromFile(new File(deckDir, args[i]));
            RegisteredPlayer rp = RegisteredPlayer.forCommander(deck);
            RuleLobbyPlayer lobby = new RuleLobbyPlayer("Ai(" + (i - 4) + ")-" + deck.getName());
            lobby.setAiProfile("Default");
            rp.setPlayer(lobby);
            players.add(rp);
        }
        Match match = new Match(rules, players, "Pod");

        for (int g = 1; g <= games; g++) {
            MyRandom.setRandom(new Random(seed + g));
            playOne(match, outDir + "/" + tag + "-g" + g);
        }
        System.exit(0);
    }

    private static void playOne(Match match, String prefix) throws Exception {
        Game game = match.createGame();
        game.setNoGUIUser();
        long start = System.currentTimeMillis();
        // FULL_STATE=1 also writes the replay viewer's full card-state stream (all players' boards and hands).
        PrintWriter state = System.getenv("FULL_STATE") != null ? new PrintWriter(prefix + ".state.jsonl", "UTF-8") : null;
        JaceCombo.Telemetry telemetry = null;
        fixtureApplied = false;
        fixtureTurn = -1;
        try (PrintWriter hand = new PrintWriter(prefix + ".hand.jsonl", "UTF-8")) {
            game.subscribeToEvents(new HandTracker(game, hand));
            if (JaceCombo.TELEMETRY) telemetry = new JaceCombo.Telemetry(game, new PrintWriter(prefix + ".jace.jsonl", "UTF-8"));
            if (telemetry != null) game.subscribeToEvents(telemetry);
            if (FIXTURE != null) game.subscribeToEvents(new FixtureStopper(game));
            if (state != null) game.subscribeToEvents(new ReplayRecorder.Tracker(game, state));
            try {
                TimeLimitedCodeBlock.runWithTimeout(() -> match.startGame(game), match.getRules().getSimTimeout(), TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                System.out.println("Stopping slow match as draw");
            } catch (Exception | StackOverflowError e) {
                e.printStackTrace();
            } finally {
                game.setGameOver(GameEndReason.Draw);
            }
        }
        if (state != null) state.close();
        long ms = System.currentTimeMillis() - start;
        List<GameLogEntry> log = game.getGameLog().getLogEntries(null);
        Collections.reverse(log);
        try (PrintWriter out = new PrintWriter(prefix + ".log", "UTF-8")) {
            for (GameLogEntry entry : log) out.println(entry);
            String result = FIXTURE != null ? String.format("Game Result: fixture finished in %d ms (diagnostic, not scored).", ms) : game.getOutcome().isDraw()
                    ? String.format("Game Result: ended in a Draw! Took %d ms.", ms)
                    : String.format("Game Result: ended in %d ms. %s has won!", ms, game.getOutcome().getWinningLobbyPlayer().getName());
            out.println();
            out.println(result);
            System.out.println(prefix + " " + result);
            if (telemetry != null) telemetry.finish(result);
        }
    }

    /** Writes player 1's hand (card names) whenever it changes, anchored to the game-log length. */
    public static final class HandTracker {
        private final Game game;
        private final PrintWriter out;
        private String last = "";

        HandTracker(Game game, PrintWriter out) {
            this.game = game;
            this.out = out;
        }

        @Subscribe
        public void onEvent(GameEvent event) {
            Player p1 = game.getPlayers().stream().filter(p -> p.getName().startsWith("Ai(1)")).findFirst().orElse(null);
            if (p1 == null) return;
            StringBuilder sb = new StringBuilder();
            for (Card c : p1.getCardsIn(ZoneType.Hand)) {
                if (sb.length() > 0) sb.append(',');
                sb.append("[\"").append(c.getId()).append("\",\"").append(c.getName().replace("\\", "\\\\").replace("\"", "\\\"")).append("\"]");
            }
            String now = sb.toString();
            if (now.equals(last)) return;
            last = now;
            out.println("{\"a\":" + game.getGameLog().getLogEntries(null).size() + ",\"hand\":[" + now + "]}");
        }
    }

    private PodSim() {
    }
}
