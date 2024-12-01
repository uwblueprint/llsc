SERVER_LOGGER_NAME = "uvicorn"


def LOGGER_NAME(name: str):
    return f"{SERVER_LOGGER_NAME}.{name}"
