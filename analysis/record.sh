#!/bin/sh
# Records Forge games with full logs + card state for analysis. Usage: ./record.sh <my deck> <games each> <opponent ids...>
cd "$(dirname "$0")"
DECK=$1; N=$2; shift 2
JAVA=/opt/homebrew/opt/openjdk@21/bin/java
OUT="$PWD/logs/$DECK"; mkdir -p "$OUT"
run() {
  ( cd ../forge/app && $JAVA -Xmx3072m -Dio.netty.tryReflectionSetAccessible=true -Dfile.encoding=UTF-8 \
      -cp "../replaysim/classes:forge-gui-desktop-2.0.15-jar-with-dependencies.jar" forge.view.ReplayRecorder \
      "$PWD/../decks" "$DECK.dck" "b3-$1.dck" "$N" "$OUT/b3-$1" 2>&1 | grep -c "Game Result" | sed "s/^/b3-$1 games: /" )
}
# PAR at a time (default 4)
for o in "$@"; do
  run "$o" &
  while [ "$(jobs -r | wc -l)" -ge ${PAR:-4} ]; do sleep 1; done
done
wait
