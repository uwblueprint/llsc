from sqlalchemy import *

from . import db

schedule_state_enum = db.enum("PENDING_PARTICIPANT_RESPONSE", "PENDING_VOLUNTEER_RESPONSE", "SCHEDULED", "COMPLETED", name = "state")

class Schedules(db.Model):
    __tablename__ = "schedules"

    scheduleId = db.Column(db.Integer, primary_key = True, nullable = False)
    state = db.Column(schedule_state_enum, nullable = False)