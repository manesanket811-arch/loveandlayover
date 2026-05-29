#!/bin/bash

# Love and Layovers - Setup Script
# This script helps set up the project locally and prepare for AWS deployment

set -e  # Exit on any error

echo "======================================"
echo "Love and Layovers - Setup Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${YELLOW}AWS CLI not found. Installing...${NC}"
        pip install awscli
    else
        echo -e "${GREEN}✓ AWS CLI found${NC}"
    fi
}

# Check if SAM CLI is installed
check_sam_cli() {
    if ! command -v sam &> /dev/null; then
        echo -e "${YELLOW}SAM CLI not found. Installing...${NC}"
        pip install aws-sam-cli
    else
        echo -e "${GREEN}✓ SAM CLI found${NC}"
    fi
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}Python 3 not found. Please install Python 3.${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ Python 3 found${NC}"
    fi
}

# Install Python dependencies
install_dependencies() {
    echo -e "${BLUE}Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Create .env file for local development
create_env_file() {
    if [ ! -f .env ]; then
        echo -e "${BLUE}Creating .env file...${NC}"
        cat > .env << EOF
# Love and Layovers Environment Variables

# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=default

# API Endpoint (set after AWS deployment)
API_ENDPOINT=http://localhost:3000/api

# Email Configuration
SES_VERIFIED_EMAIL=hello@loveandlayovers.com
SES_REGION=us-east-1

# Database Tables
SUBSCRIBERS_TABLE=love-and-layovers-subscribers
CONTACTS_TABLE=love-and-layovers-contacts
DOWNLOADS_TABLE=love-and-layovers-downloads

# S3 Buckets
WEBSITE_BUCKET=love-and-layovers-website
ITINERARIES_BUCKET=love-and-layovers-itineraries

# YouTube Configuration
YOUTUBE_CHANNEL=@LoveAndLayover
YOUTUBE_API_KEY=YOUR_API_KEY_HERE

# Google Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Website Configuration
WEBSITE_URL=https://loveandlayovers.com
WEBSITE_TITLE=Love and Layovers
WEBSITE_DESCRIPTION=Real travel stories, honest tips, and ready-to-use itineraries
EOF
        echo -e "${GREEN}✓ .env file created${NC}"
        echo -e "${YELLOW}Note: Update .env with your actual values${NC}"
    else
        echo -e "${GREEN}✓ .env file already exists${NC}"
    fi
}

# Create directories
create_directories() {
    echo -e "${BLUE}Creating directories...${NC}"
    mkdir -p itineraries/{singapore,tokyo,bali}
    mkdir -p assets/{images,fonts,css}
    mkdir -p .aws-sam/build
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Display next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN}======================================"
    echo "Setup Complete! ✓"
    echo "======================================${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo ""
    echo "1. Update .env file with your values:"
    echo "   - GOOGLE_ANALYTICS_ID"
    echo "   - YOUTUBE_API_KEY (if using YouTube integration)"
    echo "   - AWS configuration"
    echo ""
    echo "2. Test website locally:"
    echo "   python -m http.server 8000"
    echo "   Then open http://localhost:8000"
    echo ""
    echo "3. Deploy to AWS:"
    echo "   Follow instructions in AWS_DEPLOYMENT_GUIDE.md"
    echo ""
    echo "4. Create itinerary PDFs:"
    echo "   Place PDFs in the itineraries/ folder"
    echo "   Then upload to S3"
    echo ""
    echo -e "${YELLOW}See AWS_DEPLOYMENT_GUIDE.md for detailed instructions.${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    check_python
    check_aws_cli
    check_sam_cli
    echo ""

    install_dependencies
    echo ""

    create_directories
    echo ""

    create_env_file
    echo ""

    show_next_steps
}

# Run main function
main
