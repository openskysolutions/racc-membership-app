#!/bin/bash

# Quick test script to verify the Job Board API is working

API_URL="http://localhost:3000/api"

echo "================================================"
echo "Job Board API Quick Test"
echo "================================================"
echo ""

# Test 1: Check if API is running
echo "1. Testing API health check..."
response=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL%/api}/health)
if [ "$response" = "200" ]; then
    echo "   ✅ API is running"
else
    echo "   ❌ API is not responding (HTTP $response)"
    echo "   Please start the backend: cd ghl-api && npm run dev"
    exit 1
fi

# Test 2: Try to fetch jobs (should work even if empty)
echo ""
echo "2. Testing GET /api/jobs (public endpoint)..."
response=$(curl -s -w "\n%{http_code}" "$API_URL/jobs")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo "   ✅ Jobs endpoint is accessible"
    job_count=$(echo "$body" | grep -o '"jobs":\[' | wc -l)
    if [ "$job_count" -gt 0 ]; then
        total=$(echo "$body" | grep -o '"total":[0-9]*' | cut -d: -f2)
        echo "   📊 Found $total job(s) in database"
    else
        echo "   📊 No jobs in database yet (this is normal)"
    fi
else
    echo "   ❌ Failed to fetch jobs (HTTP $http_code)"
    echo "   Response: $body"
fi

# Test 3: Check if database tables exist
echo ""
echo "3. Checking database tables..."
cd ghl-api 2>/dev/null
if [ -f "node_modules/.bin/prisma" ]; then
    echo "   ℹ️  To verify tables, run: cd ghl-api && npx prisma studio"
    echo "   Then look for 'jobs' and 'job_applications' tables"
else
    echo "   ⚠️  Prisma not found in ghl-api directory"
fi

echo ""
echo "================================================"
echo "✅ Basic API tests complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Start frontend: npm run dev"
echo "2. Navigate to: http://localhost:5173/jobs"
echo "3. Login as active member to post a job"
echo ""
echo "📚 Full documentation: docs/JOB_BOARD_FEATURE.md"
