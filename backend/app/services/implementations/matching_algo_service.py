import logging
import sys
import os
from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.Role import Role
from app.interfaces.matching_algo_service import IMatchingAlgoService
from app.models.User import User
from app.schemas.user import UserBase

# Import the matching algorithm
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.matching.main import find_best_matches


class MatchingAlgoService(IMatchingAlgoService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    def _convert_user_to_match_format(self, user):
        """Convert user and form data to the format required by the matching algorithm"""
        if not user.form:
            return None
            
        return {
            "First Name": user.first_name,
            "Last Name": user.last_name,
            "Date of Birth": str(user.form.date_of_birth) if user.form.date_of_birth else None,
            "Gender Identity": user.form.gender_identity,
            "Ethnicity": user.form.ethnicity,
            "Marital Status": user.form.marital_status,
            "Children Status": user.form.children_status,
            "Diagnostic": user.form.diagnostic,
            "Language": user.form.language,
            "Treatment": user.form.treatment.split(",") if user.form.treatment else [],
            "Experience": user.form.experience.split(",") if user.form.experience else [],
            "Preferences": user.form.preferences.split(",") if user.form.preferences else [],
            "Role": "Volunteer" if user.role_id == 1 else "Participant"
        }

    # Consider changing the main.py to accomadate the new users sent in instead of the old format
    async def get_matches(self, user_id: UUID) -> List[UserBase]:
        """
        Find potential volunteer matches for a participant.
        
        :param user_id: ID of the participant user to find matches for
        :return: List of matching volunteer profiles
        :raises ValueError: If user is not found or not a participant
        """
        try:
            # Get the participant user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User with ID {user_id} not found")
            
            # Verify this is a participant (role_id = 2)
            #RBAC, maybe implement this in the route itself.
            if user.role.name != "PARTICIPANT":  # Using the role name
                raise ValueError(f"User with ID {user_id} is not a participant")
            
            # Check if the user has form data
            if not user.form:
                raise ValueError(f"User with ID {user_id} has no form data")
            
            # Get all volunteers (role_id = 1) with their form data
            volunteers = self.db.query(User).join(User.role).filter(Role.name == "VOLUNTEER").all()
            
            # Convert the participant and volunteers to the format needed by the algorithm
            patient_data = self._convert_user_to_match_format(user)
            
            # Filter out volunteers without form data and convert to matching format
            volunteer_data = []
            for volunteer in volunteers:
                if volunteer.form:
                    volunteer_info = self._convert_user_to_match_format(volunteer)
                    if volunteer_info:
                        volunteer_data.append(volunteer_info)
            
            if not patient_data:
                return []
                
            # Run the matching algorithm
            matches = find_best_matches([patient_data], volunteer_data)
            
            # Get the patient's matches
            user_full_name = f"{user.first_name} {user.last_name}"
            matched_volunteers = []
            
            if user_full_name in matches:
                volunteer_matches = matches[user_full_name]
                # Map back to User objects
                for match in volunteer_matches:
                    volunteer_data = match["Volunteer"]
                    volunteer = next(
                        (v for v in volunteers 
                         if v.first_name == volunteer_data["First Name"] 
                         and v.last_name == volunteer_data["Last Name"]), 
                        None
                    )
                    if volunteer:
                        matched_volunteers.append(volunteer)
            
            # Convert to response models
            return [UserBase.from_orm(volunteer) for volunteer in matched_volunteers]
            
        except ValueError as ve:
            raise ve
        except Exception as e:
            self.logger.error(f"Error finding matches: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Internal server error during matching process: {str(e)}")