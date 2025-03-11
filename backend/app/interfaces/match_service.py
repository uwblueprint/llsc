from abc import ABC, abstractmethod
from uuid import UUID

from app.schemas.match import MatchResponse

class IMatchService(ABC):
    """
    Interface for Match Service that manages patient-volunteer matches
    """

    @abstractmethod
    async def get_all_matches(self) -> list[MatchResponse]:
        """
        Get all matches in the system

        :return: List of match objects with details
        :rtype: list[MatchResponse]
        :raises Exception: if retrieval fails
        """
        pass

    @abstractmethod
    async def get_match(self, match_id: UUID) -> MatchResponse:
        """
        Get a specific match by ID

        :param match_id: The unique identifier of the match
        :type match_id: UUID
        :return: Match information
        :rtype: MatchResponse
        :raises Exception: if match retrieval fails
        """
        pass

    @abstractmethod
    async def delete_match(self, match_id: UUID) -> bool:
        """
        Delete a match by its ID

        :param match_id: The unique identifier of the match to delete
        :type match_id: UUID
        :return: True if deletion successful, False otherwise
        :rtype: bool
        :raises Exception: if match deletion fails
        """
        pass