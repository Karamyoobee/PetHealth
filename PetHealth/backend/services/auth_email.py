import smtplib
import ssl
from concurrent.futures import ThreadPoolExecutor
from email.message import EmailMessage

from flask import current_app


email_executor = ThreadPoolExecutor(max_workers=2)


def email_configured():
    config = current_app.config
    return bool(
        config.get("SMTP_HOST") and config.get("SMTP_FROM")
        and (not config.get("SMTP_USERNAME") or config.get("SMTP_PASSWORD"))
    )


def send_password_email(app, email, code=None, purpose="reset"):
    config = app.config
    message = EmailMessage()
    message["From"] = config["SMTP_FROM"]
    message["To"] = email
    if code is not None:
        registration = purpose == "registration"
        message["Subject"] = "Verify your Pet Health email" if registration else "Your Pet Health password reset code"
        instruction = "email verification" if registration else "password reset"
        message.set_content(
            f"Your Pet Health {instruction} code is: {code}\n\n"
            "It expires in 10 minutes and can only be used once.\n"
            "Use it only in the Pet Health app. Never share this code.\n"
            "If you did not request this, ignore this email."
        )
    else:
        message["Subject"] = "Your Pet Health password was changed"
        message.set_content(
            "Your Pet Health app password was reset. Existing app sessions have been signed out.\n\n"
            "If you did not make this change, sign in with Google and reset your app password immediately.\n"
            "Your Google account password has not been changed."
        )

    try:
        context = ssl.create_default_context()
        if config.get("SMTP_USE_SSL"):
            connection = smtplib.SMTP_SSL(config["SMTP_HOST"], config["SMTP_PORT"], timeout=15, context=context)
        else:
            connection = smtplib.SMTP(config["SMTP_HOST"], config["SMTP_PORT"], timeout=15)
        with connection as server:
            if not config.get("SMTP_USE_SSL"):
                server.starttls(context=context)
            if config.get("SMTP_USERNAME"):
                server.login(config["SMTP_USERNAME"], config["SMTP_PASSWORD"])
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        app.logger.error("Password email delivery failed (%s)", type(exc).__name__)


def queue_password_email(email, code=None):
    email_executor.submit(send_password_email, current_app._get_current_object(), email, code)


def queue_registration_email(email, code):
    email_executor.submit(send_password_email, current_app._get_current_object(), email, code, "registration")
