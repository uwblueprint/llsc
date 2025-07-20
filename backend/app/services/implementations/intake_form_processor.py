from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models import UserData, Treatment, Experience, User
import logging

logger = logging.getLogger(__name__)


class IntakeFormProcessor:
    """
    Processes intake form JSON submissions into structured database tables.
    Handles both predefined options and custom "Other" entries.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def process_form_submission(self, user_id: str, form_data: Dict[str, Any]) -> UserData:
        """
        Main method to process a complete intake form submission.
        
        Args:
            user_id: The user's UUID
            form_data: The complete form data from frontend
            
        Returns:
            UserData: The created/updated user data record
        """
        try:
            # Get or create UserData record
            user_data = self._get_or_create_user_data(user_id)
            
            # Process different sections of the form
            self._process_personal_info(user_data, form_data.get('personalInfo', {}))
            self._process_demographics(user_data, form_data.get('demographics', {}))
            self._process_cancer_experience(user_data, form_data.get('cancerExperience', {}))
            self._process_flow_control(user_data, form_data)
            
            # Process treatments and experiences (many-to-many)
            self._process_treatments(user_data, form_data.get('cancerExperience', {}))
            self._process_experiences(user_data, form_data.get('cancerExperience', {}))
            
            # Process caregiver experience for volunteers (separate from cancer experience)
            if 'caregiverExperience' in form_data:
                self._process_caregiver_experience(user_data, form_data['caregiverExperience'])
            
            # Process loved one data if present
            if 'lovedOne' in form_data:
                self._process_loved_one_data(user_data, form_data['lovedOne'])
            
            # Save to database
            self.db.add(user_data)
            self.db.commit()
            self.db.refresh(user_data)
            
            logger.info(f"Successfully processed intake form for user {user_id}")
            return user_data
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing intake form for user {user_id}: {str(e)}")
            raise
    
    def _get_or_create_user_data(self, user_id: str) -> UserData:
        """Get existing UserData or create new one."""
        user_data = self.db.query(UserData).filter(UserData.id == user_id).first()
        if not user_data:
            user_data = UserData(id=user_id)
        return user_data
    
    def _process_personal_info(self, user_data: UserData, personal_info: Dict[str, Any]):
        """Process personal information fields."""
        if not personal_info:
            return
            
        user_data.first_name = personal_info.get('firstName')
        user_data.last_name = personal_info.get('lastName')
        user_data.city = personal_info.get('city')
        user_data.province = personal_info.get('province')
        user_data.postal_code = personal_info.get('postalCode')
        user_data.phone = personal_info.get('phoneNumber')
        
        # Parse date of birth
        dob_str = personal_info.get('dateOfBirth')
        if dob_str:
            try:
                # Assuming format DD/MM/YYYY from frontend
                user_data.date_of_birth = datetime.strptime(dob_str, '%d/%m/%Y').date()
            except ValueError:
                try:
                    # Try ISO format as fallback
                    user_data.date_of_birth = datetime.fromisoformat(dob_str).date()
                except ValueError:
                    logger.warning(f"Could not parse date of birth: {dob_str}")
    
    def _process_demographics(self, user_data: UserData, demographics: Dict[str, Any]):
        """Process demographic information."""
        if not demographics:
            return
            
        user_data.gender_identity = demographics.get('genderIdentity')
        user_data.pronouns = demographics.get('pronouns', [])  # Array
        user_data.ethnic_group = demographics.get('ethnicGroup', [])  # Array
        user_data.marital_status = demographics.get('maritalStatus')
        user_data.has_kids = demographics.get('hasKids')
        
        # Handle custom gender identity
        if user_data.gender_identity == 'Self-describe':
            user_data.gender_identity_custom = demographics.get('genderIdentityCustom')
        
        # Handle custom ethnic group
        ethnic_groups = demographics.get('ethnicGroup', [])
        if 'Other' in ethnic_groups:
            user_data.other_ethnic_group = demographics.get('ethnicGroupCustom')
    
    def _process_cancer_experience(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """Process cancer experience information."""
        if not cancer_exp:
            return
            
        user_data.diagnosis = cancer_exp.get('diagnosis')
        
        # Parse diagnosis date
        diag_date_str = cancer_exp.get('dateOfDiagnosis')
        if diag_date_str:
            try:
                user_data.date_of_diagnosis = datetime.strptime(diag_date_str, '%d/%m/%Y').date()
            except ValueError:
                try:
                    user_data.date_of_diagnosis = datetime.fromisoformat(diag_date_str).date()
                except ValueError:
                    logger.warning(f"Could not parse diagnosis date: {diag_date_str}")
        
        # Handle "Other" treatment and experience text
        user_data.other_treatment = cancer_exp.get('otherTreatment')
        user_data.other_experience = cancer_exp.get('otherExperience')
    
    def _process_flow_control(self, user_data: UserData, form_data: Dict[str, Any]):
        """Process flow control fields."""
        user_data.has_blood_cancer = form_data.get('hasBloodCancer')
        user_data.caring_for_someone = form_data.get('caringForSomeone')
    
    def _process_treatments(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """
        Process treatments - map frontend names to database records.
        Handles both predefined options and creates new ones for custom entries.
        """
        treatment_names = cancer_exp.get('treatments', [])
        if not treatment_names:
            return
        
        # Clear existing treatments
        user_data.treatments.clear()
        
        for treatment_name in treatment_names:
            if not treatment_name:
                continue
                
            # Find existing treatment
            treatment = self.db.query(Treatment).filter(
                Treatment.name == treatment_name
            ).first()
            
            if treatment:
                user_data.treatments.append(treatment)
            else:
                # Create new treatment for custom entry
                logger.info(f"Creating new treatment: {treatment_name}")
                new_treatment = Treatment(name=treatment_name)
                self.db.add(new_treatment)
                self.db.flush()  # Get the ID
                user_data.treatments.append(new_treatment)
    
    def _process_experiences(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """
        Process experiences - map frontend names to database records.
        Handles both predefined options and creates new ones for custom entries.
        """
        experience_names = cancer_exp.get('experiences', [])
        if not experience_names:
            return
        
        # Clear existing experiences
        user_data.experiences.clear()
        
        for experience_name in experience_names:
            if not experience_name:
                continue
                
            # Find existing experience
            experience = self.db.query(Experience).filter(
                Experience.name == experience_name
            ).first()
            
            if experience:
                user_data.experiences.append(experience)
            else:
                # Create new experience for custom entry
                logger.info(f"Creating new experience: {experience_name}")
                new_experience = Experience(name=experience_name)
                self.db.add(new_experience)
                self.db.flush()  # Get the ID
                user_data.experiences.append(new_experience)
    
    def _process_caregiver_experience(self, user_data: UserData, caregiver_exp: Dict[str, Any]):
        """
        Process caregiver experience for volunteers who are caregivers without cancer.
        Maps caregiver experiences to the same user_experiences table as cancer experiences.
        """
        if not caregiver_exp:
            return
        
        # Handle "Other" caregiver experience text
        user_data.other_experience = caregiver_exp.get('otherExperience')
        
        # Process caregiver experiences - map to same experiences table
        experience_names = caregiver_exp.get('experiences', [])
        if not experience_names:
            return
        
        # Note: We don't clear existing experiences here in case user has both 
        # cancer and caregiver experiences (though that would be in cancerExperience)
        
        for experience_name in experience_names:
            if not experience_name:
                continue
                
            # Find existing experience
            experience = self.db.query(Experience).filter(
                Experience.name == experience_name
            ).first()
            
            if experience:
                # Only add if not already present
                if experience not in user_data.experiences:
                    user_data.experiences.append(experience)
            else:
                # Create new experience for custom entry
                logger.info(f"Creating new caregiver experience: {experience_name}")
                new_experience = Experience(name=experience_name)
                self.db.add(new_experience)
                self.db.flush()  # Get the ID
                user_data.experiences.append(new_experience)
    
    def _process_loved_one_data(self, user_data: UserData, loved_one_data: Dict[str, Any]):
        """Process loved one data including demographics and cancer experience."""
        if not loved_one_data:
            return
        
        # Process loved one demographics
        self._process_loved_one_demographics(user_data, loved_one_data.get('demographics', {}))
        
        # Process loved one cancer experience
        self._process_loved_one_cancer_experience(user_data, loved_one_data.get('cancerExperience', {}))
        
        # Process loved one treatments and experiences
        self._process_loved_one_treatments(user_data, loved_one_data.get('cancerExperience', {}))
        self._process_loved_one_experiences(user_data, loved_one_data.get('cancerExperience', {}))
    
    def _process_loved_one_demographics(self, user_data: UserData, demographics: Dict[str, Any]):
        """Process loved one demographic information."""
        if not demographics:
            return
            
        user_data.loved_one_gender_identity = demographics.get('genderIdentity')
        user_data.loved_one_age = demographics.get('age')
    
    def _process_loved_one_cancer_experience(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """Process loved one cancer experience information."""
        if not cancer_exp:
            return
            
        user_data.loved_one_diagnosis = cancer_exp.get('diagnosis')
        
        # Parse loved one diagnosis date
        diag_date_str = cancer_exp.get('dateOfDiagnosis')
        if diag_date_str:
            try:
                user_data.loved_one_date_of_diagnosis = datetime.strptime(diag_date_str, '%d/%m/%Y').date()
            except ValueError:
                try:
                    user_data.loved_one_date_of_diagnosis = datetime.fromisoformat(diag_date_str).date()
                except ValueError:
                    logger.warning(f"Could not parse loved one diagnosis date: {diag_date_str}")
        
        # Handle "Other" treatment and experience text for loved one
        user_data.loved_one_other_treatment = cancer_exp.get('otherTreatment')
        user_data.loved_one_other_experience = cancer_exp.get('otherExperience')
    
    def _process_loved_one_treatments(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """Process loved one treatments - map frontend names to database records."""
        treatment_names = cancer_exp.get('treatments', [])
        if not treatment_names:
            return
        
        # Clear existing loved one treatments
        user_data.loved_one_treatments.clear()
        
        for treatment_name in treatment_names:
            if not treatment_name:
                continue
                
            # Find existing treatment
            treatment = self.db.query(Treatment).filter(
                Treatment.name == treatment_name
            ).first()
            
            if treatment:
                user_data.loved_one_treatments.append(treatment)
            else:
                # Create new treatment for custom entry
                logger.info(f"Creating new loved one treatment: {treatment_name}")
                new_treatment = Treatment(name=treatment_name)
                self.db.add(new_treatment)
                self.db.flush()  # Get the ID
                user_data.loved_one_treatments.append(new_treatment)
    
    def _process_loved_one_experiences(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """Process loved one experiences - map frontend names to database records."""
        experience_names = cancer_exp.get('experiences', [])
        if not experience_names:
            return
        
        # Clear existing loved one experiences
        user_data.loved_one_experiences.clear()
        
        for experience_name in experience_names:
            if not experience_name:
                continue
                
            # Find existing experience
            experience = self.db.query(Experience).filter(
                Experience.name == experience_name
            ).first()
            
            if experience:
                user_data.loved_one_experiences.append(experience)
            else:
                # Create new experience for custom entry
                logger.info(f"Creating new loved one experience: {experience_name}")
                new_experience = Experience(name=experience_name)
                self.db.add(new_experience)
                self.db.flush()  # Get the ID
                user_data.loved_one_experiences.append(new_experience)
    
    def process_ranking_form(self, user_id: str, ranking_data: Dict[str, Any]):
        """
        Process ranking form submission for user preferences.
        
        Args:
            user_id: The user's UUID
            ranking_data: The ranking preferences data
        """
        # TODO: Implement ranking preferences processing
        # This would handle RankingPreference model population
        pass 
