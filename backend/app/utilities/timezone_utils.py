"""
Utility functions for handling Canadian timezone abbreviations.
Maps abbreviations (NST, AST, EST, CST, MST, PST) to IANA timezone identifiers.
"""

from typing import Optional
from zoneinfo import ZoneInfo

# Map Canadian timezone abbreviations to IANA timezone identifiers
CANADIAN_TIMEZONE_MAP = {
    "NST": ZoneInfo("America/St_Johns"),  # Newfoundland Standard Time
    "AST": ZoneInfo("America/Halifax"),  # Atlantic Standard Time
    "EST": ZoneInfo("America/Toronto"),  # Eastern Standard Time
    "CST": ZoneInfo("America/Winnipeg"),  # Central Standard Time
    "MST": ZoneInfo("America/Edmonton"),  # Mountain Standard Time
    "PST": ZoneInfo("America/Vancouver"),  # Pacific Standard Time
}


def get_timezone_from_abbreviation(abbreviation: Optional[str]) -> Optional[ZoneInfo]:
    """
    Convert a Canadian timezone abbreviation to a ZoneInfo object.

    Args:
        abbreviation: One of NST, AST, EST, CST, MST, PST, or None

    Returns:
        ZoneInfo object for the timezone, or None if abbreviation is None/invalid

    Examples:
        >>> tz = get_timezone_from_abbreviation("EST")
        >>> tz
        zoneinfo.ZoneInfo(key='America/Toronto')
    """
    if not abbreviation:
        return None

    return CANADIAN_TIMEZONE_MAP.get(abbreviation.upper())
