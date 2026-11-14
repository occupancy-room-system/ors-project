@echo off
REM ==============================================================================
REM Script: build-and-push-ecr.bat
REM Purpose: Build and push ORS Docker images to Amazon ECR (Windows)
REM ==============================================================================

if "%AWS_ACCOUNT_ID%"=="" (
    echo [ERROR] AWS_ACCOUNT_ID is not set.
    echo Please set it before running:
    echo set AWS_ACCOUNT_ID=123456789012
    echo set AWS_REGION=ap-southeast-1
    exit /b 1
)

if "%AWS_REGION%"=="" set AWS_REGION=ap-southeast-1
if "%IMAGE_TAG%"=="" set IMAGE_TAG=latest
if "%TARGET_PLATFORM%"=="" set TARGET_PLATFORM=linux/amd64
if "%NEXT_PUBLIC_BASE_API%"=="" set NEXT_PUBLIC_BASE_API=http://localhost:8080

set ECR_REGISTRY=%AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com
set SERVER_REPO=ors-server
set FRONTEND_REPO=ors-frontend

echo ======================================================================
echo ORS AWS ECR Deployment Build
echo ======================================================================
echo AWS Region:       %AWS_REGION%
echo AWS Account ID:   %AWS_ACCOUNT_ID%
echo ECR Registry:     %ECR_REGISTRY%
echo Image Tag:        %IMAGE_TAG%
echo ======================================================================

echo [1/5] Authenticating Docker with AWS ECR...
aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %ECR_REGISTRY%
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo [2/5] Verifying ECR repositories...
aws ecr describe-repositories --repository-names %SERVER_REPO% --region %AWS_REGION% >nul 2>&1 || aws ecr create-repository --repository-name %SERVER_REPO% --region %AWS_REGION% >nul
aws ecr describe-repositories --repository-names %FRONTEND_REPO% --region %AWS_REGION% >nul 2>&1 || aws ecr create-repository --repository-name %FRONTEND_REPO% --region %AWS_REGION% >nul

echo [3/5] Building and tagging ors-server image...
docker build --platform %TARGET_PLATFORM% -t %SERVER_REPO%:%IMAGE_TAG% -t %ECR_REGISTRY%/%SERVER_REPO%:%IMAGE_TAG% ./ors-server
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo [4/5] Building and tagging ors-frontend image...
docker build --platform %TARGET_PLATFORM% --build-arg NEXT_PUBLIC_BASE_API=%NEXT_PUBLIC_BASE_API% -t %FRONTEND_REPO%:%IMAGE_TAG% -t %ECR_REGISTRY%/%FRONTEND_REPO%:%IMAGE_TAG% ./ors-frontend
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo [5/5] Pushing images to Amazon ECR...
docker push %ECR_REGISTRY%/%SERVER_REPO%:%IMAGE_TAG%
docker push %ECR_REGISTRY%/%FRONTEND_REPO%:%IMAGE_TAG%

echo ======================================================================
echo Successfully built and pushed ORS images to Amazon ECR!
echo ======================================================================

