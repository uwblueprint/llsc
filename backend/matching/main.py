import argparse

from algorithms.algorithm import Algorithm
from data.seeder.data_seeder import Seeder
import numpy as np

# PARAMS = [  "First Name",
#             "Second Name", 
#             "Province", 
#             "Language",
#             "Gender Identity ", 
#             "Pronouns",
#             "Ethnicity",
#             "Marital Status",   
#             "Children Status", 
#             "Blood Cancer Status",
#             "Caregiver Status", 
#             "Caregiver Type", 
#             "Diagnostic", 
#             "Date of Diagnosis", 
#             "Treatment", 
#             "Experience"
#         ]
ENTRIES = 50
tempweight = []

def softmax_weights(length: int, alpha = 0.5):
    ranks = np.arange(1, length + 1)
    # Exponentiate with decay factor and normalize
    exp_weights = np.exp(-alpha * ranks)

    normalized_weights = exp_weights / np.sum(exp_weights)

    # Convert to regular Python list
    return normalized_weights.tolist()


def get_param(record, param):
    return record[param]
    

def find_best_matches(volunteers, patients, preferenes):
    """
    Find the best matches between volunteers and patients based on the given parameters and weights

    Args:
        volunteers (list): List of volunteer records
        patients (list): List of patient records
        params (list): List of parameters to optimize on
        weights (list): List of weights for each parameter
    """
    matches = []
    # best_score = float('-inf')

    for param, weight in zip(patients, weights):
        volunteer_value = get_param(volunteers, param)
        patient_value = get_param(patients, param)

        volunteer_value.lower()
        patient_value.lower()

        if volunteer_value == patient_value:
            score += weight

        if score > best_score:
            best_score = score
            matches.append((get_param(volunteer, "First Name"), patient, score)) # messed up rn cause you can't query it by First Name only

    matches.sort(key=lambda x: x[2], reverse=True)

    return matches

def run_algorithm(params, weights):
    s = Seeder(ENTRIES)
    Seeder.generate_mathching_data()

    data = Seeder.get_data()


    # records of patients
    # [ {}, {}]
    volunteers = data[:ENTRIES//2]

    patients = data[ENTRIES//2:]

    preferences = [preferences for _ in data[preferences]]

    matches = find_best_matches(volunteers, patients, preferences)


def main():
    parser = argparse.ArgumentParser(
        description="Test algorithms with parameters to optimize on"
    )

    # pass in the parameters we want to optimize on and the weights for each of them

    parser.add_argument("--params", nargs="+", required=True, type=int, help="Weights for each of the parameters")
    parser.add_argument(
        "--params", nargs="+", help="List of parameters for the algorithm"
    )

    args = parser.parse_args()

    run_algorithm(args.algo, args.params) # change this since we are now passing in the params and weights now


if __name__ == "__main__":
    main()
