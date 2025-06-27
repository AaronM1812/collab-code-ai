#!/bin/bash

# Collab Code AI Deployment Script
# Usage: ./deploy.sh [local|docker|render|heroku]

set -e

echo "🚀 Collab Code AI Deployment Script"
echo "=================================="

case "$1" in
  "local")
    echo "📦 Deploying locally..."
    
    # Check if MongoDB is running
    if ! pgrep -x "mongod" > /dev/null; then
      echo "⚠️  MongoDB is not running. Starting MongoDB..."
      if command -v docker &> /dev/null; then
        docker run -d -p 27017:27017 --name mongodb mongo:latest
        echo "✅ MongoDB started with Docker"
      else
        echo "❌ Please start MongoDB manually or install Docker"
        exit 1
      fi
    fi
    
    # Start backend
    echo "🔧 Starting backend..."
    cd backend
    npm install
    npm start &
    BACKEND_PID=$!
    cd ..
    
    # Start WebSocket server
    echo "🔌 Starting WebSocket server..."
    cd backend
    node websocket-server.js &
    WEBSOCKET_PID=$!
    cd ..
    
    # Start frontend
    echo "🎨 Starting frontend..."
    cd frontend
    npm install
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    echo "✅ All services started!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend: http://localhost:3001"
    echo "🔌 WebSocket: ws://localhost:1234"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $WEBSOCKET_PID $FRONTEND_PID; exit" INT
    wait
    ;;
    
  "docker")
    echo "🐳 Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
      echo "❌ Docker is not installed"
      exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
      echo "❌ Docker Compose is not installed"
      exit 1
    fi
    
    echo "🔨 Building and starting containers..."
    docker-compose up -d --build
    
    echo "✅ Docker deployment complete!"
    echo "📱 Frontend: http://localhost"
    echo "🔧 Backend: http://localhost:3001"
    echo "🔌 WebSocket: ws://localhost:1234"
    ;;
    
  "render")
    echo "☁️  Deploying to Render..."
    echo "⚠️  Please configure your Render services manually:"
    echo ""
    echo "1. Backend Service:"
    echo "   - Build Command: cd backend && npm install"
    echo "   - Start Command: cd backend && npm start"
    echo "   - Environment Variables: MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, OPENAI_API_KEY"
    echo ""
    echo "2. WebSocket Service:"
    echo "   - Build Command: cd backend && npm install"
    echo "   - Start Command: cd backend && node websocket-server.js"
    echo "   - Environment Variables: Same as backend"
    echo ""
    echo "3. Frontend Static Site:"
    echo "   - Build Command: cd frontend && npm install && npm run build"
    echo "   - Publish Directory: frontend/build"
    echo ""
    echo "4. Update frontend/src/services/api.ts with your Render URLs"
    ;;
    
  "heroku")
    echo "☁️  Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
      echo "❌ Heroku CLI is not installed"
      echo "Install from: https://devcenter.heroku.com/articles/heroku-cli"
      exit 1
    fi
    
    # Create Heroku apps
    echo "🔨 Creating Heroku apps..."
    heroku create collab-code-ai-backend
    heroku create collab-code-ai-frontend
    heroku create collab-code-ai-websocket
    
    # Deploy backend
    echo "🔧 Deploying backend..."
    cd backend
    git init
    git add .
    git commit -m "Deploy backend to Heroku"
    heroku git:remote -a collab-code-ai-backend
    git push heroku main
    cd ..
    
    # Deploy WebSocket server
    echo "🔌 Deploying WebSocket server..."
    cd backend
    heroku git:remote -a collab-code-ai-websocket
    git push heroku main
    cd ..
    
    # Deploy frontend
    echo "🎨 Deploying frontend..."
    cd frontend
    git init
    git add .
    git commit -m "Deploy frontend to Heroku"
    heroku git:remote -a collab-code-ai-frontend
    git push heroku main
    cd ..
    
    echo "✅ Heroku deployment complete!"
    ;;
    
  *)
    echo "❌ Invalid deployment option"
    echo "Usage: ./deploy.sh [local|docker|render|heroku]"
    echo ""
    echo "Options:"
    echo "  local   - Deploy locally with npm"
    echo "  docker  - Deploy with Docker Compose"
    echo "  render  - Instructions for Render deployment"
    echo "  heroku  - Deploy to Heroku"
    exit 1
    ;;
esac 