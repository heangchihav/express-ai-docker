FROM node:18-slim

# Install OpenSSL and curl for Prisma and healthcheck
RUN apt-get update -y && apt-get install -y openssl curl

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser

WORKDIR /app

# Copy package files and prisma schema first
COPY package.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

# Install dependencies, nodemon, typescript, ts-node and clean up
RUN npm install && \
    npm install -g nodemon typescript ts-node && \
    npm cache clean --force && \
    rm -rf /tmp/* ~/.npm

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Set proper permissions
RUN mkdir -p /app/logs && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app/logs && \
    chmod -R 755 /app/node_modules

# Use non-root user
USER appuser

# Define healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application with nodemon
CMD ["npx", "nodemon", "--exec", "ts-node", "src/server.ts"]
