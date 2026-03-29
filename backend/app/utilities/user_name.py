from app.models import User

def resolve_user_first_name(user: User | None) -> str | None:
    if not user:
        return None

    if user.first_name and user.first_name.strip():
        return user.first_name.strip()

    if user.user_data and user.user_data.first_name and user.user_data.first_name.strip():
        return user.user_data.first_name.strip()

    return None
