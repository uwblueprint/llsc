import os
from logging.config import dictConfig

import firebase_admin
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import app_config


def create_app():
    # configure FastAPI logger
    dictConfig(
        {
            "version": 1,
            "handlers": {
                "wsgi": {
                    "class": "logging.FileHandler",
                    "level": "ERROR",
                    "filename": "error.log",
                    "formatter": "default",
                }
            },
            "formatters": {
                "default": {"format": "%(asctime)s-%(levelname)s-%(name)s" + "::%(module)s,%(lineno)s: %(message)s"},
            },
            "root": {"level": "ERROR", "handlers": ["wsgi"]},
        }
    )

    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            os.getenv("FRONTEND_URL", "http://localhost:3000"),
            "https://uw-blueprint-starter-code.firebaseapp.com",
            "https://uw-blueprint-starter-code.web.app",
            # TODO: create a separate middleware function to dynamically
            # determine this value
            # re.compile("^https:\/\/uw-blueprint-starter-code--pr.*\.web\.app$"),
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if os.getenv("FASTAPI_CONFIG") != "production":
        app.state.database_uri = "postgresql://{username}:{password}@{host}:5432/{db}".format(
            username=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=os.getenv("DB_HOST"),
            db=(os.getenv("POSTGRES_DB_TEST") if app_config["TESTING"] else os.getenv("POSTGRES_DB_DEV")),
        )
    else:
        app.state.database_uri = os.getenv("DATABASE_URL")

    private_key = os.getenv("FIREBASE_SVC_ACCOUNT_PRIVATE_KEY")
    if private_key:
        private_key = private_key.replace("\\n", "\n")

    firebase_admin.initialize_app(
        firebase_admin.credentials.Certificate(
            {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_SVC_ACCOUNT_PRIVATE_KEY_ID"),
                "private_key": private_key,
                "client_email": os.getenv("FIREBASE_SVC_ACCOUNT_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_SVC_ACCOUNT_CLIENT_ID"),
                "auth_uri": os.getenv("FIREBASE_SVC_ACCOUNT_AUTH_URI"),
                "token_uri": os.getenv("FIREBASE_SVC_ACCOUNT_TOKEN_URI"),
                "auth_provider_x509_cert_url": os.getenv("FIREBASE_SVC_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL"),
                "client_x509_cert_url": os.getenv("FIREBASE_SVC_ACCOUNT_CLIENT_X509_CERT_URL"),
            }
        ),
        {"storageBucket": os.getenv("FIREBASE_STORAGE_DEFAULT_BUCKET")},
    )

    # from . import models, rest

    # models.init_app(app)
    # rest.init_app(app)

    return app
