#!/bin/bash

# 180Connect Local Development Setup Script

echo "🚀 Starting 180Connect Local Development Environment"
echo "=================================================="

# Kill any existing processes on ports 8000 and 5173
echo "🧹 Cleaning up existing processes..."
pkill -f "uvicorn.*8000" 2>/dev/null || true
pkill -f "vite.*5173" 2>/dev/null || true
sleep 2

# Backend setup
echo "🔧 Setting up backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🎯 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/lib/python*/site-packages/fastapi" ]; then
    echo "📚 Installing backend dependencies..."
    pip install -r requirements.txt
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << 'EOF'
# Local Development Database
RENDER_DATABASE_URL=postgresql://localhost/180connect_dev

# Email Configuration
GMAIL_SENDER=sheffield@180dc.org
GMAIL_APP_PASSWORD=bbbw xluh mbfq qosn

# API Keys
CHARITYBASE_API_KEY=ef7f40fe-ca6c-40fb-a7b7-4bcd0ca1ee80
COMPANIES_HOUSE_API_KEY=5fe6b853-a006-4590-95b3-f4eda143a123

# Security
SECRET_KEY=your_very_secret_key_for_local_development

# Google OAuth
GOOGLE_CLIENT_ID=197447102347-ustgcqknmtt21akdst1fh8vqvpef7ia1.apps.googleusercontent.com
EOF
fi

# Start backend
echo "🌟 Starting FastAPI backend on port 8000..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Frontend setup
cd ../frontend
echo "🎨 Setting up frontend..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📚 Installing frontend dependencies..."
    npm install
fi

# Check if .env.development exists
if [ ! -f ".env.development" ]; then
    echo "⚙️  Creating frontend .env.development..."
    cat > .env.development << 'EOF'
VITE_API_URL=http://localhost:8000
EOF
fi

# Start frontend
echo "🌟 Starting React frontend on port 5173..."
npm run dev &
FRONTEND_PID=$!

# Wait for both to start
sleep 5

echo ""
echo "✅ Local development environment is ready!"
echo "========================================="
echo "🔗 Frontend: http://localhost:5173"
echo "🔗 Backend:  http://localhost:8000"
echo "🔗 API Docs: http://localhost:8000/docs"
echo ""
echo "📝 To stop the development servers:"
echo "   pkill -f 'uvicorn.*8000'"
echo "   pkill -f 'vite.*5173'"
echo ""

# Test backend
echo "🧪 Testing backend connection..."
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding"
fi

# Test frontend
echo "🧪 Testing frontend connection..."
if curl -s http://localhost:5173/ > /dev/null; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 Development environment is ready! Start coding!"

# Keep script running to show logs
wait
