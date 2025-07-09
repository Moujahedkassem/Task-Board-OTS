# Use official Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Copy frontend package files and install dependencies
COPY apps/frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY apps/frontend/. .

# Copy the shared directory from the project root (for types only)
COPY shared ./shared

# Copy the backend directory for type-only imports (for types only)
COPY apps/backend ./backend

# Build the frontend
RUN npm run build

# Expose the port Vite preview uses (default: 4173)
EXPOSE 4173

# Start the Vite preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]