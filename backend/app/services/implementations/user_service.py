import firebase_admin.auth
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserInDB
from app.services.interfaces.user_service import IUserService
import logging

class UserService(IUserService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def create_user(self, user: UserCreate) -> UserInDB:
        firebase_user = None
        try:
            # Create user in Firebase
            firebase_user = firebase_admin.auth.create_user(
                email=user.email,
                password=user.password
            )

            # Create user in database
            db_user = User(
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                role=user.role,
                auth_id=firebase_user.uid
            )
            self.db.add(db_user)
            self.db.commit()
            self.db.refresh(db_user)

            return UserInDB.from_orm(db_user)

        except firebase_admin.auth.AuthError as firebase_error:
            # If Firebase failed to add, the user wasn't added to the db so nothing to rollback
            self.logger.error(f"Firebase authentication error: {str(firebase_error)}")
            raise HTTPException(status_code=400, detail=str(firebase_error))

        except Exception as e:
            # If database insertion fails, we need to delete the Firebase user
            if firebase_user:
                try:
                    firebase_admin.auth.delete_user(firebase_user.uid)
                except firebase_admin.auth.AuthError as firebase_error:
                    # Log the error if we couldn't delete the Firebase user
                    self.logger.error(f"Failed to delete Firebase user after database insertion failed. Firebase UID: {firebase_user.uid}. Error: {str(firebase_error)}")
            
            # Rollback the database session
            self.db.rollback()
            self.logger.error(f"Error creating user: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))