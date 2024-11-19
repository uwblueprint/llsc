import argparse
import sys
from llsc.backend.matching.data.seeder.data_seeder import Seeder
from config import OUTPUT_FORMAT_CHOICES, FILE_PATH_REQUIRED_FORMATS


class CLI:
    def __init__(self):
        self.args = None

    def parse_arguments(self):
        """Parse command line arguments."""
        
        parser = argparse.ArgumentParser(description="Generate and save data.")
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
            df = seeder.save_data(output_format="dataframe")
            print(df)
        else:
            seeder.save_data(
                output_format=self.args.output_format, file_path=self.args.file_path
            )


def main():
    cli = CLI()
    cli.parse_arguments()
    cli.validate_arguments()
    cli.run_seeder()


if __name__ == "__main__":
    main()
