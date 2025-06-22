"""
Interface for volunteer data service operations.
Defines the contract for volunteer data CRUD operations.
"""

from abc import ABC, abstractmethod
from typing import List

from app.schemas.volunteer_data import (
    VolunteerDataCreateRequest,
    VolunteerDataResponse,
    VolunteerDataUpdateRequest,
)


class IVolunteerDataService(ABC):
    """
    Interface for volunteer data service operations
    """

    @abstractmethod
    async def create_volunteer_data(
        self, volunteer_data: VolunteerDataCreateRequest
    ) -> VolunteerDataResponse:
        """Create new volunteer data entry"""
        pass

    @abstractmethod
    async def get_volunteer_data_by_id(self, volunteer_data_id: str) -> VolunteerDataResponse:
        """Get volunteer data by ID"""
        pass

    @abstractmethod
    async def get_volunteer_data_by_user_id(self, user_id: str) -> VolunteerDataResponse:
        """Get volunteer data by user ID"""
        pass

    @abstractmethod
    async def get_all_volunteer_data(self) -> List[VolunteerDataResponse]:
        """Get all volunteer data entries"""
        pass

    @abstractmethod
    async def update_volunteer_data_by_id(
        self, volunteer_data_id: str, volunteer_data_update: VolunteerDataUpdateRequest
    ) -> VolunteerDataResponse:
        """Update volunteer data by ID"""
        pass

    @abstractmethod
    async def delete_volunteer_data_by_id(self, volunteer_data_id: str) -> None:
        """Delete volunteer data by ID"""
        pass 