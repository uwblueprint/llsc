import logging
from datetime import timedelta, time as dt_time
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import AvailabilityTemplate, User
from app.schemas.availability import (
    AvailabilityEntity,
    AvailabilityTemplateSlot,
    CreateAvailabilityRequest,
    CreateAvailabilityResponse,
    DeleteAvailabilityRequest,
    DeleteAvailabilityResponse,
    GetAvailabilityRequest,
)


class AvailabilityService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def get_availability(self, req: GetAvailabilityRequest) -> AvailabilityEntity:
        """
        Takes a user_id and returns availability templates.
        """
        try:
            user_id = req.user_id
            user = self.db.query(User).filter_by(id=user_id).one()
            
            # Get templates
            templates = self.db.query(AvailabilityTemplate).filter_by(
                user_id=user_id, is_active=True
            ).all()
            
            # Convert to response format
            template_slots: List[AvailabilityTemplateSlot] = []
            for template in templates:
                template_slots.append(AvailabilityTemplateSlot(
                    day_of_week=template.day_of_week,
                    start_time=template.start_time,
                    end_time=template.end_time
                ))
            
            validated_data = AvailabilityEntity.model_validate(
                {"user_id": user_id, "templates": template_slots}
            )
            return validated_data

        except Exception as e:
            self.logger.error(f"Error getting availability: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def create_availability(self, availability: CreateAvailabilityRequest) -> CreateAvailabilityResponse:
        """
        Takes a user_id and template slots (day_of_week + time ranges).
        Converts these to AvailabilityTemplate records.
        Replaces all existing templates for the user.
        """
        added = 0
        try:
            user_id = availability.user_id
            user = self.db.query(User).filter_by(id=user_id).one()
            
            # Delete all existing templates for this user
            self.db.query(AvailabilityTemplate).filter_by(user_id=user_id).delete()
            
            # Track templates we've seen to avoid duplicates
            seen_templates = set()
            
            for template_slot in availability.templates:
                # Validate day_of_week
                if not (0 <= template_slot.day_of_week <= 6):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid day_of_week: {template_slot.day_of_week}. Must be 0-6 (Monday-Sunday)"
                    )
                
                # Validate time range
                if template_slot.end_time <= template_slot.start_time:
                    raise HTTPException(
                        status_code=400,
                        detail=f"end_time must be after start_time"
                    )
                
                # Create template for each 30-minute block in the range
                current_time = template_slot.start_time
                end_time = template_slot.end_time
                
                while current_time < end_time:
                    # Calculate next 30-minute increment
                    next_time = self._add_minutes(current_time, 30)
                    if next_time > end_time:
                        next_time = end_time
                    
                    template_key = (template_slot.day_of_week, current_time)
                    
                    if template_key not in seen_templates:
                        template = AvailabilityTemplate(
                            user_id=user_id,
                            day_of_week=template_slot.day_of_week,
                            start_time=current_time,
                            end_time=next_time,
                            is_active=True
                        )
                        self.db.add(template)
                        seen_templates.add(template_key)
                        added += 1
                    
                    current_time = next_time

            self.db.flush()
            validated_data = CreateAvailabilityResponse.model_validate({"user_id": user_id, "added": added})
            self.db.commit()
            return validated_data
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating availability: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_availability(self, req: DeleteAvailabilityRequest) -> DeleteAvailabilityResponse:
        """
        Takes a DeleteAvailabilityRequest with template slots.
        Deletes matching AvailabilityTemplate records.
        Non-existent templates will be silently ignored.
        """
        deleted = 0

        try:
            user_id = req.user_id
            user = self.db.query(User).filter(User.id == user_id).one()
            
            # Collect templates to delete
            templates_to_delete = set()
            
            for template_slot in req.templates:
                # Validate day_of_week
                if not (0 <= template_slot.day_of_week <= 6):
                    self.logger.warning(f"Skipping invalid day_of_week: {template_slot.day_of_week}")
                    continue
                
                # Find all templates in this range
                current_time = template_slot.start_time
                end_time = template_slot.end_time
                
                while current_time < end_time:
                    templates_to_delete.add((template_slot.day_of_week, current_time))
                    current_time = self._add_minutes(current_time, 30)
            
            # Delete matching templates
            for day_of_week, time_val in templates_to_delete:
                deleted_count = (
                    self.db.query(AvailabilityTemplate)
                    .filter_by(
                        user_id=user_id,
                        day_of_week=day_of_week,
                        start_time=time_val,
                        is_active=True
                    )
                    .delete()
                )
                deleted += deleted_count

            self.db.flush()
            
            # Get remaining templates for response
            templates = self.db.query(AvailabilityTemplate).filter_by(
                user_id=user_id, is_active=True
            ).all()
            
            remaining_slots: List[AvailabilityTemplateSlot] = []
            for template in templates:
                remaining_slots.append(AvailabilityTemplateSlot(
                    day_of_week=template.day_of_week,
                    start_time=template.start_time,
                    end_time=template.end_time
                ))

            response = DeleteAvailabilityResponse.model_validate(
                {"user_id": req.user_id, "deleted": deleted, "templates": remaining_slots}
            )

            self.db.commit()
            return response

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating availability for user {req.user_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update availability")

    @staticmethod
    def _add_minutes(time_val: dt_time, minutes: int) -> dt_time:
        """Add minutes to a time object, handling overflow."""
        total_minutes = time_val.hour * 60 + time_val.minute + minutes
        hours = total_minutes // 60
        mins = total_minutes % 60
        if hours >= 24:
            hours = 23
            mins = 59
        return dt_time(hours, mins, time_val.second, time_val.microsecond)
