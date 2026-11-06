package forge.view;

import java.io.File;
import java.io.PrintWriter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import com.google.common.collect.Multiset;
import com.google.common.eventbus.Subscribe;

import forge.GuiDesktop;
import forge.deck.Deck;
import forge.deck.io.DeckSerializer;
import forge.game.*;
import forge.game.card.Card;
import forge.game.card.CounterType;
import forge.game.event.GameEvent;
import forge.game.player.Player;
import forge.game.player.RegisteredPlayer;
import forge.game.zone.ZoneType;
import forge.gui.GuiBase;
import forge.model.FModel;
import forge.player.GamePlayerUtil;

/**
 * Runs Forge Commander games exactly like `forge sim`, and also records card state for the replay viewer.
 * After every game event it writes any battlefield card whose power, toughness, counters, loyalty, tapped state or
 * controller changed (tokens included, from the moment they're created), each player's exact hand,
 * plus hand/library sizes, anchored to the number of game-log entries so far.
 *
 * Usage: ReplayRecorder <deck dir> <deck1.dck> <deck2.dck> <games> <output prefix>
 * Writes <prefix>-<n>.log (same text format as `forge sim`) and <prefix>-<n>.state.jsonl per game.
 */
public final class ReplayRecorder {

    public static void main(String[] args) throws Exception {
        System.setProperty("java.awt.headless", "true");
        System.setProperty("java.util.Arrays.useLegacyMergeSort", "true");
        GuiBase.setInterface(new GuiDesktop());
        FModel.initialize(null, null);
        if (System.getenv("SMART_AI") != null) SmartAi.install();

        String deckDir = args[0];
        int games = Integer.parseInt(args[3]);
        String prefix = args[4];

        GameRules rules = new GameRules(GameType.Commander);
        rules.setAppliedVariants(EnumSet.of(GameType.Commander));
        rules.setSimTimeout(300);

        List<RegisteredPlayer> players = new ArrayList<>();
        for (int i = 1; i <= 2; i++) {
            Deck deck = DeckSerializer.fromFile(new File(deckDir, args[i]));
            RegisteredPlayer rp = RegisteredPlayer.forCommander(deck);
            rp.setPlayer(GamePlayerUtil.createAiPlayer("Ai(" + i + ")-" + deck.getName(), i - 1, ""));
            players.add(rp);
        }
        Match match = new Match(rules, players, "Replay");

        for (int g = 1; g <= games; g++) {
            playOne(match, g, prefix);
        }
        System.exit(0);
    }

    private static void playOne(Match match, int index, String prefix) throws Exception {
        Game game = match.createGame();
        game.setNoGUIUser();
        try (PrintWriter state = new PrintWriter(prefix + "-" + index + ".state.jsonl", "UTF-8")) {
            game.subscribeToEvents(new Tracker(game, state));
            long start = System.currentTimeMillis();
            try {
                TimeLimitedCodeBlock.runWithTimeout(() -> match.startGame(game), match.getRules().getSimTimeout(), TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                System.out.println("Stopping slow match as draw");
            } catch (Exception | StackOverflowError e) {
                e.printStackTrace();
            } finally {
                game.setGameOver(GameEndReason.Draw);
            }
            long ms = System.currentTimeMillis() - start;

            List<GameLogEntry> log = game.getGameLog().getLogEntries(null);
            Collections.reverse(log);
            try (PrintWriter out = new PrintWriter(prefix + "-" + index + ".log", "UTF-8")) {
                for (GameLogEntry entry : log) out.println(entry);
                String result = game.getOutcome().isDraw()
                        ? String.format("Game Result: Game %d ended in a Draw! Took %d ms.", index, ms)
                        : String.format("Game Result: Game %d ended in %d ms. %s has won!", index, ms, game.getOutcome().getWinningLobbyPlayer().getName());
                out.println();
                out.println(result);
                System.out.println(result);
            }
        }
    }

    /** Writes a JSON line whenever a battlefield card's power, toughness, counters, loyalty, tapped state or controller changes. */
    public static final class Tracker {
        private final Game game;
        private final PrintWriter out;
        private final Map<Integer, String> lastCard = new HashMap<>();
        private String lastZones = "";
        private String lastHands = "";

        Tracker(Game game, PrintWriter out) {
            this.game = game;
            this.out = out;
        }

        @Subscribe
        public void onEvent(GameEvent event) {
            int anchor = game.getGameLog().getLogEntries(null).size();
            for (Card c : game.getCardsIn(ZoneType.Battlefield)) {
                StringBuilder counters = new StringBuilder();
                for (Multiset.Entry<CounterType> e : c.getCounters().entrySet()) {
                    if (counters.length() > 0) counters.append(',');
                    counters.append('"').append(json(e.getElement().getName())).append("\":").append(e.getCount());
                }
                String sig = c.getNetPower() + "/" + c.getNetToughness() + "|" + counters + "|" + (c.isPlaneswalker() ? c.getCurrentLoyalty() : "")
                        + "|" + c.isCreature() + "|" + c.isTapped() + "|" + c.getController().getName();
                if (sig.equals(lastCard.get(c.getId()))) continue;
                lastCard.put(c.getId(), sig);
                out.println("{\"a\":" + anchor + ",\"id\":\"" + c.getId() + "\",\"name\":\"" + json(c.getName()) + "\""
                        + ",\"ctrl\":\"" + json(c.getController().getName()) + "\",\"tap\":" + c.isTapped() + ",\"tok\":" + c.isToken() + ",\"land\":" + c.isLand()
                        + (c.isCreature() ? ",\"p\":" + c.getNetPower() + ",\"t\":" + c.getNetToughness() : "")
                        + (c.isPlaneswalker() ? ",\"loyalty\":" + c.getCurrentLoyalty() : "")
                        + ",\"c\":{" + counters + "}}");
            }
            StringBuilder zones = new StringBuilder();
            for (Player p : game.getPlayers()) {
                if (zones.length() > 0) zones.append(',');
                zones.append('"').append(json(p.getName())).append("\":[").append(p.getZone(ZoneType.Hand).size()).append(',').append(p.getZone(ZoneType.Library).size()).append(']');
            }
            if (!zones.toString().equals(lastZones)) {
                lastZones = zones.toString();
                out.println("{\"a\":" + anchor + ",\"zones\":{" + zones + "}}");
            }
            // Exact hand contents, so the replay can show the cards each player is holding and what they drew.
            StringBuilder hands = new StringBuilder();
            for (Player p : game.getPlayers()) {
                if (hands.length() > 0) hands.append(',');
                hands.append('"').append(json(p.getName())).append("\":[");
                boolean first = true;
                for (Card c : p.getCardsIn(ZoneType.Hand)) {
                    if (!first) hands.append(',');
                    first = false;
                    hands.append("[\"").append(c.getId()).append("\",\"").append(json(c.getName())).append("\"]");
                }
                hands.append(']');
            }
            if (!hands.toString().equals(lastHands)) {
                lastHands = hands.toString();
                out.println("{\"a\":" + anchor + ",\"hands\":{" + hands + "}}");
            }
        }

        private static String json(String s) {
            return s.replace("\\", "\\\\").replace("\"", "\\\"");
        }
    }

    private ReplayRecorder() {
    }
}
