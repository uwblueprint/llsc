"""
Database seeding system for LLSC backend.

This module provides a clean separation between schema migrations and reference data seeding.
All reference data (roles, treatments, experiences, etc.) is managed here instead of in migrations.
"""

from .runner import seed_database

__all__ = ["seed_database"]
