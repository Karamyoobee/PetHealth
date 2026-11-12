from flask import Blueprint, Response


privacy_bp = Blueprint("privacy", __name__)


@privacy_bp.get("/privacy")
def privacy_policy():
    # Keep the policy available without an account so it can be linked in Google Play.
    page = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pet Health Privacy Policy</title>
  <style>
    body { margin: 0; background: #f8f7f3; color: #1f302c; font-family: Arial, sans-serif; line-height: 1.6; }
    main { max-width: 760px; margin: 40px auto; padding: 32px; background: #fff; border-radius: 14px; box-shadow: 0 2px 12px #00000012; }
    h1, h2 { color: #087d69; line-height: 1.25; }
    h1 { margin-top: 0; }
    a { color: #087d69; }
    .updated { color: #5c6966; }
  </style>
</head>
<body>
  <main>
    <h1>Pet Health Privacy Policy</h1>
    <p class="updated">Last updated: 12 November 2026</p>
    <p>Pet Health helps owners organise pet care records, reminders and vet-visit information. This policy explains how the Pet Health mobile app handles information.</p>

    <h2>Information we collect</h2>
    <ul>
      <li>Account details, such as your name, email address and sign-in method.</li>
      <li>Pet details and records you add, including a pet's name, species, breed, age, weight, photos, symptoms, medication, vaccinations and vet visits.</li>
      <li>Messages sent to the Pet Health Assistant and the selected pet record summary needed to answer the question.</li>
      <li>Notification details, including an Expo push token, device installation identifier and time zone, when you allow reminders.</li>
    </ul>

    <h2>How we use information</h2>
    <p>We use this information to create and secure your account, save the records you choose to add, create reminders, generate PDF reports, answer Assistant questions and send account or reminder notifications. Pet Health does not sell personal information.</p>

    <h2>Service providers</h2>
    <p>We use Google Sign-In to authenticate Google accounts, Brevo to send verification and password-reset emails, Expo to deliver push notifications, and Google Gemini to generate Assistant responses. Gemini receives a limited summary of the selected pet's records and the message you send; it does not receive direct access to the Pet Health database. Our backend and database providers process information to run the service.</p>

    <h2>Data security and retention</h2>
    <p>Passwords are stored as hashes rather than readable passwords. Access to pet records is restricted to the signed-in account that owns them. We keep account and pet records while your account is active so the app can provide its features.</p>

    <h2>Your choices</h2>
    <p>You can edit or delete individual pet records in the app and can turn off notifications in your device settings. You can delete your Pet Health account in the app, or follow our <a href="/delete-account">account deletion instructions</a>. We may need to confirm your identity before completing an email request.</p>

    <h2>Children</h2>
    <p>Pet Health is not directed to children under 13. If you believe a child has provided personal information, contact us so we can review the request.</p>

    <h2>Changes to this policy</h2>
    <p>We may update this policy when the app changes. The latest version will always be available at this address.</p>

    <h2>Contact</h2>
    <p>For privacy questions or requests, email <a href="mailto:karamjeetsinghpb06@gmail.com">karamjeetsinghpb06@gmail.com</a>.</p>
  </main>
</body>
</html>"""
    return Response(page, mimetype="text/html")


@privacy_bp.get("/delete-account")
def delete_account_page():
    # Keep deletion instructions public for people who no longer have the app.
    page = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Delete your Pet Health account</title>
  <style>
    body { margin: 0; background: #f8f7f3; color: #1f302c; font-family: Arial, sans-serif; line-height: 1.6; }
    main { max-width: 760px; margin: 40px auto; padding: 32px; background: #fff; border-radius: 14px; box-shadow: 0 2px 12px #00000012; }
    h1, h2 { color: #087d69; line-height: 1.25; }
    h1 { margin-top: 0; }
    a { color: #087d69; }
  </style>
</head>
<body>
  <main>
    <h1>Delete your Pet Health account</h1>
    <p>You can permanently delete your Pet Health account from the app. Sign in, open the Home screen, then select <strong>Delete Account</strong> and confirm your choice.</p>

    <h2>If you cannot access the app</h2>
    <p>Email <a href="mailto:karamjeetsinghpb06@gmail.com?subject=Delete%20my%20Pet%20Health%20account">karamjeetsinghpb06@gmail.com</a> from the email address registered with Pet Health. Use the subject “Delete my Pet Health account”. We may ask you to confirm that the account belongs to you.</p>

    <h2>What is deleted</h2>
    <p>We delete your account details, pet profiles and photos, symptoms, medication and reminder records, vaccinations, vet visits, weight entries, Assistant conversations, and notification registrations. Deletion is permanent and cannot be undone. We aim to complete verified email requests within 30 days.</p>

    <h2>What is kept</h2>
    <p>We do not keep your Pet Health account data after deletion, except information we must retain to meet a legal obligation. Deleting Pet Health does not delete your Google account.</p>
  </main>
</body>
</html>"""
    return Response(page, mimetype="text/html")
