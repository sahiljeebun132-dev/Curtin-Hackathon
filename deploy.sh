#!/usr/bin/env bash
# ============================================================
#  VELA / ARIA - One-click deploy button (macOS / Linux)
#  Run:  ./deploy.sh
#  First run sets up git + remote; later runs just push.
#  Vercel auto-deploys the push.
# ============================================================
set -e
cd "$(dirname "$0")"

echo ""
echo "===================================================="
echo "   VELA / ARIA  -  One-click Deploy"
echo "===================================================="
echo ""

# 1. Healthy git repo?
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[setup] Initialising a fresh git repository..."
  rm -rf .git
  git init
  git branch -M main
fi

# 2. Remote set?
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "[setup] Linking GitHub remote..."
  git remote add origin https://github.com/sahiljeebun132-dev/Curtin-Hackathon.git
fi

# 3. Commit + push
echo "[1/2] Saving and pushing your changes..."
git add -A
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M:%S')" || echo "   (nothing new to commit - pushing current state)"
git push -u origin main

echo ""
echo "[2/2] Pushed. Vercel will build and deploy automatically."
echo "   Live dashboard: https://vercel.com/asherrs-projects"
echo ""
