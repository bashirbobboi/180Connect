/**
 * Root component that handles routing and layout structure.
 * Defines all available routes and their corresponding components.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import EmailPage from './email/EmailPage';
import LoginPage from './login/LoginPage';
import CompanyPage from './company/CompanyPage';
import AccountPage from './account/AccountPage';
import AddClientPage from './client/AddClientPage';
import EditClientPage from './client/EditClientPage';

/**
 * Main App component that sets up routing.
 * Routes:
 * - /: Homepage (redirects to /email)
 * - /email: Email management dashboard
 * - /login: Authentication page
 * - /account: User profile management
 * - /company/:id: Individual company profile
 * - /add-client: Add new client page
 * - /edit-client/:clientId: Edit client page
 */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/email" element={<EmailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/company/:id" element={<CompanyPage />} />
        <Route path="/add-client" element={<AddClientPage />} />
        <Route path="/edit-client/:clientId" element={<EditClientPage />} />
      </Routes>
    </Router>
  );
}