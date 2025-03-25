from datetime import datetime, timedelta
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.time_block import TimeBlockBase, TimeBlockId, TimeRange

class SuggestedTimeCreateRequest(BaseModel):
  match_id: int
  suggested_time_blocks: List[TimeBlockId]
  suggested_new_times: List[TimeRange]

class SuggestedTimeUpdateRequest(BaseModel):
  suggested_time_id: UUID
  time_blocks: List[TimeBlockId]


class SuggestedTimeDeleteRequest(BaseModel):
  suggested_time_id: UUID
  time_blocks: List[TimeBlockId]

class SuggestedTimeEntity(BaseModel):
  match_id: int
