import os
import firebase

from firebase import credentials, auth
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse

# initializing firebase
cred = credentials.Certificate("Blueprint/llsc/backend/python/firebaseServiceAccount.json")
firebase_admin.initialize_app(cred)

# define function??
app = FastAPI()

# middleware function to work with jwt auth
@app.middleware("http")
async def authenticate_user(request: Request, call_next):
    auth_header = request.headers.get("Authorization")


    # check if jwt exists and locates it if it does
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]  
        
        try:
            # getting token
            decoded_token = auth.verify_id_token(token)
            request.state.user = decoded_token 
            
        except Exception as e:
            # error w token
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
    else:
        # error if no auth
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token missing",
        )

    # next middleware or endpoint
    response = await call_next(request)
    return response

# Example of a protected route that requires authentication
@app.get("/protected")
async def protected_route(request: Request):
    user = request.state.user  # Retrieve user info from request state
    return {"message": f"Hello {user['email']}, you are authenticated!"}