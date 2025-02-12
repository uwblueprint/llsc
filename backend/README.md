# llsc-backend
This repository contains the backend for the Leukemia & Lymphoma Society of Canada (LLSC) application. Below is a guide to help you set up the environment, install dependencies using PDM, and run the backend using Docker.

## Prerequisites

Ensure you have the following installed on your machine:

- **Python 3.12+**
- **[PDM](https://pdm.fming.dev/latest/#installation)** (Python Dependency Manager)
  - Install PDM using:
    ```bash
    pip install pdm
    ```
    Alternatively, if you're using Homebrew:
    ```bash
    brew install pdm
    ```
- **Docker**


- Create a `.env` file in `./backend` (the root directory, not in the backend folder) based on the .env.sample file. Update
  the environment variables as needed. Consult the [Secrets](#secrets) section
  for detailed instructions.

```bash
cp .env.sample .env
```

## Installation

Once PDM is installed, install the project dependencies by running:

```bash
pdm install
```

to install all the project dependancies listed in the `pyproject.toml` file.

## Running the Backend Locally
To start up the database using docker, run the following command:
```bash
cd backend
pdm run db
```

To check if the database has been started up, type the following:
```bash
 docker ps | grep llsc_db_dev_local
```
This checks the list of docker containers and searchs for the container name `llsc_db_dev_local`

Note: If you wish to run the backend outside of Docker (e.g., for local development), you'll need to set up a PostgreSQL database. Ensure your database configuration is set properly in the environment variables before running the project.

To start the backend locally, use the following command:

```bash
pdm run dev
```
## Run Project

Take advantage of the docker compose file in the LLSC root directory to run the backend alongside the frontend by simply running

```bash
docker-compose up --build
```

<!--
## Setup Docker Image For Backend

Ensure Docker is installed on your machine. To build the Docker image, run:

```bash
docker build -t <image-name> .
```

Replace <image-name> with a name of your choice.

### Running the Docker Container

To run the image, execute the following command:

```bash
docker run -p 8080:8080 <image-name>

# Add Flags if needed
-d # Runs container in background
```

You can adjust the ports as needed. For example, 8080:8080 maps the container’s port 8080 to your local machine's port 8080. Once running, you should be able to access the backend locally via: -->

The backend runs at http://localhost:8080 and the frontend runs at http://localhost:3000.

## Formatting and Linting (mirrors [formatting in base README](../README.md#formatting-and-linting))

### Pre-commit Hook

We have added the pre-commit hook package and defined the config file in `backend/.pre-commit-config.yaml`. This should automatically get installed when you run `pdm install` and should work whenever you run any `git commit` or `git push` commands in the repo.

You can also manually run the pre-commit hooks prior to pushing/commiting code by running the following:

```
pdm run precommit
```

If the above command doesn't work please run `pdm run precommit-install` prior to running above.

Note after the pre-commit hooks run you may need to stage the changed files again. Please look over the changes before you push the code again.

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

## Environment Variables
Environment variables are currently stored in an .env file within the base repository (not the backend folder). You will need to copy the local environment variables stored in the following notion [page](https://www.notion.so/uwblueprintexecs/Environment-Variables-11910f3fb1dc80e4bc67d35c3d65d073?pvs=4) to get the database working.


## Adding a new model
When adding a new model, make sure to add it to `app/models/__init__.py` so that the migration script can pick it up when autogenerating the new migration.

In `app/models/__init__.py`, add the new model like so:
```python
from .Base import Base
...
from .<new_model_name> import <new_model_name>

__all__ = ["Base", ... , "<new_model_name>"]
```
Then run the steps found in the [Migrations](#migrations) section to create a new migration.

## Migrations

We use Alembic for database schema migrations. We mainly use migration scripts to keep track of the incremental and in theory revertible changes that have occurred on the database. To create a new migration, run the following command after adding or editing models in `backend/app/models.py`:
```bash
cd backend
pdm run alembic revision --autogenerate -m "<migration message>"
```

To apply the migration, run the following command:
```bash
pdm run alembic upgrade head
```

### Logging

To add a logger to a new service or file, use the `LOGGER_NAME` function in `app/utilities/constants.py`

```python
from app.utilities.constants import LOGGER_NAME

log = logging.getLogger(LOGGER_NAME("my_service"))
```

If you'd like to create a new logger name in the hierarchy, you'll need to add it to `alembic.ini` under the logger section. Following the pre-existing examples for `logger_uvicorn` for example.
