#!/bin/bash
# Run Slate scraper locally and push results to GitHub
# This must run from a residential IP (not GitHub Actions) because
# Slate's API blocks datacenter IPs.
#
# Usage: cd aviato-app/scrapers && ./run_slate_local.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Running Slate scraper..."
cd "$SCRIPT_DIR"
python3 slate_scraper.py

echo ""
echo "Committing and pushing results..."
cd "$REPO_DIR"
git add aviato-app/scrapers/slate_flights.json aviato-app/app/data/flights.ts
if ! git diff --cached --quiet; then
    git commit -m "Update Slate flight data $(date -u +%Y-%m-%d)"
    git pull --rebase origin main
    git push origin main
    echo "Done! Slate flights updated and pushed."
else
    echo "No changes to commit."
fi
