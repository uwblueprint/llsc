import os
import firebase

from firebase import credentials, auth
from fastapi import FastAPI, Request, HTTPException, status, Depends, HTTPException, Security
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List

# initializing firebase
def initialize_firebase():
    cwd = os.getcwd()
    service_account_path = os.path.join(cwd, "firebaseServiceAccount.json")
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)

security = HTTPBearer()

#go into database and get user role as string from uid
def get_user_role_from_database(uid: str) -> str:
    #need to implement logic here???
    user_roles = {
        "uid_1": "admin",
        "uid_2": "volunteer",
        "uid_3": "participant"
    }
    user = db.query(User).filter(User.uid == uid).first()
    return user_roles.get(uid, "participant") #defaults to participant?

#verify token when logging in and return their role
def verify_firebase_token(
    credentials: HTTPAUthorizationCredentials = Security(security)
) -> dict:
    try:
        decoded_token - auth.verify_id_token(credentials.credentials)
        user_id = decoded_token.get("uid")

        role = get_user_role_from_database(user_id)

        if not role:
            raise HTTPException(status_code=403, detail="User role not found")

        decoded_token["role"] = role
        return decoded_token

    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# change access based on role
def role_required(allowed_roles: List[str]):
    def wrapper(user: dict = Depends(verify_firebase_token)):
        role = user.get("role")
        if role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denies: role '{role}' not authorized"
            )
        return user
    return wrapper

# apply role dependency to endpoints
app = FastAPI()

@app.get("/admin")
def admin_endpoint(
    user: dict = Depends(role_required(["admin"]))):
        return {"message": f"Welcome, {user['email']}"}

@app.get("/volunteer")
def volunteer_endpoint(
    user: dict = Depends(role_required(["admin", "volunteer"]))):
        return {"message": f"Welcome, {user['email']}"}

@app.get("/participant")
def participant_endpoint(
    user: dict = Depends(role_required(["admin", "volunteer", "participant"]))):
        return {"message": f"Welcome, {user['email']}"}

"""
###
def authorize_for_roles(roles):
    def auth_middleware(request: Request):
        auth_middleware_roles = roles

        pass
    return auth_middleware #when initializing endpoint, 

@router.post("/", response_model=UserCreateResponse)
async def create_user(
    user: UserCreateRequest, auth_middleware = Depends(authorize_for_roles({"Admin"}))
)
### experiment w/ depends

initialize_firebase()

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
"""