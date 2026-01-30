## Gemini AI-Core Development Context

This document provides the necessary context for Gemini to effectively assist in the development and maintenance of the `ai-core` project.

### 1. Project Overview

`ai-core` is a universal toolkit designed to provide structured knowledge and patterns for Large Language Models (LLMs) to improve their software development assistance. It is a meta-framework consisting of **Skills**, **Subagents**, and an orchestration layer.

*   **Core Idea:** Instead of relying on general knowledge, LLMs are guided by project-specific conventions and best practices defined in `ai-core`.
*   **Skills:** These are Markdown files (`SKILL.md`) in the `SKILLS/` directory that define universal patterns for specific domains (e.g., `security`, `testing`, `database`). There are over 40 skills.
*   **Subagents:** Located in `SUBAGENTS/`, these are specialized agents for handling complex, multi-step tasks like orchestration or learning.
*   **Architecture:** The system follows a clear workflow: **User Request -> Intent Analysis -> Resource Selection (Skills/Agents) -> Coordinated Execution**. This is documented in `ARCHITECTURE.md`.
*   **Technology:** The project is primarily composed of Markdown files for knowledge representation, Shell scripts for orchestration and testing, and YAML for GitHub Actions.

### 2. Building, Running, and Testing

This is the central development repository for `ai-core`. The primary development activities are creating/editing skills and running tests.

*   **Installation Script (`run.sh`):** This script is **NOT** for use within this repository. It is the installer used to deploy `ai-core` into *other* projects. It sets up configuration files (e.g., `AGENTS.md`) and symlinks the `SKILLS/` and `SUBAGENTS/` directories.

*   **Running Tests:** The primary command to validate the entire project is:
    ```bash
    # From the project root
    ./tests/run-all-tests.sh
    ```
    This executes three main suites:
    1.  **unit:** Tests the installation scripts.
    2.  **integration:** Tests agent and skill interactions.
    3.  **validation:** Validates the structure and integrity of the installation.

*   **Skill Validation:** To specifically validate the format and quality of all `SKILL.md` files, use:
    ```bash
    # From the project root
    ./tests/validate-skills.sh
    ```

### 3. Development Conventions

All contributions, especially new skills, **must** adhere to the strict conventions defined in `SKILLS/skill-authoring/SKILL.md`.

#### Skill File Structure (`SKILLS/<skill-name>/SKILL.md`)

Every skill file must contain two main parts: a YAML frontmatter for metadata and a structured Markdown body for instructions.

**1. YAML Frontmatter (Required):**
```yaml
---
name: <kebab-case-name>
description: >
  A one-sentence, action-oriented description of the skill.
  Must end with "Trigger: <action>" or similar.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root] # or [frontend], [backend], etc.
  auto_invoke: ["action that triggers this skill"]
  tags: [tag1, tag2, tag3]
---
```

**2. Markdown Body (Required Sections):**
*   `## When to Use`: A bulleted list of specific use cases.
*   `## Critical Patterns`: A clear do/don't list using `> **ALWAYS**:` and `> **NEVER**:`.
*   **Pattern Breakdowns:** One or more sections for specific patterns, each including code examples (`✅ Good` vs `❌ Bad`).
*   `## Commands`: A block with relevant, runnable shell commands.
*   `## Related Skills`: Links to other skills to encourage composition.

#### Content Authoring Principles

*   **Write for an LLM:** Be specific, direct, and action-oriented. Avoid prose.
*   **Use Structured Formats:** Employ tables, bold keywords, and lists.
*   **Provide Concrete Examples:** Every pattern must have a clear, copy-pasteable code example.
*   **Validate Rigorously:** Use `./tests/validate-skills.sh` and `yamllint` on the frontmatter.

### 4. Key Files & Directories

*   `SKILLS/`: The core knowledge base of the project. The primary area for contributions.
*   `SUBAGENTS/`: Houses the specialized agents.
*   `tests/`: Contains all unit, integration, and validation test scripts.
    *   `tests/run-all-tests.sh`: The main entry point for testing.
    *   `tests/validate-skills.sh`: The script for checking skill quality.
*   `.github/workflows/`: Contains GitHub Actions for CI/CD, including automated security scans, dependency checks, and the crucial `receive-ai-core-updates.yml` workflow that propagates changes to downstream projects.
*   `run.sh`: The installer script for deploying `ai-core` to other projects.
*   `ARCHITECTURE.md`: High-level overview of the system design and workflow.
*   `docs/adr/`: Contains Architecture Decision Records for key design choices.
*   `templates/`: Contains the base templates for `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` that are installed in other projects.
