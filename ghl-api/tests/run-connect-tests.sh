#!/bin/bash

# Quick Start Script for Connect Account Flow Tests
# This script helps you run the tests with proper setup

# Don't exit on error for curl commands - we want to handle them gracefully
set +e

echo "🚀 RACC Connect Account Flow Tests - Quick Start"
echo "=================================================="
echo ""

# Detect the backend port (try 3000 first, then 3001)
BACKEND_PORT=""
if curl -s http://localhost:3000/api/auth/test-email > /dev/null 2>&1; then
    BACKEND_PORT=3000
elif curl -s http://localhost:3001/api/auth/test-email > /dev/null 2>&1; then
    BACKEND_PORT=3001
fi

# Check if backend is running
echo "Checking if backend is running..."
if [ -z "$BACKEND_PORT" ]; then
    echo "❌ Backend is not running on http://localhost:3000 or :3001"
    echo ""
    echo "Please start the backend first:"
    echo "  cd ghl-api"
    echo "  npm run dev"
    echo ""
    echo "Note: The backend needs these environment variables configured:"
    echo "  - EMAIL_PROVIDER, EMAIL_USER, EMAIL_PASS (for sending emails)"
    echo "  - PRIVATE_INTEGRATION_TOKEN, LOCATION_ID (for GoHighLevel)"
    echo ""
    echo "These should be in ghl-api/.env (not the test .env.test file)"
    exit 1
fi
echo "✅ Backend is running on port $BACKEND_PORT"
echo ""

# Update API_URL for the test script
export API_URL="http://localhost:$BACKEND_PORT/api"

# Test email service configuration
echo "Testing email service..."
EMAIL_TEST_RESULT=$(curl -s "http://localhost:$BACKEND_PORT/api/auth/test-email")
if echo "$EMAIL_TEST_RESULT" | grep -q "configured correctly"; then
    echo "✅ Email service is configured"
    PROVIDER=$(echo "$EMAIL_TEST_RESULT" | grep -o '"provider":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$PROVIDER" ]; then
        echo "   Provider: $PROVIDER"
    fi
else
    echo "⚠️  Email service may not be configured properly"
    echo "   Response: $EMAIL_TEST_RESULT"
    echo ""
    echo "   Check ghl-api/.env for EMAIL_* variables"
    echo ""
fi
echo ""

# Check for .env.test file (optional for test email)
if [ -f ".env.test" ]; then
    echo "✅ Found .env.test file"
    echo "Loading test email configuration..."
    set -a  # Export all variables
    source .env.test
    set +a
    
    if [ -n "$TEST_EMAIL" ]; then
        echo "   Test email: $TEST_EMAIL"
    fi
    echo ""
else
    echo "ℹ️  No .env.test file found (optional)"
    echo ""
    echo "   .env.test is only needed for automated mode."
    echo "   Interactive mode will prompt for email."
    echo ""
    echo "   To create .env.test:"
    echo "   cp .env.test.example .env.test"
    echo ""
fi

# Ask user which mode to run
echo "Select test mode:"
echo "  1) Interactive (recommended - prompts for email)"
echo "  2) Automated (requires TEST_EMAIL environment variable)"
echo ""
read -p "Enter choice [1-2]: " choice
echo ""

case $choice in
    1)
        echo "🎯 Running in INTERACTIVE mode..."
        echo "You will be prompted to enter a real email address."
        echo ""
        node connect-account-flow.test.js interactive
        ;;
    2)
        if [ -z "$TEST_EMAIL" ]; then
            echo "❌ TEST_EMAIL environment variable is required for automated mode"
            echo ""
            read -p "Enter test email address: " email
            echo ""
            TEST_EMAIL="$email" node connect-account-flow.test.js automated
        else
            echo "🎯 Running in AUTOMATED mode..."
            echo "Using email: $TEST_EMAIL"
            echo ""
            node connect-account-flow.test.js automated
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Test run complete!"
echo ""
