1. 📘 Project Overview
Name:
180Connect — Outreach Platform for 180 Degrees Consulting Sheffield

Description:
180Connect is a Web-based platform designed to streamline the client outreach process for 180 Degrees Consulting Sheffield. It aggregates data on potential charity and social enterprise clients using public APIs, applies predefined outreach criteria, and prepares customized email drafts using structured templates. 

Key Features:
CLIENTS
Data Aggregation: Collects data from the CharityBase and Companies House APIs for Clients.

Client Management: Add, edit and view detailed client profiles.

EMAILS
Email Drafting: Generates personalized outreach emails using predefined templates (AI-generated drafts has been deprecated).

Email Review & Sending: Allows team members to preview email drafts before sending them via Gmail SMTP integration.

Communication History: View and search past email interactions with clients done through 180Connect.

Miscellaneous
Modular Design: Split across data_collection.py, email_templates.py, and email_sender.py for easy maintainability and future upgrades.

Internal Use: Executive and Consulting team members at 180DC Sheffield, especially IT, Outreach, and Project Acquisition leads.

Organizational Use: Designed to support the operational workflows of 180DC Sheffield but extensible for use by other 180DC branches.


2. Directory Structure

```
project-root/
│
├── backend/                  # FastAPI backend application
│   ├── main.py               # FastAPI app entry point and CORS config
│   ├── models.py             # Database models (SQLAlchemy)
│   ├── database.py           # Database connection and session management
│   ├── database.db           # SQLite database file (used for local development/testing)
│   ├── routes/               # API route definitions (register, login, clients, etc.)
│   │   ├── api_routes.py
│   │   ├── token_routes.py
│   │   ├── google_routes.py
│   │   └── client_routes.py
│   ├── data_collection.py    # Data import scripts from API's (Charitybase & Companies House)
│   ├── procfile              # (For deployment) Specifies the command to run the FastAPI app
│   ├── requirements.txt      # Lists all Python dependencies needed to run the backend
│   ├── runtime.txt           # Specifies the Python version for deployment (e.g., python-3.10.12)
│   ├── google_authentication.py# Handles Google OAuth token verification and related logic
│   ├── email_sender.py       # Utility for sending emails via Gmail SMTP 
│   ├── config.py             # Stores configuration variables/settings for the backend
│   ├── ai_analysis.py        # (Deprecated) Previously used for AI-based analysis; no longer in use
│   ├── csv_files/            # Directory for storing CSV data imports from API's (client data)


├── frontend/                 # React frontend application (Vite)
│   ├── src/                  # Source code for the frontend
│   │   ├── App.jsx           # Main app and routing
│   │   ├── Components/       # Reusable React components (NavBar, AddClientForm, etc.)
│   │   ├── login/            # Login and registration pages
│   │   ├── account/          # Account/profile management
│   │   ├── client/           # Client-related pages (Add, Edit, View)
│   │   ├── company/          # Company profile pages
│   │   ├── email/            # Email dashboard page
│   │   ├── config.js         # Centralized configuration for frontend settings
│   │   ├── HomePage.jsx      # The landing page component; typically shown at the root route ("/")
│   │   ├── index.css         # Global CSS styles applied across the entire frontend app
│   │   ├── main.jsx          # Entry point for the React app; renders root component & sets up the app
│   │   ├── styles.less       # LESS stylesheet for custom styles (can be used for variables) 
│   ├── public/               # Static assets (favicon, etc.)
│   ├── .env.development      # Environment variables for development mode
│   ├── .env.production       # Environment variables for production build 
│   ├── eslint.config.js      # ESLint configuration for code linting and enforcing code style
│   ├── index.html            # The main HTML template loaded by Vite; root for the React app
│   ├── package-lock.json     # Automatically generated; locks exact versions of installed npm 
│   ├── package.json          # Lists project dependencies, scripts, and metadata for the frontend
│   ├── vite.config.js        # Vite configuration file (build, plugins, aliases, etc.)
```

3. System Requirements

- Python 3.10+ (for backend)
- Node.js 18+ (for frontend)
- OS: Windows, macOS, or Linux

4. Future Improvements
Mobile Responsiveness:
Enhance the frontend UI to be fully mobile-friendly, ensuring a seamless experience on smartphones and tablets.

Admin Page for User Management:
Implement an admin dashboard that allows privileged users to view and delete user accounts.

Customizable Email Templates:
Allow users (especially admins) to create, edit and manage email templates directly from the frontend, making outreach more flexible.

AI Email Personalization:
Complete and improve the AI-powered email drafting feature to generate more personalized and context-aware outreach emails.

Expand Client Data Sources:
Integrate additional APIs to discover and import more potential clients, increasing the reach and utility of the platform.

Frontend Client Retrieval by Region:
Add a frontend feature that enables users to fetch and view clients from different regions (using API filters).

5. Contributors
Mohammed Bobboi (bashirbobboi@gmail.com) & Abdulkarim Bobboi (Abdulkarimbobboi@gmail.com)
