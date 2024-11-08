import os

import firebase_admin
from firebase_admin import credentials


def initialize_firebase():
    cred = credentials.Certificate("llsc/backend/app/utilities/serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
