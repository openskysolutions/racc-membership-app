#!/bin/bash

# Job Board Feature Setup Script
# This script installs dependencies and sets up the job board feature

echo "================================================"
echo "RACC Job Board Feature Setup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to ghl-api directory
echo -e "${BLUE}📁 Navigating to ghl-api directory...${NC}"
cd ghl-api || { echo "Error: ghl-api directory not found"; exit 1; }

# Install multer for file uploads
echo -e "\n${BLUE}📦 Installing multer for file uploads...${NC}"
npm install multer @types/multer

# Create upload directory
echo -e "\n${BLUE}📂 Creating upload directories...${NC}"
mkdir -p public/uploads/resumes
chmod 755 public/uploads/resumes
echo -e "${GREEN}✓ Upload directory created: public/uploads/resumes${NC}"

# Run Prisma migration
echo -e "\n${BLUE}🗄️  Running database migration...${NC}"
npx prisma migrate dev --name add_jobs_feature

# Generate Prisma Client
echo -e "\n${BLUE}🔧 Generating Prisma Client...${NC}"
npx prisma generate

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✓ Job Board Feature Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Restart your backend server: npm run dev"
echo "2. Navigate to http://localhost:5173/jobs to view the job board"
echo "3. Login as an active member to post jobs"
echo ""
echo -e "${BLUE}Documentation: docs/JOB_BOARD_FEATURE.md${NC}"
echo ""
