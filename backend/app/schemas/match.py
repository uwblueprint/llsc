from pydantic import BaseModel

from app.schemas.time_block import TimeBlockEntity

class SubmitMatchRequest(BaseModel):
    match_id: int
    time_block_id: int


class SubmitMatchResponse(BaseModel):
    match_id: int
    time_block: TimeBlockEntity
