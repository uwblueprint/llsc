from data_category.personality import Personality
from data_category.demographics import Demographics
from llsc.backend.matching.data.seeder.data_formatter import DataFormatter


class Seeder:
    # TODO : wrap the records more modularly

    def __init__(self, num_records=10):
        self.num_records = num_records
        self.data = []

    def generate_data(self):
        for _ in range(self.num_records):
            record = {
                "Role": Personality.get_random_role(),
                "Diagnosis": Personality.get_random_diagnosis(),
                "Date of Diagnosis": Personality.get_random_date_of_diagnosis(),
                "Gender Identity": Demographics.get_random_gender_identity(),
                "Ethnic Background": Demographics.get_random_ethnic_background(),
                "Age": Demographics.get_random_age(),
                "Pronouns": Demographics.get_random_pronouns(),
                "City": Demographics.get_random_city(),
            }
            self.data.append(record)

    def get_data(self):
        return self.data

    def save_data(self, output_format="dataframe", file_path=None):
        if not self.data:
            self.generate_data()

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
        else:
            raise ValueError(
                "Unsupported output format. Choose 'dataframe', 'csv', 'json', or 'excel'."
            )
