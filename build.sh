#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Fetching race results..."
python3 scripts/fetch_results.py

echo "Building site..."
hugo "$@"
