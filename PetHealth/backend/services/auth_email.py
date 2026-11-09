from concurrent.futures import ThreadPoolExecutor

import requests
from flask import current_app


email_executor = ThreadPoolExecutor(max_workers=2)


def email_configured():
    config = current_app.config
    return bool(config.get("BREVO_API_KEY") and config.get("BREVO_SENDER_EMAIL"))


def send_password_email(app, email, code=None, purpose="reset"):
    # Send account emails through Brevo's HTTPS API so Render's SMTP limits do not affect delivery.
    config = app.config
    if code is not None:
        registration = purpose == "registration"
        subject = "Verify your Pet Health email" if registration else "Your Pet Health password reset code"
        instruction = "email verification" if registration else "password reset"
        text_content = (
            f"Your Pet Health {instruction} code is: {code}\n\n"
            "It expires in 10 minutes and can only be used once.\n"
            "Use it only in the Pet Health app. Never share this code.\n"
            "If you did not request this, ignore this email."
        )
    else:
        subject = "Your Pet Health password was changed"
        text_content = (
            "Your Pet Health app password was reset. Existing app sessions have been signed out.\n\n"
            "If you did not make this change, sign in with Google and reset your app password immediately.\n"
            "Your Google account password has not been changed."
        )

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={"api-key": config["BREVO_API_KEY"], "content-type": "application/json"},
            json={
                "sender": {"name": config["BREVO_SENDER_NAME"], "email": config["BREVO_SENDER_EMAIL"]},
                "to": [{"email": email}],
                "subject": subject,
                "textContent": text_content,
            },
            timeout=15,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        app.logger.error("Password email delivery failed (%s)", type(exc).__name__)


def queue_password_email(email, code=None):
    # Send mail separately so the API request does not wait for Gmail.
    email_executor.submit(send_password_email, current_app._get_current_object(), email, code)


def queue_registration_email(email, code):
    email_executor.submit(send_password_email, current_app._get_current_object(), email, code, "registration")
