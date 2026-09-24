from flask import request


def current_user_id():
    return request.headers.get("X-User-Id", "demo-user")


def current_user_email():
    return request.headers.get("X-User-Email")


def current_user_name():
    return request.headers.get("X-User-Name", current_user_id())
