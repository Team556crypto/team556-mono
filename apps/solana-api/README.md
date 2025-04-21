# Solana API

A basic Express API for Solana blockchain integration.

## Getting Started

1. Clone the repository
2. Navigate to the project directory
3. Copy the environment file: `cp .env.example .env`
4. Install dependencies: `yarn install`
5. Start the development server: `yarn dev`

## Environment Variables

- `PORT` - Port for the server to listen on (default: 3001)
- `NODE_ENV` - Environment mode ('development' or 'production')
- `REQUEST_ORIGIN` - Allowed origin for CORS in production mode (required in production)

## CORS Configuration

- In development mode (`NODE_ENV` is not 'production'): Accepts requests from any origin
- In production mode (`NODE_ENV === 'production'`): Only accepts requests from the origin specified in the `REQUEST_ORIGIN` environment variable

## Available Scripts

- `yarn dev` - Start the development server with hot-reload
- `yarn build` - Build the production-ready code
- `yarn start` - Run the production build
- `yarn lint` - Run ESLint
- `yarn check-types` - Run TypeScript type checking

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check endpoint
