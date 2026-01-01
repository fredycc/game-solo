# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose the application port
EXPOSE 3005

# Define environment variables
ENV NODE_ENV=production
ENV PORT=3005

# Start the server
CMD ["npm", "run", "server"]
