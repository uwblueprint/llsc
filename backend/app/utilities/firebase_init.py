import os

import firebase_admin
from firebase_admin import credentials


def initialize_firebase():
    private_key = os.getenv("FIREBASE_SVC_ACCOUNT_PRIVATE_KEY")
    if private_key:
        private_key = private_key.replace("\\n", "\n")

    cred = credentials.Certificate(
        {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_SVC_ACCOUNT_PRIVATE_KEY_ID"),
            "private_key": private_key,
            "client_email": os.getenv("FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_SVC_ACCOUNT_CLIENT_ID"),
            "auth_uri": os.getenv("FIREBASE_SVC_ACCOUNT_AUTH_URI"),
            "token_uri": os.getenv("FIREBASE_SVC_ACCOUNT_TOKEN_URI"),
            "auth_provider_x509_cert_url": os.getenv(
                "FIREBASE_SVC_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL"
            ),
            "client_x509_cert_url": os.getenv(
                "FIREBASE_SVC_ACCOUNT_CLIENT_X509_CERT_URL"
            ),
        }
    )

    firebase_admin.initialize_app(cred)
