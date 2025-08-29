# 180Connect Local Development Guide

This guide will help you set up and run 180Connect locally for development and testing.

## Quick Start

1. **Use the automated script (Recommended):**
   ```bash
   ./start_local_dev.sh
   ```

2. **Or follow the manual setup below**

## Manual Setup

### Prerequisites

- Python 3.10+ 
- Node.js 18+
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Mac/Linux
   # or
   .\venv\Scripts\activate   # On Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file:** (Create this file in `backend/.env`)
   ```env
   # Database - Use production PostgreSQL or local setup
   RENDER_DATABASE_URL=your_database_url_here
   
   # Email Configuration
   GMAIL_SENDER=sheffield@180dc.org
   GMAIL_APP_PASSWORD=bbbw xluh mbfq qosn
   
   # API Keys
   CHARITYBASE_API_KEY=ef7f40fe-ca6c-40fb-a7b7-4bcd0ca1ee80
   COMPANIES_HOUSE_API_KEY=5fe6b853-a006-4590-95b3-f4eda143a123
   
   # Security
   SECRET_KEY=your_very_secret_key_for_local_development
   
   # Google OAuth
   GOOGLE_CLIENT_ID=197447102347-ustgcqknmtt21akdst1fh8vqvpef7ia1.apps.googleusercontent.com
   ```

5. **Start the backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.development` file:** (Create this file in `frontend/.env.development`)
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

## Accessing the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Development Workflow

### Making Changes

1. **Frontend changes:** 
   - Edit files in `frontend/src/`
   - Vite will automatically reload the page

2. **Backend changes:**
   - Edit files in `backend/`
   - Uvicorn will automatically reload the server

### Testing Changes

1. **Test in browser:** Open http://localhost:5173
2. **Test API endpoints:** Use http://localhost:8000/docs
3. **Check console logs:** Monitor both terminal windows for errors

### Database

The application uses PostgreSQL in production. For local development:

- **Option 1:** Connect to the production database (be careful!)
- **Option 2:** Set up local PostgreSQL database
- **Option 3:** For simple testing, the codebase can be modified to use SQLite

### Common Issues

**Backend won't start:**
- Check your `.env` file exists and has correct values
- Ensure virtual environment is activated
- Check if port 8000 is already in use: `lsof -i :8000`

**Frontend won't start:**
- Check `node_modules` exists (run `npm install`)
- Ensure `.env.development` exists with correct API URL
- Check if port 5173 is already in use: `lsof -i :5173`

**Authentication issues:**
- Verify Google OAuth client ID is correct
- Check that CORS is configured for localhost:5173

### Stopping the Development Servers

```bash
# Kill all uvicorn processes
pkill -f "uvicorn.*8000"

# Kill all vite processes  
pkill -f "vite.*5173"

# Or use Ctrl+C in each terminal window
```

## Git Workflow for Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes locally and test thoroughly**

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add your descriptive commit message"
   ```

4. **Push to your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub when ready to merge

## Environment Variables

### Backend (.env)
- `RENDER_DATABASE_URL`: Database connection string
- `GMAIL_SENDER` & `GMAIL_APP_PASSWORD`: Email sending credentials
- `CHARITYBASE_API_KEY` & `COMPANIES_HOUSE_API_KEY`: API keys for data collection
- `SECRET_KEY`: JWT token encryption key
- `GOOGLE_CLIENT_ID`: Google OAuth configuration

### Frontend (.env.development)
- `VITE_API_URL`: Backend API endpoint (http://localhost:8000 for local)

## Tips

- **Use different branches** for different features
- **Test thoroughly** before pushing to main branch
- **Keep commits atomic** - one feature/fix per commit
- **Use descriptive commit messages**
- **Don't commit sensitive data** (.env files are gitignored)

## Need Help?

- Check the error logs in terminal windows
- Use the API documentation at http://localhost:8000/docs
- Test individual API endpoints with curl or Postman
- Check browser developer console for frontend errors
