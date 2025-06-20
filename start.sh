#!/bin/bash

echo "🚀 Starting POS Server..."

# Kill existing server processes
echo "📍 Checking for existing processes..."
pkill -f "node dist/index.js" 2>/dev/null && echo "✅ Killed existing server" || echo "ℹ️  No existing server found"

# Wait a moment
sleep 2

# Build and start
echo "🔨 Building project..."
npm run build

echo "🌟 Starting server on port 3001..."
npm start

echo "🎯 Server should be available at http://localhost:3001"
echo "📊 Health check: http://localhost:3001/health"
echo "📱 API: http://localhost:3001/api" 