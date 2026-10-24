#!/usr/bin/env bash
# Rebuild data/attestation from the cached/downloaded TMBM PDFs: import (uz) -> import (ru) -> pair -> spelling clean -> key audit.
# Add --offline to use only the cache (/tmp/tmbm_cache). Needs pdfplumber and curl.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/tmbm_import.py "$@" >/dev/null
python3 tools/tmbm_import_ru.py "$@" >/dev/null
python3 tools/tmbm_pair_ru.py
python3 tools/tmbm_clean.py
python3 tools/tmbm_audit.py
