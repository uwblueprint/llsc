import json
import os
from typing import Dict

import boto3
from botocore.exceptions import ClientError

TEMPLATES_FILE = "app/utilities/ses/ses_templates.json"
TEMPLATES_DIR = "app/utilities/ses/template_files"


def load_templates_metadata(file_path: str) -> Dict:
    try:
        with open(file_path, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Error: {file_path} not found.")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing {file_path}: {e}")
        return []


def load_file_content(file_path: str) -> str:
    """Reads the content of a file."""
    try:
        with open(file_path, "r") as file:
            return file.read()
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return ""


# Function to create or update SES template
def create_or_update_ses_template(template_metadata, ses_client, force_update=False):
    name = template_metadata["TemplateName"]
    try:
        text_part = load_file_content(template_metadata["TextPart"])
        html_part = load_file_content(template_metadata["HtmlPart"])
        if not text_part or not html_part:
            print(f"Skipping template '{name}' missing content.")
            return

        template = {
            "TemplateName": template_metadata["TemplateName"],
            "SubjectPart": template_metadata["SubjectPart"],
            "TextPart": text_part,
            "HtmlPart": html_part,
        }

        # Check if template exists
        try:
            ses_client.get_template(TemplateName=name)
            # Template exists, update it
            if force_update:
                ses_client.update_template(Template=template)
                print(f"SES template '{name}' updated successfully!")
            else:
                print(f"SES template '{name}' already exists. Use force_update=True to update.")
        except ClientError as e:
            if e.response["Error"]["Code"] == "TemplateDoesNotExist":
                # Template doesn't exist, create it
                ses_client.create_template(Template=template)
                print(f"SES template '{name}' created successfully!")
            else:
                raise
    except ClientError as e:
        print(f"An error occurred while processing SES template '{name}': {e}")


# Ensure SES templates are available at app startup
def ensure_ses_templates(force_update=False):
    templates_metadata = load_templates_metadata(TEMPLATES_FILE)
    aws_region = os.getenv("AWS_REGION")
    aws_access_key = os.getenv("AWS_ACCESS_KEY")
    aws_secret_key = os.getenv("AWS_SECRET_KEY")

    if not aws_region:
        print("AWS_REGION not set. Skipping SES template setup.")
        return

    # If access keys are provided, use them. Otherwise, boto3 will use IAM role credentials
    if aws_access_key and aws_secret_key:
        ses_client = boto3.client(
            "ses",
            region_name=aws_region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
        )
    else:
        # Use IAM role credentials (automatic in ECS)
        print("Using IAM role credentials for SES template setup.")
        ses_client = boto3.client(
            "ses",
            region_name=aws_region,
        )

    for template_metadata in templates_metadata:
        create_or_update_ses_template(template_metadata, ses_client, force_update=force_update)
