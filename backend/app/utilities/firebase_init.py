import logging
import os

import firebase_admin
from firebase_admin import credentials

from app.utilities.constants import LOGGER_NAME

log = logging.getLogger(LOGGER_NAME("firebase_init"))


def initialize_firebase():
    log.info("Running initialize_firebase")
    cwd = os.getcwd()
    service_account_path = os.path.join(cwd, "serviceAccountKey.json")
    cred = credentials.Certificate(service_account_path)

    firebase_admin.initialize_app(cred)
    log.info("Finished initializing firebase")
