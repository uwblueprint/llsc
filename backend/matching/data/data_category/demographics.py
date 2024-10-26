import random


class Demographics:

    # TODO: Add more roles and diagnoses (as we go and finalize the survey)
    # TODO: can we move these field paramaters to a constants file?
    
    GENDER_IDENTITIES = [
        "Female",
        "Male",
        "Non-binary",
        "Prefer not to answer",
        "Prefer to self-describe",
    ]
    ETHNIC_GROUPS = [
        "Black (including African and Caribbean descent)",
        "Middle Eastern",
        "East Asian",
        "South Asian",
        "Southeast Asian",
        "Indigenous person from Canada",
        "Latin American",
        "White",
        "Mixed ethnicity",
        "Prefer not to answer",
        "Another background/Prefer to self describe",
    ]
    PRONOUNS = [
        "He/Him",
        "She/Her",
        "They/Them",
        "Ze/Hir",
        "Prefer not to answer",
        "Other",
    ]
    CITIES = [
        "Toronto",
        "Vancouver",
        "Montreal",
        "Calgary",
        "Ottawa",
        "Edmonton",
        "Winnipeg",
        "Quebec City",
        "Hamilton",
        "Halifax",
    ]

    @staticmethod
    def get_random_gender_identity():
        return random.choice(Demographics.GENDER_IDENTITIES)

    @staticmethod
    def get_random_ethnic_background():
        return random.sample(Demographics.ETHNIC_GROUPS, k=random.randint(1, 3))

    @staticmethod
    def get_random_age(min_age=18, max_age=90):
        return random.randint(min_age, max_age)

    @staticmethod
    def get_random_pronouns():
        return random.choice(Demographics.PRONOUNS)

    @staticmethod
    def get_random_city():
        return random.choice(Demographics.CITIES)
