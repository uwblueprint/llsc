from typing import Union

from dotenv import load_dotenv
from fastapi import FastAPI

from app.routes import email

load_dotenv()
app = FastAPI()

app.include_router(email.router, tags=["email"], prefix="/email")

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
