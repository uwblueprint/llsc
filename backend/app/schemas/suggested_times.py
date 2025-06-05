from datetime import datetime, timedelta
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.time_block import TimeBlockEntity, TimeBlockId, TimeRange

class SuggestedTimeCreateRequest(BaseModel):
  match_id: int
  suggested_new_times: List[TimeRange]

class SuggestedTimeGetRequest(BaseModel):
  match_id: int

class SuggestedTimeDeleteRequest(BaseModel):
  match_id: int

class SuggestedTimeEntity(BaseModel):
  id: int
  match_id: int
  timeblock_id: TimeBlockId

class SuggestedTimeCreateResponse(BaseModel):
  match_id: int
  suggested_new_times: List[TimeRange]

class SuggestedTimeGetResponse(BaseModel):
  match_id: int
  suggested_times: List[TimeBlockEntity]
