import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import sys

# Add the parent directory to the path to make relative imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Now import from config package
from backend.config import GMAIL_SENDER, GMAIL_APP_PASSWORD

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465

def send_email_gmail(recipient_email, subject, body, sender_email=GMAIL_SENDER):
    """Send an email using Gmail SMTP via Google Workspace."""
    
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
        server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
        server.sendmail(sender_email, recipient_email, msg.as_string())

    print(f"✅ Email sent to {recipient_email}")

if __name__ == "__main__":
    test_recipient = "mbabobboi1@180dc.org" 
    test_subject = "SMTP Test from 180DC Sheffield"
    test_body = "Hello,\n\nThis is a test email sent using Gmail SMTP from our outreach system.\n\nBest,\n180 Degrees Consulting Sheffield"

    send_email_gmail(test_recipient, test_subject, test_body)
