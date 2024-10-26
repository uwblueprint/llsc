import random
from datetime import datetime, timedelta


class Personality:
    # TODO: Add more roles and diagnoses (as we go and finalize the survey)
    # TODO: can we move these field paramaters to a constants file?

    ROLES = [
        "A person diagnosed with a cancer/survivor",
        "I am a caregiver",
        "I am a family member",
        "I am a friend",
        "I am a healthcare provider",
        "Other",
    ]

    DIAGNOSES = [
        "Acute Myeloid Leukemia (AML)",
        "Acute Lymphoblastic Leukemia (ALL)",
        "Chronic Myeloid Leukemia (CML)",
        "Chronic Lymphocytic Leukemia (CLL)",
        "Monoclonal Gammopathy of Undetermined Significance (MGUS)",
        "Multiple Myeloma (MM)",
        "Myelodysplastic Syndromes (MDS)",
        "Myeloproliferative Neoplasms (MPN)",
        "Non-Hodgkin Lymphoma (NHL)",
        "Hodgkin Lymphoma (HL)",
        "Unknown",
        "Other",
    ]

    @staticmethod
    def get_random_role():
        return random.choice(Personality.ROLES)

    @staticmethod
    def get_random_diagnosis():
        return random.choice(Personality.DIAGNOSES)

    @staticmethod
    def get_random_date_of_diagnosis(start_year=1990, end_year=2024):
        start_date = datetime(start_year, 1, 1)
        end_date = datetime(end_year, 12, 31)
        random_date = start_date + timedelta(
            days=random.randint(0, (end_date - start_date).days)
        )
        return random_date.strftime("%B %Y")
