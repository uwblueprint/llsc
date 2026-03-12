"""
Pydantic schemas for treatment and experience reference data.
Handles create requests and response models for the API.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TreatmentCreateRequest(BaseModel):
    """Request schema for creating a new treatment."""

    name: str = Field(..., min_length=1, description="Treatment name (e.g. Chemotherapy, Immunotherapy)")


class TreatmentResponse(BaseModel):
    """Response schema for a treatment."""

    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class ExperienceCreateRequest(BaseModel):
    """Request schema for creating a new experience."""

    name: str = Field(..., min_length=1, description="Experience name (e.g. Brain Fog, Fatigue)")
    scope: Literal["patient", "caregiver", "both", "none"] = Field(
        ...,
        description="Who the experience applies to: patient, caregiver, both, or none",
    )


class ExperienceResponse(BaseModel):
    """Response schema for an experience."""

    id: int
    name: str
    scope: Literal["patient", "caregiver", "both", "none"]

    model_config = ConfigDict(from_attributes=True)
