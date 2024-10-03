from sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_app(app):
    app.app_context().push()
    db.init_app(app)

    erase_db_and_sync = app.config["TESTING"]

    if erase_db_and_sync:
        # drop tables
        db.reflect()
        db.drop_all()

        # recreate tables
        db.create_all()
