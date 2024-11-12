import pandas as pd

class DataFormatter:
    def __init__(self, data):
        self.data = pd.DataFrame(data)

    def to_dataframe(self):
        return self.data

    # def to_csv(self, file_path="output.csv"):
    #     self.data.to_csv(file_path, index=False)
    #     print(f"Data saved to {file_path}")

    def to_json(self, file_path="output.json"):
        self.data.to_json(file_path, orient="records", lines=True)
        print(f"Data saved to {file_path}")

    # def to_excel(self, file_path="output.xlsx"):
    #     self.data.to_excel(file_path, index=False)
    #     print(f"Data saved to {file_path}")
