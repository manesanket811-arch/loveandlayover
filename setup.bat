@echo off
REM Love and Layovers - Setup Script for Windows

setlocal enabledelayedexpansion

echo ======================================
echo Love and Layovers - Setup Script
echo ======================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.
    exit /b 1
) else (
    echo [OK] Python found
)

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] AWS CLI not found. Installing...
    pip install awscli
) else (
    echo [OK] AWS CLI found
)

REM Check if SAM CLI is installed
sam --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] SAM CLI not found. Installing...
    pip install aws-sam-cli
) else (
    echo [OK] SAM CLI found
)

REM Install Python dependencies
echo.
echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed

REM Create directories
echo.
echo Creating directories...
if not exist "itineraries\singapore" mkdir itineraries\singapore
if not exist "itineraries\tokyo" mkdir itineraries\tokyo
if not exist "itineraries\bali" mkdir itineraries\bali
if not exist "assets\images" mkdir assets\images
if not exist "assets\fonts" mkdir assets\fonts
if not exist "assets\css" mkdir assets\css
if not exist ".aws-sam\build" mkdir .aws-sam\build
echo [OK] Directories created

REM Create .env file
echo.
if not exist ".env" (
    echo Creating .env file...
    (
        echo # Love and Layovers Environment Variables
        echo.
        echo # AWS Configuration
        echo AWS_REGION=us-east-1
        echo AWS_PROFILE=default
        echo.
        echo # API Endpoint
        echo API_ENDPOINT=http://localhost:3000/api
        echo.
        echo # Email Configuration
        echo SES_VERIFIED_EMAIL=hello@loveandlayovers.com
        echo SES_REGION=us-east-1
        echo.
        echo # Database
        echo SUBSCRIBERS_TABLE=love-and-layovers-subscribers
        echo CONTACTS_TABLE=love-and-layovers-contacts
        echo DOWNLOADS_TABLE=love-and-layovers-downloads
        echo.
        echo # S3 Buckets
        echo WEBSITE_BUCKET=love-and-layovers-website
        echo ITINERARIES_BUCKET=love-and-layovers-itineraries
        echo.
        echo # YouTube Configuration
        echo YOUTUBE_CHANNEL=@LoveAndLayover
        echo YOUTUBE_API_KEY=YOUR_API_KEY_HERE
        echo.
        echo # Google Analytics
        echo GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
        echo.
        echo # Website Configuration
        echo WEBSITE_URL=https://loveandlayovers.com
        echo WEBSITE_TITLE=Love and Layovers
        echo WEBSITE_DESCRIPTION=Real travel stories, honest tips, and ready-to-use itineraries
    ) > .env
    echo [OK] .env file created
    echo [WARNING] Update .env with your actual values
) else (
    echo [OK] .env file already exists
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next Steps:
echo.
echo 1. Update .env with your values
echo.
echo 2. Test website locally:
echo    python -m http.server 8000
echo    Then open http://localhost:8000
echo.
echo 3. Deploy to AWS:
echo    Read AWS_DEPLOYMENT_GUIDE.md
echo.
echo 4. Create itinerary PDFs and upload to S3
echo.
echo See README.md for more information.
echo.

pause
