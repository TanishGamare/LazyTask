#!/bin/bash
# Lazytask - Run Script

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r backend/requirements.txt

# Run the app
echo ""
echo "🍵 Starting Lazytask..."
echo ""
cd backend
python app.py
