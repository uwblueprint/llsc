from fastapi import FASTAPI, HTTPException, Depends
from firebase_admin import auth
import firebase_unit
from pydantic import BaseModel

app = FastAPI()
class User(BaseModel):
    email: str
    password: str

@app.post("/signup")
async def sign_up(user: User):
    try:
        new_user = auth.create_user(email=user.email, password=user.password)
        return {"message": "User created successfully", "user_id": new_user.uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
async def login(user: User):
    try:
        custom_token = auth.create_custom_token(user.email)
        return {"token": custom_token}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
