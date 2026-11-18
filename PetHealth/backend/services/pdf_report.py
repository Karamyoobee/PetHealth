from datetime import datetime, timezone
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer


def _value(value):
    if value is None or value == "":
        return "Not recorded"
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, datetime):
        return value.isoformat(sep=" ", timespec="minutes")
    return str(value)


def _text(value):
    return escape(_value(value)).replace("\n", "<br/>")


def _line(story, styles, label, value):
    story.append(Paragraph(f"<b>{escape(label)}:</b> {_text(value)}", styles["BodyText"]))


def _saved_day(value):
    # Show the weekday from the saved visit date when it is available.
    try:
        return datetime.fromisoformat(str(value)[:10]).strftime("%A")
    except (TypeError, ValueError):
        return None


def _course_length(record):
    # Count both the first and last day of a medication course.
    try:
        start = datetime.fromisoformat(str(record.get("startDate"))[:10]).date()
        end = datetime.fromisoformat(str(record.get("endDate"))[:10]).date()
    except (TypeError, ValueError):
        return None

    if end < start:
        return None
    days = (end - start).days + 1
    return f"{days} day" if days == 1 else f"{days} days"


def _report_value(record, field):
    if field == "visitDay":
        return _saved_day(record.get("appointmentDate"))
    if field == "courseLength":
        return _course_length(record)
    if field == "reminderTime" and record.get("reminderTimes"):
        return ", ".join(record["reminderTimes"])
    return record.get(field)


def _section(story, styles, title, records, fields):
    section = [Paragraph(title, styles["Heading2"])]
    found = False
    for index, record in enumerate(records, 1):
        found = True
        section.append(Paragraph(f"Record {index}", styles["Heading3"]))
        for label, field in fields:
            _line(section, styles, label, _report_value(record, field))
        for dose in record.get("doseLog", []) or []:
            _line(section, styles, "Dose", f"{_value(dose.get('takenAt'))} - {_value(dose.get('status'))}")
            if dose.get("notes"):
                _line(section, styles, "Dose notes", dose["notes"])
        section.append(Spacer(1, 8))
    if not found:
        section.append(Paragraph("No records saved.", styles["BodyText"]))
    story.append(KeepTogether(section[:3]))
    story.extend(section[3:])


def _page_footer(pdf, document):
    pdf.saveState()
    pdf.setFont("Helvetica", 9)
    pdf.setFillColor(colors.HexColor("#3E4946"))
    pdf.drawString(54, 32, "Pet Health | Saved health records")
    pdf.drawRightString(letter[0] - 54, 32, f"Page {document.page}")
    pdf.restoreState()


def build_pet_report(pet, vet_visits, medications, reminders, symptoms=None, weights=None, flags=None, vaccinations=None):
    # Build the report from the records already checked by the pet report route.
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=48, bottomMargin=54,
        title=f"Pet Health Report - {pet.get('name', 'Pet')}", author="Pet Health",
    )
    styles = getSampleStyleSheet()
    styles["Title"].textColor = colors.HexColor("#00796B")
    styles["Heading2"].textColor = colors.HexColor("#00796B")
    story = [Paragraph("Pet Health Report", styles["Title"])]
    _line(story, styles, "Generated (UTC)", datetime.now(timezone.utc))
    story.append(Paragraph("Pet Profile", styles["Heading2"]))
    for label, field in (
        ("Pet", "name"), ("Species", "species"), ("Breed", "breed"), ("Age (years)", "age"),
        ("Sex", "sex"), ("Weight (kg)", "weightKg"), ("Spayed/neutered", "spayedNeutered"),
    ):
        _line(story, styles, label, pet.get(field))

    _section(story, styles, "Vet Visits", vet_visits, (
        ("Day", "visitDay"), ("Date", "appointmentDate"), ("Time", "appointmentTime"), ("Reason", "reason"),
        ("Clinic", "clinicName"), ("Veterinarian", "veterinarianName"), ("Diagnosis", "diagnosis"),
        ("Treatment", "treatment"), ("Notes", "notes"), ("Follow-up date", "followUpDate"),
    ))
    _section(story, styles, "Medications and Treatment", medications, (
        ("Name", "name"), ("Purpose", "purpose"), ("Dosage", "dosage"), ("Schedule", "schedule"),
        ("Instructions", "instructions"), ("Start date", "startDate"), ("End date", "endDate"),
        ("Treatment length", "courseLength"), ("Reminder time", "reminderTime"),
        ("Status", "status"), ("Completed", "completedAt"),
    ))
    _section(story, styles, "Reminder Schedule", reminders, (
        ("Title", "title"), ("Type", "type"), ("Scheduled for", "scheduledFor"), ("Repeat", "repeat"),
        ("Enabled", "enabled"), ("Completed", "completedAt"), ("Snoozed until", "snoozedUntil"),
    ))
    _section(story, styles, "Vaccinations", vaccinations if vaccinations is not None else [], (
        ("Name", "name"), ("Due date", "dueDate"), ("Status", "status"),
        ("Completed", "completedAt"), ("Notes", "notes"),
    ))
    _section(story, styles, "Symptoms", symptoms if symptoms is not None else [], (
        ("Recorded at", "recordedAt"), ("Symptom", "name"), ("Severity", "severity"), ("Notes", "notes"),
    ))
    _section(story, styles, "Weight History", weights if weights is not None else [], (
        ("Recorded at", "recordedAt"), ("Weight (kg)", "weightKg"), ("Notes", "notes"),
    ))
    _section(story, styles, "Predictive Flags", flags if flags is not None else [], (
        ("Title", "title"), ("Message", "message"), ("Severity", "severity"),
        ("Created at", "createdAt"), ("Resolved", "resolved"),
    ))
    document.build(story, onFirstPage=_page_footer, onLaterPages=_page_footer)
    buffer.seek(0)
    return buffer
