FROM node:15

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install packages
RUN npm install

# Copy the app code
COPY . .

# Build the project
RUN npm run build

# Expose ports
EXPOSE 5000

# Run the application
CMD [ "node", "dist/start.js" ]
