# Leukemia & Lymphoma Society of Canada (LLSC)

## Table of Contents

- [Repo Structure](#repo-structure)
- [Setup](#setup)
- [Version Control Guide](#version-control-guide)
  - [Branching](#branching)
  - [Docker Commands](#docker-commands)
  - [Accessing PostgreSQL Database](#accessing-postgresql-database)
- [Seeding the Production Database](#seeding-the-production-database)
- [Formatting and Linting](#formatting-and-linting)
- [Secrets](#secrets)

## Repo Structure
```
llsc/
├── backend/
│   ├── app/
│   │   ├── middlewares/       # Middleware components (e.g., auth middleware)
│   │   ├── migrations/        # Database migrations
│   │   ├── models/            # SQLAlchemy database models
│   │   │   └── __init__.py    # App initialization, contains all models
│   │   ├── resources/         # Data Transfer Objects (DTOs)
│   │   ├── routes/            # Route components
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Services handling business logic
│   │   │   ├── implementations/ # Concrete implementations of service interfaces
│   │   │   └── interfaces/    # Service interfaces
│   │   └── utilities/         # Shared utility modules
├── frontend/
│   ├── public/                # Static files
│   ├── src/
│   │   ├── APIClients/         # API clients
│   │   ├── components/         # Reusable UI components
│   │   ├── constants/          # Constants
│   │   ├── contexts/           # Context providers
│   │   ├── pages/              # Next.js page routes
│   │   ├── styles/             # Global styles
│   │   ├── types/              # Custom type definitions
│   │   └── utils/              # Utility functions
├── docker-compose.yml
├── Dockerfile
├── .env.sample
└── README.md
```

## Setup
- Make sure you have been added to the [UW Blueprint Github Workspace](https://github.com/uwblueprint/).
- Install Docker Desktop ([MacOS](https://docs.docker.com/docker-for-mac/install/) | [Windows](https://docs.docker.com/desktop/install/windows-install/) | [Linux](https://docs.docker.com/engine/install/#server)) and ensure that it is running.

- Clone the [LLSC Github Repository](https://github.com/uwblueprint/llsc) to your local machine and `cd` into the project folder:

SSH (recommended)
```bash
git clone git@github.com:uwblueprint/llsc.git
cd llsc
```
If you haven't set up SSH keys already for github, follow the steps outlined [here](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account).

HTTPS
```bash
git clone https://github.com/uwblueprint/llsc.git
cd llsc
```

- Create a .env file in `./backend` and `./frontend` based on the .env.sample file. Update
  the environment variables as needed. Consult the [Secrets](#secrets) section
  for detailed instructions.

```bash
cp .env.sample .env
```

- Build and start the Docker containers (in detached mode)

```bash
docker-compose up -d
```

- Install pdm (this is a global installation, so location doesn't matter)
On macOS:
```bash
brew install pdm
```
Otherwise, feel free to follow install instructions [here](https://pdm-project.org/latest/#installation)

- Install postgresql (this is for local development)
On macOS:
```bash
brew install postgresql
```
Otherwise, feel free to follow install instructions [here](https://www.postgresql.org/download/)
Note: you will need this for `psycopg2`, which requires a config file that is part of postgresql.

You will then need to go into each directory individually to install dependencies.

FastAPI backend
```bash
cd backend
pdm install
```

To run the backend server locally (recommended for development), run the following command:
```bash
cd backend
pdm run dev
```

To check if the database has been started up, type the following:
```bash
 docker ps | grep llsc_db
```
This checks the list of docker containers and searchs for the container name `llsc_db`

NextJS frontend
```bash
cd frontend
npm install
```

To run the frontend server locally (recommended for development), run the following command:
```bash
cd frontend
npm run dev
```

## Version Control Guide

### Branching

- Branch off of `main` for all feature work and bug fixes, creating a "feature branch". Prefix the feature branch name with your github username. The branch name should be in kebab case and it should be short and descriptive and should include the ticket number. E.g. `mslwang/LLSC-42-readme-update`.

- To integrate changes on `main` into your feature branch, **use rebase instead of merge**

```bash
# currently working on feature branch, there are new commits on main
git pull origin main --rebase

# if there are conflicts, resolve them and then:
git add .
git rebase --continue

# force push to remote feature branch
git push --force-with-lease
```

### Docker Commands

If you’re new to Docker, you can learn more about `docker-compose` commands at
this [docker compose overview](https://docs.docker.com/compose/reference/).

```bash
# build Builds images
docker-compose
```

```bash
# builds images (if they don’t exist) & starts containers
docker-compose up
```

```bash
# builds images & starts containers
docker-compose up --build
```

```bash
# stops the containers
docker-compose down
```

```bash
# stops the containers and removes volumes
docker-compose down --volumes
```

```bash
# get Names & Statuses of Running Containers
docker ps
```

```bash
# Remove all stopped containers, unused networks, dangling images, and build cache
docker system prune -a --volumes
```

### Accessing PostgreSQL Database

Run in two lines (View Users Table):

```bash
docker exec -it llsc_db psql -U postgres -d llsc
SELECT * FROM public.users;
```

Running the commands line by line.

```bash
# run a bash shell in the container
docker exec -it llsc /bin/bash

# in container now
psql -U postgres -d llsc

# in postgres shell, some common commands:
# display all table names
\dt
# quit
\q
# you can run any SQL query, don't forget the semicolon!
SELECT * FROM public."<table-name>";
```

### Seeding the Production Database
TBD

## Formatting and Linting

### Backend

#### Ruff

We use Ruff for code linting and formatting in the backend. To check for linting issues:

```bash
cd backend
pdm run ruff check .
```

To automatically fix linting issues:

```bash
cd backend
pdm run ruff check --fix .
```

To run the formatter:
```bash
cd backend
pdm run ruff format .
```

All code needs to pass ruff formatting and linting before it can be merged.

### Logging

To add a logger to a new service or file, use the `LOGGER_NAME` function in `app/utilities/constants.py`

```python
from app.utilities.constants import LOGGER_NAME

log = logging.getLogger(LOGGER_NAME("my_service"))
```

If you'd like to create a new logger name in the hierarchy, you'll need to add it to `alembic.ini` under the logger section. Following the pre-existing examples for `logger_uvicorn` for example.

### Frontend

#### Prettier

We use Prettier for code formatting in the frontend. To check for formatting issues:

```bash
npm run prettier:check
```

To automatically fix formatting issues:

```bash
npm run prettier:fix
```

#### ESLint

We use ESLint for code linting. To check for linting issues:

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

#### Combined Formatting and Linting

To run both Prettier and ESLint to format and fix linting issues in one command:

```bash
npm run format
```

## Commits

- Commits should be atomic (guideline: the commit is self-contained; a reviewer could make sense of it even if they viewed the commit diff in isolation)

- Trivial commits (e.g. fixing a typo in the previous commit, formatting changes) should be squashed or fixup'd into the last non-trivial commit

```bash
# last commit contained a typo, fixed now
git add .
git commit -m "Fix typo"

# fixup into previous commit through interactive rebase
# x in HEAD~x refers to the last x commits you want to view
git rebase -i HEAD~2
# text editor opens, follow instructions in there to fixup

# force push to remote feature branch
git push -f
```

- Commit messages and PR names are descriptive and written in **imperative tense**. The first word should be capitalized. E.g. "Create user REST endpoints", not "Created user REST endpoints"
- PRs can contain multiple commits, they do not need to be squashed together before merging as long as each commit is atomic. Our repo is configured to only allow squash commits to `main` so the entire PR will appear as 1 commit on `main`, but the individual commits are preserved when viewing the PR.

## Secrets
Secrets are stored in the Environment Variable [file](https://www.notion.so/uwblueprintexecs/Environment-Variables-11910f3fb1dc80e4bc67d35c3d65d073?pvs=4) within the LLSC notion.

## Migrations (mirrors [backend README](./backend/README.md))

We use Alembic for database schema migrations. We mainly use migration scripts to keep track of the incremental and in theory revertible changes that have occurred on the database. But, we don't need to rely on this to build the datebase itself, as `Base.metadata.create_all(bind=engine)` achieves that based on the current models. To create a new migration, run the following command after adding or editing models in `backend/app/models.py`:
```bash
cd backend
pdm run alembic revision --autogenerate -m "<migration message>"
```

To apply the migration, run the following command:
```bash
pdm run alembic upgrade head
```
