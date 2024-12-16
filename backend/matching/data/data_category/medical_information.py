import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import random
from datetime import datetime, timedelta
from backend.matching.data.config import (
    DIAGNOSES,
    TREATMENTS,
    EXPERIENCES,
    YES_NO,
    CAREGIVING_TYPES,
)


class MedicalInformation:
    # TODO: Add more roles and diagnoses (as we go and finalize the survey)
    # TODO: can we move these field paramaters to a constants file?

    @staticmethod
    def get_random_blood_cancer_question():
        return random.choice(YES_NO)

    @staticmethod
    def get_random_caregiver_question():
        return random.choice(YES_NO)

    @staticmethod
    def get_random_caregiver_type():
        return random.choice(CAREGIVING_TYPES)

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_diagnosis():
        category = random.choice(list(DIAGNOSES.keys()))
        return random.choice(DIAGNOSES[category])

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_date_of_diagnosis(start_year=1969, end_year=datetime.now().year):
        start_date = datetime(start_year, 1, 1)
        end_date = datetime(end_year, 12, 31)
        random_date = start_date + timedelta(
            days=random.randint(0, (end_date - start_date).days)
        )
        return random_date.strftime("%B %Y")

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_treatment():
        return random.choice(TREATMENTS)

    # IMPORTANT: for matching algo
    # there can be multiple experiences that they can select
    @staticmethod
    def get_random_experience():
        num_experiences = random.randint(0, len(EXPERIENCES))
        # reutrns empty of all of the experiences
        return random.sample(EXPERIENCES, num_experiences)
