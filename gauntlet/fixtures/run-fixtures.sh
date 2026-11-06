#!/bin/sh
# Stage 1 diagnostics (C7): applies each fixtures/jace/*.state at player 1's first main phase and plays that turn.
# Arm: real-card Jace + combo pilot + telemetry (separate runtime: app-jace-real + replaysim/classes-combo).
# Usage: sh run-fixtures.sh [fixture-name-glob]
cd "$(dirname "$0")/../../forge/app-jace-real" || exit 1
OUT="$(cd ../../gauntlet/fixtures && pwd)/out"; mkdir -p "$OUT"
for f in ../../gauntlet/fixtures/jace/${1:-*}.state; do
  n=$(basename "$f" .state)
  SMART_AI=1 POLITICS=1 KEEP_TOKENS=1 JACE_REAL_RULES=1 JACE_COMBO_AI=1 JACE_TELEMETRY=1 FIXTURE="$(cd "$(dirname "$f")" && pwd)/$n.state" \
    /opt/homebrew/opt/openjdk@21/bin/java -Xmx3072m -Dio.netty.tryReflectionSetAccessible=true -Dfile.encoding=UTF-8 \
    -cp ../replaysim/${CLASSES:-classes-combo}:forge-gui-desktop-2.0.15-jar-with-dependencies.jar forge.view.PodSim \
    "$HOME/Projects/mtg-commander/forge/decks" "$OUT" "$n" 1 1 jace-v0.1-real.dck b3-313935.dck b3-4036.dck b3-24662123.dck > "$OUT/$n.stdout.txt" 2>&1
  echo "$n: $(grep -c 'fixture applied' "$OUT/$n.stdout.txt") applied, $(grep -h 'Game Result' "$OUT/$n-g1.log" 2>/dev/null)"
done
