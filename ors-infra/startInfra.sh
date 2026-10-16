#!/usr/bin/env bash

# ==============================================================================
# ORS Infrastructure - Start MySQL Database Container
# Usage: ./startInfra.sh
# ==============================================================================

set -e

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}       Starting ORS Infrastructure (MySQL DB)       ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker is not installed or not in PATH.${NC}"
    echo -e "Please install Docker Desktop and start it before running this script."
    exit 1
fi

# 2. Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}[WARNING] Docker daemon is not running.${NC}"
    echo -e "Attempting to start Docker Desktop..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker || true
    elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32" ]]; then
        powershell.exe -Command "Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'" || true
    fi

    echo "Waiting for Docker daemon to initialize..."
    retries=30
    while ! docker info >/dev/null 2>&1 && [ $retries -gt 0 ]; do
        sleep 2
        retries=$((retries - 1))
        echo -n "."
    done
    echo ""

    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}[ERROR] Docker daemon could not be reached.${NC}"
        echo "Please open Docker Desktop manually and wait until it is ready."
        exit 1
    fi
fi

# 3. Check if container 'ors-db' is already running, stopped, or needs creation
RUNNING_CONTAINER=$(docker ps -q -f name=^/ors-db$ || docker ps -q -f name=^ors-db$ || true)
EXISTING_CONTAINER=$(docker ps -a -q -f name=^/ors-db$ || docker ps -a -q -f name=^ors-db$ || true)

if [ -n "$RUNNING_CONTAINER" ]; then
    echo -e "${GREEN}[OK] Container 'ors-db' is already running.${NC}"
elif [ -n "$EXISTING_CONTAINER" ]; then
    echo -e "${YELLOW}[INFO] Starting existing stopped container 'ors-db'...${NC}"
    docker start ors-db
else
    echo -e "${BLUE}[INFO] Creating persistent volume 'occupancy_mysql_data'...${NC}"
    docker volume create occupancy_mysql_data >/dev/null 2>&1 || true

    echo -e "${BLUE}[INFO] Creating and launching new 'ors-db' container...${NC}"
    docker run -d \
        --name ors-db \
        --restart unless-stopped \
        -p 3307:3306 \
        -e MYSQL_ROOT_PASSWORD=ors2026 \
        -e MYSQL_DATABASE=orsdb \
        -v occupancy_mysql_data:/var/lib/mysql \
        mysql:latest
fi

# 4. Wait for MySQL to become ready
echo -e "${BLUE}[INFO] Waiting for MySQL service on port 3307 to be ready...${NC}"
max_attempts=30
attempt=1

until docker exec ors-db mysqladmin -u root -pors2026 ping >/dev/null 2>&1 || [ $attempt -gt $max_attempts ]; do
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done
echo ""

if [ $attempt -gt $max_attempts ]; then
    echo -e "${RED}[ERROR] MySQL container started, but failed readiness check after $((max_attempts * 2)) seconds.${NC}"
    echo "Check logs with: docker logs ors-db"
    exit 1
fi

# 5. Ensure 'orsdb' database exists
docker exec ors-db mysql -u root -pors2026 -e "CREATE DATABASE IF NOT EXISTS orsdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >/dev/null 2>&1 || true

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}     MySQL Database is UP and READY!                ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Host:      ${YELLOW}localhost${NC}"
echo -e "Port:      ${YELLOW}3307${NC} (mapped from container 3306)"
echo -e "Database:  ${YELLOW}orsdb${NC}"
echo -e "Username:  ${YELLOW}root${NC}"
echo -e "Password:  ${YELLOW}ors2026${NC}"
echo -e "Volume:    ${YELLOW}occupancy_mysql_data${NC}"
echo -e "Container: ${YELLOW}ors-db${NC}"
echo -e "${GREEN}====================================================${NC}"
