import random
import datetime
import re
from faker import Faker
from config import (
    PROVINCES,
    LANGUAGES,
    GENDER_IDENTITIES,
    PRONOUNS,
    ETHNIC_GROUPS,
    MARITAL_STATUSES,
    YES_NO,
)

fake = Faker()  # generic faker
fake_ca = Faker("en_CA")  # canadian faker


# TODO: this uses the random and datetime; we can use a seeder like Faker to generate more realistic data
# TODO: have highlighted relevent fields for the matching algorithm
class Demographics:
    @staticmethod
    # temporary function to get random first name
    def get_random_first_name():
        return fake.first_name()

    # temporary function to get random first name
    @staticmethod
    def get_random_last_name():
        return fake.last_name()

    @staticmethod
    def get_random_date_of_birth(min_age=18, max_age=90):
        today = datetime.date.today()
        age = random.randint(min_age, max_age)
        dob = today.replace(year=today.year - age)
        return dob.strftime("%Y-%m-%d")

    # temporary function to get random first name
    # TODO: not needed for matching algorithm; can use Faker here to emulate better response
    @staticmethod
    def get_random_email():
        return fake.email()

    # TODO: not needed for matching algorithm; can use Faker here to emulate better response
    @staticmethod
    def get_random_phone():
        return fake_ca.phone_number()

    # TODO: not needed for matching algorithm; can use Faker here to emulate better response
    @staticmethod
    def get_random_postal_code():
        # use the regex part here to make it random
        template = "A0A 0A0"

        # Use re.sub with specific replacement logic for each position
        return re.sub(
            r"[A-Z]|\d",
            lambda x: random.choice(
                "ABCEGHJKLMNPRSTVXY"
                if x.start() == 0
                else "ABCEGHJKLMNPRSTVWXYZ"
                if x.group().isalpha()
                else "0123456789"
            ),
            template,
        )

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_province():
        # todo: can prob use the ecanadian data to also return the provinces
        return random.choice(PROVINCES)

    # temporary function to get random first name
    @staticmethod
    def get_random_city():
        # using the canadian localized data for the cities only
        return fake_ca.city()

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_language():
        return random.choice(LANGUAGES)

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_gender_identity():
        return random.choice(GENDER_IDENTITIES)

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_pronouns():
        return random.choice(PRONOUNS)

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_ethnic_background():
        return random.choice(ETHNIC_GROUPS)

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_marital_status():
        return random.choice(MARITAL_STATUSES)

    # IMPORTANT: for matching algo
    @staticmethod
    def get_random_children_status():
        return random.choice(YES_NO)

    #### FOR THE VOLUNTEER QUESITONS
    @staticmethod
    def get_criminal_record_check():
        return random.choice(YES_NO)
