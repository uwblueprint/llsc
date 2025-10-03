# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LLSC (Leukemia & Lymphoma Society of Canada) is a full-stack application built for matching participants with volunteers. The application uses a monorepo structure with separate frontend and backend services.

**Tech Stack:**
- Backend: FastAPI (Python 3.12), SQLAlchemy, PostgreSQL, Alembic migrations
- Frontend: Next.js, React, TypeScript, Chakra UI
- Infrastructure: Docker, Docker Compose
- Auth: Firebase Authentication
- Email: AWS SES

## Development Commands

### Initial Setup
```bash
# Start Docker containers (required for database)
docker-compose up -d

# Backend setup
cd backend
pdm install
pdm run dev  # Runs on http://localhost:8000

# Frontend setup
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

### Backend Commands
```bash
cd backend

# Development
pdm run dev                    # Start FastAPI dev server (port 8000)

# Database
pdm run alembic revision --autogenerate -m "message"  # Create migration
pdm run alembic upgrade head   # Apply migrations
pdm run seed                   # Seed database with reference data
pdm run db-reset               # Reset DB: down, up, migrate, seed

# Testing
pdm run tests                  # Run pytest tests

# Linting & Formatting
pdm run ruff check .           # Check linting
pdm run ruff check --fix .     # Fix linting issues
pdm run ruff format .          # Format code
pdm run precommit              # Run pre-commit hooks manually
```

### Frontend Commands
```bash
cd frontend

npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run prettier:check   # Check formatting
npm run prettier:fix     # Fix formatting
npm run format           # Run both prettier and eslint fixes
```

### Docker Commands
```bash
# Database access
docker exec -it llsc_db psql -U postgres -d llsc

# Container management
docker-compose up --build    # Rebuild and start
docker-compose down          # Stop containers
docker-compose down --volumes # Stop and remove volumes
docker ps                    # List running containers
```

## Architecture

### Backend Structure

The backend follows a **layered service architecture**:

- **Models** (`app/models/`): SQLAlchemy ORM models. All models must be imported in `app/models/__init__.py` for Alembic autogeneration to work.
- **Schemas** (`app/schemas/`): Pydantic schemas for request/response validation.
- **Routes** (`app/routes/`): FastAPI route handlers that accept requests and return responses.
- **Services** (`app/services/`): Business logic layer that routes call into.
  - `implementations/`: Concrete service implementations
- **Interfaces** (`app/interfaces/`): Abstract base classes defining service contracts.
- **Middleware** (`app/middleware/`): Request/response middleware (e.g., `AuthMiddleware`).
- **Utilities** (`app/utilities/`): Shared utilities, constants, Firebase, SES initialization.
- **Seeds** (`app/seeds/`): Database seeding scripts for reference data.

**Key Backend Files:**
- `app/server.py`: FastAPI application initialization, middleware setup, route registration
- `app/__init__.py`: Contains `run_migrations()` which auto-runs Alembic migrations on startup
- `app/utilities/constants.py`: Contains `LOGGER_NAME()` function for creating standardized loggers

**Authentication Flow:**
- Firebase tokens are validated via `AuthMiddleware`
- Public paths are defined in `server.py` (`PUBLIC_PATHS`)
- Protected routes require valid Firebase auth tokens

**Database Migrations:**
When adding a new model, you MUST:
1. Create the model file in `app/models/`
2. Import it in `app/models/__init__.py` and add to `__all__`
3. Run `pdm run alembic revision --autogenerate -m "description"`
4. Run `pdm run alembic upgrade head`

### Frontend Structure

The frontend is a **Next.js application** using TypeScript and Chakra UI:

- **Pages** (`src/pages/`): Next.js file-based routing
  - `participant/`: Participant-specific pages (intake, ranking)
  - `volunteer/`: Volunteer-specific pages (intake, secondary application)
  - `admin/`: Admin dashboard pages
- **Components** (`src/components/`): Reusable React components
  - `auth/`: Authentication-related components
  - `intake/`: Form intake components
  - `ranking/`: Ranking interface components
  - `ui/`: Base UI components
- **API Clients** (`src/APIClients/`): API communication layer with backend
- **Contexts** (`src/contexts/`): React Context providers for global state
- **Hooks** (`src/hooks/`): Custom React hooks
- **Types** (`src/types/`): TypeScript type definitions
- **Utils** (`src/utils/`): Utility functions

**Key Frontend Files:**
- `src/pages/_app.tsx`: Next.js app wrapper, providers setup
- `src/pages/_document.tsx`: Custom document for Next.js

## Version Control

### Branching
- Branch off `main` for all feature work
- Branch naming: `<github-username>/<ticket-number>-description` (e.g., `mslwang/LLSC-42-readme-update`)
- Use rebase instead of merge to integrate main: `git pull origin main --rebase`

### Commits
- Commits should be atomic and self-contained
- Use imperative tense with capitalized first word (e.g., "Add user authentication")
- Squash trivial commits (typos, formatting) using `git rebase -i`

## Logging

To add a logger to any file:
```python
from app.utilities.constants import LOGGER_NAME
import logging

log = logging.getLogger(LOGGER_NAME("my_service"))
```

## Testing

- Backend tests: `pdm run tests` (runs pytest in `backend/tests/`)
- Test structure: `tests/unit/` and `tests/functional/`
- CI runs linting, formatting checks, unit tests, and security scans on every PR

## Firebase Configuration

Backend requires:
1. `serviceAccountKey.json` in `backend/` directory (obtain from Firebase Console)
2. `FIREBASE_WEB_API_KEY` in `.env` file

## Environment Variables

Environment variables are stored in:
- Backend: `.env` in project root (loaded by backend service)
- Frontend: `frontend/.env`

Secrets are documented in the LLSC Notion workspace.
