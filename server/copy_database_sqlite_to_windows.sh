#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SRC_FILE="$SCRIPT_DIR/database.sqlite"
DEST_DIR="/mnt/c/Users/ayuya/Antigravity-work/daily-report-system/server"
DEST_FILE="$DEST_DIR/database.sqlite"

if [[ ! -f "$SRC_FILE" ]]; then
  echo "ERROR: Source file not found: $SRC_FILE" >&2
  exit 1
fi

if [[ ! -d "$DEST_DIR" ]]; then
  echo "ERROR: Destination directory not found: $DEST_DIR" >&2
  echo "Hint: Ensure the Windows folder exists: C:\\Users\\ayuya\\Antigravity-work\\daily-report-system\\server" >&2
  exit 1
fi

cp -f "$SRC_FILE" "$DEST_FILE"

echo "Copied: $SRC_FILE"
echo "   ->  $DEST_FILE"
