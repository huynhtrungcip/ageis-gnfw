# Contributing to Aegis NGFW

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- npm or bun
- Docker & Docker Compose (for full stack testing)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/aegis-ngfw.git
cd aegis-ngfw

# Install dependencies
npm install

# Start development server (mock data, no Docker needed)
npm run dev
```

### Full Stack Development

```bash
# Start with Docker (PostgreSQL + PostgREST + Frontend)
docker compose up -d

# Or use the one-click script
sudo bash scripts/deploy-oneclick.sh --dev --auto
```

## Project Structure

- `src/pages/` — Page components (one per route)
- `src/components/` — Reusable UI components
- `src/hooks/` — Data fetching and custom hooks
- `src/lib/` — Utility functions, API client, formatters
- `src/contexts/` — React contexts (Auth, DemoMode)
- `docker/` — Docker configurations and SQL schema
- `scripts/` — Deployment and agent scripts

## Code Style

- **TypeScript** strict mode
- **Tailwind CSS** with semantic design tokens (use `bg-primary`, not `bg-blue-500`)
- **shadcn/ui** components as base
- **Small, focused components** — avoid files over 300 lines
- **Shared utilities** in `src/lib/formatters.ts` — don't duplicate formatting logic

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with clear, descriptive commits
4. Ensure no TypeScript errors: `npx tsc --noEmit`
5. Test locally (dev server + Docker if applicable)
6. Open a Pull Request with:
   - Clear description of what changed and why
   - Screenshots for UI changes
   - Testing steps

## Reporting Issues

- Use GitHub Issues
- Include: steps to reproduce, expected behavior, actual behavior
- For security issues, see [SECURITY.md](SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
