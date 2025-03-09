from abc import ABC, abstractmethod
from typing import List
from app.schemas.user import UserBase
from uuid import UUID


class IMatchingAlgoService(ABC):
    """
    Interface for the Matching Algorithm Service, defining methods to find
    potential matches between users.
    """

    @abstractmethod
    async def get_matches(self, user_id: UUID) -> List[UserBase]:
        """
        Find potential matches based on the given user ID.

        :param user_id: ID of the user to find matches for
        :type user_id: UUID
        :return: List of matching users
        :rtype: List[UserBase]
        :raises Exception: If matching process fails
        """
        pass