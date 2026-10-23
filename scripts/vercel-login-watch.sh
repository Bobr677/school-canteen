#!/usr/bin/env bash
LOG=/tmp/vlogin.txt
AUTH1="$HOME/.local/share/com.vercel.cli/auth.json"
AUTH2="$HOME/.vercel/auth.json"
: > "$LOG"
for i in $(seq 1 40); do
  if [ -f "$AUTH1" ] || [ -f "$AUTH2" ]; then
    echo "AUTH_COMPLETED" >> "$LOG"
    exit 0
  fi
  echo "--- attempt $i $(date +%H:%M:%S) ---" >> "$LOG"
  timeout 900 vercel login >> "$LOG" 2>&1
  sleep 3
done
echo "WATCHDOG_GAVE_UP" >> "$LOG"
