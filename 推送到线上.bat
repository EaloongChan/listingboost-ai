@echo off
REM Push the local site to GitHub. Triggers an automatic Vercel deploy.
REM All logic lives in scripts/deploy-push.mjs so it stays testable.
chcp 65001 >nul
cd /d "%~dp0"
node "scripts\deploy-push.mjs" %*
if errorlevel 1 goto failed
echo.
echo Done. Press any key to close.
pause >nul
exit /b 0
:failed
echo.
echo Push failed. Read the messages above.
pause >nul
exit /b 1
