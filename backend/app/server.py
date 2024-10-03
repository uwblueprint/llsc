from typing import Union

from dotenv import load_dotenv
from fastapi import FastAPI
from . import models

load_dotenv()

app = FastAPI()
models.init_app()



@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
