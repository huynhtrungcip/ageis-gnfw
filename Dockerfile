# ============================================
# Aegis NGFW - Frontend Build
# Multi-stage build for production
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy source code
COPY . .

# Build args for backend URL (injected at build time)
ARG VITE_API_URL="/api"

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:1.27-alpine AS production

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
