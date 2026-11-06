package forge.view;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.google.common.eventbus.Subscribe;

import forge.ai.AiAbilityDecision;
import forge.ai.AiPlayDecision;
import forge.ai.ComputerUtilCard;
import forge.ai.SpellAbilityAi;
import forge.ai.ability.ChangeZoneAi;
import forge.game.Game;
import forge.game.ability.ApiType;
import forge.game.card.Card;
import forge.game.cost.CostPart;
import forge.game.cost.CostPutCounter;
import forge.game.cost.CostRemoveCounter;
import forge.game.event.GameEvent;
import forge.game.event.GameEventCardChangeZone;
import forge.game.event.GameEventSpellAbilityCast;
import forge.game.event.GameEventSpellResolved;
import forge.game.event.GameEventTurnPhase;
import forge.game.phase.PhaseHandler;
import forge.game.phase.PhaseType;
import forge.game.player.Player;
import forge.game.spellability.SpellAbility;
import forge.game.zone.ZoneType;

/**
 * Jace, Multiverse Architect test support (RESUME C7, see CLAUDE-JACE-COMBO-POWER-TEST.md). Player 1 only; all opt-in.
 *  - JACE_REAL_RULES=1: run with the real-card Jace script (forge/app-jace-real) and pick a legal −3 target, because
 *    Forge's AI never targets its own permanents. Base fodder policy = the legacy set (creatures with power ≤ 2) plus
 *    creature tokens of any power and Jace planeswalker tokens.
 *  - JACE_COMBO_AI=1 (needs JACE_REAL_RULES): strategy-aware pilot: Aminatou/Bolas/Ajani Cadet loop, make fodder before
 *    −3, put a chosen payoff on top before −3, Aminatou resets Jace, Aminatou blinks entry-effect creatures, spent
 *    planeswalkers as fodder, combo pieces protected.
 *  - JACE_TELEMETRY=1: companion <game>.jace.jsonl with −3 activations, targets, revealed hits, decline reasons,
 *    combo events and turn-4/5/6 snapshots (observational only).
 */
public final class JaceCombo {
    static final boolean REAL = System.getenv("JACE_REAL_RULES") != null;
    static final boolean COMBO = REAL && System.getenv("JACE_COMBO_AI") != null;
    static final boolean TELEMETRY = System.getenv("JACE_TELEMETRY") != null;
    /** JACE_SAFE_WALKERS=1 (C8): don't fire Ajani's −3 (or Bolas borrowing it) into our own nontoken creatures. */
    static final boolean SAFE = System.getenv("JACE_SAFE_WALKERS") != null;
    static final boolean DEBUG = System.getenv("SMART_AI_DEBUG") != null;
    /** Safety bound on loop activations per turn; hitting it is logged as a diagnostic, never scored as a win. */
    static final int LOOP_LIMIT = 80;
    /**
     * JACE_PILOT_V3=1 (C11, needs JACE_COMBO_AI): (a) exactly-3-loyalty fix: −3 at 3 kills Jace before any blink can
     * act (sorcery speed), so it's only a deliberate one-shot onto a known top payoff; otherwise Aminatou/Bolas blink
     * Jace FIRST (back to 4) and then −3. (b) Elspeth double −3: with Jace ≥ 4 and a fresh blinker but < 2 fodder,
     * Elspeth +1 first (3 Soldiers) → −3 → reset → −3, leaving a Soldier to block.
     */
    static final boolean PILOT3 = System.getenv("JACE_PILOT_V3") != null;
    /**
     * JACE_PILOT_V4=1 (C13/C14, implies v3 behaviour; needs JACE_PILOT_V3 + JACE_COMBO_AI): Jace +1 when the −3 is
     * declined; Staff of Compleation proliferate to lift Jace 3 → 4 before a −3; hold Jace in the command zone when the
     * board is exposed (max 2 turns); chump-block attackers of our planeswalkers with expendable tokens.
     */
    static final boolean PILOT4 = PILOT3 && System.getenv("JACE_PILOT_V4") != null;

    static final String JACE = "Jace, Multiverse Architect";
    static final String AMINATOU = "Aminatou, the Fateshifter";
    static final String BOLAS = "Nicol Bolas, Dragon-God";
    static final String AJANI = "Ajani Unrelenting";
    static final List<String> ETB_BLINK = List.of("Archon of Cruelty", "Overlord of the Mistmoors", "Galactus, Devourer of Worlds", "Memnarch, the Warden");
    static final List<String> TOP_SETUP = List.of(AMINATOU, "Brainstorm", "Brainsurge");

    private JaceCombo() {
    }

    @SuppressWarnings("unchecked")
    static void install() throws Exception {
        java.lang.reflect.Field f = forge.ai.SpellApiToAi.class.getDeclaredField("apiToInstance");
        f.setAccessible(true);
        Map<ApiType, SpellAbilityAi> map = (Map<ApiType, SpellAbilityAi>) f.get(forge.ai.SpellApiToAi.Converter);
        if (REAL) map.put(ApiType.ChangeZone, new JaceChangeZone());
        if (SAFE) map.put(ApiType.DamageAll, new SafeDamageAll());
        System.out.println("JaceCombo: realRules=" + REAL + " comboAi=" + COMBO + " safeWalkers=" + SAFE + " telemetry=" + TELEMETRY);
    }

    // ---------- helpers ----------

    static boolean mine(Player p) {
        return p != null && p.getName().startsWith("Ai(1)");
    }

    static int loyaltyDelta(SpellAbility sa) {
        if (sa == null || sa.getPayCosts() == null) return 0;
        for (CostPart part : sa.getPayCosts().getCostParts()) {
            Integer n = part.convertAmount();
            if (part instanceof CostRemoveCounter r && r.counter.toString().equalsIgnoreCase("LOYALTY")) return -(n == null ? 0 : n);
            if (part instanceof CostPutCounter pc && pc.getCounter().toString().equalsIgnoreCase("LOYALTY")) return n == null ? 0 : n;
        }
        return 0;
    }

    static Card onField(Player me, String name) {
        for (Card c : me.getCardsIn(ZoneType.Battlefield)) if (name.equals(c.getName()) && !c.isPhasedOut()) return c;
        return null;
    }

    static boolean fresh(Card walker) {
        return walker != null && walker.getPlaneswalkerAbilityActivated() == 0;
    }

    static SpellAbility findPw(Card host, ApiType api, int delta, String descPart) {
        if (host == null) return null;
        for (SpellAbility sa : host.getSpellAbilities()) {
            if (!sa.isPwAbility() || sa.getApi() != api || loyaltyDelta(sa) != delta) continue;
            if (descPart != null && !String.valueOf(sa.getDescription()).contains(descPart)) continue;
            return sa;
        }
        return null;
    }

    static SpellAbility aminatouBlink(Card host) {
        return findPw(host, ApiType.ChangeZone, -1, "Exile another target permanent you own");
    }

    static SpellAbility ajaniHaste(Card host) {
        return findPw(host, ApiType.PumpAll, 1, "haste");
    }

    static boolean isJaceMinus3(SpellAbility sa) {
        Card h = sa == null ? null : sa.getHostCard();
        return h != null && JACE.equals(h.getName()) && sa.isPwAbility() && loyaltyDelta(sa) == -3;
    }

    /** Ready to activate: targets set, activating player set, legal right now. */
    static SpellAbility prepare(Player me, SpellAbility sa, Card target) {
        if (sa == null) return null;
        sa.setActivatingPlayer(me);
        Card host = sa.getHostCard();
        if (host == null || host.getCurrentLoyalty() + loyaltyDelta(sa) < 0) return null;
        sa.resetTargets();
        if (target != null) {
            if (!sa.canTarget(target)) return null;
            sa.getTargets().add(target);
        }
        return sa.canPlay() ? sa : null;
    }

    static boolean sorceryWindow(Player me) {
        Game game = me.getGame();
        PhaseHandler ph = game.getPhaseHandler();
        return ph.isPlayerTurn(me) && (ph.is(PhaseType.MAIN1) || ph.is(PhaseType.MAIN2)) && game.getStack().isEmpty();
    }

    /** Pieces we don't exile as routine fodder while the Cadet loop is live or one card away. */
    static boolean protectedPiece(Player me, Card c) {
        String n = c.getName();
        if (!(AMINATOU.equals(n) || BOLAS.equals(n) || AJANI.equals(n))) return false;
        int present = 0;
        for (String p : List.of(AMINATOU, BOLAS, AJANI)) if (onField(me, p) != null) present++;
        boolean thirdInHand = me.getCardsIn(ZoneType.Hand).anyMatch(h -> AMINATOU.equals(h.getName()) || BOLAS.equals(h.getName()) || AJANI.equals(h.getName()));
        return present >= 2 || (present >= 1 && thirdInHand);
    }

    /** Lower = more expendable. Returns MAX_VALUE for cards the policy won't exile. */
    static int fodderScore(Player me, Card c, boolean combo) {
        // Pilot v3: Aminatou/Bolas/Ajani are reset and fodder engines — never routine fodder.
        if (PILOT3 && (AMINATOU.equals(c.getName()) || BOLAS.equals(c.getName()) || AJANI.equals(c.getName()))) return Integer.MAX_VALUE;
        if (c.isCreature() && c.isToken()) {
            boolean cantBlock = c.hasKeyword("CARDNAME can't block.") || String.valueOf(c.getOracleText()).contains("can't block");
            return (cantBlock ? 0 : 10) + Math.max(0, c.getNetPower());
        }
        if (c.isPlaneswalker() && c.isToken()) return 30 + c.getCurrentLoyalty();
        if (c.isCreature() && !c.isToken() && c.getNetPower() <= 2) return 60 + ComputerUtilCard.evaluateCreature(c) / 20;
        if (combo && c.isPlaneswalker() && !c.isToken() && !protectedPiece(me, c)
                && (c.getPlaneswalkerAbilityActivated() > 0 || c.getCurrentLoyalty() <= 1)) return 45 + c.getCurrentLoyalty();
        return Integer.MAX_VALUE;
    }

    static List<Card> fodder(Player me, SpellAbility jaceSa, boolean combo) {
        List<Card> out = new ArrayList<>();
        Card host = jaceSa == null ? null : jaceSa.getHostCard();
        if (jaceSa != null) jaceSa.setActivatingPlayer(me);
        for (Card c : me.getCardsIn(ZoneType.Battlefield)) {
            if (c == host || c.isPhasedOut() || !(c.isCreature() || c.isPlaneswalker())) continue;
            if (jaceSa != null && !jaceSa.canTarget(c)) continue;
            if (fodderScore(me, c, combo) == Integer.MAX_VALUE) continue;
            out.add(c);
        }
        out.sort(Comparator.comparingInt(c -> fodderScore(me, c, combo)));
        return out;
    }

    static String why(Player me, Card jace, List<Card> fod) {
        if (jace.getCurrentLoyalty() < 3) return "insufficient_loyalty";
        if (!fod.isEmpty()) return "ok";
        boolean anyToken = me.getCardsIn(ZoneType.Battlefield).anyMatch(c -> c.isToken() && (c.isCreature() || c.isPlaneswalker()));
        boolean anyLegal = me.getCardsIn(ZoneType.Battlefield).anyMatch(c -> c != jace && (c.isCreature() || c.isPlaneswalker()));
        return anyToken ? "tokens_not_eligible" : anyLegal ? "saving_valuable_pieces" : "no_tokens_or_targets";
    }

    // ---------- Jace −3 under real rules ----------

    /** Real-card Jace −3: Forge's AI never targets its own permanents, so this picks the fodder. */
    public static final class JaceChangeZone extends ChangeZoneAi {
        @Override
        protected AiAbilityDecision checkApiLogic(Player ai, SpellAbility sa) {
            if (!mine(ai) || !isJaceMinus3(sa)) return super.checkApiLogic(ai, sa);
            Card jace = sa.getHostCard();
            List<Card> fod = fodder(ai, sa, COMBO);
            String reason = why(ai, jace, fod);
            if ("ok".equals(reason) && COMBO && PILOT3 && jace.getCurrentLoyalty() == 3) {
                // Pilot v3: −3 at 3 kills Jace immediately (state-based) — no blink can rescue him. Only a deliberate
                // one-shot onto a payoff we put on top this turn; otherwise next() blinks Jace first.
                TurnState st = state(ai);
                if (st.plannedTop != null) reason = "ok";
                else reason = "would_kill_jace";
                if (st.plannedTop != null) Telemetry.note(ai, "{\"ev\":\"one_shot\",\"top\":" + Telemetry.q(st.plannedTop) + "}");
            } else if ("ok".equals(reason) && COMBO && jace.getCurrentLoyalty() == 3) {
                // Pilot v2 (kept for reproducibility; known wrong: an available blinker does NOT rescue Jace at 3).
                Card a = onField(ai, AMINATOU), b = onField(ai, BOLAS);
                boolean reset = (fresh(a) && a.getCurrentLoyalty() >= 2) || (fresh(b) && b.getCurrentLoyalty() >= 2);
                if (!reset) reason = "would_kill_jace";
            }
            Telemetry.decision(ai, jace, reason, fod.size());
            if (!"ok".equals(reason)) return new AiAbilityDecision(0, AiPlayDecision.CantPlayAi);
            sa.resetTargets();
            sa.getTargets().add(fod.get(0));
            return new AiAbilityDecision(100, AiPlayDecision.WillPlay);
        }

        @Override
        protected boolean checkPhaseRestrictions(Player ai, SpellAbility sa, PhaseHandler ph) {
            if (mine(ai) && isJaceMinus3(sa)) return true;
            return super.checkPhaseRestrictions(ai, sa, ph);
        }
    }

    // ---------- safe walkers (JACE_SAFE_WALKERS) ----------

    /** Ajani Unrelenting −3: "4 damage to each creature except for tokens you control" (also borrowed by Bolas). */
    public static final class SafeDamageAll extends forge.ai.ability.DamageAllAi {
        @Override
        protected AiAbilityDecision checkApiLogic(Player ai, SpellAbility sa) {
            AiAbilityDecision base = super.checkApiLogic(ai, sa);
            if (!mine(ai) || !String.valueOf(sa.getDescription()).contains("except for tokens you control")) return base;
            int ownLoss = 0, oppLoss = 0;
            for (Card c : ai.getGame().getCardsIn(ZoneType.Battlefield)) {
                if (!c.isCreature() || c.isPhasedOut()) continue;
                boolean ours = c.getController() == ai;
                if (ours && c.isToken()) continue;
                boolean dies = !c.hasKeyword(forge.game.keyword.Keyword.INDESTRUCTIBLE) && c.getLethalDamage() <= 4;
                if (!dies) continue;
                if (ours) ownLoss += ComputerUtilCard.evaluateCreature(c);
                else oppLoss += ComputerUtilCard.evaluateCreature(c);
            }
            boolean block = ownLoss > 0 && oppLoss < 2 * ownLoss;
            if (block) Telemetry.note(ai, "{\"ev\":\"safe_walker_block\",\"by\":" + Telemetry.q(sa.getHostCard().getName()) + ",\"own\":" + ownLoss + ",\"opp\":" + oppLoss + "}");
            return block ? new AiAbilityDecision(0, AiPlayDecision.CantPlayAi) : base;
        }
    }

    // ---------- strategy-aware pilot (JACE_COMBO_AI) ----------

    static final class TurnState {
        int turn = -1;
        int loopSteps;
        boolean loopDone;
        int cadetsAtStart;
        String plannedTop;
    }

    static final Map<Game, TurnState> STATE = new ConcurrentHashMap<>();

    static TurnState state(Player me) {
        TurnState s = STATE.computeIfAbsent(me.getGame(), g -> new TurnState());
        int t = me.getGame().getPhaseHandler().getTurn();
        if (s.turn != t) {
            s.turn = t;
            s.loopSteps = 0;
            s.loopDone = false;
            s.plannedTop = null;
        }
        return s;
    }

    static int attackers(Player me) {
        int n = 0;
        for (Card c : me.getCreaturesInPlay()) if (!c.isTapped() && c.getNetPower() > 0) n++;
        return n;
    }

    /** Army big enough to make the attack meaningful against the most beatable opponent. */
    static int armyGoal(Player me) {
        int best = Integer.MAX_VALUE;
        for (Player o : me.getOpponents()) {
            if (o.hasLost()) continue;
            int blockers = 0;
            for (Card c : o.getCreaturesInPlay()) if (c.isUntapped()) blockers++;
            best = Math.min(best, blockers + (o.getLife() + 2) / 3 + 2);
        }
        return best == Integer.MAX_VALUE ? 0 : Math.min(best, LOOP_LIMIT);
    }

    /** Called first in player 1's chooseSpellAbilityToPlay. Returns an ability to activate now, or null. */
    static SpellAbility next(Player me) {
        if (!COMBO || !mine(me) || !sorceryWindow(me)) return null;
        TurnState st = state(me);
        Card jace = onField(me, JACE), am = onField(me, AMINATOU), bo = onField(me, BOLAS), aj = onField(me, AJANI);
        boolean main1 = me.getGame().getPhaseHandler().is(PhaseType.MAIN1);

        // 1. Cadet loop: Aminatou ⇄ Bolas blinks, Ajani makes a Cadet per activation, finish with +1/+0 and haste.
        if (am != null && bo != null && aj != null && main1 && !st.loopDone) {
            if (st.loopSteps == 0) {
                st.cadetsAtStart = attackers(me);
                Telemetry.note(me, "{\"ev\":\"combo_window\",\"goal\":" + armyGoal(me) + ",\"attackers\":" + st.cadetsAtStart + "}");
            }
            boolean enough = attackers(me) >= armyGoal(me) || st.loopSteps >= LOOP_LIMIT;
            if (st.loopSteps >= LOOP_LIMIT) Telemetry.note(me, "{\"ev\":\"loop_limit\",\"steps\":" + st.loopSteps + "}");
            if (!enough) {
                SpellAbility step = null;
                if (fresh(am) && am.getCurrentLoyalty() >= 2) step = prepare(me, aminatouBlink(am), bo);
                if (step == null && fresh(bo) && bo.getCurrentLoyalty() >= 2) step = prepare(me, aminatouBlink(bo), am);
                if (step != null) {
                    st.loopSteps++;
                    Telemetry.note(me, "{\"ev\":\"loop_step\",\"n\":" + st.loopSteps + ",\"by\":\"" + step.getHostCard().getName() + "\"}");
                    return step;
                }
            }
            // Finish: Ajani +1 (original or borrowed by a fresh Bolas); if only Aminatou is fresh, blink Bolas first.
            SpellAbility fin = st.loopSteps == 0 ? null : fresh(aj) ? prepare(me, ajaniHaste(aj), null) : null;
            if (fin == null && st.loopSteps > 0 && fresh(bo)) fin = prepare(me, ajaniHaste(bo), null);
            if (fin == null && st.loopSteps > 0 && fresh(am) && am.getCurrentLoyalty() >= 2 && st.loopSteps < LOOP_LIMIT) {
                SpellAbility step = prepare(me, aminatouBlink(am), bo);
                if (step != null) {
                    st.loopSteps++;
                    return step;
                }
            }
            st.loopDone = true;
            Telemetry.note(me, "{\"ev\":\"loop_done\",\"steps\":" + st.loopSteps + ",\"attackers\":" + attackers(me)
                    + ",\"haste\":" + (fin != null) + "}");
            if (fin != null) return fin;
        }

        // 2. Aminatou (or Bolas borrowing her −1) resets a spent Jace when there's fodder for a second −3.
        if (jace != null && !fresh(jace)) {
            SpellAbility j3 = findPw(jace, ApiType.ChangeZone, -3, null);
            if (j3 != null && !fodder(me, j3, true).isEmpty()) {
                SpellAbility reset = fresh(am) && am.getCurrentLoyalty() >= 2 ? prepare(me, aminatouBlink(am), jace) : null;
                if (reset == null && fresh(bo) && bo.getCurrentLoyalty() >= 2 && (am == null || aj == null)) reset = prepare(me, aminatouBlink(bo), jace);
                if (reset != null) {
                    Telemetry.note(me, "{\"ev\":\"jace_reset\",\"by\":\"" + reset.getHostCard().getName() + "\"}");
                    return reset;
                }
            }
        }

        // 2b. Pilot v3: Jace below 4 loyalty with fodder ready → blink him first (returns at 4), then −3 next.
        if (PILOT3 && jace != null && jace.getCurrentLoyalty() < 4) {
            SpellAbility j3 = findPw(jace, ApiType.ChangeZone, -3, null);
            if (j3 != null && !fodder(me, j3, true).isEmpty()) {
                SpellAbility pre = fresh(am) && am.getCurrentLoyalty() >= 2 ? prepare(me, aminatouBlink(am), jace) : null;
                if (pre == null && fresh(bo) && bo.getCurrentLoyalty() >= 2 && (am == null || aj == null)) pre = prepare(me, aminatouBlink(bo), jace);
                if (pre != null) {
                    Telemetry.note(me, "{\"ev\":\"pre_reset\",\"by\":" + Telemetry.q(pre.getHostCard().getName()) + ",\"loyalty\":" + jace.getCurrentLoyalty() + "}");
                    return pre;
                }
            }
        }

        // 2c. Pilot v3 Elspeth double −3: Jace ≥ 4, a fresh blinker, but fewer than 2 fodder → Elspeth +1 first.
        if (PILOT3 && jace != null && fresh(jace) && jace.getCurrentLoyalty() >= 4) {
            SpellAbility j3 = findPw(jace, ApiType.ChangeZone, -3, null);
            boolean blinker = (fresh(am) && am.getCurrentLoyalty() >= 2) || (fresh(bo) && bo.getCurrentLoyalty() >= 2);
            Card el = onField(me, "Elspeth, Sun's Champion");
            if (j3 != null && blinker && fodder(me, j3, true).size() < 2 && fresh(el)) {
                SpellAbility soldiers = prepare(me, findPw(el, ApiType.Token, 1, null), null);
                if (soldiers != null) {
                    Telemetry.note(me, "{\"ev\":\"seed_double\",\"by\":\"Elspeth, Sun's Champion\",\"fodder_before\":" + fodder(me, j3, true).size() + "}");
                    return soldiers;
                }
            }
        }

        // 3. Make fodder before spending Jace: Ajani +1 (its trigger makes a Cadet) or a Way-of-the-Healer −2.
        if (jace != null && fresh(jace) && jace.getCurrentLoyalty() >= 3) {
            SpellAbility j3 = findPw(jace, ApiType.ChangeZone, -3, null);
            if (j3 != null && fodder(me, j3, true).isEmpty()) {
                SpellAbility seed = fresh(aj) ? prepare(me, ajaniHaste(aj), null) : null;
                Card el = onField(me, "Elspeth, Sun's Champion");
                if (seed == null && PILOT3 && fresh(el)) seed = prepare(me, findPw(el, ApiType.Token, 1, null), null);
                if (seed == null) {
                    for (Card w : me.getPlaneswalkersInPlay()) {
                        if (w == jace || !fresh(w) || w.getCurrentLoyalty() < 3 || protectedPiece(me, w)) continue;
                        seed = prepare(me, findPw(w, ApiType.Token, -2, "Cadet"), null);
                        if (seed != null) break;
                    }
                }
                if (seed != null) {
                    Telemetry.note(me, "{\"ev\":\"seed_fodder\",\"by\":\"" + seed.getHostCard().getName() + "\"}");
                    return seed;
                }
            }
            // 4. Put a chosen payoff on top first (Aminatou +1), unless Aminatou is needed to reset Jace afterwards.
            if (j3 != null && !fodder(me, j3, true).isEmpty() && fresh(am) && st.plannedTop == null) {
                Card payoff = bestPayoff(me);
                boolean resetLater = fodder(me, j3, true).size() >= 2 && am.getCurrentLoyalty() >= 2;
                if (payoff != null && !resetLater) {
                    SpellAbility plus = prepare(me, findPw(am, ApiType.Draw, 1, null), null);
                    if (plus != null) {
                        st.plannedTop = payoff.getName();
                        Telemetry.note(me, "{\"ev\":\"top_setup\",\"by\":\"" + AMINATOU + "\",\"card\":" + Telemetry.q(payoff.getName()) + "}");
                        return plus;
                    }
                }
            }
        }

        // 5. Aminatou blinks an entry-effect creature when she has nothing better to do.
        if (am != null && fresh(am) && am.getCurrentLoyalty() >= 2 && main1 && (jace == null || fresh(jace) == false)) {
            for (String n : ETB_BLINK) {
                Card c = onField(me, n);
                if (c == null || c.isToken()) continue;
                SpellAbility blink = prepare(me, aminatouBlink(am), c);
                if (blink != null) {
                    Telemetry.note(me, "{\"ev\":\"etb_blink\",\"card\":" + Telemetry.q(n) + "}");
                    return blink;
                }
            }
        }

        // 6. Pilot v4: Jace never sits idle. If the −3 is declined, use Staff proliferate (3 → 4) or Jace's +1.
        if (PILOT4 && jace != null && fresh(jace)) {
            SpellAbility j3 = findPw(jace, ApiType.ChangeZone, -3, null);
            List<Card> fod = j3 == null ? List.of() : fodder(me, j3, true);
            String reason = why(me, jace, fod);
            if ("ok".equals(reason) && jace.getCurrentLoyalty() == 3 && st.plannedTop == null) reason = "would_kill_jace";
            if ("would_kill_jace".equals(reason) && !fod.isEmpty() && me.getLife() >= 15) {
                Card staff = onField(me, "Staff of Compleation");
                if (staff != null && staff.isUntapped()) {
                    for (SpellAbility sa : staff.getSpellAbilities()) {
                        if (sa.getApi() != ApiType.Proliferate) continue;
                        SpellAbility p = prepare(me, sa, null);
                        if (p != null) {
                            Telemetry.note(me, "{\"ev\":\"staff_proliferate\",\"jace_loyalty\":" + jace.getCurrentLoyalty() + "}");
                            return p;
                        }
                    }
                }
            }
            if (!"ok".equals(reason) && st.plannedTop == null) {
                SpellAbility plus = prepare(me, findPw(jace, ApiType.Draw, 1, null), null);
                if (plus != null) {
                    Telemetry.note(me, "{\"ev\":\"jace_plus1\",\"because\":" + Telemetry.q(reason) + ",\"loyalty\":" + jace.getCurrentLoyalty() + "}");
                    return plus;
                }
            }
        }
        return null;
    }

    // ---------- pilot v4: conditional Jace cast and blocking for planeswalkers ----------

    static final Map<Game, int[]> HOLD = new ConcurrentHashMap<>(); // {last turn counted, consecutive held turns}

    /** Hold Jace in the command zone when there's no fodder and the visible attack would kill a +1 Jace (max 2 turns). */
    static boolean holdJace(Player me) {
        if (!PILOT4 || !mine(me)) return false;
        if (!fodder(me, null, true).isEmpty()) return false;
        List<Integer> powers = new ArrayList<>();
        for (Player o : me.getOpponents()) {
            if (o.hasLost()) continue;
            for (Card c : o.getCreaturesInPlay()) if (c.getNetPower() > 0 && !c.hasKeyword(forge.game.keyword.Keyword.DEFENDER)) powers.add(c.getNetPower());
        }
        powers.sort(Comparator.reverseOrder());
        int blockers = (int) me.getCreaturesInPlay().stream().filter(c -> c.isUntapped() || c.hasKeyword(forge.game.keyword.Keyword.VIGILANCE)).count();
        int incoming = 0;
        for (int i = blockers; i < powers.size(); i++) incoming += powers.get(i);
        boolean exposed = incoming >= 5;  // Jace enters at 4, +1 → 5
        int[] h = HOLD.computeIfAbsent(me.getGame(), g -> new int[] { -1, 0 });
        int turn = me.getGame().getPhaseHandler().getTurn();
        if (!exposed) { h[1] = 0; return false; }
        if (h[0] != turn) { h[0] = turn; h[1]++; }
        boolean hold = h[1] <= 2;
        Telemetry.note(me, "{\"ev\":\"" + (hold ? "jace_hold" : "jace_cast_after_hold") + "\",\"incoming\":" + incoming + ",\"blockers\":" + blockers + ",\"held_turns\":" + h[1] + "}");
        return hold;
    }

    /** After the stock AI declares blocks: chump attackers that would kill one of our planeswalkers with spare tokens. */
    static void blockForWalkers(Player me, forge.game.combat.Combat combat) {
        if (!PILOT4 || !mine(me) || combat == null) return;
        int incomingToMe = 0;
        for (Card a : combat.getAttackersOf(me)) if (!combat.isBlocked(a)) incomingToMe += Math.max(0, a.getNetCombatDamage());
        boolean dangerToMe = incomingToMe >= me.getLife();
        for (Card a : new ArrayList<>(combat.getAttackers())) {
            if (!(combat.getDefenderByAttacker(a) instanceof Card w) || w.getController() != me || !w.isPlaneswalker()) continue;
            if (combat.isBlocked(a)) continue;
            int dmg = Math.max(0, a.getNetCombatDamage()), loyalty = w.getCurrentLoyalty();
            String why = null;
            if (dmg < loyalty) why = "walker_survives";
            else if (dangerToMe) why = "blockers_needed_for_lethal";
            Card best = null;
            if (why == null) {
                for (Card b : me.getCreaturesInPlay()) {
                    if (!b.isToken() || combat.isBlocking(b) || !forge.game.combat.CombatUtil.canBlock(b, combat) || !forge.game.combat.CombatUtil.canBlock(a, b)) continue;
                    boolean trample = a.hasKeyword(forge.game.keyword.Keyword.TRAMPLE);
                    if (trample && dmg - Math.max(0, b.getNetToughness()) >= loyalty) continue;
                    if (best == null || ComputerUtilCard.evaluateCreature(b) < ComputerUtilCard.evaluateCreature(best)) best = b;
                }
                if (best == null) why = "no_legal_token_blocker";
            }
            if (best != null) {
                combat.addBlocker(a, best);
                Telemetry.note(me, "{\"ev\":\"walker_block\",\"walker\":" + Telemetry.q(w.getName()) + ",\"attacker\":" + Telemetry.q(a.getName()) + ",\"blocker\":" + Telemetry.q(best.getName()) + "}");
            } else {
                Telemetry.note(me, "{\"ev\":\"walker_unblocked\",\"walker\":" + Telemetry.q(w.getName()) + ",\"attacker\":" + Telemetry.q(a.getName()) + ",\"why\":" + Telemetry.q(why) + "}");
            }
        }
    }

    /** Best creature/planeswalker in hand to put on top for Jace's −3 (highest mana value). */
    static Card bestPayoff(Player me) {
        Card best = null;
        for (Card c : me.getCardsIn(ZoneType.Hand)) {
            if (!(c.isCreature() || c.isPlaneswalker())) continue;
            if (best == null || c.getCMC() > best.getCMC()) best = c;
        }
        return best != null && best.getCMC() >= 4 ? best : null;
    }

    /** Hand → top of library choices for Aminatou +1 / Brainstorm / Brainsurge: keep the payoff on top when Jace can use it. */
    static Card chooseTopFromHand(Player me, SpellAbility sa, List<Card> options) {
        if (!COMBO || !mine(me) || sa == null || sa.getHostCard() == null) return null;
        if (!TOP_SETUP.contains(sa.getHostCard().getName())) return null;
        boolean jaceReady = onField(me, JACE) != null || me.getCardsIn(ZoneType.Command).anyMatch(c -> JACE.equals(c.getName()));
        if (!jaceReady) return null;
        Card best = null;
        for (Card c : options) {
            if (!(c.isCreature() || c.isPlaneswalker())) continue;
            if (best == null || c.getCMC() > best.getCMC()) best = c;
        }
        if (best != null) Telemetry.note(me, "{\"ev\":\"top_choice\",\"by\":" + Telemetry.q(sa.getHostCard().getName()) + ",\"card\":" + Telemetry.q(best.getName()) + "}");
        return best;
    }

    /** Loyal Tutor: fetch the missing Cadet-loop piece first, else the best planeswalker. */
    static Card chooseTutorTarget(Player me, SpellAbility sa, List<Card> options) {
        if (!COMBO || !mine(me) || sa == null || sa.getHostCard() == null || !"Loyal Tutor".equals(sa.getHostCard().getName())) return null;
        for (String piece : List.of(AMINATOU, BOLAS, AJANI)) {
            boolean have = onField(me, piece) != null || me.getCardsIn(ZoneType.Hand).anyMatch(c -> piece.equals(c.getName()));
            if (have) continue;
            for (Card c : options) if (piece.equals(c.getName())) {
                Telemetry.note(me, "{\"ev\":\"tutor\",\"card\":" + Telemetry.q(piece) + "}");
                return c;
            }
        }
        return null;
    }

    // ---------- telemetry ----------

    public static final class Telemetry {
        static final Map<Game, Telemetry> BY_GAME = new ConcurrentHashMap<>();
        final Game game;
        final PrintWriter out;
        int personalTurn;
        final Map<String, Object> summary = new HashMap<>();
        boolean minus3Pending;
        String pendingTarget;
        String lastExiled;
        int minus3Resolved, minus3Activated;
        final List<String> hits = new ArrayList<>();
        final Map<String, Integer> declines = new HashMap<>();
        String lastDecisionKey = "";
        int firstJaceCast = -1, firstReadyWindow = -1, firstMinus3 = -1, comboAssembled = -1, loopWindows, loopSteps, hasteFinishes;

        Telemetry(Game game, PrintWriter out) {
            this.game = game;
            this.out = out;
            BY_GAME.put(game, this);
        }

        static String q(String s) {
            return "\"" + String.valueOf(s).replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
        }

        static Telemetry of(Player p) {
            return p == null ? null : BY_GAME.get(p.getGame());
        }

        static void note(Player me, String json) {
            Telemetry t = of(me);
            if (t == null) return;
            if (json.contains("\"loop_step\"")) t.loopSteps++;
            if (json.contains("\"combo_window\"")) t.loopWindows++;
            if (json.contains("\"loop_done\"") && json.contains("\"haste\":true")) t.hasteFinishes++;
            t.emit(json.substring(0, json.length() - 1) + ",\"pt\":" + t.personalTurn + "}");
            if (DEBUG) System.out.println("JaceCombo: " + json);
        }

        static void decision(Player me, Card jace, String reason, int fodder) {
            Telemetry t = of(me);
            if (t == null) return;
            if (t.firstReadyWindow < 0 && jace.getCurrentLoyalty() >= 3) t.firstReadyWindow = t.personalTurn;
            String key = t.personalTurn + reason;
            if (key.equals(t.lastDecisionKey)) return;
            t.lastDecisionKey = key;
            if (!"ok".equals(reason)) t.declines.merge(reason, 1, Integer::sum);
            t.emit("{\"ev\":\"minus3_window\",\"pt\":" + t.personalTurn + ",\"loyalty\":" + jace.getCurrentLoyalty() + ",\"fodder\":" + fodder + ",\"decision\":" + q(reason) + "}");
        }

        void emit(String line) {
            out.println(line);
            out.flush();
        }

        Player p1() {
            return game.getPlayers().stream().filter(JaceCombo::mine).findFirst().orElse(null);
        }

        @Subscribe
        public void onEvent(GameEvent ev) {
            try {
                handle(ev);
            } catch (RuntimeException e) {
                emit("{\"ev\":\"telemetry_error\",\"msg\":" + q(e.toString()) + "}");
            }
        }

        private void handle(GameEvent ev) {
            Player me = p1();
            if (me == null) return;
            if (ev instanceof GameEventTurnPhase tp && tp.phase() == PhaseType.UPKEEP && tp.playerTurn() != null
                    && tp.playerTurn().getName().startsWith("Ai(1)")) {
                personalTurn++;
            }
            if (ev instanceof GameEventTurnPhase tp && tp.phase() == PhaseType.MAIN1 && tp.playerTurn() != null
                    && tp.playerTurn().getName().startsWith("Ai(1)")) {
                boolean assembled = onField(me, AMINATOU) != null && onField(me, BOLAS) != null && onField(me, AJANI) != null;
                if (assembled && comboAssembled < 0) {
                    comboAssembled = personalTurn;
                    emit("{\"ev\":\"combo_assembled\",\"pt\":" + personalTurn + "}");
                }
                if (personalTurn >= 4 && personalTurn <= 6) snapshot(me);
            }
            if (ev instanceof GameEventCardChangeZone cz && cz.card() != null && cz.to() != null) {
                Card c = game.findById(cz.card().getId());
                ZoneType from = cz.from() == null ? null : cz.from().zoneType();
                ZoneType to = cz.to().zoneType();
                if (c != null && mine(c.getOwner())) {
                    if (from == ZoneType.Battlefield && to == ZoneType.Exile) lastExiled = c.getName() + (c.isToken() ? " (token)" : "");
                    if (minus3Pending && from == ZoneType.Library && to == ZoneType.Battlefield) {
                        hits.add(c.getName());
                        emit("{\"ev\":\"minus3_hit\",\"pt\":" + personalTurn + ",\"card\":" + q(c.getName()) + ",\"type\":" + q(c.isPlaneswalker() ? "planeswalker" : "creature") + "}");
                    }
                    if (JACE.equals(c.getName()) && to == ZoneType.Stack && firstJaceCast < 0) firstJaceCast = personalTurn;
                }
            }
            if (ev instanceof GameEventSpellAbilityCast cast && cast.sa() != null) {
                SpellAbility sa = game.getStack().isEmpty() ? null : game.getStack().peekAbility();
                if (sa != null && isJaceMinus3(sa) && mine(sa.getActivatingPlayer())) {
                    minus3Pending = true;
                    minus3Activated++;
                    String target = sa.getTargets() != null && !sa.getTargets().isEmpty() ? describe(sa.getTargets().getFirstTargetedCard()) : "cost:" + lastExiled;
                    pendingTarget = target;
                    emit("{\"ev\":\"minus3_activated\",\"pt\":" + personalTurn + ",\"target\":" + q(target) + "}");
                }
            }
            if (ev instanceof GameEventSpellResolved res && minus3Pending && res.spell() != null && String.valueOf(res.spell()).contains("Reveal cards from the top")) {
                minus3Pending = false;
                minus3Resolved++;
                if (firstMinus3 < 0) firstMinus3 = personalTurn;
                emit("{\"ev\":\"minus3_resolved\",\"pt\":" + personalTurn + ",\"fizzled\":" + res.hasFizzled() + "}");
            }
        }

        private SpellAbility findSa(GameEventSpellAbilityCast cast) {
            try {
                Card host = game.findById(cast.sa().getHostCard().getId());
                if (host == null) return null;
                for (SpellAbility sa : host.getSpellAbilities()) if (sa.getId() == cast.sa().getId()) return sa;
            } catch (RuntimeException e) {
                return null;
            }
            return null;
        }

        static String describe(Card c) {
            if (c == null) return "?";
            String kind = c.isPlaneswalker() ? (c.isToken() ? "pw_token" : "planeswalker") : (c.isToken() ? "token" : "creature");
            return c.getName() + " [" + kind + (c.isCreature() ? ", power " + c.getNetPower() : ", loyalty " + c.getCurrentLoyalty()) + "]";
        }

        private void snapshot(Player me) {
            int tok = 0, pwTok = 0, crt = 0, pw = 0;
            for (Card c : me.getCardsIn(ZoneType.Battlefield)) {
                if (c.isCreature() && c.isToken()) tok++;
                else if (c.isPlaneswalker() && c.isToken()) pwTok++;
                else if (c.isCreature()) crt++;
                else if (c.isPlaneswalker()) pw++;
            }
            Card jace = onField(me, JACE);
            emit("{\"ev\":\"snapshot\",\"pt\":" + personalTurn + ",\"jace\":" + (jace != null) + ",\"loyalty\":" + (jace == null ? 0 : jace.getCurrentLoyalty())
                    + ",\"creature_tokens\":" + tok + ",\"pw_tokens\":" + pwTok + ",\"creatures\":" + crt + ",\"walkers\":" + pw
                    + ",\"lands\":" + me.getLandsInPlay().size() + ",\"hand\":" + me.getCardsIn(ZoneType.Hand).size()
                    + ",\"aminatou\":" + (onField(me, AMINATOU) != null) + ",\"bolas\":" + (onField(me, BOLAS) != null) + ",\"ajani\":" + (onField(me, AJANI) != null) + "}");
        }

        void finish(String result) {
            StringBuilder d = new StringBuilder();
            declines.forEach((k, v) -> d.append(d.length() > 0 ? "," : "").append(q(k)).append(':').append(v));
            emit("{\"ev\":\"summary\",\"personal_turns\":" + personalTurn + ",\"first_jace_cast\":" + firstJaceCast + ",\"first_ready_window\":" + firstReadyWindow
                    + ",\"first_minus3\":" + firstMinus3 + ",\"minus3_activated\":" + minus3Activated + ",\"minus3_resolved\":" + minus3Resolved
                    + ",\"hits\":" + hits.size() + ",\"declines\":{" + d + "},\"combo_assembled\":" + comboAssembled + ",\"loop_windows\":" + loopWindows
                    + ",\"loop_steps\":" + loopSteps + ",\"haste_finishes\":" + hasteFinishes + ",\"result\":" + q(result) + "}");
            out.close();
            BY_GAME.remove(game);
            STATE.remove(game);
        }
    }
}
