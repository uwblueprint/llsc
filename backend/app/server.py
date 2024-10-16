from typing import Union

from dotenv import load_dotenv
from fastapi import FastAPI

import firebase_admin
from firebase_admin import credentials, auth

load_dotenv()
app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

#initializing firebase
cred = credentials.Certificate("llsc/backend/python/firebaseServiceAccount.json")
firebase_admin.initialize_app(cred)
