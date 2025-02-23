import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import random
from backend.matching.data.config import PREFERENCES
  

# TODO: this uses the random and datetime; we can use a seeder like Faker to generate more realistic data
# TODO: have highlighted relevent fields for the matching algorithm
class Preferences:
    @staticmethod
    # temporary function to get random first name
    def get_random_random_preference(k : int, treatments: list, experiences: list):
        k = min(k, 5) 

        exp_entry = {"EXPERIENCE": experiences}
        treat_entry = {"TREATMENT": treatments}

        final_preference_list = PREFERENCES + [exp_entry, treat_entry]

        return random.sample(final_preference_list, k)


