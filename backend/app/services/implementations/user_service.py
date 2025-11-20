import logging
from typing import List
from uuid import UUID

import firebase_admin.auth
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.interfaces.user_service import IUserService
from app.models import Experience, FormStatus, Role, Treatment, User, UserData
from app.schemas.availability import AvailabilityTemplateSlot
from app.schemas.user import (
    SignUpMethod,
    UserCreateRequest,
    UserCreateResponse,
    UserResponse,
    UserRole,
    UserUpdateRequest,
)
from app.schemas.user_data import UserDataUpdateRequest
from app.utilities.constants import LOGGER_NAME


class UserService(IUserService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(LOGGER_NAME("user_service"))

    async def create_user(self, user: UserCreateRequest) -> UserCreateResponse:
        firebase_user = None
        try:
            if user.signup_method == SignUpMethod.PASSWORD:
                firebase_user = firebase_admin.auth.create_user(email=user.email, password=user.password)
            ## TO DO: SSO functionality depends a lot on frontend implementation,
            ##   so we may need to update this when we have a better idea of what
            ##   that looks like
            elif user.signup_method == SignUpMethod.GOOGLE:
                # For signup with Google, Firebase users are automatically created
                firebase_user = firebase_admin.auth.get_user(user.auth_id)

            role_id = UserRole.to_role_id(user.role)

            initial_status = FormStatus.INTAKE_TODO
            if role_id == UserRole.to_role_id(UserRole.ADMIN):
                initial_status = FormStatus.COMPLETED

            # Create user in database
            db_user = User(
                first_name=user.first_name or "",
                last_name=user.last_name or "",
                email=user.email,
                role_id=role_id,
                auth_id=firebase_user.uid,
                form_status=initial_status,
            )

            self.db.add(db_user)
            # Finish database transaction and run previously defined
            #   database operations (ie. db.add)
            self.db.commit()

            return UserCreateResponse.model_validate(db_user)

        except firebase_admin.exceptions.FirebaseError as firebase_error:
            self.logger.error(f"Firebase error: {str(firebase_error)}")

            if isinstance(firebase_error, firebase_admin.auth.EmailAlreadyExistsError):
                raise HTTPException(status_code=409, detail="Email already exists")

            raise HTTPException(status_code=400, detail=str(firebase_error))

        except Exception as e:
            # Clean up Firebase user if a database exception occurs
            if firebase_user:
                try:
                    firebase_admin.auth.delete_user(firebase_user.uid)
                except firebase_admin.auth.AuthError as firebase_error:
                    self.logger.error(
                        "Failed to delete Firebase user after database insertion failed"
                        f"Firebase UID: {firebase_user.uid}. "
                        f"Error: {str(firebase_error)}"
                    )

            # Rollback database changes
            self.db.rollback()
            self.logger.error(f"Error creating user: {str(e)}")

            raise HTTPException(status_code=500, detail=str(e))

    async def delete_user_by_email(self, email: str):
        try:
            db_user = self.db.query(User).filter(User.email == email).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            self.db.delete(db_user)
            self.db.commit()

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting user with email {email}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_user_by_id(self, user_id: str):
        try:
            db_user = self.db.query(User).filter(User.id == UUID(user_id)).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            self.db.delete(db_user)
            self.db.commit()

        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def soft_delete_user_by_id(self, user_id: str):
        try:
            db_user = self.db.query(User).filter(User.id == UUID(user_id)).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            db_user.active = False
            self.db.commit()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deactivating user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_user_id_by_auth_id(self, auth_id: str) -> str:
        """Get user ID for a user by their Firebase auth_id"""
        user = self.db.query(User).filter(User.auth_id == auth_id).first()
        if not user:
            raise ValueError(f"User with auth_id {auth_id} not found")
        return str(user.id)  # Convert UUID to string

    def get_user_by_email(self, email: str):
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise ValueError(f"User with email {email} not found")
        return user

    async def get_user_by_id(self, user_id: str) -> UserResponse:
        try:
            user = (
                self.db.query(User)
                .options(
                    joinedload(User.role),
                    joinedload(User.user_data).joinedload(UserData.treatments),
                    joinedload(User.user_data).joinedload(UserData.experiences),
                    joinedload(User.user_data).joinedload(UserData.loved_one_treatments),
                    joinedload(User.user_data).joinedload(UserData.loved_one_experiences),
                    joinedload(User.volunteer_data),
                    joinedload(User.availability_templates),
                )
                .filter(User.id == UUID(user_id))
                .first()
            )
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Convert templates to AvailabilityTemplateSlot for UserResponse
            availability_templates = []
            for template in user.availability_templates:
                if template.is_active:
                    availability_templates.append(
                        AvailabilityTemplateSlot(
                            day_of_week=template.day_of_week, start_time=template.start_time, end_time=template.end_time
                        )
                    )

            # Create a temporary user object with availability for validation
            user_dict = {
                **{c.name: getattr(user, c.name) for c in user.__table__.columns},
                "availability": availability_templates,
                "role": user.role,
                "user_data": user.user_data,
                "volunteer_data": user.volunteer_data,
            }

            return UserResponse.model_validate(user_dict)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Error retrieving user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_auth_id_by_user_id(self, user_id: str) -> str:
        """Get Firebase auth_id for a user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User with id {user_id} not found")
        return user.auth_id

    def get_user_role_by_auth_id(self, auth_id: str) -> str:
        """Get role name for a user by their Firebase auth_id"""
        user = self.db.query(User).join(Role).filter(User.auth_id == auth_id).first()
        if not user:
            raise ValueError(f"User with auth_id {auth_id} not found")
        return user.role.name

    async def get_users(self) -> List[UserResponse]:
        try:
            # Filter users to only include participants and volunteers (role_id 1 and 2)
            users = (
                self.db.query(User)
                .options(
                    joinedload(User.role),
                    joinedload(User.user_data),
                    joinedload(User.volunteer_data),
                    joinedload(User.availability_templates),
                )
                .filter(User.role_id.in_([1, 2]))
                .all()
            )

            # Convert templates to AvailabilityTemplateSlot for each user
            user_responses = []
            for user in users:
                availability_templates = []
                for template in user.availability_templates:
                    if template.is_active:
                        availability_templates.append(
                            AvailabilityTemplateSlot(
                                day_of_week=template.day_of_week,
                                start_time=template.start_time,
                                end_time=template.end_time,
                            )
                        )

                user_dict = {
                    **{c.name: getattr(user, c.name) for c in user.__table__.columns},
                    "availability": availability_templates,
                    "role": user.role,
                    "user_data": user.user_data,
                    "volunteer_data": user.volunteer_data,
                }
                user_responses.append(UserResponse.model_validate(user_dict))

            return user_responses
        except Exception as e:
            self.logger.error(f"Error getting users: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_admins(self) -> List[UserResponse]:
        try:
            # Get only admin users (role_id 3)
            users = (
                self.db.query(User)
                .options(
                    joinedload(User.role),
                    joinedload(User.availability_templates),
                )
                .filter(User.role_id == 3)
                .all()
            )

            # Convert templates to AvailabilityTemplateSlot for each admin (though admins typically don't have availability)
            user_responses = []
            for user in users:
                availability_templates = []
                for template in user.availability_templates:
                    if template.is_active:
                        availability_templates.append(
                            AvailabilityTemplateSlot(
                                day_of_week=template.day_of_week,
                                start_time=template.start_time,
                                end_time=template.end_time,
                            )
                        )

                user_dict = {
                    **{c.name: getattr(user, c.name) for c in user.__table__.columns},
                    "availability": availability_templates,
                    "role": user.role,
                    "user_data": user.user_data,
                    "volunteer_data": user.volunteer_data,
                }
                user_responses.append(UserResponse.model_validate(user_dict))

            return user_responses
        except Exception as e:
            self.logger.error(f"Error retrieving admin users: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def update_user_by_id(self, user_id: str, user_update: UserUpdateRequest) -> UserResponse:
        try:
            db_user = self.db.query(User).filter(User.id == UUID(user_id)).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            # update provided fields only
            update_data = user_update.model_dump(exclude_unset=True)

            # handle role conversion if role is being updated
            if "role" in update_data:
                update_data["role_id"] = UserRole.to_role_id(update_data.pop("role"))

            if "form_status" in update_data:
                try:
                    update_data["form_status"] = FormStatus(update_data["form_status"])
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid form status")

            for field, value in update_data.items():
                setattr(db_user, field, value)

            self.db.commit()
            self.db.refresh(db_user)

            # return user with role information and availability
            updated_user = (
                self.db.query(User)
                .options(
                    joinedload(User.role),
                    joinedload(User.availability_templates),
                )
                .filter(User.id == UUID(user_id))
                .first()
            )

            # Convert templates to AvailabilityTemplateSlot for UserResponse
            availability_templates = []
            for template in updated_user.availability_templates:
                if template.is_active:
                    availability_templates.append(
                        AvailabilityTemplateSlot(
                            day_of_week=template.day_of_week, start_time=template.start_time, end_time=template.end_time
                        )
                    )

            user_dict = {
                **{c.name: getattr(updated_user, c.name) for c in updated_user.__table__.columns},
                "availability": availability_templates,
                "role": updated_user.role,
                "user_data": updated_user.user_data,
                "volunteer_data": updated_user.volunteer_data,
            }

            return UserResponse.model_validate(user_dict)

        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def update_user_data_by_id(self, user_id: str, user_data_update: UserDataUpdateRequest) -> UserResponse:
        """
        Update user_data fields for a user. Handles partial updates including
        treatments and experiences (many-to-many relationships).
        """
        try:
            db_user = self.db.query(User).filter(User.id == UUID(user_id)).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            # Get or create UserData
            user_data = self.db.query(UserData).filter(UserData.user_id == UUID(user_id)).first()
            if not user_data:
                user_data = UserData(user_id=UUID(user_id))
                self.db.add(user_data)
                self.db.flush()

            update_data = user_data_update.model_dump(exclude_unset=True)

            # Update simple fields (personal info, demographics, cancer experience)
            simple_fields = [
                # Personal Information
                "first_name",
                "last_name",
                "date_of_birth",
                "phone",
                "city",
                "province",
                "postal_code",
                # Demographics
                "gender_identity",
                "marital_status",
                "has_kids",
                "timezone",
                # Cancer Experience
                "diagnosis",
                "date_of_diagnosis",
                "additional_info",
                # Loved One Demographics
                "loved_one_gender_identity",
                "loved_one_age",
                # Loved One Cancer Experience
                "loved_one_diagnosis",
                "loved_one_date_of_diagnosis",
            ]
            for field in simple_fields:
                if field in update_data:
                    setattr(user_data, field, update_data[field])
                    # Sync first_name and last_name to User table for consistency
                    if field in ("first_name", "last_name"):
                        setattr(db_user, field, update_data[field])

            # Handle pronouns (array field)
            if "pronouns" in update_data:
                user_data.pronouns = update_data["pronouns"]

            # Handle ethnic_group (array field)
            if "ethnic_group" in update_data:
                user_data.ethnic_group = update_data["ethnic_group"]

            # Handle treatments (many-to-many)
            if "treatments" in update_data:
                user_data.treatments.clear()
                if update_data["treatments"]:
                    for treatment_name in update_data["treatments"]:
                        if treatment_name:
                            treatment = self.db.query(Treatment).filter(Treatment.name == treatment_name).first()
                            if treatment:
                                user_data.treatments.append(treatment)

            # Handle experiences (many-to-many)
            if "experiences" in update_data:
                user_data.experiences.clear()
                if update_data["experiences"]:
                    for experience_name in update_data["experiences"]:
                        if experience_name:
                            experience = self.db.query(Experience).filter(Experience.name == experience_name).first()
                            if experience:
                                user_data.experiences.append(experience)

            # Handle loved one treatments (many-to-many)
            if "loved_one_treatments" in update_data:
                user_data.loved_one_treatments.clear()
                if update_data["loved_one_treatments"]:
                    for treatment_name in update_data["loved_one_treatments"]:
                        if treatment_name:
                            treatment = self.db.query(Treatment).filter(Treatment.name == treatment_name).first()
                            if treatment:
                                user_data.loved_one_treatments.append(treatment)

            # Handle loved one experiences (many-to-many)
            if "loved_one_experiences" in update_data:
                user_data.loved_one_experiences.clear()
                if update_data["loved_one_experiences"]:
                    for experience_name in update_data["loved_one_experiences"]:
                        if experience_name:
                            experience = self.db.query(Experience).filter(Experience.name == experience_name).first()
                            if experience:
                                user_data.loved_one_experiences.append(experience)

            self.db.commit()
            self.db.refresh(db_user)

            # Return updated user with all relationships loaded
            updated_user = (
                self.db.query(User)
                .options(
                    joinedload(User.role),
                    joinedload(User.user_data).joinedload(UserData.treatments),
                    joinedload(User.user_data).joinedload(UserData.experiences),
                    joinedload(User.user_data).joinedload(UserData.loved_one_treatments),
                    joinedload(User.user_data).joinedload(UserData.loved_one_experiences),
                    joinedload(User.volunteer_data),
                    joinedload(User.availability_templates),
                )
                .filter(User.id == UUID(user_id))
                .first()
            )

            # Convert templates to AvailabilityTemplateSlot for UserResponse (same as get_user_by_id)
            availability_templates = []
            for template in updated_user.availability_templates:
                if template.is_active:
                    availability_templates.append(
                        AvailabilityTemplateSlot(
                            day_of_week=template.day_of_week, start_time=template.start_time, end_time=template.end_time
                        )
                    )

            # Create a temporary user object with availability for validation
            user_dict = {
                **{c.name: getattr(updated_user, c.name) for c in updated_user.__table__.columns},
                "availability": availability_templates,
                "role": updated_user.role,
                "user_data": updated_user.user_data,
                "volunteer_data": updated_user.volunteer_data,
            }

            return UserResponse.model_validate(user_dict)

        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating user_data for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
