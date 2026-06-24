@echo off
REM ============================================================
REM  VELA / ARIA - One-click deploy button (Windows)
REM  Double-click this file to push your changes. Vercel then
REM  auto-builds and deploys the new version globally.
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo ====================================================
echo    VELA / ARIA  -  One-click Deploy
echo ====================================================
echo.

echo [1/2] Saving and pushing your changes to GitHub...
git add -A
git commit -m "Deploy %date% %time%" 2>nul || echo    (nothing new to commit - pushing current state)
git push origin main
if errorlevel 1 (
  echo.
  echo  Push failed. If this is the first push, run once:
  echo     git remote add origin https://github.com/sahiljeebun132-dev/Curtin-Hackathon.git
  echo.
  pause
  exit /b 1
)

echo.
echo [2/2] Done. Vercel will build and deploy automatically.
echo    Watch progress at: https://vercel.com/asherrs-projects
echo.
pause
