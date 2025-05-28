#!/bin/bash
# Exit on error
set -e

# Install dependencies
echo "Installing dependencies..."
npm install

# Set environment variables
export PUBLIC_URL=/

# Build the app
echo "Building the app..."
npm run build

# Create a _redirects file for SPA routing
echo '/* /index.html 200' > build/_redirects

echo "Build completed successfully!"
