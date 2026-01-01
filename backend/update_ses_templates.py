#!/usr/bin/env python3
"""
Script to update SES email templates in AWS.
Run this script to:
1. Compile Jinja2 templates (.j2) to HTML files
2. Update existing templates with the latest HTML/text content in AWS SES
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader, Undefined

from app.utilities.ses.ses_init import ensure_ses_templates


class PreservingUndefined(Undefined):
    """Custom Undefined that preserves {{variable}} syntax for AWS SES"""

    def __str__(self):
        return "{{%s}}" % self._undefined_name


# Change to backend directory for proper path resolution
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

# Load environment variables from .env file
load_dotenv()


def compile_jinja_templates():
    """
    Compile all .j2 Jinja2 templates to .html files
    """
    template_dir = Path("app/utilities/ses/template_files")
    source_dir = template_dir / "source"
    compiled_dir = template_dir / "compiled"
    base_dir = template_dir / "base"

    # Set up Jinja2 environment with multiple loader paths and custom Undefined handler
    env = Environment(
        loader=FileSystemLoader([str(source_dir), str(base_dir)]),
        undefined=PreservingUndefined,
    )

    # Find all .j2 files in source directory
    j2_files = list(source_dir.glob("*.j2"))

    if not j2_files:
        print("No .j2 templates found to compile.")
        return

    print(f"Found {len(j2_files)} Jinja2 template(s) to compile...")

    for j2_file in j2_files:
        template_name = j2_file.name
        output_name = template_name.replace(".j2", ".html")
        output_path = compiled_dir / output_name

        print(f"  Compiling {template_name} → {output_name}")

        # Determine which base template to use based on language
        is_french = "_fr" in template_name.lower()

        # Update the source file to extend the correct base template
        source_content = j2_file.read_text()

        if is_french:
            # Replace base_email.html with base_email_fr.html
            source_content = source_content.replace(
                '{% extends "base_email.html" %}', '{% extends "base_email_fr.html" %}'
            )
        else:
            # Replace base_email.html with base_email_en.html
            source_content = source_content.replace(
                '{% extends "base_email.html" %}', '{% extends "base_email_en.html" %}'
            )

        # Temporarily write this to the file for compilation
        j2_file.write_text(source_content)

        # Load template
        template = env.get_template(template_name)

        # Render WITHOUT passing any variables to preserve {{}} for AWS SES
        rendered = template.render()

        # Write to output file
        output_path.write_text(rendered)
        print("    ✓ Compiled successfully")

    print(f"\nCompiled {len(j2_files)} template(s).")


if __name__ == "__main__":
    print("=== Compiling Jinja2 Templates ===\n")
    compile_jinja_templates()

    print("\n=== Updating SES Templates in AWS ===\n")
    ensure_ses_templates(force_update=True)

    print("\n✓ Done!")
