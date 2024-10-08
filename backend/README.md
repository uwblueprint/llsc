# llsc-backend

## Setup (mirrors [base README](../README.md#setup))
- Install pdm (this is a global installation, so location doesn't matter)
On macOS:
```bash
brew install pdm
```
Otherwise, feel free to follow install instructions [here](https://pdm-project.org/latest/#installation)

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


## Formatting and Linting (mirrors [formatting in base README](../README.md#formatting-and-linting))

### Ruff

We use Ruff for code linting and formatting in the backend. To check for and automatically fix linting issues:

```bash
cd backend
pdm run ruff check --fix .
```

To format the code:
```bash
cd backend
pdm run ruff format .
```

## Migrations

We use Alembic for database schema migrations. We mainly use migration scripts to keep track of the incremental and in theory revertible changes that have occurred on the database. But, we don't need to rely on this to build the datebase itself, as `Base.metadata.create_all(bind=engine)` achieves that based on the current models. To create a new migration, run the following command after adding or editing models in `backend/app/models.py`:
```bash
cd backend
pdm run alembic revision --autogenerate -m "<migration message>"
```

To apply the migration, run the following command:
```bash
pdm run alembic upgrade head
```
