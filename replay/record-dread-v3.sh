#!/bin/sh
# Re-record the 10 v1.0-dreadhorde-only pilot-v3 screen games (pods 1-10, game 1) with FULL_STATE so the viewer
# shows loyalty/counters/live P/T. Same deck, pilot v3 runtime and seeds as the screen run.
cd "$(dirname "$0")/../forge/app-jace-real" || exit 1
L="$HOME/Projects/mtg-commander/replay/logs"
D="$HOME/Projects/mtg-commander/forge/decks"
rec() {
  SMART_AI=1 POLITICS=1 KEEP_TOKENS=1 JACE_REAL_RULES=1 JACE_COMBO_AI=1 JACE_TELEMETRY=1 JACE_SAFE_WALKERS=1 COMMANDER_FIRST=1 JACE_PILOT_V3=1 FULL_STATE=1 \
    /opt/homebrew/opt/openjdk@21/bin/java -Xmx3072m -Dio.netty.tryReflectionSetAccessible=true -Dfile.encoding=UTF-8 \
    -cp ../replaysim/classes-v3:forge-gui-desktop-2.0.15-jar-with-dependencies.jar forge.view.PodSim "$D" "$L" \
    "jace-v1.0-dreadhorde-only-smart-politics-jacecombo-$1" 1 "$2" jace-v1.0-dreadhorde-only.dck "$3" "$4" "$5" 2>&1 | grep 'Game Result' | sed 's#.*/##'
}
rec pod01 100000 b3-313935.dck b3-4036.dck b3-24662123.dck &
rec pod02 200000 b3-3047743.dck b3-15073736.dck b3-4036.dck &
rec pod03 300000 b3-15073736.dck b3-313935.dck b3-3047743.dck &
rec pod04 400000 b3-24662123.dck b3-4133378.dck b3-3047743.dck &
wait
rec pod05 500000 b3-11619336.dck b3-3047743.dck b3-4133378.dck &
rec pod06 600000 b3-11619336.dck b3-7817483.dck b3-4133378.dck &
rec pod07 700000 b3-15073736.dck b3-11650077.dck b3-171880.dck &
rec pod08 800000 b3-11650077.dck b3-13631413.dck b3-171880.dck &
wait
rec pod09 900000 b3-9298397.dck b3-4133378.dck b3-24662123.dck &
rec pod10 1000000 b3-7817483.dck b3-9298397.dck b3-13631413.dck &
wait
cd ../../replay && node build.js > /dev/null 2>&1 && echo rebuilt
