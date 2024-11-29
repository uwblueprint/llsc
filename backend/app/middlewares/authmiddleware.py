import os
import firebase

from firebase import credentials, auth
from fastapi import FastAPI, Request, HTTPException, status, Depends, HTTPException, Security
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List

app = FastAPI()

#use is_authorized_by_role to get info about user - NOT DONE
#input is user (get info when accessing endpoint?)
#output is user info found using token - token, role, etc.
class get_user_info(is_authorized_by_role):
    def __init__(self, roles: List[str]):
        #self.roles = roles

    def __call__(self, user: dict = Depends(verify_firebase_token)):
        #role = user.get("role")
        #if role not in self.roles:
        #    raise HTTPException(
        #        status_code=403,
        #        detail=f"Access denied: role '{role}' not authorized"
        #    )
        #return user

#middleware function
#input allowed roles, endpoint
#output: allowing/disallowing access to endpoint
def role_based_access_control(allowed_roles: List[str]):
    def middleware_decorator(endpoint: Callable):
        async def wrapper(request: Request, *args, **kwargs):
            roles = getattr(request.state, "user_roles", [])
            if not allowed_roles:
                return await endpoint(request, *args, **kwargs)
            if not any(role in allowed_roles for role in roles):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: user cannot access this endpoint"
                )
            return await endpoint(request, *args, **kwargs)
        return wrapper
    return middleware_decorator

#add middleware to request state
#basically applies middleware function to all requests
@app.middleware("http")
async def add_user_roles(request: Request, call_next):
    #before request
    request.state.user_roles = ["user"] #get roles from is_authorized_by_roles
    #run request
    response = await call_next(request)
    #after request
    return response

#example: applying middleware to endpoint
@app.post("/admin_only")
@role_based_access_control(allowed_roles=["admin"])
async def admin_endpoint(request: Request):
    return {"message": "This is an admin endpoint"}