import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import argparse
import sys
from backend.matching.data.seeder.data_seeder import Seeder
from backend.matching.data.config import (
    OUTPUT_FORMAT_CHOICES,
    OPTIONS_FOR_DATA,
    FILE_PATH_REQUIRED_FORMATS,
)

class CLI:
    def __init__(self):
        self.args = None

    def parse_arguments(self):
        """Parse command line arguments."""

        parser = argparse.ArgumentParser(description="Generate and save data.")

        parser.add_argument(
            "option",
            type=str,
            choices=OPTIONS_FOR_DATA,
            help="What type of data do you want?",
        )

        parser.add_argument(
            "num_records", type=int, help="Number of records to generate"
        )
        parser.add_argument(
            "output_format", choices=OUTPUT_FORMAT_CHOICES, help="Output format"
        )
        parser.add_argument(
            "--file_path",
            type=str,
            help="File path to save the data (required for csv, json, excel)",
            default=None,
        )

        self.args = parser.parse_args()

    def validate_arguments(self):
        """Validate the parsed arguments."""
        if (
            self.args.output_format in FILE_PATH_REQUIRED_FORMATS
            and not self.args.file_path
        ):
            print(
                f"Error: file_path is required for formats: {', '.join(FILE_PATH_REQUIRED_FORMATS)}",
                file=sys.stderr,
            )
            sys.exit(1)

    def run_seeder(self):
        """Run the Seeder with the provided arguments."""
        seeder = Seeder(num_records=self.args.num_records)

        if self.args.output_format == "dataframe":
            df = seeder.save_data(output_format="dataframe", option=self.args.option)
            print(df)
        else:
            seeder.save_data(
                output_format=self.args.output_format,
                file_path=self.args.file_path,
                option=self.args.option,
            )


def main():
    cli = CLI()
    cli.parse_arguments()
    cli.validate_arguments()
    cli.run_seeder()


if __name__ == "__main__":
    main()
