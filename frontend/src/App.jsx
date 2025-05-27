/**
 * Root component that handles routing and layout structure.
 * Defines all available routes and their corresponding components.
 */

import { Analytics } from '@vercel/analytics/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import EmailPage from './email/EmailPage';
import LoginPage from './login/LoginPage';
import CompanyPage from './company/CompanyPage';
import AccountPage from './account/AccountPage';
import EditClientPage from './client/EditClientPage';
import ResetPasswordPage, { ForgotPassword } from './forgot-password/ResetPasswordPage';

/**
 * Main App component that sets up routing.
 * Routes:
 * - /: Homepage (redirects to /email)
 * - /email: Email management dashboard
 * - /login: Authentication page
 * - /forgot-password: Send password reset request page
 * - /reset-password: Reset password page
 * - /account: User profile management
 * - /company/:id: Individual company profile
 * - /edit-client/:clientId: Edit client page
 */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/email" element={<EmailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/company/:id" element={<CompanyPage />} />
        <Route path="/edit-client/:clientId" element={<EditClientPage />} />
      </Routes>
      <Analytics />
    </Router>
  );
}