#!/bin/sh
# Records Forge games (T'Challa vs. chosen bracket-3 decks) into logs/ for the replay viewer.
# Uses ../forge/replaysim's ReplayRecorder, which plays exactly like `forge sim` and also writes a
# .state.jsonl per game with live power/toughness, counters, loyalty, tapped state and hand sizes.
# Usage: [DECK=tchalla-tuned2] [SMART=1] ./record.sh [games per opponent=2] [opponent deck ids...]   (2 Forge instances at a time)
#   SMART=1: record with the smart AI (SmartAi.java) in the test copy of Forge (../forge/app-jace-minus3), which also has Jace's -3 fix.
cd "$(dirname "$0")"
N=${1:-2}; shift
OPPS=${*:-"24662123 11650077 313935 3047743 1909492 4593151"}
JAVA=/opt/homebrew/opt/openjdk@21/bin/java
DECK=${DECK:-tchalla-proposed}
APP=app; [ -n "$SMART" ] && APP=app-jace-minus3 && export SMART_AI=1
TAG="$DECK"; [ -n "$SMART" ] && TAG="$DECK-smart"
mkdir -p logs
for o in $OPPS; do
  # Numeric ids are bracket-3 decks; anything else is one of Patrick's own decks (e.g. jace-updated).
  case "$o" in *[!0-9]*) OPP=$o ;; *) OPP=b3-$o ;; esac
  while [ "$(jobs -r | wc -l)" -ge 2 ]; do sleep 1; done
  ( cd ../forge/$APP && $JAVA -Xmx3072m -Dio.netty.tryReflectionSetAccessible=true -Dfile.encoding=UTF-8 \
      -cp "../replaysim/classes:forge-gui-desktop-2.0.15-jar-with-dependencies.jar" forge.view.ReplayRecorder \
      "$PWD/../decks" "$DECK.dck" "$OPP.dck" "$N" "$PWD/../../replay/logs/$TAG-$OPP" \
      2>&1 | grep "Game Result" ) &
done
wait
