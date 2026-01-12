FROM python:3.12

WORKDIR /app

COPY pyproject.toml ./
COPY pdm.lock ./
RUN pip install pdm && pdm install

COPY . .

# Entrypoint setup
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["pdm", "run", "fastapi", "run", "app/server.py", "--port", "8080"]