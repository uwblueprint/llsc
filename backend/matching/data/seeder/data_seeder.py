from backend.matching.data.data_category.medical_information import MedicalInformation
from backend.matching.data.data_category.demographics import Demographics
from backend.matching.data.seeder.data_formatter import DataFormatter


class Seeder:
    # TODO : wrap the records more modularly
    def __init__(self, num_records=10):
        self.num_records = num_records
        self.data = []

    # TODO: see what the schema of our db acutally holds
    def generate_data_participant(self):
        for _ in range(self.num_records):
            record = {
                "First Name": Demographics.get_random_first_name(),
                "Last Name": Demographics.get_random_last_name(),
                "Date of Birth": Demographics.get_random_date_of_birth(),
                "Email": Demographics.get_random_email(),
                "Phone": Demographics.get_random_phone(),
                "Postal Code": Demographics.get_random_postal_code(),
                "Province": Demographics.get_random_province(),
                "City": Demographics.get_random_city(),
                "Language": Demographics.get_random_language(),
                "Gender Identity": Demographics.get_random_gender_identity(),
                "Pronouns": Demographics.get_random_pronouns(),
                "Ethnicity": Demographics.get_random_ethnic_background(),
                "Marital Status": Demographics.get_random_marital_status(),
                "Children Status": Demographics.get_random_children_status(),
                "Blood Cancer Status": MedicalInformation.get_random_blood_cancer_question(),
                "Caregiver Status": MedicalInformation.get_random_caregiver_question(),
                "Caregiver Type": MedicalInformation.get_random_caregiver_type(),
                "Diagnostic": MedicalInformation.get_random_diagnosis(),
                "Date of Diagnosis": MedicalInformation.get_random_date_of_diagnosis(),
                "Treatment": MedicalInformation.get_random_treatment(),
                "Experience": MedicalInformation.get_random_experience(),
            }
            self.data.append(record)

    # TODO: see what the schema of our db acutally holds
    def generate_data_volunteer(self):
        for _ in range(self.num_records):
            record = {
                "First Name": Demographics.get_random_first_name(),
                "Last Name": Demographics.get_random_last_name(),
                "Date of Birth": Demographics.get_random_date_of_birth(),
                "Email": Demographics.get_random_email(),
                "Phone": Demographics.get_random_phone(),
                "Postal Code": Demographics.get_random_postal_code(),
                "Province": Demographics.get_random_province(),
                "City": Demographics.get_random_city(),
                "Language": Demographics.get_random_language(),
                "Criminal Record Status": Demographics.get_criminal_record_status(),
                "Blood Cancer Status": MedicalInformation.get_random_blood_cancer_question(),
                "Caregiver Status": MedicalInformation.get_random_caregiver_question(),
                "Caregiver Type": MedicalInformation.get_random_caregiver_type(),
                "Diagnostic": MedicalInformation.get_random_diagnosis(),
                "Date of Diagnosis": MedicalInformation.get_random_date_of_diagnosis(),
                "Gender Identity": Demographics.get_random_gender_identity(),
                "Pronouns": Demographics.get_random_pronouns(),
                "Ethnicity": Demographics.get_random_ethnic_background(),
                "Marital Status": Demographics.get_random_marital_status(),
                "Children Status": Demographics.get_random_children_status(),
                "Experience": MedicalInformation.get_random_experience(),
                # TODO: WHY IS TRAETMENET NOT HERE?
                # TODO: tell us a story, reference, anyhting eles to share
            }
            self.data.append(record)

    # call this twice for matching data (one for participant and one for volunteer)
    def generate_mathching_data(self):
        for _ in range(self.num_records):
            record = {
                "First Name": Demographics.get_random_first_name(),  
                "Second Name": Demographics.get_random_last_name(),  
                "Province": Demographics.get_random_province(),
                "Language": Demographics.get_random_language(),
                "Gender Identity": Demographics.get_random_gender_identity(),
                "Pronouns": Demographics.get_random_pronouns(),
                "Ethnicity": Demographics.get_random_ethnic_background(),
                "Marital Status": Demographics.get_random_marital_status(),
                "Children Status": Demographics.get_random_children_status(),
                "Blood Cancer Status": MedicalInformation.get_random_blood_cancer_question(),
                "Caregiver Status": MedicalInformation.get_random_caregiver_question(),
                "Caregiver Type": MedicalInformation.get_random_caregiver_type(),
                "Diagnostic": MedicalInformation.get_random_diagnosis(),
                "Date of Diagnosis": MedicalInformation.get_random_date_of_diagnosis(),
                "Treatment": MedicalInformation.get_random_treatment(),
                "Experience": MedicalInformation.get_random_experience(),
            }
            self.data.append(record)

    def get_data(self):
        return self.data

    # TOOD: fix this part so no matter what function we are calling it saves to the db and or the specific file to upload
    def save_data(self, output_format="dataframe", file_path=None, option="matching"):
        if not self.data:
            # TODO FIX THIS HERE FOR DIFFERENT METHODS HERE NOT JUST THIS GENERAT EDATA

            if option == "participant":
                self.generate_data_participant()
            elif option == "volunteer":
                self.generate_data_volunteer()
            else:
                self.generate_mathching_data()
        else:
            raise ValueError(
                "Data has already been generated. Call get_data() to retrieve it."
            )

        # Use the OutputHandler for saving/formatting data
        handler = DataFormatter(self.data)

        if output_format == "dataframe":
            return handler.to_dataframe()
        elif output_format == "csv":
            handler.to_csv(file_path if file_path else "output.csv")
        elif output_format == "json":
            handler.to_json(file_path if file_path else "output.json")
        elif output_format == "excel":
            handler.to_excel(file_path if file_path else "output.xlsx")
        elif output_format == "db":
            # TODO: upload the data to the db using SQLAlchemy
            # need to chcek what type of user it is (use the option to check which one it is before we can upload it)
            pass
        else:
            raise ValueError(
                "Unsupported output format. Choose from: dataframe, csv, json, excel, db"
            )
