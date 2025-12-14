#!/usr/bin/env python3
"""
Script to update SES email templates in AWS.
Run this script to update existing templates with the latest HTML/text content.
"""

import os

from dotenv import load_dotenv

from app.utilities.ses.ses_init import ensure_ses_templates

# Change to backend directory for proper path resolution
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

# Load environment variables from .env file
load_dotenv()


if __name__ == "__main__":
    print("Updating SES templates...")
    ensure_ses_templates(force_update=True)
    print("Done!")
