# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV REACT_APP_API_URL=https://gideons-tech-suite.onrender.com/api/v1
ENV REACT_APP_WS_URL=wss://gideons-tech-suite.onrender.com/ws

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Install bash for debugging
RUN apk add --no-cache bash

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /docker-entrypoint.sh

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chmod 755 /var/cache/nginx /var/log/nginx /var/run /run

# Create necessary directories
RUN mkdir -p /run/nginx && \
    chown -R nginx:nginx /run/nginx && \
    chmod -R 755 /run/nginx

# Run as non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Start nginx using the entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
