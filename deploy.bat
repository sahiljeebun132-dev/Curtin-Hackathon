@echo off
REM ============================================================
REM  VELA / ARIA - One-click deploy button (Windows)
REM  Double-click to publish. First run sets up git + remote;
REM  every run after just pushes. Vercel auto-deploys the push.
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo ====================================================
echo    VELA / ARIA  -  One-click Deploy
echo ====================================================
echo.

REM --- 1. Make sure we have a healthy git repo ---------------
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo [setup] Initialising a fresh git repository...
  if exist ".git" rmdir /s /q ".git"
  git init
  git branch -M main
)

REM --- 2. Make sure the GitHub remote is set -----------------
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo [setup] Linking GitHub remote...
  git remote add origin https://github.com/sahiljeebun132-dev/Curtin-Hackathon.git
)

REM --- 3. Commit and push -----