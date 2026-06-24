#!/usr/bin/env bash
# ============================================================
#  VELA / ARIA - One-click deploy button (macOS / Linux)
#  Run:  ./deploy.sh
#  Pushes your changes; Vercel auto-builds and deploys.
# ============================================================
set -e
cd "$(dirname "$0")"

echo ""
echo "===================================================="
echo "   VELA / ARIA  -  One-click Deploy"
echo "===================================================="
echo ""

echo "[1/2] Saving and pushing your changes to GitHub..."
git add -A
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M:%S')" || echo "   (nothing new to commit - pushing current state)"

if ! git push origin main; then
  echo ""
  echo " Push failed. If this is the first push, run once:"
  echo "    git remote add origin https://github.com/sahiljeebun132-dev/Curtin-Hackathon.git"
  exit 1
fi

echo ""
echo "[2/2] Done. Vercel will build and deploy automatically."
echo "   Watch progress at: https://vercel.com/asherrs-projects"
echo ""
