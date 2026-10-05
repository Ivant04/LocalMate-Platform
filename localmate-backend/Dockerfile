FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose port (Render automatically provides PORT env)
EXPOSE 8080

CMD ["node", "src/server.js"]
