from typing import List

from pydantic import BaseModel

from app.schemas.time_block import TimeBlockEntity, TimeBlockId, TimeRange


class SuggestedTimeCreateRequest(BaseModel):
  match_id: int
  suggested_new_times: List[TimeRange]

class SuggestedTimeGetRequest(BaseModel):
  match_id: int

class SuggestedTimeDeleteRequest(BaseModel):
  match_id: int

class SuggestedTimeDeleteResponse(BaseModel):
  match_id: int
  deleted: int

class SuggestedTimeCreateResponse(BaseModel):
  match_id: int
  added: int

class SuggestedTimeGetResponse(BaseModel):
  match_id: int
  suggested_times: List[TimeBlockEntity]

class SuggestedTimeEntity(BaseModel):
  id: int
  match_id: int
  timeblock_id: TimeBlockId
