from flask import request


def current_user_id():
    return request.headers.get("X-User-Id", "demo-user")
