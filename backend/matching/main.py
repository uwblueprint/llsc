import argparse

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.matching.data.seeder.data_seeder import Seeder
import numpy as np
from backend.matching.data.config import DIAGNOSES
from datetime import datetime

ENTRIES = 50

def print_data(data, file):
    for record in data:
        file.write(f"{record}\n")

def print_matches(matches):
    with open("matches.txt", "w") as f:  # Fix: Use string for filename
        for patient, top_matches in matches.items():
            f.write(f"\nPatient: {patient}\n")
            for match in top_matches:
                volunteer = match["Volunteer"]
                score = match["Score"]
                f.write(f"Volunteer: {volunteer['First Name']} {volunteer['Last Name']}, Score: {score:.2f}\n")

def softmax_weights(length: int, alpha = 0.5):
    if length == 0:
        return []
    
    ranks = np.arange(1, length + 1)
    # Exponentiate with decay factor and normalize
    exp_weights = np.exp(-alpha * ranks)

    normalized_weights = exp_weights / np.sum(exp_weights)

    # Convert to regular Python list
    return normalized_weights.tolist()
    
def get_diagnosis_category(diagnosis):
    for category, diseases in DIAGNOSES.items():
        if diagnosis in diseases:
            return category
    return "Unknown"

#Both of the following functions return values between 0 and 1 based on how close they are.
def calculate_age_similarity(dob1, dob2, max_age_diff=50):
    try:
        date1 = datetime.strptime(dob1, '%Y-%m-%d')
        date2 = datetime.strptime(dob2, '%Y-%m-%d')
        age_diff = abs((date1 - date2).days / 365.25)

        return np.exp(-age_diff / max_age_diff)
    except:
        return 0
    
def calculate_similarity(patient_list, volunteer_list):
    if not patient_list:
        return 0

    each_weighting = 1 / len(patient_list)

    total_score = 0
        
    for treatment in patient_list:
        if treatment in volunteer_list:
            total_score += each_weighting

    return total_score

# This returns a list of nums values for each preference
# Potential improvement: return a dict instead with the bools of each preference
def matches_criteria(volunteer, patient, patient_preferences):
    if volunteer.get("Language") != patient.get("Language"):
        return []
        
    criteria_checks = {
        "SAME GENDER": volunteer.get("Gender Identity") == patient.get("Gender Identity"),
        "SIMILIAR ETHNICITY": volunteer.get("Ethnicity") == patient.get("Ethnicity"),
        "SIMILIAR MARITAL STATUS": volunteer.get("Marital Status") == patient.get("Marital Status"),
        "SIMILIAR PARENTAL STATUS": volunteer.get("Children Status") == patient.get("Children Status"),
        "SIMILIAR DIAGNOSES": get_diagnosis_category(volunteer.get("Diagnostic")) == get_diagnosis_category(patient.get("Diagnostic")),
    }

    final_weights = []

    for pref in patient_preferences:
        if isinstance(pref, dict) and "TREATMENT" in pref:
            treatment_preference_list = pref["TREATMENT"] 
            final_weights.append(calculate_similarity(treatment_preference_list, volunteer.get("Treatment")))
        elif isinstance(pref, dict) and "EXPERIENCE" in pref:
            experience_preference_list = pref["EXPERIENCE"] 
            final_weights.append(calculate_similarity(experience_preference_list, volunteer.get("Experience")))
        elif pref == "SIMILAR AGE":
            final_weights.append(calculate_age_similarity(patient.get("Date of Birth"), volunteer.get("Date of Birth")))
        else:
            final_weights.append(1 if criteria_checks.get(pref, False) else 0)

    return final_weights

def find_best_matches(volunteers, patients):
    """
    Find the best matches for each patient based on preferences.

    Args:
        volunteers (list): List of volunteer records, each with preferences.
        patients (list): List of patient records, each with preferences.

    Returns:
        dict: A dictionary where each patient has a list of top-k matches with their scores.
    """
    results = {}

    # For later note, to improve the codebase, we can instead use a dict to map the pref
    # to the weights instead of a seperate list and using indices to match them
    for patient in patients:
        # Confirm that the weightages are coming out to be same
        patient_preferences = patient.get("Preferences", [])
        num_preferences = len(patient_preferences)
        
        preference_weights = softmax_weights(num_preferences)

        volunteer_scores = []

        for volunteer in volunteers:
            preference_compatibility_checks = matches_criteria(volunteer, patient, patient_preferences)

            if not preference_compatibility_checks:
                continue

            if num_preferences != len(preference_compatibility_checks):
                raise ValueError("Preference weights and matches lengths don't match")

            total_score = sum(
                match * preference_weights[i] 
                for i, match in enumerate(preference_compatibility_checks) 
                if match
            )

            volunteer_scores.append({
                "Volunteer": volunteer,
                "Score": total_score
            })

        volunteer_scores.sort(key=lambda x: x["Score"], reverse=True)

        results[patient["First Name"] + " " + patient["Last Name"]] = volunteer_scores

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

    matches = find_best_matches(volunteers, participants)

    # debugging purposes
    print_matches(matches)


def main():
    run_algorithm() 


if __name__ == "__main__":
    main()
