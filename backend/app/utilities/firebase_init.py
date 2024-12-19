import os

import firebase_admin
from firebase_admin import credentials


def initialize_firebase():
    cwd = os.getcwd()
    service_account_path = os.path.join(cwd, "serviceAccountKey.json")
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)
