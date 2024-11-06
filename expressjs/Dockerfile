# Use the latest official Node.js image
FROM node:latest

# Set environment variables
ENV NODE_ENV=production

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies (use --legacy-peer-deps to resolve potential peer dependency issues)
RUN npm install --legacy-peer-deps
RUN npm install -g typescript

# Copy all the application files to the container
COPY . .

# Rebuild bcrypt dependencies for the container's architecture (e.g., ARM or x86)
RUN npm rebuild bcrypt --build-from-source

# Build the TypeScript code (if using TypeScript)
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "docker:start"]
