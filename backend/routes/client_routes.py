from fastapi import APIRouter, HTTPException, Query, Header, Path, Body, Request, Form
from models import User, Company, Email, BulkEmailCreate
from routes.token_routes import verify_token, get_render_user_from_uid
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
async def render_get_all_db_clients(
        request: Request,
        authorization: str = Header(...)
    ):
    """Retrieve the list of clients from the database."""
    # Check if using SQLite or PostgreSQL
    if hasattr(request.app.state, 'SessionLocal'):
        # SQLite/SQLAlchemy approach
        from models import Company, Source, Token, User
        SessionLocal = request.app.state.SessionLocal
        
        with SessionLocal() as db:
            try:
                token_value = authorization.replace("Bearer ", "")
                
                # Verify token using SQLAlchemy
                from routes.token_routes import verify_token_sqlite
                token = verify_token_sqlite(token_value, db)
                if not token:
                    return {"message": "Invalid token.", "results": []}
                
                # Get all companies with their sources
                companies = db.query(Company, Source.name.label('source_name')).outerjoin(Source).order_by(Company.name).all()
                
                if not companies:
                    return {"message": "Database empty.", "results": []}
                    
                return [
                    {
                        "id": company.id,
                        "name": company.name,
                        "status": company.status,
                        "company_type": company.company_type,
                        "address": company.address,
                        "city": company.city,
                        "region": company.region,
                        "email": company.email,
                        "postcode": company.postcode,
                        "website": company.website,
                        "activities": company.activities,
                        "source": source_name or "Unknown"
                    }
                    for company, source_name in companies
                ]
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    else:
        # PostgreSQL/asyncpg approach
        pool = request.app.state.db

        async with pool.acquire() as conn:
            try:
                token_value = authorization.replace("Bearer ", "")
                token = await verify_token(token_value, conn)

                if not token:
                    return {"message": "Invalid token.", "results": []}
                
                # Use fetch to get all company records joined with their source name
                companies = await conn.fetch(
                    """
                    SELECT 
                        companies.id,
                        companies.name,
                        companies.status,
                        companies.company_type,
                        companies.address,
                        companies.city,
                        companies.region,
                        companies.email,
                        companies.postcode,
                        companies.website,
                        companies.activities,
                        sources.name AS source_name
                    FROM companies
                    LEFT JOIN sources ON companies.source_id = sources.id
                    ORDER BY companies.name;
                    """
                )
                
                if not companies:
                    return {"message": "Database empty.", "results": []}
                    
                return [
                    {
                        "id": c["id"],
                        "name": c["name"],
                        "status": c["status"],
                        "company_type": c["company_type"],
                        "address": c["address"],
                        "city": c["city"],
                        "region": c["region"],
                        "email": c["email"],
                        "postcode": c["postcode"],
                        "website": c["website"],
                        "activities": c["activities"],
                        "source": c["source_name"]
                    }
                    for c in companies
                ]
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/clients/{company_id}")
async def get_company(
    request: Request,
    company_id: int, 
):
    # Check if using SQLite or PostgreSQL
    if hasattr(request.app.state, 'SessionLocal'):
        # SQLite/SQLAlchemy approach
        from models import Company
        SessionLocal = request.app.state.SessionLocal
        
        with SessionLocal() as db:
            company = db.query(Company).filter(Company.id == company_id).first()
            
            if not company:
                raise HTTPException(status_code=404, detail="Company not found")
            
            return {
                "id": company.id,
                "name": company.name,
                "status": company.status,
                "company_type": company.company_type,
                "address": company.address,
                "email": company.email,
                "postcode": company.postcode,
                "city": company.city,
                "region": company.region,
                "website": company.website,
                "activities": company.activities,
                "id_from_source": company.id_from_source,
                "source_id": company.source_id
            }
    else:
        # PostgreSQL/asyncpg approach
        pool = request.app.state.db

        async with pool.acquire() as conn:
            company = await conn.fetchrow(
                """
                SELECT 
                    id, name, status, company_type, address, email, postcode, 
                    city, region, website, activities, id_from_source, source_id
                FROM companies
                WHERE id = $1
                """,
                company_id
            )

            if not company:
                raise HTTPException(status_code=404, detail="Company not found")

            return dict(company)

@router.get("/search-clients")
async def search_companies(
    request: Request,
    query: str = Query(..., min_length=1), 
):
    # Check if using SQLite or PostgreSQL
    if hasattr(request.app.state, 'SessionLocal'):
        # SQLite/SQLAlchemy approach
        from models import Company
        SessionLocal = request.app.state.SessionLocal
        
        with SessionLocal() as db:
            try:
                companies = db.query(Company).filter(
                    Company.name.ilike(f"%{query}%")
                ).all()

                if not companies:
                    return {"message": "No companies found matching the query.", "results": []}

                return {
                    "message": "Success",
                    "results": [
                        {
                            "id": c.id,
                            "name": c.name,
                            "status": c.status,
                            "company_type": c.company_type,
                            "address": c.address,
                            "email": c.email,
                            "postcode": c.postcode,
                            "website": c.website,
                            "activities": c.activities,
                        }
                        for c in companies
                    ]
                }

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    else:
        # PostgreSQL/asyncpg approach
        pool = request.app.state.db

        async with pool.acquire() as conn:
            try:
                companies = await conn.fetch(
                    """
                    SELECT id, name, status, company_type, address, email, postcode, website, activities
                    FROM companies
                    WHERE LOWER(name) LIKE LOWER($1)
                    """,
                    f"%{query}%",
                )

                if not companies:
                    return {"message": "No companies found matching the query.", "results": []}

                return {
                    "message": "Success",
                    "results": [
                        {
                            "id": c["id"],
                            "name": c["name"],
                            "status": c["status"],
                            "company_type": c["company_type"],
                            "address": c["address"],
                            "email": c["email"],
                            "postcode": c["postcode"],
                            "website": c["website"],
                            "activities": c["activities"],
                        }
                        for c in companies
                    ]
                }

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
@router.post("/send-emails/")
async def create_bulk_emails(
    request: Request,
    email_data: BulkEmailCreate,
    authorization: str = Header(...),
):
    # Check if using SQLite or PostgreSQL
    if hasattr(request.app.state, 'SessionLocal'):
        # SQLite/SQLAlchemy approach
        from models import Company, User, Email
        from routes.token_routes import verify_token_sqlite
        SessionLocal = request.app.state.SessionLocal
        
        with SessionLocal() as db:
            try:
                # Verify token and user
                token_value = authorization.replace("Bearer ", "")
                token = verify_token_sqlite(token_value, db)
                if not token:
                    raise HTTPException(status_code=401, detail="Invalid token")
                
                user = db.query(User).filter(User.id == token.user_id).first()
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")

                # Fetch all specified companies
                companies = db.query(Company).filter(Company.id.in_(email_data.client_ids)).all()
                found_ids = {c.id for c in companies}
                missing_ids = set(email_data.client_ids) - found_ids

                if missing_ids:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Companies not found for IDs: {missing_ids}"
                    )

                created_emails = []

                for company in companies:
                    email_content = email_data.content.replace("{charity_name}", company.name)
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
                        '<br></div><div>Business Consulting and Services</div>'
                        '<div>Sheffield, South Yorkshire</div>'
                        '<div><img width="96" height="96" src="https://ci3.googleusercontent.com/mail-sig/AIorK4z7bSBEIHVpx-66BDEvzOz_BzLe3E1hmBNaK9jvUMFHF4R4bsW2oHU4pTR6zGHTqDzFfySVbwZ5DnS3" alt="180DC Sheffield logo"></div>'
                        '</div></div>'
                    )

                    status = "failed"
                    if company.email:
                        try:
                            msg = MIMEMultipart("alternative")
                            msg["From"] = GMAIL_SENDER
                            msg["To"] = company.email
                            msg["Subject"] = email_data.subject
                            msg.attach(MIMEText(email_content, "plain"))
                            msg.attach(MIMEText(html_content, "html"))

                            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                                server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
                                server.sendmail(GMAIL_SENDER, company.email, msg.as_string())

                            status = "sent"
                        except Exception as e:
                            print(f"❌ Failed to send to {company.email}: {e}")
                    else:
                        print(f"⚠️ No email for company {company.name}")

                    # Insert email record
                    new_email = Email(
                        user_id=user.id,
                        client_id=company.id,
                        subject=email_data.subject,
                        content=email_data.content,
                        status=status
                    )
                    db.add(new_email)
                    db.commit()
                    db.refresh(new_email)

                    created_emails.append({
                        "id": new_email.id,
                        "subject": email_data.subject,
                        "status": status,
                        "client_name": company.name,
                        "client_email": company.email
                    })

                return {
                    "message": f"Successfully processed {len(created_emails)} emails",
                    "emails": created_emails
                }

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to process emails: {str(e)}")
    else:
        # PostgreSQL/asyncpg approach
        pool = request.app.state.db

        async with pool.acquire() as conn:
            try:
                # Verify token and user
                token_value = authorization.replace("Bearer ", "")
                token = await verify_token(token_value, conn)
                user = await get_render_user_from_uid(conn, token["user_id"])

                # Fetch all specified companies
                company_ids = tuple(email_data.client_ids)
                companies = await conn.fetch(
                    "SELECT * FROM companies WHERE id = ANY($1::int[]);", company_ids
                )
                found_ids = {c["id"] for c in companies}
                missing_ids = set(company_ids) - found_ids

                if missing_ids:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Companies not found for IDs: {missing_ids}"
                    )

                created_emails = []

                for company in companies:
                    email_content = email_data.content.replace("{charity_name}", company["name"])
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
                        '<br></div><div>Business Consulting and Services</div>'
                        '<div>Sheffield, South Yorkshire</div>'
                        '<div><img width="96" height="96" src="https://ci3.googleusercontent.com/mail-sig/AIorK4z7bSBEIHVpx-66BDEvzOz_BzLe3E1hmBNaK9jvUMFHF4R4bsW2oHU4pTR6zGHTqDzFfySVbwZ5DnS3" alt="180DC Sheffield logo"></div>'
                        '</div></div>'
                    )

                    status = "failed"
                    if company["email"]:
                        try:
                            msg = MIMEMultipart("alternative")
                            msg["From"] = GMAIL_SENDER
                            msg["To"] = company["email"]
                            msg["Subject"] = email_data.subject
                            msg.attach(MIMEText(email_content, "plain"))
                            msg.attach(MIMEText(html_content, "html"))

                            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                                server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
                                server.sendmail(GMAIL_SENDER, company["email"], msg.as_string())

                            status = "sent"
                        except Exception as e:
                            print(f"❌ Failed to send to {company['email']}: {e}")
                    else:
                        print(f"⚠️ No email for company {company['name']}")

                    # Insert email record
                    email_row = await conn.fetchrow(
                        """
                        INSERT INTO emails (user_id, client_id, subject, content, status)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id;
                        """,
                        user["id"],
                        company["id"],
                        email_data.subject,
                        email_data.content,
                        status
                    )

                    created_emails.append({
                        "id": email_row["id"],
                        "subject": email_data.subject,
                        "status": status,
                        "client_name": company["name"],
                        "client_email": company["email"]
                    })

                return {
                    "message": f"Successfully processed {len(created_emails)} emails",
                    "emails": created_emails
                }

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to process emails: {str(e)}")
        
@router.post("/send-email/")
async def create_bulk_emails(
    request: Request,
    authorization: str = Header(...),
    client_id: int = Form(...),
    subject: str = Form(...),
    content: str = Form(...),
):
    pool = request.app.state.db

    async with pool.acquire() as conn:
        try:
            # Verify token and user
            token_value = authorization.replace("Bearer ", "")
            token = await verify_token(token_value, conn)
            user = await get_render_user_from_uid(conn, token["user_id"])

            # Fetch all specified companies
            company = await conn.fetchrow(
                "SELECT * FROM companies WHERE id = $1 LIMIT 1;", client_id
            )

            if not company:
                raise HTTPException(
                    status_code=404,
                    detail=f"Invalid company id"
                )

            content = content.replace("{charity_name}", company["name"])
            html_content = (
                '<div style="font-family: Arial, sans-serif;">'
                f'{content.replace(chr(10), "<br>")}'
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
                '<br></div><div>Business Consulting and Services</div>'
                '<div>Sheffield, South Yorkshire</div>'
                '<div><img width="96" height="96" src="https://ci3.googleusercontent.com/mail-sig/AIorK4z7bSBEIHVpx-66BDEvzOz_BzLe3E1hmBNaK9jvUMFHF4R4bsW2oHU4pTR6zGHTqDzFfySVbwZ5DnS3" alt="180DC Sheffield logo"></div>'
                '</div></div>'
            )

            status = "failed"
            if company["email"]:
                try:
                    msg = MIMEMultipart("alternative")
                    msg["From"] = GMAIL_SENDER
                    msg["To"] = company["email"]
                    msg["Subject"] = subject
                    msg.attach(MIMEText(content, "plain"))
                    msg.attach(MIMEText(html_content, "html"))

                    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                        server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
                        server.sendmail(GMAIL_SENDER, company["email"], msg.as_string())

                    status = "sent"
                except Exception as e:
                    print(f"❌ Failed to send to {company['email']}: {e}")
            else:
                print(f"⚠️ No email for company {company['name']}")

            # Insert email record
            await conn.execute(
                """
                INSERT INTO emails (user_id, client_id, subject, content, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id;
                """,
                user["id"],
                company["id"],
                subject,
                content,
                status
            )

            return {
                "message": f"Successfully processed email",
            }
    
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process email: {str(e)}")

@router.get("/client-emails/{client_id}")
async def get_client_emails(
    request: Request,
    client_id: int,
    authorization: str = Header(...),
):
    """Get all emails between the current user and a specific client."""
    pool = request.app.state.db

    async with pool.acquire() as conn:
        try:
            # Verify token and user
            token_value = authorization.replace("Bearer ", "")
            token = await verify_token(token_value, conn)
            user = await get_render_user_from_uid(conn, token["user_id"])

            # Check if client exists
            client = await conn.fetchrow(
                """
                SELECT id, name, email, activities, address, company_type, postcode, id_from_source, status, website
                FROM companies
                WHERE id = $1
                """,
                client_id
            )
            if not client:
                raise HTTPException(status_code=404, detail="Client not found")

            # Get all emails sent by user to that client
            emails = await conn.fetch(
                """
                SELECT id, subject, content, status, date
                FROM emails
                WHERE user_id = $1 AND client_id = $2
                ORDER BY date DESC
                """,
                user["id"],
                client_id
            )

            return {
                "client": dict(client),
                "emails": [
                    {
                        "id": e["id"],
                        "subject": e["subject"],
                        "content": e["content"],
                        "status": e["status"],
                        "date": e["date"].isoformat() if e["date"] else None
                    }
                    for e in emails
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
async def add_client(
    request: Request,
    client_data: CreateClientRequest,
    authorization: str = Header(...),
):
    """Add a new client to the database."""
    # Check if using SQLite or PostgreSQL
    if hasattr(request.app.state, 'SessionLocal'):
        # SQLite/SQLAlchemy approach
        from models import Company, User
        from routes.token_routes import verify_token_sqlite
        SessionLocal = request.app.state.SessionLocal
        
        with SessionLocal() as db:
            try:
                # Verify token and user
                token_value = authorization.replace("Bearer ", "")
                token = verify_token_sqlite(token_value, db)
                if not token:
                    raise HTTPException(status_code=401, detail="Invalid token")
                
                user = db.query(User).filter(User.id == token.user_id).first()
                if not user:
                    raise HTTPException(status_code=401, detail="Invalid user")

                # Insert new company
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
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to add client: {str(e)}"
                )
    else:
        # PostgreSQL/asyncpg approach
        pool = request.app.state.db

        async with pool.acquire() as conn:
            try:
                # Verify token and user
                token_value = authorization.replace("Bearer ", "")
                token = await verify_token(token_value, conn)
                _ = await get_render_user_from_uid(conn, token["user_id"])

                # Insert new company
                inserted = await conn.fetchrow(
                    """
                    INSERT INTO companies (
                        name, status, company_type, address, email, postcode,
                        city, region, website, activities
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id, name, status, company_type, address, email,
                              postcode, city, region, website, activities;
                    """,
                    client_data.name,
                    client_data.status,
                    client_data.company_type,
                    client_data.address,
                    client_data.email,
                    client_data.postcode,
                    client_data.city,
                    client_data.region,
                    client_data.website,
                    client_data.activities
                )

                return {
                    "message": "Client added successfully",
                    "client": dict(inserted)
                }

            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to add client: {str(e)}"
                )

@router.put("/clients/{client_id}")
async def update_client(
    request: Request,
    client_id: int = Path(...),
    client_data: CreateClientRequest = Body(...),
    authorization: str = Header(...),
):
    pool = request.app.state.db

    async with pool.acquire() as conn:
        try:
            # Authenticate user
            token_value = authorization.replace("Bearer ", "")
            token = await verify_token(token_value, conn)
            _ = await get_render_user_from_uid(conn, token["user_id"])

            # Check if client exists
            company = await conn.fetchrow(
                "SELECT * FROM companies WHERE id = $1",
                client_id
            )
            if not company:
                raise HTTPException(status_code=404, detail="Client not found")

            # Update the record
            updated = await conn.fetchrow(
                """
                UPDATE companies
                SET name = $1,
                    company_type = $2,
                    status = $3,
                    address = $4,
                    email = $5,
                    postcode = $6,
                    city = $7,
                    region = $8,
                    website = $9,
                    activities = $10
                WHERE id = $11
                RETURNING id, name, company_type, status, address, email, postcode, city, region, website, activities;
                """,
                client_data.name,
                client_data.company_type,
                client_data.status,
                client_data.address,
                client_data.email,
                client_data.postcode,
                client_data.city,
                client_data.region,
                client_data.website,
                client_data.activities,
                client_id
            )

            return {
                "message": "Client updated",
                "client": dict(updated)
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to update client: {str(e)}")
