# GEMINI.md

## Project Overview

This project is a meta-orchestrator for AI development tools called "Orchestra." It's a command-line interface (CLI) tool written in TypeScript that coordinates multiple AI models (Claude, Codex, Gemini, GLM) to perform complex software development tasks. The tool is designed with a multi-agent architecture where different AI "agents" (Architect, Executor, Auditor, Consultant) collaborate to plan, implement, and review code.

The project also includes a Terminal User Interface (TUI) built with React and Ink, providing an interactive way to manage the orchestration tasks.

**Key Technologies:**

*   **Language:** TypeScript
*   **Runtime:** Node.js (>=18.0.0)
*   **Frameworks/Libraries:**
    *   Commander.js for the CLI
    *   React and Ink for the TUI
    *   Vitest for testing
*   **AI Integration:** Adapters for Claude, Codex, Gemini, and GLM CLIs.

## Building and Running

### Prerequisites

*   Node.js (version 18 or higher)
*   One or more of the supported AI CLI tools installed and configured (Claude, Codex, Gemini, GLM)

### Installation

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Build the project:**
    ```bash
    npm run build
    ```

### Running the CLI

*   **Run directly with tsx (for development):**
    ```bash
    npm run dev -- <command>
    ```
    For example:
    ```bash
    npm run dev -- start "Create a Python script to fetch weather data"
    ```

*   **Run the compiled version:**
    ```bash
    npm start -- <command>
    ```
    For example:
    ```bash
    npm start -- doctor
    ```

### Running the TUI

*   **Run the compiled TUI:**
    ```bash
    npm run tui
    ```

### Testing

*   **Run unit tests:**
    ```bash
    npm test
    ```

*   **Run tests with coverage:**
    ```bash
    npm run test:coverage
    ```

## Development Conventions

*   **Code Style:** The project uses ESLint for linting, but the specific configuration is not detailed in the provided files. It is recommended to follow the existing code style.
*   **Testing:** The project uses `vitest` for testing. Tests are located in the `src` directory, and it is expected that new features or bug fixes are accompanied by corresponding tests.
*   **Commits:** The `package.json` suggests a conventional commit style (e.g., `feat:`, `fix:`) but this is not enforced.
*   **Modularity:** The codebase is organized into modules by functionality (`adapters`, `cli`, `orchestrator`, `prompts`, `tui`, `utils`), and this modular structure should be maintained.

## File Structure

The project follows a standard TypeScript project structure:

```
├── src/
│   ├── adapters/      # Adapters for different AI models
│   ├── cli/           # Command-line interface logic
│   ├── orchestrator/  # Core orchestration logic
│   ├── prompts/       # Prompts for the different AI agents
│   ├── tui/           # Terminal User Interface components and screens
│   ├── types.ts       # Shared TypeScript types
│   └── utils/         # Utility functions
├── package.json       # Project metadata and dependencies
├── tsconfig.json      # TypeScript compiler configuration
└── vitest.config.ts # Configuration for the test runner (inferred)
```

**Key Files:**

*   `src/index.ts`: The main entry point of the application.
*   `src/cli/index.ts`: The entry point for the command-line interface.
*   `src/tui/index.tsx`: The entry point for the Terminal User Interface.
*   `src/orchestrator/Orchestrator.ts`: The core class that manages the multi-agent workflow.
*   `src/adapters/*.ts`: Each file in this directory implements the interface for a specific AI tool.
*   `src/prompts/*.ts`: These files contain the prompts that define the behavior of each AI agent.
*   `README.md`: Provides detailed documentation on the project, its features, and how to use it.
