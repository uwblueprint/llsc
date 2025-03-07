import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import registry

mapper_registry = registry()
BaseModel = mapper_registry.generate_base()

class Base(BaseModel):
    __abstract__ = True  # Prevents table creation for this class

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  
    created_at = Column(DateTime, default=func.now())  
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())  
