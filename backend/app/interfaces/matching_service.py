from abc import ABC, abstractmethod
from typing import Any, Dict, List
from uuid import UUID


class IMatchingService(ABC):
    """
    Interface for the Matching Service, defining methods to find
    potential matches between users.
    """

    @abstractmethod
    async def get_matches(self, user_id: UUID) -> List[Dict[str, Any]]:
        """
        Find potential matches based on the given user ID.

        :param user_id: ID of the user to find matches for
        :type user_id: UUID
        :return: List of dictionaries with 'user' and 'score' keys
        :rtype: List[Dict[str, Any]]
        :raises Exception: If matching process fails
        """
        pass
