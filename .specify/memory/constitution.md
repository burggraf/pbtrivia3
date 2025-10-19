<!--
Sync Impact Report:
Version change: [uninitialized] → 1.0.0 (MAJOR - Initial constitution establishment)
Modified principles: N/A (initial creation)
Added sections: All sections newly created
Removed sections: N/A
Templates requiring updates: ✅ updated - plan-template.md, tasks-template.md, command templates (none found)
Follow-up TODOs: N/A
-->

# Trivia Party Constitution

## Core Principles

### I. Static Web Architecture

This is a static web site application with no server-side code and no SSR. It will be deployed as a static site to Cloudflare Pages. We use React, shadcn, and Tailwind for the UI/UX. All functionality must work within the constraints of a static site architecture.

### II. Test-Driven Development (TDD)

Write tests for everything first. Tests must pass before completing a feature. The Red-Green-Refactor cycle is strictly enforced. Use vitest as a testing framework. No feature implementation is considered complete without passing tests that were written before the code.

### III. High Test Coverage

Aim for > 80% test coverage for all code. Coverage metrics are monitored and must be maintained or improved with each change. Low coverage areas must be addressed before feature completion.

### IV. End-to-End Testing

Use the Chrome Dev Tools MCP server to make sure every feature works and it looks correct. All user-facing features must be validated through automated browser testing to ensure proper functionality and visual appearance.

### V. Simplicity

Start simple and only add complexity when it's justified. Follow YAGNI (You Ain't Gonna Need It) principles. Every added feature, dependency, or abstraction must provide clear value to the trivia party application.

## Development Workflow

All code changes must be submitted through pull requests. All pull requests must be reviewed and approved by at least one other team member before being merged. All tests must pass in the CI/CD pipeline before a pull request can be merged. Code review must verify compliance with this constitution.

## Governance

This constitution supersedes all other practices. Amendments to this constitution require documentation, approval from the team, and a migration plan if necessary. All pull requests and code reviews must verify compliance with this constitution. Any deviation from constitutional principles must be explicitly justified and documented.

**Version**: 1.0.0 | **Ratified**: 2025-01-19 | **Last Amended**: 2025-01-19