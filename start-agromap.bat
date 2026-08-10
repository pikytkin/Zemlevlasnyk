@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PORT=3000"
set "HOST=0.0.0.0"
set "LOCAL_URL=http://localhost:%PORT%"
set "PORT_PID="

title AgroMap server

echo.
echo ==========================================
echo   AgroMap local server
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Install Node.js and run this file again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found.
  echo Reinstall Node.js with npm and run this file again.
  echo.
  pause
  exit /b 1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do set "PORT_PID=%%a"
if defined PORT_PID (
  echo Port %PORT% is already used by PID %PORT_PID%.
  echo Checking whether AgroMap is already running...
  echo.
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri '%LOCAL_URL%/api/leaderboard' -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200) { exit 0 } else { exit 2 } } catch { exit 1 }"
  if not errorlevel 1 (
    echo AgroMap is already running. Opening browser...
    echo.
    start "" "%LOCAL_URL%"
    echo You can keep playing. This window can be closed.
    echo.
    pause
    exit /b 0
  )
  echo The port is busy, but this looks like an older server version.
  echo Trying to stop old Node.js process PID %PORT_PID%...
  taskkill /PID %PORT_PID% /F >nul 2>nul
  if errorlevel 1 (
    echo Could not stop PID %PORT_PID% automatically.
    echo Close it in Task Manager or run: taskkill /PID %PORT_PID% /F
    echo.
    pause
    exit /b 1
  )
  timeout /t 2 /nobreak >nul
  set "PORT_PID="
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do set "PORT_PID=%%a"
  if defined PORT_PID (
    echo Port %PORT% is still busy by PID %PORT_PID%.
    echo Close it in Task Manager, then run this file again.
    echo.
    pause
    exit /b 1
  )
  echo Old server stopped. Starting updated AgroMap...
  echo.
)

echo Local address:
echo   %LOCAL_URL%
echo.
echo Network addresses:
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } | ForEach-Object { '  http://' + $_.IPAddress + ':%PORT%' }"
echo.
echo If another device cannot open the game, allow Node.js through Windows Firewall for private networks.
echo.

start "" "%LOCAL_URL%"
echo Server is running in this window. Do not close it while playing.
echo Press Ctrl+C to stop the server.
echo.

call npm start

echo.
echo Server stopped or failed to start.
echo.
pause
