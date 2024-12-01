import random
from backend.matching.data.config import PREFERENCES
  

# TODO: this uses the random and datetime; we can use a seeder like Faker to generate more realistic data
# TODO: have highlighted relevent fields for the matching algorithm
class Preferences:
    @staticmethod
    # temporary function to get random first name
    def get_random_random_preference(k : int):
        k = min(k, len(PREFERENCES))
        return random.sample(PREFERENCES, k)

