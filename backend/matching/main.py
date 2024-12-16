import argparse

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# from backend.matching.data.seeder.data_seeder import Seeder

from backend.matching.data.seeder.data_seeder import Seeder
import numpy as np

ENTRIES = 25

def print_data(data, file):
    for record in data:
        file.write(f"{record}\n")

def print_matches(matches):
    for patient, top_matches in matches.items():
        print(f"\nPatient: {patient}")

        for match in top_matches:
            volunteer = match["Volunteer"]
            score = match["Score"]
            print(f"Volunteer: {volunteer['First Name']} {volunteer['Last Name']}, Score: {score:.2f}")

def softmax_weights(length: int, alpha = 0.5):
    if length == 0:
        return []
    
    ranks = np.arange(1, length + 1)
    # Exponentiate with decay factor and normalize
    exp_weights = np.exp(-alpha * ranks)

    normalized_weights = exp_weights / np.sum(exp_weights)

    # Convert to regular Python list
    return normalized_weights.tolist()
    

def find_best_matches(volunteers, patients, top_k):
    """
    Find the top-k best matches for each patient based on preferences.

    Args:
        volunteers (list): List of volunteer records, each with preferences.
        patients (list): List of patient records, each with preferences.
        top_k (int): Number of top matches to return for each patient.

    Returns:
        dict: A dictionary where each patient has a list of top-k matches with their scores.
    """
    results = {}

    for patient in patients:
        patient_preferences = patient.get("Preferences", [])
        num_preferences = len(patient_preferences)
        
        preference_weights = softmax_weights(num_preferences)

        volunteer_scores = []

        for volunteer in volunteers:
            volunteer_preferences = volunteer.get("Preferences", [])
            total_score = 0

            for i, patient_pref in enumerate(patient_preferences):
                if patient_pref in volunteer_preferences:
                    total_score += preference_weights[i] * 1  

            volunteer_scores.append({
                "Volunteer": volunteer,
                "Score": total_score
            })

        volunteer_scores.sort(key=lambda x: x["Score"], reverse=True)

        results[patient["First Name"] + " " + patient["Last Name"]] = volunteer_scores[:top_k]

    return results

def run_algorithm():
    s = Seeder(ENTRIES)
    # s.generate_matching_data()
    s.generate_data_participant()
    s.generate_data_volunteer()

    volunteers = s.get_volunteers()
    participants = s.get_participants()

    # debugging purposes
    with open("output.txt", "w") as file:
        file.write("Volunteers:\n")
        print_data(volunteers, file)

        file.write("\nParticipants:\n")
        print_data(participants, file)

    matches = find_best_matches(volunteers, participants, 5)

    # debugging purposes
    print_matches(matches)


def main():
    run_algorithm() 


if __name__ == "__main__":
    main()
