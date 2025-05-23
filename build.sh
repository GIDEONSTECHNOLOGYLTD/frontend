#!/bin/sh
set -e

# Install dependencies
npm ci

# Build the React app
npm run build

# Create necessary directories
mkdir -p /usr/share/nginx/html

# Copy built files to nginx directory
cp -r build/* /usr/share/nginx/html/

# Make the script executable
chmod +x /docker-entrypoint.sh
