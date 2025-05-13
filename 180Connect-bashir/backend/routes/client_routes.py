from fastapi import APIRouter, Depends, HTTPException, Query, Header, Path, Body
from models import User, Company, Email, BulkEmailCreate
from routes.token_routes import verify_token, get_current_user_from_token
from database import get_db
from config import GMAIL_SENDER, GMAIL_APP_PASSWORD
from ai_analysis import generate_email
from pydantic import BaseModel
import pandas as pd
import numpy as np
import ollama
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session, joinedload

router = APIRouter(prefix="")

###############################################
############# DB FUNCTIONS ####################
###############################################
@router.get("/all-clients")
def get_all_db_clients(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Retrieve the list of clients from the database."""
    try:
        token_value = authorization.replace("Bearer ", "")
        token = verify_token(token_value, db)
        if not token:
            return {"message": "Invalid token.", "results": []}
        
        # Use join to get source information
        companies = (
            db.query(Company)
            .options(joinedload(Company.source))
            .all()
        )
        
        if not companies:
            return {"message": "Database empty.", "results": []}
            
        return [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "company_type": c.company_type,
                "address": c.address,
                "city": c.city,
                "region": c.region,
                "email": c.email,
                "postcode": c.postcode,
                "website": c.website,
                "activities": c.activities,
                "source": c.source.name if c.source else None
            }
            for c in companies
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/clients/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.get("/search-clients")
def search_companies(query: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    try:
        companies = db.query(Company).filter(Company.name.ilike(f"%{query}%")).all()
        if not companies:
            return {"message": "No companies found matching the query.", "results": []}
        return [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "company_type": c.company_type,
                "address": c.address,
                "email": c.email,
                "postcode": c.postcode,
                "website": c.website,
                "activities": c.activities
            }
            for c in companies
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
@router.post("/send-emails/")
def create_bulk_emails(
    email_data: BulkEmailCreate,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    # Verify if companies exist
    companies = db.query(Company).filter(Company.id.in_(email_data.client_ids)).all()
    found_ids = {company.id for company in companies}
    missing_ids = set(email_data.client_ids) - found_ids
    
    if missing_ids:
        raise HTTPException(
            status_code=404, 
            detail=f"Companies not found for IDs: {missing_ids}"
        )
    
    created_emails = []
    user = get_current_user_from_token(authorization, db)
    try:
        for company in companies:
            # Create email record
            new_email = Email(
                user_id=user.id,
                client_id=company.id,
                subject=email_data.subject,
                content=email_data.content,
                ai=email_data.ai,
                status="sent"
            )
            db.add(new_email)
            
            # Send the actual email if company has an email address
            if company.email:
                try:
                    # Replace {charity_name} with actual company name
                    email_content = email_data.content.replace("{charity_name}", company.name)
                    
                    # Create HTML version of the email with signature
                    html_content = (
                        '<div style="font-family: Arial, sans-serif;">'
                        f'{email_content.replace(chr(10), "<br>")}'
                        '<br><br>'
                        '<div dir="ltr">'
                        '<div>'
                        '<a href="mailto:sheffield@180dc.org" target="_blank">Email</a>'
                        '<span>&nbsp;-&nbsp;</span>'
                        '<a href="https://www.180dc.org/" target="_blank">Website</a>'
                        '<span>&nbsp;-&nbsp;</span>'
                        '<a href="https://www.instagram.com/180dcsheffield/" target="_blank">Instagram</a>'
                        '<span>&nbsp;-&nbsp;</span>'
                        '<a href="https://www.linkedin.com/company/104399563/admin/dashboard/" target="_blank">LinkedIn</a>'
                        '<br>'
                        '</div>'
                        '<div>Business Consulting and Services</div>'
                        '<div>Sheffield, South Yorkshire</div>'
                        '<div>'
                        '<img width="96" height="96" src="https://ci3.googleusercontent.com/mail-sig/AIorK4z7bSBEIHVpx-66BDEvzOz_BzLe3E1hmBNaK9jvUMFHF4R4bsW2oHU4pTR6zGHTqDzFfySVbwZ5DnS3" alt="180DC Sheffield logo">'
                        '</div>'
                        '</div>'
                        '</div>'
                    )
                    
                    # Create both plain text and HTML versions
                    msg = MIMEMultipart('alternative')
                    msg["From"] = GMAIL_SENDER
                    msg["To"] = company.email
                    msg["Subject"] = email_data.subject
                    
                    # Add plain text version
                    text_part = MIMEText(email_content, 'plain')
                    msg.attach(text_part)
                    
                    # Add HTML version
                    html_part = MIMEText(html_content, 'html')
                    msg.attach(html_part)

                    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                        server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
                        server.sendmail(GMAIL_SENDER, company.email, msg.as_string())
                    
                    new_email.status = "sent"
                except Exception as e:
                    new_email.status = "failed"
                    print(f"Failed to send email to {company.email}: {str(e)}")
            else:
                new_email.status = "failed"
                print(f"No email address for company {company.name}")
            
            created_emails.append({
                "id": new_email.id,
                "subject": new_email.subject,
                "status": new_email.status,
                "client_name": company.name,
                "client_email": company.email
            })
        
        db.commit()
        
        return {
            "message": f"Successfully processed {len(created_emails)} emails",
            "emails": created_emails
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process emails: {str(e)}"
        )
    
@router.get("/client-emails/{client_id}")
def get_client_emails(
    client_id: int,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Get all emails between the current user and a specific client."""
    try:
        user = get_current_user_from_token(authorization, db)
        
        # Check if client exists
        client = db.query(Company).filter(Company.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        emails = (
            db.query(Email)
            .filter(
                Email.user_id == user.id,
                Email.client_id == client_id
            )
            .order_by(Email.date.desc())  # Most recent first
            .all()
        )
        
        return {
            "client": {
                "id": client.id,
                "name": client.name,
                "email": client.email,
                "activities": client.activities,
                "address": client.address,
                "company_type": client.company_type,
                "postcode": client.postcode,
                "id_from_source": client.id_from_source,
                "status": client.status,
                "website": client.website,
            },
            "emails": [
                {
                    "id": email.id,
                    "subject": email.subject,
                    "content": email.content,
                    "status": email.status,
                    "date": email.date.isoformat(),
                    "ai_generated": email.ai
                }
                for email in emails
            ]
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve emails: {str(e)}"
        )

###############################################
############# CSV FUNCTIONS ###################
###############################################

# ✅ Load client data safely
CLIENT_DATA_FILE = "csv_files/client_data.csv"

def load_client_data():
    """Load client data from CSV, handling missing or invalid values."""
    try:
        df = pd.read_csv(CLIENT_DATA_FILE, encoding="utf-8")

        # ✅ Replace problematic values
        df.replace([np.inf, -np.inf], np.nan, inplace=True)  # Convert inf/-inf to NaN
        df.fillna("", inplace=True)  # Replace NaN with empty strings

        return df
    except Exception as e:
        print(f"❌ Error loading client data: {e}")
        return pd.DataFrame()  # Return empty DataFrame on error

client_data = load_client_data()  # Load data on startup

# ✅ Email Model for API Requests
class EmailRequest(BaseModel):
    client_name: str
    recipient_email: str
    tone: str = "professional"

# ✅ Gmail SMTP Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465

# ---------------------------
# 🔹 1. GET Client Data
# ---------------------------
@router.get("/clients")
def get_clients():
    """Retrieve the list of clients from the CSV file."""
    try:
        if client_data.empty:
            raise HTTPException(status_code=500, detail="Client data not available.")
        return client_data.to_dict(orient="records")  # Convert DataFrame to JSON
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# ---------------------------
# 🔹 2. POST Generate AI Email
# ---------------------------
@router.post("/generate-email")
def generate_ai_email(email_request: EmailRequest):
    """Generate an AI-powered outreach email using Llama 3."""
    try:
        subject, email_body = generate_email(
            client_name=email_request.client_name,
            client_type="nonprofit or business",
            mission="Supporting community initiatives",  # Replace with real mission
            website="http://example.com",  # Replace with real website
            tone=email_request.tone
        )
        return {"subject": subject, "body": email_body}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------
# 🔹 3. POST Send Email
# ---------------------------
@router.post("/send-email")
def send_email(email_request: EmailRequest):
    """Send an email via Gmail SMTP."""
    try:
        subject, email_body = generate_email(
            client_name=email_request.client_name,
            client_type="nonprofit or business",
            mission="Supporting community initiatives",  # Replace with real mission
            website="http://example.com",  # Replace with real website
            tone=email_request.tone
        )

        msg = MIMEMultipart()
        msg["From"] = GMAIL_SENDER
        msg["To"] = email_request.recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(email_body, "plain"))

        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_SENDER, email_request.recipient_email, msg.as_string())

        return {"message": f"✅ Email sent to {email_request.recipient_email}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateClientRequest(BaseModel):
    name: str
    company_type: str
    status: str = "active"
    address: str | None = None
    email: str | None = None
    postcode: str | None = None
    city: str | None = None
    region: str | None = None
    website: str | None = None
    activities: str | None = None

@router.post("/add-client")
def add_client(
    client_data: CreateClientRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Add a new client to the database."""
    try:
        # Verify token and get user
        user = get_current_user_from_token(authorization, db)
        
        # Create new company
        new_company = Company(
            name=client_data.name,
            status=client_data.status,
            company_type=client_data.company_type,
            address=client_data.address,
            email=client_data.email,
            postcode=client_data.postcode,
            city=client_data.city,
            region=client_data.region,
            website=client_data.website,
            activities=client_data.activities
        )
        
        db.add(new_company)
        db.commit()
        db.refresh(new_company)
        
        return {
            "message": "Client added successfully",
            "client": {
                "id": new_company.id,
                "name": new_company.name,
                "status": new_company.status,
                "company_type": new_company.company_type,
                "address": new_company.address,
                "email": new_company.email,
                "postcode": new_company.postcode,
                "city": new_company.city,
                "region": new_company.region,
                "website": new_company.website,
                "activities": new_company.activities
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add client: {str(e)}"
        )

@router.put("/clients/{client_id}")
def update_client(
    client_id: int = Path(...),
    client_data: CreateClientRequest = Body(...),
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    user = get_current_user_from_token(authorization, db)
    company = db.query(Company).filter(Company.id == client_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Client not found")
    # Update fields
    company.name = client_data.name
    company.company_type = client_data.company_type
    company.status = client_data.status
    company.address = client_data.address
    company.email = client_data.email
    company.postcode = client_data.postcode
    company.city = client_data.city
    company.region = client_data.region
    company.website = client_data.website
    company.activities = client_data.activities
    db.commit()
    db.refresh(company)
    return {"message": "Client updated", "client": {
        "id": company.id,
        "name": company.name,
        "company_type": company.company_type,
        "status": company.status,
        "address": company.address,
        "email": company.email,
        "postcode": company.postcode,
        "city": company.city,
        "region": company.region,
        "website": company.website,
        "activities": company.activities
    }}
