# Trivia Party Constitution

## Core Principles

### I. Technology Stack

This is a static web site application with no server-side code and no SSR. It will be deployed as a static site to Cloudflare Pages. We use React, shadcn, and Tailwind for the UI/UX.

### II. Test-Driven Development (TDD)

Write tests for everything first. Tests must pass before completing a feature. The Red-Green-Refactor cycle is strictly enforced. Use vitest as a testing framework.

### III. High Test Coverage

Aim for > 80% test coverage for all code.

### IV. End-to-End Testing

Use the Chrome Dev Tools MCP server to make sure every feature works and it looks correct.

### V. Simplicity

Start simple and only add complexity when it's justified. Follow YAGNI (You Ain't Gonna Need It) principles.

## Development Workflow

All code changes must be submitted through pull requests. All pull requests must be reviewed and approved by at least one other team member before being merged. All tests must pass in the CI/CD pipeline before a pull request can be merged.

## Governance

This constitution supersedes all other practices. Amendments to this constitution require documentation, approval from the team, and a migration plan if necessary. All pull requests and code reviews must verify compliance with this constitution.
