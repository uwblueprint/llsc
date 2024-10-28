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

## Installation

Once PDM is installed, install the project dependencies by running:

```bash
pdm install
```

to install all the project dependancies listed in the `pyproject.toml` file.

## Running the Backend Locally
To start the backend locally, use the following command:

```bash
pdm run dev
```

Note: If you wish to run the backend outside of Docker (e.g., for local development), you'll need to set up a PostgreSQL database. Ensure your database configuration is set properly in the environment variables before running the project. For the time being, the recommended approach for local development using the database is to use the docker compose Postgres instance with your local dev backend.

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

## Environment Variables
Environment variables are currently stored in an .env file within the base repository (not the backend folder). You will need to copy the local environment variables stored in the following notion [page](https://www.notion.so/uwblueprintexecs/Environment-Variables-11910f3fb1dc80e4bc67d35c3d65d073?pvs=4) to get the database working.

## Pre-commit Hook

We have added the pre-commit hook package and defined the config file in `backend/.pre-commit-config.yaml`. This should automatically get installed when you run `pdm install` and should work whenever you run any `git commit` or `git push` commands in the repo.

You can also manually run the pre-commit hooks prior to pushing/commiting code by running the following:

```
pdm run precommit
```

If the above command doesn't work please run `pdm run precommit-install` prior to running above.

Note after the pre-commit hooks run you may need to stage the changed files again. Please look over the changes before you push the code again.
