#!/bin/sh
# Opens Forge's desktop app with the Homebrew Java 21 install (it isn't on PATH).
cd "$(dirname "$0")/app"
exec /opt/homebrew/opt/openjdk@21/bin/java -Xmx4096m -Dio.netty.tryReflectionSetAccessible=true -Dfile.encoding=UTF-8 -jar forge-gui-desktop-2.0.15-jar-with-dependencies.jar
