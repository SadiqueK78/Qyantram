#!/bin/bash

echo "🚀 Quantum Circuit Simulator - Full Stack Setup"
echo "================================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Frontend
echo -e "\n${BLUE}Setting up Frontend...${NC}"
cd frontend > /dev/null 2>&1
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
echo -e "${GREEN}✓ Frontend ready${NC}"
cd .. > /dev/null 2>&1

# Backend
echo -e "\n${BLUE}Setting up Backend...${NC}"
cd backend > /dev/null 2>&1
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
echo -e "${GREEN}✓ Backend ready${NC}"
cd .. > /dev/null 2>&1

echo -e "\n${GREEN}Setup complete!${NC}"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Terminal 2 (Backend):"
echo "  cd backend && source venv/bin/activate && python app.py"
echo ""
echo "Then open: http://localhost:5173"
