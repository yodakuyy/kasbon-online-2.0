@echo off
echo ========================================
echo   Kasbon Online 2.0 - Git Push Tool
echo ========================================
echo.

:: Set variables
set REPO_URL=https://github.com/yodakuyy/kasbon-online-2.0.git

:: Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in PATH.
    pause
    exit /b
)

:: Initialize git if not exists
if not exist .git (
    echo [1/5] Initializing local Git repository...
    git init
    git remote add origin %REPO_URL%
) else (
    echo [1/5] Local Git repository already exists.
    echo       Updating remote origin...
    git remote remove origin >nul 2>&1
    git remote add origin %REPO_URL%
)

:: Add all changes
echo [2/5] Adding files to staging...
git add .

:: Ask for commit message
set /p msg="[3/5] Enter commit message (leave blank for default): "
if "%msg%"=="" set msg=Modernize Kasbon Online 2.0 UI/UX with Multi-step Form and Dashboard

:: Commit
echo [4/5] Committing changes...
git commit -m "%msg%"

:: Push
echo [5/5] Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo   SUCCESS: Code pushed to GitHub!
echo ========================================
pause
