import argparse

from algorithms.algorithm import Algorithm
from data.seeder.data_seeder import Seeder

def get_param(person, param):
    return person.get(param, None)
    
def find_best_matches(volunteers, patients, params, weights):
    matches = []
    best_score = float('-inf')

    for param, weight in zip(params, weights):
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
    ENTRIES = 50
    s = Seeder(ENTRIES)
    Seeder.generate_mathching_data()

    data = Seeder.get_data()

    volunteers = data[:ENTRIES//2]
    patients = data[ENTRIES//2:]

    matches = find_best_matches(volunteers, patients, params, weights)


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
