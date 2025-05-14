import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import sys

# === PATH SETUP FOR RELATIVE IMPORTS ===
# Ensures config and other modules can be imported regardless of how the script is run.
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# === IMPORT EMAIL CREDENTIALS FROM CONFIG ===
from backend.config import GMAIL_SENDER, GMAIL_APP_PASSWORD

# === SMTP SERVER SETTINGS ===
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465

def send_email_gmail(recipient_email, subject, body, sender_email=GMAIL_SENDER):
    """
    Send an email using Gmail SMTP via Google Workspace.

    Args:
        recipient_email (str): The recipient's email address.
        subject (str): The subject line of the email.
        body (str): The plain text body of the email.
        sender_email (str): The sender's email address (default: GMAIL_SENDER from config).
    """
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    # === SEND EMAIL VIA GMAIL SMTP ===
    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
        server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
        server.sendmail(sender_email, recipient_email, msg.as_string())

    print(f"✅ Email sent to {recipient_email}")

# === EXAMPLE USAGE ===
if __name__ == "__main__":
    # Edit the test_recipient, test_subject, and test_body for testing.
    test_recipient = "mbabobboi1@180dc.org" 
    test_subject = "SMTP Test from 180DC Sheffield"
    test_body = "Hello,\n\nThis is a test email sent using Gmail SMTP from our outreach system.\n\nBest,\n180 Degrees Consulting Sheffield"

    send_email_gmail(test_recipient, test_subject, test_body)
