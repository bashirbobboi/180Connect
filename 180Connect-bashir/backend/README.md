# 180Connect Backend

## Tech Stack
- FastAPI for API development
- SQLite with SQLAlchemy ORM
- Gmail SMTP for email sending
- OpenAI API for content generation
- Google OAuth integration

## Project Structure
```
backend/
├── routes/
│   ├── api_routes.py     # Core API endpoints
│   ├── client_routes.py  # Client management endpoints
│   ├── google_routes.py  # Google OAuth authentication
│   └── token_routes.py   # Token management
├── csv_files/           # Data source files
├── ai_analysis.py      # AI content generation
├── config.py          # Environment configuration
├── data_collection.py # Data import utilities
├── database.py       # Database configuration
├── email_sender.py   # Email service
├── main.py          # Application entry point
└── models.py        # Database models
```

## Key Features
1. Authentication System
   - Token-based authentication
   - Password hashing
   - Session management

2. Google OAuth Integration
   - Authentication managed via Google Cloud Console
   - Testing environment limitations:
     - Maximum 100 test users
     - Users must be manually added in Google Cloud Console
     - APIs & Services > OAuth Consent Screen > Audience

3. Data Management
   - SQLite database
   - CharityBase API integration
   - Companies House API integration

4. Email System
   - Gmail SMTP integration
   - Bulk email sending
   - Email tracking

5. AI Integration
   - OpenAI API integration
   - Content generation
   - Email customization
   - Response analysis

## Setup Instructions
1. Create and activate virtual environment:
   ```bash
   python -m venv myenv
   .\myenv\Scripts\activate  # On Windows
   source myenv/bin/activate  # On Mac/Linux
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Initialize database:
   If running for the first time, ensure the init_db() function in main.py is not commented out

4. Run development server:
   ```bash
   fastapi dev main.py
   ```

## API Documentation
The API is available at `http://localhost:8000` with interactive documentation at `/docs`.

## Dependencies
See requirements.txt for full list of Python packages.
