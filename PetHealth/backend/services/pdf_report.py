from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def _line(pdf, y, label, value):
    text = f"{label}: {value if value not in (None, '') else '-'}"
    pdf.drawString(72, y, text[:95])
    return y - 16


def _section(pdf, y, title):
    if y < 90:
        pdf.showPage()
        y = 740
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(72, y, title)
    pdf.setFont("Helvetica", 10)
    return y - 20


def build_pet_report(pet, vet_visits, medications, reminders, symptoms=None, weights=None, flags=None):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle(f"Pet Health Report - {pet.get('name', 'Pet')}")

    y = 740
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(72, y, "Pet Health Report")
    y -= 30

    pdf.setFont("Helvetica", 10)
    y = _line(pdf, y, "Pet", pet.get("name"))
    y = _line(pdf, y, "Species", pet.get("species"))
    y = _line(pdf, y, "Breed", pet.get("breed"))
    y = _line(pdf, y, "Age", pet.get("age"))
    y = _line(pdf, y, "Sex", pet.get("sex"))
    y = _line(pdf, y, "Weight kg", pet.get("weightKg"))
    y = _line(pdf, y, "Spayed/neutered", pet.get("spayedNeutered"))

    y = _section(pdf, y - 10, "Vet Visits")
    for visit in vet_visits:
        y = _line(pdf, y, visit.get("appointmentDate"), f"{visit.get('clinicName')} - {visit.get('diagnosis')}")

    y = _section(pdf, y - 10, "Medications")
    for medication in medications:
        y = _line(pdf, y, medication.get("name"), f"{medication.get('dosage')} - {medication.get('schedule')}")

    y = _section(pdf, y - 10, "Reminders")
    for reminder in reminders:
        y = _line(pdf, y, reminder.get("scheduledFor"), reminder.get("title"))

    y = _section(pdf, y - 10, "Symptoms")
    for symptom in symptoms or []:
        y = _line(pdf, y, symptom.get("recordedAt"), f"{symptom.get('name')} - {symptom.get('severity')}")

    y = _section(pdf, y - 10, "Weights")
    for weight in weights or []:
        y = _line(pdf, y, weight.get("recordedAt"), f"{weight.get('weightKg')} kg")

    y = _section(pdf, y - 10, "Predictive Flags")
    for flag in flags or []:
        y = _line(pdf, y, flag.get("title"), flag.get("message"))

    pdf.save()
    buffer.seek(0)
    return buffer
