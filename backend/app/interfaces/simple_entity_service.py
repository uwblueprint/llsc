from abc import ABC, abstractmethod


class ISimpleEntityService(ABC):
    """
    A class to handle CRUD functionality for simple entities
    """

    @abstractmethod
    def get_entities(self):
        """Return a list of all simple entities

        :return: A list of dictionaries from SimpleEntity objects
        :rtype: list of dictionaries
        """
        pass

    @abstractmethod
    def get_entity(self, entity_id):
        """Return a dictionary from the SimpleEntity object based on id

        :param entity_id: SimpleEntity id
        :return: dictionary of SimpleEntity object
        :rtype: dictionary
        :raises Exception: id retrieval fails
        """
        pass

    @abstractmethod
    def create_entity(self, entity_data):
        """Create a new SimpleEntity object

        :param entity_data: dictionary of simple entity fields
        :return: dictionary of SimpleEntity object
        :rtype: dictionary
        :raises Exception: if simple entity fields are invalid
        """
        pass

    @abstractmethod
    def update_entity(self, entity_id, entity_data):
        """Update existing simple entity

        :param entity_data: dictionary of simple entity fields
        :param entity_id: SimpleEntity id
        :return: dictionary of SimpleEntity object
        :rtype: dictionary
        """
        pass

    @abstractmethod
    def delete_entity(self, entity_id):
        """Delete existing simple entity

        :param entity_id: SimpleEntity id
        :return: id of the SimpleEntity deleted
        :rtype: integer
        """
        pass
