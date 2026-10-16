@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo        Starting ORS Infrastructure (MySQL DB)
echo ====================================================

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please install Docker Desktop and start it before running this script.
    pause
    exit /b 1
)

docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Docker daemon is not running.
    echo Attempting to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker daemon to initialize...
    timeout /t 10 /nobreak >nul
)

cd /d "%~dp0"

for /f %%i in ('docker ps -q -f "name=^/ors-db$"') do set RUNNING_ID=%%i
if not defined RUNNING_ID (
    for /f %%i in ('docker ps -q -f "name=^ors-db$"') do set RUNNING_ID=%%i
)

if defined RUNNING_ID (
    echo [OK] Container 'ors-db' is already running.
) else (
    for /f %%i in ('docker ps -a -q -f "name=^/ors-db$"') do set EXISTING_ID=%%i
    if not defined EXISTING_ID (
        for /f %%i in ('docker ps -a -q -f "name=^ors-db$"') do set EXISTING_ID=%%i
    )
    if defined EXISTING_ID (
        echo [INFO] Starting stopped container 'ors-db'...
        docker start ors-db
    ) else (
        echo [INFO] Creating persistent volume 'occupancy_mysql_data'...
        docker volume create occupancy_mysql_data >nul 2>nul
        echo [INFO] Creating and launching new 'ors-db' container...
        docker run -d --name ors-db --restart unless-stopped -p 3307:3306 -e MYSQL_ROOT_PASSWORD=ors2026 -e MYSQL_DATABASE=orsdb -v occupancy_mysql_data:/var/lib/mysql mysql:latest
    )
)

echo [INFO] Waiting for MySQL container to become ready...
set /a count=0
:WAIT_LOOP
docker exec ors-db mysqladmin -u root -pors2026 ping >nul 2>nul
if %errorlevel% equ 0 (
    goto MYSQL_READY
)
set /a count+=1
if %count% geq 30 (
    echo [ERROR] MySQL took too long to start. Check: docker logs ors-db
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul
goto WAIT_LOOP

:MYSQL_READY
docker exec ors-db mysql -u root -pors2026 -e "CREATE DATABASE IF NOT EXISTS orsdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>nul

echo ====================================================
echo      MySQL Database is UP and READY!
echo ====================================================
echo Host:      localhost
echo Port:      3307
echo Database:  orsdb
echo Username:  root
echo Password:  ors2026
echo Volume:    occupancy_mysql_data
echo Container: ors-db
echo ====================================================
pause
