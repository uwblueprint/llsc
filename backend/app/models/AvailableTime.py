from sqlalchemy import Column, ForeignKey, Table

from .Base import Base

# AvailableTimes as a pure association table
# only exists to establish a relationship between Users and Time Blocks
# a User has an Availability which is composed of many time blocks
available_times = Table(
    "available_times",
    Base.metadata,
    Column("time_block_id", ForeignKey("time_blocks.id"), primary_key=True),
    Column("user_id", ForeignKey("users.id"), primary_key=True),
)
