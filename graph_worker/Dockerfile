FROM node:latest

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy local code to the container image
COPY . ./

# Build the TypeScript code
RUN npm run build

# Run the service on container startup
CMD ["npm", "start"]
EXPOSE 7000