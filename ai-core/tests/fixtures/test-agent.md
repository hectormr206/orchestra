---
name: test-agent
description: >
  Test agent for unit testing. This agent is used to validate that the
  testing infrastructure can properly parse and validate agent metadata.

  Use when: Running tests to verify agent parsing logic.

tools: [Read,Write,Edit,Bash,Grep,Glob]
model: inherit
platforms:
  claude-code: true
  opencode: true
  gemini-cli: false
  github-copilot: false
metadata:
  author: test-author
  version: "1.0.0"
  type: specialist
  skills:
    - testing
    - documentation
  scope: [root]
---

# Test Agent

You are a **test agent** used for validating the testing infrastructure.

## Purpose

This agent serves as a fixture for testing:
- YAML frontmatter parsing
- Required field validation
- Skill reference validation
- Platform compatibility checks

## Skills Used

- `testing` - Test patterns and methodologies
- `documentation` - Documentation standards

## Test Coverage

This agent should be used to verify:
1. Frontmatter parsing works correctly
2. All required fields are present
3. Skills reference valid ai-core skills
4. Platform flags are properly set
5. Metadata fields are validated
