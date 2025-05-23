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

# Create necessary directories with correct permissions
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx /var/lib/nginx/tmp && \
    chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx /var/lib/nginx/tmp && \
    chmod -R 755 /var/cache/nginx /var/run /var/log/nginx /var/lib/nginx/tmp

# Create temp directories for nginx
RUN mkdir -p /tmp/nginx && \
    chown -R nginx:nginx /tmp/nginx && \
    chmod -R 755 /tmp/nginx

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Run as non-root user
USER nginx

# Expose port 8080
EXPOSE 8080

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
