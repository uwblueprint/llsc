from abc import ABC, abstractmethod
from uuid import UUID
from typing import List

from app.schemas.match import MatchCreateRequest, MatchUpdateRequest, MatchResponse


class IMatchingService(ABC):
    """
    Interface for the Matching Service, defining required methods.
    """

    @abstractmethod
    async def get_match(self, match_id: UUID) -> MatchResponse:
        """
        Get the match details by match ID.

        :param match_id: UUID of the match.
        :return: MatchResponse containing match details.
        :raises Exception: if retrieval fails.
        """
        pass

    @abstractmethod
    async def create_match(self, match_data: MatchCreateRequest) -> MatchResponse:
        """
        Create a match between two users.

        :param match_data: MatchCreateRequest containing user1_id, user2_id.
        :return: MatchResponse containing the created match details.
        :raises Exception: if creation fails.
        """
        pass

    @abstractmethod
    async def update_match(self, match_id: UUID, match_data: MatchUpdateRequest) -> MatchResponse:
        """
        Update the match details.

        :param match_id: UUID of the match.
        :param match_data: MatchUpdateRequest containing the updated match data.
        :return: MatchResponse containing updated match details.
        :raises Exception: if update fails.
        """
        pass

    @abstractmethod 
    async def delete_match(self, match_id: UUID) -> None: # update this
        """
        Delete a match by match ID.

        :param match_id: UUID of the match.
        :raises Exception: if deletion fails.
        """
        pass

    @abstractmethod
    async def get_user_matches(self, user_id: UUID, start_index: int, end_index: int) -> List[MatchResponse]: # update this
        """
        Get paginated matches for a user.

        :param user_id: UUID of the user.
        :param start_index: Start index of the matches.
        :param end_index: End index of the matches.
        :return: List of MatchResponse.
        """
        pass
