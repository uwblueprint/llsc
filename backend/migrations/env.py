# Add debug print statements and force the connection string

import os
from logging.config import fileConfig
import sys

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import create_engine, pool

# Import your models
from app.models import Base

load_dotenv()

# Add debug prints
print("Starting migrations...")
print(f"Current working directory: {os.getcwd()}")

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata

# Debug print
print("Target metadata loaded")

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = "postgresql://rohannankani:postgres@localhost:5432/llsc"
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    print("Running migrations online...")
    
    # HARDCODE the engine creation, bypassing all config
    connection_string = "postgresql://rohannankani:postgres@localhost:5432/llsc"
    print(f"Using connection string: {connection_string}")
    
    # Create engine directly
    engine = create_engine(connection_string)
    
    # Debug connection
    try:
        with engine.connect() as test_conn:
            print("Test connection successful!")
    except Exception as e:
        print(f"Test connection failed: {e}")
        sys.exit(1)
    
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

# Use online migrations
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

print("Tables in metadata:", [t.name for t in Base.metadata.sorted_tables])