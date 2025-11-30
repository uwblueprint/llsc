from pydantic import BaseModel


class ContactRequest(BaseModel):
    """Schema for contact form submission"""

    name: str
    email: str
    message: str


class ContactResponse(BaseModel):
    """Schema for contact form response"""

    success: bool
    message: str
