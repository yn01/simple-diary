FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
