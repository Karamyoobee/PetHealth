from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from flask import abort, current_app, request


def utc_now():
    return datetime.now(timezone.utc)


def create_session_token(user):
    now = utc_now()
    expires_at = now + timedelta(hours=current_app.config["JWT_EXPIRES_HOURS"])
    payload = {
        "iss": current_app.config["JWT_ISSUER"],
        "sub": user["userId"],
        "email": user.get("email"),
        "name": user.get("name"),
        "sid": str(uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")
    return token, expires_at


def bearer_token():
    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        return None
    return header.split(" ", 1)[1].strip()


def current_session():
    token = bearer_token()
    if not token:
        return None

    try:
        return jwt.decode(
            token,
            current_app.config["JWT_SECRET"],
            algorithms=["HS256"],
            issuer=current_app.config["JWT_ISSUER"],
        )
    except jwt.PyJWTError:
        abort(401, description="Invalid or expired session token")


def current_user_id():
    session = current_session()
    if session:
        return session["sub"]
    abort(401, description="Authentication required")


def current_user_email():
    session = current_session()
    if session:
        return session.get("email")
    return None


def current_user_name():
    session = current_session()
    if session:
        return session.get("name") or current_user_id()
    return None
