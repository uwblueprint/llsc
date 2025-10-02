# Repository Guidelines

## Project Structure & Module Organization
The repository separates API and UI concerns. `backend/app` houses the FastAPI stack—middlewares, models, services, routes, schemas, and utilities—with migrations in `backend/migrations`. Automated tests live in `backend/tests` (unit and functional) plus `e2e-tests` for request-driven smoke checks. The Next.js client resides in `frontend/src`, where `components`, `pages`, `contexts`, `APIClients`, and `utils` cover the feature surface.

## Build, Test, and Development Commands
- `docker-compose up -d` boots Postgres and supporting services; pair with `docker-compose down -v` to rebuild from scratch.
- `cd backend && pdm install` prepares Python deps; `pdm run dev` starts FastAPI on `http://localhost:8080`.
- `cd frontend && npm install` sets up the UI; `npm run dev` runs the Next.js app on `http://localhost:3000`.
- `pdm run tests` executes the backend pytest suite; `npm run lint` runs ESLint/TypeScript checks; `npm run build` verifies a production bundle.

## Coding Style & Naming Conventions
Backend code targets Python 3.12 with Ruff enforcing 120-character lines, import sorting, and lint rules; run `pdm run ruff format` before committing. Use snake_case for files, modules, and functions, PascalCase for SQLAlchemy models and Pydantic schemas, and keep service interfaces under `services/interfaces`. Frontend TypeScript follows Prettier defaults (2-space indentation) and Next.js conventions: PascalCase React components, camelCase hooks, and colocated styles in `src/styles` when needed.

## Testing Guidelines
Pytest expects files named `test_*.py` in `backend/tests`, with async fixtures available for FastAPI routes. Focus unit tests on service logic and place HTTP flow checks in `tests/functional`. Gather coverage with `pytest --cov=app` when shipping high-risk changes. The `e2e-tests` directory hosts request-based regression scripts; run them against a live stack (`BACKEND_URL` set) before deploying auth or entity flows. Frontend currently relies on linting and type checks—add component tests under `frontend/src/__tests__` when introducing complex interactions.

## Commit & Pull Request Guidelines
Commits should be atomic and written in imperative mood (e.g., “Add intake confirmation flow”), mirroring existing history. Reference tickets in the body when relevant. Pull requests must summarize scope, note migrations or env updates, and include screenshots or GIFs for UI changes. Confirm linting, formatting, and tests ran successfully, and call out follow-up items so reviewers can assess risk quickly.

## Security & Configuration Tips
Never commit secrets. Copy `.env.sample` into `backend/.env` and `frontend/.env`, sourcing values from the LLSC vault. Keep `backend/serviceAccountKey.json` local; it is already gitignored. When adding loggers, register names via `app/utilities/constants.py` to preserve structured logging across services.
