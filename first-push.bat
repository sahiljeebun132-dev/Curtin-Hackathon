@echo off
REM ============================================================
REM  VELA / ARIA - FIRST-TIME publish (run this ONCE)
REM  The GitHub repo was created with a starter file, so your
REM  local project and the remote diverged. This uploads your
REM  project and replaces that empty starter. After this works,
REM  use deploy.bat from now on.
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo ====================================================
echo    VELA / ARIA  -  First-time publish (one-time)
echo ====================================================
echo.
echo This replaces the empty starter repo on GitHub with your
echo local project. Only run this the first time.
echo.
pause

REM Make sure git + remote exist (in case run before deploy.bat)
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  if exist ".git" rmdir /s /q ".git"
  git init
  git branch -M main
)
git remote get-url origin >nul 2>&1 || git remote add origin https://github.com/sahiljeebun132-dev/Curtin-Hackathon.git

git add -A
git commit -m "VELA/ARIA POC: deterministic risk engine + React UI (Game of Code 2026)" 2>nul

echo Publishing (overwriting the empty starter)...
git push -u origin main --force-with-lease
if errorlevel 1 (
  echo Retrying with a full overwrite...
  git push -u origin main --force
)

echo.
echo Done. Your code is now on GitHub. From now on, just use deploy.bat.
echo.
pause
