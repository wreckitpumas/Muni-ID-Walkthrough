#!/usr/bin/env bash
# Milwaukee Municipal ID Wizard – local launcher
# Starts a local HTTP server (required for fetch('translations.json'))
# then opens the wizard in the default browser.

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8743

# ── Find a free port near 8743 ──────────────────────────────────────────────
find_free_port() {
  local p=$PORT
  while ss -ltn 2>/dev/null | grep -q ":$p " || \
        netstat -ltn 2>/dev/null | grep -q ":$p "; do
    p=$((p + 1))
  done
  echo "$p"
}
PORT=$(find_free_port)

URL="http://localhost:$PORT"
SERVER_PID=""

# ── Cleanup on exit ─────────────────────────────────────────────────────────
cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null
  fi
}
trap cleanup EXIT INT TERM

# ── Start server ─────────────────────────────────────────────────────────────
cd "$DIR"

if command -v python3 &>/dev/null; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 \
    >/tmp/muni-id-server.log 2>&1 &
  SERVER_PID=$!
  SERVER_CMD="python3"
elif command -v python &>/dev/null; then
  python -m SimpleHTTPServer "$PORT" \
    >/tmp/muni-id-server.log 2>&1 &
  SERVER_PID=$!
  SERVER_CMD="python"
elif command -v node &>/dev/null && command -v npx &>/dev/null; then
  npx --yes http-server "$DIR" -p "$PORT" -a 127.0.0.1 --silent &
  SERVER_PID=$!
  SERVER_CMD="node/npx"
else
  echo "Error: no suitable HTTP server found."
  echo "Install Python 3 or Node.js and try again."
  exit 1
fi

# ── Wait for server to be ready ──────────────────────────────────────────────
echo "Starting server ($SERVER_CMD) on $URL ..."
for i in $(seq 1 20); do
  if curl -sf "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

# ── Open browser ─────────────────────────────────────────────────────────────
if command -v xdg-open &>/dev/null; then
  xdg-open "$URL" &
elif command -v open &>/dev/null; then       # macOS
  open "$URL" &
elif command -v start &>/dev/null; then      # Windows/WSL
  start "$URL" &
else
  echo "Open your browser and navigate to: $URL"
fi

echo "Wizard running at $URL"
echo "Press Ctrl-C to stop."

# ── Keep alive until the user quits ─────────────────────────────────────────
wait "$SERVER_PID"
