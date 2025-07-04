from sqlalchemy import Column, ForeignKey, Table

from .Base import Base

# SuggestedTimes as a pure association table
# only exists to establish a relationship between Matches and Time Blocks (many to many)
suggested_times = Table(
    "suggested_times",
    Base.metadata,
    # composite key of match and time block
    Column("match_id", ForeignKey("matches.id"), primary_key=True),
    Column("time_block_id", ForeignKey("time_blocks.id"), primary_key=True),
)
