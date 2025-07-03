from abc import ABC, abstractmethod
from uuid import UUID

from app.schemas.user_data import UserDataCreateRequest, UserDataUpdateRequest


class IUserDataService(ABC):
    """Interface with user data management methods."""

    @abstractmethod
    def get_user_data_by_id(self, user_data_id: UUID):
        """
        Get user data by its ID

        :param user_data_id: user data's id
        :type user_data_id: UUID
        :return: a UserDataResponse with user data information
        :rtype: UserDataResponse
        :raises Exception: if user data retrieval fails
        """
        pass

    @abstractmethod
    def get_user_data_by_user_id(self, user_id: UUID):
        """
        Get user data associated with a user ID

        :param user_id: user's id
        :type user_id: UUID
        :return: a UserDataResponse with user data information
        :rtype: UserDataResponse
        :raises Exception: if user data retrieval fails
        """
        pass

    @abstractmethod
    def create_user_data(self, user_data: UserDataCreateRequest):
        """
        Create user data for a user

        :param user_data: the user data to be created
        :type user_data: UserDataCreateRequest
        :return: the created user data
        :rtype: UserDataResponse
        :raises Exception: if user data creation fails
        """
        pass

    @abstractmethod
    def update_user_data_by_user_id(self, user_id: UUID, user_data: UserDataUpdateRequest):
        """
        Update user data for a user

        :param user_id: user's id
        :type user_id: UUID
        :param user_data: the user data to be updated
        :type user_data: UserDataUpdateRequest
        :return: the updated user data
        :rtype: UserDataResponse
        :raises Exception: if user data update fails
        """
        pass

    @abstractmethod
    def delete_user_data_by_id(self, user_data_id: UUID):
        """
        Delete user data by its ID

        :param user_data_id: user data's id
        :type user_data_id: UUID
        :raises Exception: if user data deletion fails
        """
        pass

    @abstractmethod
    def delete_user_data_by_user_id(self, user_id: UUID):
        """
        Delete user data by user ID

        :param user_id: user's id
        :type user_id: UUID
        :raises Exception: if user data deletion fails
        """
        pass
