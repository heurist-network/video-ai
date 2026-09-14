#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f reference-lab/library/index.json ]]; then
  echo "reference-lab/library already present"
  exit 0
fi

if ! command -v gh >/dev/null; then
  echo "install GitHub CLI: brew install gh" >&2
  exit 1
fi

gh auth status >/dev/null

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

gh release download media-v1 --pattern 'library.tar.gz' --dir "$TMP"
mkdir -p reference-lab
tar -xzf "$TMP/library.tar.gz" -C reference-lab
echo "OK → reference-lab/library"
