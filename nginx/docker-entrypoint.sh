#!/bin/sh
set -e

# Create necessary directories with proper permissions
mkdir -p /run/nginx
chown -R nginx:nginx /run/nginx
chmod -R 755 /run/nginx

# Fix permissions for Nginx runtime files
chown -R nginx:nginx /var/cache/nginx
chown -R nginx:nginx /var/log/nginx
chmod -R 755 /var/cache/nginx
chmod -R 755 /var/log/nginx

# Fix permissions for application files
chown -R nginx:nginx /usr/share/nginx/html
chmod -R 755 /usr/share/nginx/html

# Start Nginx as non-root user
exec nginx -g 'daemon off;'
