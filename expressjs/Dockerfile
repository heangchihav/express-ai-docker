FROM node:18

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install
RUN npx prisma generate

# Then copy the rest of the application
COPY . .

# Start the application
CMD ["npm", "start"]