@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "COMMIT_MSG=%~1"
if not defined COMMIT_MSG set "COMMIT_MSG=Update game"

echo.
echo === Zemlevlasnyk: local changes ===
git status --short
if errorlevel 1 exit /b 1

echo.
echo === Adding files ===
git add .
if errorlevel 1 exit /b 1

git diff --cached --quiet
if errorlevel 1 (
  echo.
  echo === Commit ===
  git commit -m "%COMMIT_MSG%"
  if errorlevel 1 exit /b 1

  echo.
  echo === Push to GitHub ===
  git push
  if errorlevel 1 exit /b 1
) else (
  echo.
  echo No local changes to commit. Updating server from GitHub anyway.
)

echo.
echo === Deploy on server ===
ssh root@149.5.209.150 "cd /var/www/Zemlevlasnyk && git pull --ff-only && bash deploy-server.sh"
if errorlevel 1 exit /b 1

echo.
echo Done. Open https://zemlevlasnyk.com
pause
