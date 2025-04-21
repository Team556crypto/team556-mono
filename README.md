# Team556 Monorepo

Welcome to the Team556 monorepo! This repository contains various applications and shared packages managed using Turborepo.

## Table of Contents

-   [What's inside?](#whats-inside)
-   [Getting Started](#getting-started)
-   [Development Workflow](#development-workflow)
-   [Utilities](#utilities)
-   [Useful Links](#useful-links)
-   [Contributing](#contributing)

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

## Contributing

We welcome contributions! Here's a guide for getting started, especially if you're new or using AI assistance:

1.  **Find an Issue:**
    -   Look through the [Issues tab](https://github.com/your-org/your-repo/issues) on GitHub (replace with your actual repo link if possible).
    -   Choose an issue you'd like to work on. If it's not assigned, feel free to ask if you can take it by commenting on the issue.

2.  **Start with the Base Prompt (AI Assistance):**
    -   Each issue created from a template includes a "**Base Prompt**" section at the bottom.
    -   Copy this entire section.
    -   Paste it as the *very first message* to your AI coding assistant (like Cascade!). This gives the AI the necessary context to help you effectively with that specific issue.

3.  **Create a Branch:**
    -   Make sure you have the latest code from the main branch (usually `main` or `master`):
        ```sh
        git checkout main
        git pull origin main
        ```
    -   Create a new branch specifically for the issue you're working on. Use a descriptive name, often including the issue number:
        ```sh
        # Example: git checkout -b feat/123-add-login-button
        git checkout -b <type>/<issue-number>-<short-description>
        ```
        Common types include `feat` (feature), `fix` (bug fix), `docs` (documentation), `refactor`.

4.  **Make Changes:**
    -   Work on the code changes required to address the issue. Your AI assistant can help you with writing, testing, and debugging code.
    -   Remember to follow the project's coding style and guidelines.
    -   Run linters and tests as needed (`yarn lint`, `yarn test` if configured).

5.  **Commit Your Changes:**
    -   Stage the files you've changed:
        ```sh
        git add .
        # or git add <specific-file-path>
        ```
    -   Commit the changes with a clear and concise message, often referencing the issue number:
        ```sh
        # Example: git commit -m "feat: Add login button (#123)"
        git commit -m "<type>: <description> (#<issue-number>)"
        ```

6.  **Push Your Branch:**
    -   Push your new branch to the remote repository (GitHub):
        ```sh
        git push -u origin <your-branch-name>
        ```
        The `-u` flag sets the upstream branch, so next time you can just use `git push`.

7.  **Create a Pull Request (PR):**
    -   Go to the repository page on GitHub.
    -   You should see a prompt to create a Pull Request from your recently pushed branch. Click it.
    -   If not, go to the "Pull requests" tab and click "New pull request". Select your branch to compare against the `main` branch.
    -   Fill out the PR template:
        -   Give it a clear title.
        -   Describe the changes you made and *why*.
        -   Link the issue it resolves (e.g., "Closes #123").
    -   Submit the Pull Request.

8.  **Review and Merge:**
    -   Project maintainers will review your PR. They might request changes.
    -   Make any requested changes, commit them, and push them to your branch (the PR will update automatically).
    -   Once approved, a maintainer will merge your PR into the main branch.

Congratulations, you've contributed! 🎉