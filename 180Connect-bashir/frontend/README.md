# 180Connect Frontend

## Tech Stack
- React 18+ with Vite
- React Router for navigation
- Bootstrap 5 for styling
- Google OAuth for authentication
- REST API integration
- [Wikimedia Codex](https://doc.wikimedia.org/codex/main/using-codex/about.html) components and icons

## Project Structure
```
frontend/
├── public/            
├── src/
│   ├── account/      # Account management components
│   ├── company/      # Company profile components
│   ├── Components/   # Shared components
│   ├── email/        # Email management components
│   ├── login/        # Authentication components
│   ├── App.jsx       # Root component
│   ├── main.jsx      # Entry point
│   └── styles/       # Global styles
```

## Key Features
1. Authentication
   - Email/password login
   - Google OAuth integration
   - Token-based session management

2. Client Management
   - Search functionality
   - Filtering by multiple criteria
   - Company profiles

3. Email System
   - Email templates
   - AI-assisted content generation
   - Draft saving
   - Email history tracking

## Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file with:
   ```
   VITE_API_URL=https://one80connect.onrender.com
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## API Integration
The frontend communicates with the FastAPI backend at `${API_URL}`. All authenticated requests require a Bearer token.
