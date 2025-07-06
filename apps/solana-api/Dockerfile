# Stage 1: Build the application
# Using node:20-slim for better native module compatibility than alpine
FROM node:20-slim AS builder

# Set working directory to the root for the monorepo context
WORKDIR /app

# Copy root package.json and lockfile first
COPY package.json yarn.lock ./
# Copy solana-api package.json
COPY apps/solana-api/package.json ./apps/solana-api/
# Copy shared package manifests if needed for install/build (e.g., typescript-config)
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install ALL monorepo dependencies using yarn workspaces
RUN yarn install --frozen-lockfile

# Copy the rest of the monorepo source code
COPY . .

# Build only the solana-api package using yarn turbo
RUN yarn turbo run build --filter=solana-api

# Stage 2: Create the final lightweight image
FROM node:20-slim

WORKDIR /app

# Copy only the necessary package.json from solana-api for production install
COPY --from=builder /app/apps/solana-api/package.json ./package.json
COPY --from=builder /app/yarn.lock ./

# Install ONLY production dependencies for solana-api
RUN yarn install --production --frozen-lockfile

# Copy the built 'dist' directory from the correct location in the builder stage
COPY --from=builder /app/apps/solana-api/dist ./dist/

# Expose the port (set via SOLANA_API__PORT secret, defaults to 4000)
EXPOSE 4000

# Command to run the application (using yarn start from solana-api's package.json)
CMD [ "yarn", "start" ]
