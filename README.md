# Team556 Monorepo

Welcome to the Team556 monorepo! This repository contains various applications and shared packages managed using Turborepo.

## What's inside?

This Turborepo includes the following apps and packages:

### Apps

-   `main-api`: The main backend API service.
-   `pos`: Point-of-Sale application.
-   `prototype`: Prototyping application.
-   `solana-api`: API service interacting with the Solana blockchain.
-   `wallet`: Wallet application.

### Packages

-   `@repo/ui`: Shared React component library.
-   `@repo/eslint-config`: Shared ESLint configurations.
-   `@repo/typescript-config`: Shared `tsconfig.json` configurations used throughout the monorepo.

Each package and app is written in TypeScript where applicable.

## Getting Started

1.  **Clone the repository:**
    ```sh
    git clone <your-repo-url>
    cd team556-mono
    ```

2.  **Install dependencies:**
    This project uses `yarn` as the package manager. Make sure you have it installed.
    ```sh
    yarn install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory by copying the example if one exists, or configure it based on the required variables for the different apps (e.g., database connections, API keys). Refer to the `.env.example` or specific app documentation if available.
    *Note: The `main-api` currently loads `.env` from the monorepo root.* (See MEMORY[169cd4f6-1b7b-46d4-aa36-4fd43aabb9b7])

## Development Workflow

### Build

To build all apps and packages, run the following command from the root directory:

```sh
yarn build
```

To build a specific app or package, use the `--filter` flag:

```sh
yarn turbo run build --filter=<app-or-package-name>...
# Example: Build only the main-api
yarn turbo run build --filter=main-api...
# Example: Build the ui package and the wallet app
yarn turbo run build --filter=@repo/ui... --filter=wallet...
```

### Develop

To run all apps and packages in development mode (usually with hot-reloading), run the following command from the root directory:

```sh
yarn dev
```

To run a specific app in development mode:

```sh
yarn turbo run dev --filter=<app-name>...
# Example: Run only the wallet app
yarn turbo run dev --filter=wallet...
```

### Other Commands

-   **Lint:** `yarn lint`
-   **Format:** `yarn format` (if configured)
-   **Clean:** `yarn clean` (often removes `node_modules` and build artifacts)

Check the root `package.json` and `turbo.json` for all available scripts and pipeline configurations.

## Utilities

This Turborepo utilizes:

-   [TypeScript](https://www.typescriptlang.org/) for static type checking.
-   [ESLint](https://eslint.org/) for code linting (using shared configurations from `@repo/eslint-config`).
-   [Prettier](https://prettier.io) (likely configured) for code formatting.

## Useful Links

Learn more about Turborepo:

-   [Turborepo Documentation](https://turbo.build/docs)
-   [Tasks](https://turbo.build/docs/core-concepts/monorepos/running-tasks)
-   [Caching](https://turbo.build/docs/core-concepts/caching)
-   [Remote Caching](https://turbo.build/docs/core-concepts/remote-caching)
-   [Filtering](https://turbo.build/docs/core-concepts/monorepos/filtering)
-   [Configuration Options](https://turbo.build/docs/reference/configuration)
-   [CLI Usage](https://turbo.build/docs/reference/command-line-reference)