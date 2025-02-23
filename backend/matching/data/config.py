# config.py

# Constants for output format choices
OUTPUT_FORMAT_CHOICES = ["dataframe", "csv", "json", "excel", "db"]

# Constants for formats that require a file path
FILE_PATH_REQUIRED_FORMATS = ["csv", "json", "excel"]

OPTIONS_FOR_DATA = ["participant", "volunteer", "matching"]

# Constants for the different types of data that can be generated

############################################################################################################
### DEMOGRAPHICS DATA
############################################################################################################
YES_NO = ["Yes", "No"]
FIRST_NAMES = ["John", "Jane", "Alex", "Taylor", "Sam", "Chris"]
LAST_NAMES = ["Doe", "Smith", "Lee", "Patel", "Brown", "Garcia"]
PROVINCES = [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
]
LANGUAGES = ["English", "French"]
GENDER_IDENTITIES = [
    "Female",
    "Male",
    "Non-binary",
    "Prefer not to answer",
    "Prefer to self-describe",  # TODO: not sure how to accomidate for these 'other options'
]
PRONOUNS = ["she/her", "he/him", "they/them", "other"]
ETHNIC_GROUPS = [
    "Black (including African and Caribbean descent)",
    "Middle Eastern, Western or Central Asian",
    "Chinese",
    "East Asian, excluding Chinese",
    "Indigenous person from Canada",
    "Latin American",
    "South Asian",
    "Southeast Asian",
    "White/Caucasian",
    "Mixed ethnicity",
    "Prefer not to answer",
]
MARITAL_STATUSES = ["Single", "Married/Common Law", "Divorced", "Widowed"]


############################################################################################################
### MEDICAL INFORMATION DATA
############################################################################################################
CAREGIVING_TYPES = [
    "Parent",
    "Sibling",
    "Child",
    "Spouse",
    "Friend",
    "Other",  # TODO: how do we impl this? (like if the user chooses other)
]
DIAGNOSES = {
    "Unknown": ["Unknown"],
    "Category 1": [
        "Acute Myeloid Leukemia",
        "Acute Lymphoblastic Leukemia",
        "Acute Promyelocytic leukemia",
        "Mixed Phenotype Leukemia",
    ],
    "Category 2": [
        "Chronic Lymphocytic Leukemia / Small Lymphocytic Lymphoma",
        "Chronic Myeloid Leukemia",
        "Hairy Cell Leukemia",
    ],
    "Category 3": [
        "Myeloma",
        "Hodgin’s Lymphoma",
        "Indolent/low grade Non-Hodgkin’s Lymphoma",
        "Aggressive/high grade Non-Hodgkin’s Lymphoma",
    ],
    "Category 4": ["Low risk MDS", "High Risk MDS"],
    "Category 5": ["Myelofibrosis", "Essential Thrombocythemia", "Polycythemia Vera"],
}

#Upto 2
TREATMENTS = [
    "Unknown",
    "Watch and Wait / Active Surveillance",
    "Chemotherapy/immunotherapy",
    "Oral Chemotherapy",
    "Radiation",
    "Maintenance chemotherapy",
    "Palliative care",
    "Transfusions",
    "Autologous Stem Cell Transplant",
    "Allogeneic Stem cell Transplant",
    "Haplo Stem Cell Transplant",
    "CAR-T",
]

#Upto 5
EXPERIENCES = [
    "Brain Fog",
    "Fatigue",
    "Fertility Issues",
    "Graft vs Host",
    "Returning to work after/during treatment",
    "Returning to school after/during treatment",
    "Speaking to your children about diagnosis",
    "Speaking to your family or friends about diagnosis",
    "Relapse",
    "Anxiety",
    "Depression",
    "PTSD",
    "Side effects from treatment",
]

PREFERENCES = [
    "SIMILIAR MARTIAL STATUS",
    "SIMILIAR DIAGNOSIS",
    "SIMILIAR PARENTAL STATUS",
    "SIMILIAR AGE",
    "SAME GENDER",
    "SIMILIAR ETHNICITY"
]

