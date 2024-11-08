# Stage 1: Build the project
FROM node:18 AS build

WORKDIR /app

COPY . .

# Install dependencies and generate Prisma client
RUN npm install

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Run production environment
FROM node:18 AS production

WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Install only production dependencies
RUN npm prune --production

# Expose the port Express is running on
EXPOSE 3000

# Command to run the server in production
CMD ["node", "dist/server.js"]
