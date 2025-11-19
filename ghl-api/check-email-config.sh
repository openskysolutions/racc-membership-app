#!/bin/bash

# Email Configuration Diagnostic Script
# Run this on the production server to diagnose email issues

echo "========================================"
echo "Email Configuration Diagnostic"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ ERROR: .env file not found!"
  echo "   Expected location: $(pwd)/.env"
  echo ""
  exit 1
fi

echo "✅ .env file found"
echo ""

# Check for required email environment variables
echo "Checking environment variables:"
echo "--------------------------------"

check_var() {
  var_name=$1
  if grep -q "^${var_name}=" .env; then
    value=$(grep "^${var_name}=" .env | cut -d= -f2 | tr -d '"' | tr -d "'")
    if [ -z "$value" ]; then
      echo "⚠️  ${var_name} is set but empty"
    else
      # Mask password/key values
      if [[ "$var_name" == *"PASS"* ]] || [[ "$var_name" == *"KEY"* ]]; then
        echo "✅ ${var_name}=****** (hidden)"
      else
        echo "✅ ${var_name}=${value}"
      fi
    fi
  else
    echo "❌ ${var_name} is NOT set"
  fi
}

check_var "EMAIL_PROVIDER"
check_var "EMAIL_FROM"
check_var "EMAIL_FROM_NAME"
check_var "SMTP_HOST"
check_var "SMTP_PORT"
check_var "SMTP_USER"
check_var "SMTP_PASS"
check_var "SMTP_SECURE"

echo ""
echo "Testing API endpoint:"
echo "--------------------------------"

# Test the email configuration endpoint
BACKEND_PORT=$(grep "^BACKEND_PORT=" .env | cut -d= -f2 | tr -d '"' | tr -d "'" || echo "5005")
API_URL="http://localhost:${BACKEND_PORT}/api/auth/test-email"

echo "Testing: ${API_URL}"
RESPONSE=$(curl -s "${API_URL}")

if echo "$RESPONSE" | grep -q "configured correctly"; then
  echo "✅ Email service is working!"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo "❌ Email service test failed!"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "Testing SMTP connection:"
echo "--------------------------------"

SMTP_HOST=$(grep "^SMTP_HOST=" .env | cut -d= -f2 | tr -d '"' | tr -d "'")
SMTP_PORT=$(grep "^SMTP_PORT=" .env | cut -d= -f2 | tr -d '"' | tr -d "'" || echo "587")

if [ ! -z "$SMTP_HOST" ]; then
  echo "Testing connection to ${SMTP_HOST}:${SMTP_PORT}..."
  if timeout 5 bash -c "echo > /dev/tcp/${SMTP_HOST}/${SMTP_PORT}" 2>/dev/null; then
    echo "✅ Can connect to SMTP server"
  else
    echo "❌ Cannot connect to SMTP server"
    echo "   This could mean:"
    echo "   - SMTP server is down"
    echo "   - Firewall blocking port ${SMTP_PORT}"
    echo "   - Incorrect SMTP_HOST value"
  fi
else
  echo "⚠️  SMTP_HOST not set - skipping connection test"
fi

echo ""
echo "========================================"
echo "Diagnostic Complete"
echo "========================================"
