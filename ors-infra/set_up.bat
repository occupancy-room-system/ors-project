@echo off
setlocal enabledelayedexpansion

title ORS Project - Developer Environment Setup

echo ===================================================================
echo       ORS Project Developer Environment Setup (Windows)
echo ===================================================================
echo This script installs and verifies all requirements from scratch:
echo   [1] Git
echo   [2] Java Development Kit (JDK 21 LTS)
echo   [3] Apache Maven
echo   [4] Node.js (LTS) ^& npm
echo   [5] Docker Desktop ^& Docker Compose
echo ===================================================================
echo.

set PASS=0
set FAIL=0

:: Check winget
where winget >nul 2>nul
if %errorlevel% neq 0 (
    echo [FAIL] 'winget' (Windows Package Manager) is missing.
    echo Please install 'App Installer' from the Microsoft Store or update Windows.
    pause
    exit /b 1
)

:: ---------------------------------------------------------------------
:: 1. Git
:: ---------------------------------------------------------------------
echo ==> 1/5 Checking Git...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing Git for Windows...
    winget install --id Git.Git -e --silent --accept-source-agreements --accept-package-agreements
) else (
    echo   [SKIP] Git is already present.
)

:: ---------------------------------------------------------------------
:: 2. Java 21 LTS
:: ---------------------------------------------------------------------
echo.
echo ==> 2/5 Checking Java 21 LTS...
set NEED_JAVA=1
for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set JAVA_VER=%%~g
    set JAVA_VER=!JAVA_VER:~0,2!
    if "!JAVA_VER!"=="21" set NEED_JAVA=0
)

if "!NEED_JAVA!"=="1" (
    echo [INFO] Installing Eclipse Temurin JDK 21 LTS...
    winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-source-agreements --accept-package-agreements
) else (
    echo   [SKIP] Java 21 LTS is already present.
)

:: ---------------------------------------------------------------------
:: 3. Apache Maven
:: ---------------------------------------------------------------------
echo.
echo ==> 3/5 Checking Apache Maven...
where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing Apache Maven...
    winget install --id Apache.Maven -e --silent --accept-source-agreements --accept-package-agreements
) else (
    echo   [SKIP] Apache Maven is already present.
)

:: ---------------------------------------------------------------------
:: 4. Node.js (LTS) & npm
:: ---------------------------------------------------------------------
echo.
echo ==> 4/5 Checking Node.js (LTS) ^& npm...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing Node.js LTS...
    winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
) else (
    echo   [SKIP] Node.js is already present.
)

:: ---------------------------------------------------------------------
:: 5. Docker Desktop
:: ---------------------------------------------------------------------
echo.
echo ==> 5/5 Checking Docker Desktop...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing Docker Desktop...
    winget install --id Docker.DockerDesktop -e --silent --accept-source-agreements --accept-package-agreements
    echo [NOTE] Please restart your computer after installation to enable WSL2/Hyper-V.
) else (
    echo   [SKIP] Docker is already present.
)

:: ---------------------------------------------------------------------
:: Verification Matrix (PASS / FAIL check)
:: ---------------------------------------------------------------------
echo.
echo ===================================================================
echo                    VERIFYING ALL REQUIREMENTS
echo ===================================================================

where git >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('git --version 2^>nul') do echo   [PASS] Git: %%v
    set /a PASS+=1
) else (
    echo   [FAIL] Git: Not found on PATH
    set /a FAIL+=1
)

where java >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do echo   [PASS] Java: %%v
    set /a PASS+=1
) else (
    echo   [FAIL] Java: Not found on PATH
    set /a FAIL+=1
)

where mvn >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('mvn -version 2^>nul ^| findstr /i "Apache Maven"') do echo   [PASS] Maven: %%v
    set /a PASS+=1
) else (
    echo   [FAIL] Maven: Not found on PATH
    set /a FAIL+=1
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node --version 2^>nul') do echo   [PASS] Node.js: %%v
    set /a PASS+=1
) else (
    echo   [FAIL] Node.js: Not found on PATH
    set /a FAIL+=1
)

where npm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('npm --version 2^>nul') do echo   [PASS] npm: %%v
    set /a PASS+=1
) else (
    echo   [FAIL] npm: Not found on PATH
    set /a FAIL+=1
)

where docker >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('docker --version 2^>nul') do echo   [PASS] Docker: %%v
    set /a PASS+=1
) else (
    echo   [FAIL] Docker: Not found on PATH
    set /a FAIL+=1
)

docker compose version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('docker compose version 2^>nul') do echo   [PASS] Docker Compose: %%v
    set /a PASS+=1
) else (
    echo   [WARN] Docker Compose: Docker daemon not running or compose plugin missing
)

echo ===================================================================
echo Result: !PASS! Passed, !FAIL! Failed
echo ===================================================================

if !FAIL! equ 0 (
    echo [SUCCESS] Your machine is 100%% ready to run the ORS project!
    echo.
    echo Next steps:
    echo   1. Start MySQL:    startInfra.bat
    echo   2. Start Backend:  cd ..\ors-server ^&^& mvn spring-boot:run
    echo   3. Start Frontend: cd ..\ors-frontend ^&^& npm install ^&^& npm run dev
) else (
    echo [WARN] Some tools were newly installed or failed.
    echo Please CLOSE this window, restart your terminal or computer, and run set_up.bat again.
)

echo.
pause
