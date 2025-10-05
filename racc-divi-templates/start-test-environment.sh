#!/bin/bash

echo "🚀 Starting RACC Template Test Environment..."
echo ""

# Start Docker containers
echo "📦 Starting WordPress and MySQL containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for WordPress to be ready..."
sleep 30

echo ""
echo "✅ WordPress is starting up!"
echo ""
echo "🌐 Access your test site at: http://localhost:8080"
echo ""
echo "📋 Setup Instructions:"
echo "1. Complete WordPress installation (takes 2-3 minutes)"
echo "2. Install Divi theme (you'll need to download it from ElegantThemes)"
echo "3. Import the RACC template from: $(pwd)/racc-template.json"
echo ""
echo "🛑 To stop the test environment, run: docker-compose down"
echo ""
echo "📁 Upload test files to: $(pwd)/test-uploads/"
echo ""