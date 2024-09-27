FROM python:3.12

WORKDIR /app

COPY pyproject.toml ./
COPY pdm.lock ./
RUN pip install pdm && pdm install
COPY . .

EXPOSE 8080
CMD ["pdm", "run", "fastapi", "run", "app/server.py", "--port", "8080"]
