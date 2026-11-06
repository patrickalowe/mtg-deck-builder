package forge.view;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;

import forge.ai.AiAbilityDecision;
import forge.ai.AiPlayDecision;
import forge.ai.ComputerUtil;
import forge.ai.ComputerUtilCard;
import forge.ai.ComputerUtilCombat;
import forge.ai.SpellAbilityAi;
import forge.ai.SpellApiToAi;
import forge.ai.ability.AttachAi;
import forge.ai.ability.ChangeZoneAllAi;
import forge.ai.ability.DrawAi;
import forge.ai.ability.PermanentCreatureAi;
import forge.ai.ability.PermanentNoncreatureAi;
import forge.ai.ComputerUtilMana;
import forge.ai.ability.PeekAndRevealAi;
import forge.ai.ability.PhasesAi;
import forge.ai.ability.RemoveFromCombatAi;
import forge.game.Game;
import forge.game.GameObject;
import forge.game.ability.ApiType;
import forge.game.card.Card;
import forge.game.combat.Combat;
import forge.game.phase.PhaseHandler;
import forge.game.phase.PhaseType;
import forge.game.player.Player;
import forge.game.spellability.SpellAbility;

/**
 * Teaches Forge's AI cards it otherwise never (or rarely) plays well, by swapping in smarter decision logic
 * for their effect types. Every other card keeps Forge's own logic.
 * Jace's deck:
 *  - Aetherize: cast once an opponent declares attackers at you, when the attack is big (6+ damage or lethal).
 *  - Clever Concealment: cast in response to something that threatens your permanents; phase out everything at risk.
 *  - Lim-Dûl's Vault: cast at the end of an opponent's turn (Forge's script still won't pay life to dig deeper).
 * T'Challa's deck:
 *  - Swiftfoot Boots: only cast in main phase 2 once there's a creature worth protecting (don't spend early turns on it).
 *  - Mirrormind Crown: equip the best non-legendary creature, so the token copies survive the legend rule.
 *  - Reconnaissance / Greater Good: cast once you have two or more creatures.
 *  - Reconnaissance ability: pull a blocked attacker that would die out of combat; untap attackers after damage.
 *  - Greater Good ability: sacrifice for cards when your creatures are threatened by removal or a wipe.
 *  - Midnight Angel Armor: cast when affordable (after T'Challa if he's waiting); equip it to T'Challa whenever he's out.
 *  - T'Challa first: when T'Challa is in the command zone and affordable, hold artifacts with MV 4+ and recast him
 *    first, so every big artifact puts two +1/+1 counters on him (the AI used to leave him there for rounds).
 */
public final class SmartAi {

    @SuppressWarnings("unchecked")
    public static void install() throws Exception {
        Field f = SpellApiToAi.class.getDeclaredField("apiToInstance");
        f.setAccessible(true);
        Map<ApiType, SpellAbilityAi> map = (Map<ApiType, SpellAbilityAi>) f.get(SpellApiToAi.Converter);
        map.put(ApiType.ChangeZoneAll, new SmartChangeZoneAll());
        map.put(ApiType.Phases, new SmartPhases());
        map.put(ApiType.PeekAndReveal, new SmartPeek());
        map.put(ApiType.PermanentNoncreature, new SmartPermanentNoncreature());
        map.put(ApiType.Attach, new SmartAttach());
        map.put(ApiType.RemoveFromCombat, new SmartRemoveFromCombat());
        map.put(ApiType.Draw, new SmartDraw());
        map.put(ApiType.PermanentCreature, new SmartPermanentCreature());
        System.out.println("SmartAi: custom logic installed for Aetherize, Clever Concealment, Lim-Dûl's Vault, "
                + "Swiftfoot Boots, Mirrormind Crown, Reconnaissance, Greater Good");
    }

    private static final boolean DEBUG = System.getenv("SMART_AI_DEBUG") != null;

    // Only Patrick's deck (player 1, "Ai(1)-...") gets the smarter logic; opponents keep Forge's standard AI.
    private static boolean is(SpellAbility sa, String name) {
        Card host = sa.getHostCard();
        return host != null && name.equals(host.getName()) && host.getController() != null
                && host.getController().getName().startsWith("Ai(1)");
    }

    private static void debug(Player ai, String msg) {
        if (DEBUG) System.out.println("SmartAi: " + msg + " | phase " + ai.getGame().getPhaseHandler().getPhase() + " of " + ai.getGame().getPhaseHandler().getPlayerTurn().getName());
    }

    private static AiAbilityDecision play() { return new AiAbilityDecision(100, AiPlayDecision.WillPlay); }
    private static AiAbilityDecision pass() { return new AiAbilityDecision(0, AiPlayDecision.CantPlayAi); }

    /** Aetherize: bounce a big attack once blockers are known. */
    public static final class SmartChangeZoneAll extends ChangeZoneAllAi {
        @Override
        protected AiAbilityDecision canPlay(Player ai, SpellAbility sa) {
            if (!is(sa, "Aetherize")) return super.canPlay(ai, sa);
            debug(ai, "considering Aetherize");
            Game game = ai.getGame();
            PhaseHandler ph = game.getPhaseHandler();
            Combat combat = game.getCombat();
            // Forge's AI doesn't take priority as defender after blocks, so cast once attackers are declared.
            boolean attacked = ph.is(PhaseType.COMBAT_DECLARE_ATTACKERS) || ph.is(PhaseType.COMBAT_DECLARE_BLOCKERS);
            if (combat == null || !attacked || !ph.getPlayerTurn().isOpponentOf(ai)) return pass();
            int incoming = 0;
            for (Card a : combat.getAttackers()) {
                if (combat.getDefenderByAttacker(a) == ai) incoming += Math.max(0, a.getNetCombatDamage());
            }
            return incoming >= 6 || incoming >= ai.getLife() ? play() : pass();
        }
    }

    /** Clever Concealment: phase out whatever is threatened by a wipe/removal on the stack. */
    public static final class SmartPhases extends PhasesAi {
        @Override
        protected AiAbilityDecision canPlay(Player ai, SpellAbility sa) {
            if (!is(sa, "Clever Concealment")) return super.canPlay(ai, sa);
            debug(ai, "considering Clever Concealment");
            List<GameObject> threatened = ComputerUtil.predictThreatenedObjects(ai, null, true);
            sa.resetTargets();
            int saved = 0;
            for (GameObject o : threatened) {
                if (o instanceof Card c && c.getController() == ai && !c.isLand() && sa.canTarget(c)) {
                    sa.getTargets().add(c);
                    saved++;
                }
            }
            return saved > 0 ? play() : pass();
        }
    }

    /** Lim-Dûl's Vault: set up the next draws at the end of an opponent's turn. */
    public static final class SmartPeek extends PeekAndRevealAi {
        @Override
        protected AiAbilityDecision checkApiLogic(Player ai, SpellAbility sa) {
            if (!is(sa, "Lim-Dûl's Vault")) return super.checkApiLogic(ai, sa);
            debug(ai, "considering Lim-Dûl's Vault");
            PhaseHandler ph = ai.getGame().getPhaseHandler();
            boolean opponentsEndStep = ph.is(PhaseType.END_OF_TURN) && ph.getPlayerTurn().isOpponentOf(ai);
            if (opponentsEndStep) debug(ai, "Vault: end step, can pay " + forge.ai.ComputerUtilMana.canPayManaCost(sa, ai, 0, false));
            return opponentsEndStep ? play() : pass();
        }
    }

    private static int creatures(Player ai) {
        return ai.getCreaturesInPlay().size();
    }

    static final String TCHALLA = "T'Challa, the Black Panther";

    private static boolean mine(SpellAbility sa) {
        Card host = sa.getHostCard();
        return host != null && host.getController() != null && host.getController().getName().startsWith("Ai(1)");
    }

    /** T'Challa is in the command zone and the AI can afford him (printed cost + commander tax) right now. */
    static boolean tchallaWaiting(Player ai) {
        // Look T'Challa up by name in the real zones: getCommanders() returns Forge's original card object, which
        // doesn't follow the card when it moves to the battlefield.
        if (ai.getCardsIn(forge.game.zone.ZoneType.Battlefield).anyMatch(c -> TCHALLA.equals(c.getName()))) return false;
        for (Card c : ai.getCardsIn(forge.game.zone.ZoneType.Command)) {
            if (!TCHALLA.equals(c.getName())) continue;
            // Real payability check (respects Vibranium tokens only paying for artifacts) plus the commander tax.
            SpellAbility cast = c.getFirstSpellAbility();
            if (cast == null) return false;
            cast.setActivatingPlayer(ai);
            boolean ok = ComputerUtilMana.canPayManaCost(cast, ai, 2 * ai.getCommanderCast(c), false);
            if (DEBUG) debug(ai, "T'Challa in command zone, tax " + 2 * ai.getCommanderCast(c) + ", can pay " + ok);
            return ok;
        }
        return false;
    }

    /** Hold an artifact with MV 4+ while T'Challa should be recast first. */
    private static boolean holdForTchalla(Player ai, SpellAbility sa) {
        Card host = sa.getHostCard();
        boolean hold = mine(sa) && host.isArtifact() && host.getCMC() >= 4 && tchallaWaiting(ai);
        if (hold) debug(ai, "holding " + host.getName() + " until T'Challa is recast");
        return hold;
    }

    /** Recast T'Challa whenever affordable; hold big artifact creatures until he's out. */
    public static final class SmartPermanentCreature extends PermanentCreatureAi {
        @Override
        protected AiAbilityDecision checkApiLogic(Player ai, SpellAbility sa) {
            if (mine(sa) && TCHALLA.equals(sa.getHostCard().getName())) { debug(ai, "casting T'Challa"); return play(); }
            if (holdForTchalla(ai, sa)) return pass();
            return super.checkApiLogic(ai, sa);
        }
    }

    /** When to cast Swiftfoot Boots, Reconnaissance and Greater Good. */
    public static final class SmartPermanentNoncreature extends PermanentNoncreatureAi {
        @Override
        protected AiAbilityDecision checkApiLogic(Player ai, SpellAbility sa) {
            if (holdForTchalla(ai, sa)) return pass();
            if (is(sa, JaceCombo.JACE) && JaceCombo.holdJace(ai)) return pass();
            if (is(sa, "Midnight Angel Armor")) { debug(ai, "casting Midnight Angel Armor"); return play(); }
            PhaseHandler ph = ai.getGame().getPhaseHandler();
            if (is(sa, "Swiftfoot Boots")) {
                boolean worthProtecting = ai.getCreaturesInPlay().stream().anyMatch(c -> c.isCommander() || ComputerUtilCard.evaluateCreature(c) >= 180);
                if (!worthProtecting || !ph.is(PhaseType.MAIN2)) return pass();
                return super.checkApiLogic(ai, sa);
            }
            if (is(sa, "Reconnaissance") || is(sa, "Greater Good")) {
                debug(ai, "considering casting " + sa.getHostCard().getName() + " with " + creatures(ai) + " creatures");
                return creatures(ai) >= 2 && ph.is(PhaseType.MAIN2) ? play() : pass();
            }
            return super.checkApiLogic(ai, sa);
        }
    }

    /** Mirrormind Crown: equip the best non-legendary creature. */
    public static final class SmartAttach extends AttachAi {
        @Override
        protected AiAbilityDecision checkApiLogic(Player ai, SpellAbility sa) {
            if (is(sa, "Midnight Angel Armor") && !sa.isSpell()) {
                // Move the Armor onto T'Challa (flying, vigilance, +3/+3) whenever he's out and not already wearing it.
                Card armor = sa.getHostCard();
                Card tchalla = ai.getCreaturesInPlay().stream().filter(c -> TCHALLA.equals(c.getName())).findFirst().orElse(null);
                if (tchalla == null || armor.getAttachedTo() == tchalla || !sa.canTarget(tchalla)) return pass();
                sa.resetTargets();
                sa.getTargets().add(tchalla);
                debug(ai, "equipping Midnight Angel Armor to T'Challa");
                return play();
            }
            if (!is(sa, "Mirrormind Crown") || sa.isSpell()) return super.checkApiLogic(ai, sa);
            Card crown = sa.getHostCard();
            Card best = null;
            for (Card c : ai.getCreaturesInPlay()) {
                if (c.getType().isLegendary() || !sa.canTarget(c)) continue;
                if (best == null || ComputerUtilCard.evaluateCreature(c) > ComputerUtilCard.evaluateCreature(best)) best = c;
            }
            if (best == null || crown.getAttachedTo() == best) return pass();
            Card current = crown.getAttachedTo();
            if (current != null && !current.getType().isLegendary()
                    && ComputerUtilCard.evaluateCreature(current) >= ComputerUtilCard.evaluateCreature(best)) return pass();
            sa.resetTargets();
            sa.getTargets().add(best);
            return play();
        }
    }

    /** Reconnaissance: save attackers that would die; untap attackers once damage is done. */
    public static final class SmartRemoveFromCombat extends RemoveFromCombatAi {
        @Override
        protected AiAbilityDecision canPlay(Player ai, SpellAbility sa) {
            if (!is(sa, "Reconnaissance")) return super.canPlay(ai, sa);
            Game game = ai.getGame();
            PhaseHandler ph = game.getPhaseHandler();
            Combat combat = game.getCombat();
            if (combat == null || ph.getPlayerTurn() != ai) return pass();
            sa.resetTargets();
            for (Card a : combat.getAttackers()) {
                if (a.getController() != ai || !sa.canTarget(a)) continue;
                boolean dies = ph.is(PhaseType.COMBAT_DECLARE_BLOCKERS) && combat.isBlocked(a) && ComputerUtilCombat.attackerWouldBeDestroyed(ai, a, combat);
                boolean freeUntap = (ph.is(PhaseType.COMBAT_DAMAGE) || ph.is(PhaseType.COMBAT_END)) && a.isTapped();
                if (dies || freeUntap) {
                    sa.getTargets().add(a);
                    debug(ai, "Reconnaissance on " + a.getName() + (dies ? " (would die)" : " (untap after damage)"));
                    return play();
                }
            }
            return pass();
        }
    }

    /** Greater Good: cash in creatures for cards when they're about to be lost anyway. */
    public static final class SmartDraw extends DrawAi {
        @Override
        protected AiAbilityDecision checkApiLogic(Player ai, SpellAbility sa) {
            if (!is(sa, "Greater Good")) return super.checkApiLogic(ai, sa);
            for (GameObject o : ComputerUtil.predictThreatenedObjects(ai, null, true)) {
                if (o instanceof Card c && c.getController() == ai && c.isCreature() && c.getNetPower() >= 3) {
                    debug(ai, "Greater Good: " + c.getName() + " is threatened");
                    return play();
                }
            }
            return pass();
        }
    }

    private SmartAi() {
    }
}
