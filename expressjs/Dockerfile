FROM node:18-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser

WORKDIR /app

# Copy package files and prisma schema first
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies and clean up
RUN npm install && \
    npm cache clean --force && \
    rm -rf /tmp/* ~/.npm

# Copy application code
COPY . .

# Set proper permissions
RUN chown -R appuser:appuser /app

# Use non-root user
USER appuser

# Define healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Set Node to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
