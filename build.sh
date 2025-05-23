#!/bin/sh
set -e

# Set environment variables
export NODE_ENV=production
export REACT_APP_API_URL=https://gideons-tech-suite.onrender.com/api/v1
export REACT_APP_WS_URL=wss://gideons-tech-suite.onrender.com/ws

# Install dependencies with legacy peer deps
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Build the React app
echo "Building application..."
npm run build

# Create necessary directories
mkdir -p /usr/share/nginx/html

# Copy built files to nginx directory
echo "Copying build files..."
cp -r build/* /usr/share/nginx/html/

# Set proper permissions
chmod -R 755 /usr/share/nginx/html/

echo "Build completed successfully!"
