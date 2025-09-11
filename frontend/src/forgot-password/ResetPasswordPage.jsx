import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from "react-router-dom";
import '../styles.less';
import '../App.css';
import '../login/LoginPage.css';

const API_URL = import.meta.env.VITE_API_URL;

export function ForgotPassword(){
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleRequestPasswordReset = async (event) => {
    event.preventDefault();

    if (!email) {
      alert("Email is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Invalid email format.");
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("email", email);

      const res = await fetch(`${API_URL}/request-password-reset`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message && data.message.includes("not fully implemented")) {
          alert("Password reset is not available in local development mode. Please contact an administrator.");
        } else {
          setEmail('');
          setSent(true);
        }
      } else {
        const data = await res.json();
        alert(data.detail || "Reset failed.");
      }
    } catch {
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-vh-100 login-page">
      {/* Header with logo and back to login button */}
      <div className="d-flex justify-content-between align-items-center p-4">
        {/* Logo in top left */}
        <div>
          <img 
            src="/connectlogo.png" 
            alt="180Connect Logo" 
            width="200" 
            height="" 
          />
        </div>
        
        {/* Back to login button */}
        <button 
          className="css-1uj0sxn create-account-hover"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/login';
          }}
        >
          BACK TO LOGIN
        </button>
      </div>

      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-6 col-xl-5">
              
              {sent ? (
                <div className="text-center">
                  <h1 className="css-1llmlc0 mb-4">Email Sent</h1>
                  <div className="bg-white p-4 rounded" style={{ border: '1px solid #e0e0e0' }}>
                    <p className="mb-0">
                      An email with instructions on how to reset your password has been sent to <strong>{email}</strong>. 
                      Check your spam or junk folder if you don't see the email in your inbox.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Title */}
                  <div className="text-center mb-5">
                    <h1 className="css-1llmlc0 mb-3">Forgot Password?</h1>
                    <p className="text-muted">Enter your email address and we'll send you instructions to reset your password.</p>
                  </div>

                  {/* Forgot Password Form */}
                  <form onSubmit={handleRequestPasswordReset}>
                    <div className="mb-4">
                      <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                        EMAIL ADDRESS
                      </label>
                      <div className="input-container">
                        <input 
                          type="email"
                          className="form-control px-0 py-2"
                          placeholder="name@example.com"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            boxShadow: 'none'
                          }}
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="btn w-100 py-3 mb-4"
                      style={{ 
                        backgroundColor: email ? '#000' : '#e5e5e5',
                        color: email ? '#fff' : '#999',
                        fontSize: '14px',
                        fontWeight: '500',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        border: 'none',
                        borderRadius: '5px'
                      }}
                      disabled={!email}
                    >
                      SEND RESET EMAIL
                    </button>
                  </form>

                  <div className="text-center">
                    <span className="text-muted small">Remember your password? </span>
                    <a 
                      className="text-dark fw-medium small sign-in-link"
                      style={{ cursor: 'pointer' }}
                      onClick={() => window.location.href = '/login'}
                    >
                      Sign in
                    </a>
                  </div>
                </>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");  
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePasswordReset = async (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("token", token);
      formData.append("new_password", newPassword);

      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (res.ok) {
        setSuccessMessage("Password reset successful. Redirecting...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        const data = await res.json();
        setErrorMessage(data.detail || "Reset failed.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-vh-100 login-page">
      {/* Header with logo and back to login button */}
      <div className="d-flex justify-content-between align-items-center p-4">
        {/* Logo in top left */}
        <div>
          <img 
            src="/connectlogo.png" 
            alt="180Connect Logo" 
            width="200" 
            height="" 
          />
        </div>
        
        {/* Back to login button */}
        <button 
          className="css-1uj0sxn create-account-hover"
          onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}
        >
          BACK TO LOGIN
        </button>
      </div>

      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-6 col-xl-5">
              
              {!token ? (
                <div className="text-center">
                  <h1 className="css-1llmlc0 mb-4">Invalid Reset Link</h1>
                  <p className="text-muted mb-4">This password reset link is invalid or has expired.</p>
                  <button 
                    className="btn py-3 px-4"
                    style={{ 
                      backgroundColor: '#000',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '500',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      border: 'none',
                      borderRadius: '5px'
                    }}
                    onClick={() => navigate('/forgot-password')}
                  >
                    REQUEST A NEW ONE
                  </button>
                </div>
              ) : (
                <>
                  {/* Title */}
                  <div className="text-center mb-5">
                    <h1 className="css-1llmlc0 mb-3">Reset Password</h1>
                    <p className="text-muted">Enter your new password below.</p>
                  </div>

                  {/* Messages */}
                  {errorMessage && (
                    <div className="alert alert-danger mb-4" role="alert">
                      {errorMessage}
                    </div>
                  )}
                  {successMessage && (
                    <div className="alert alert-success mb-4" role="alert">
                      {successMessage}
                    </div>
                  )}

                  {/* Reset Password Form */}
                  <form onSubmit={handlePasswordReset}>
                    <div className="mb-4">
                      <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                        NEW PASSWORD
                      </label>
                      <div className="input-container">
                        <input 
                          type="password"
                          className="form-control px-0 py-2"
                          placeholder="Create a strong password"
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            boxShadow: 'none'
                          }}
                          required
                        />
                      </div>
                      <div className="form-text text-muted small mt-1" style={{ fontSize: '11px' }}>
                        Password should be at least 8 characters long
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                        CONFIRM PASSWORD
                      </label>
                      <div className="input-container">
                        <input 
                          type="password"
                          className="form-control px-0 py-2"
                          placeholder="Confirm your password"
                          value={confirmNewPassword} 
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            boxShadow: 'none'
                          }}
                          required
                        />
                      </div>
                      {(newPassword !== confirmNewPassword && confirmNewPassword) && (
                        <div className="form-text text-danger small mt-1" style={{ fontSize: '11px' }}>
                          Passwords do not match
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit"
                      className="btn w-100 py-3 mb-4"
                      style={{ 
                        backgroundColor: (newPassword && confirmNewPassword && newPassword === confirmNewPassword) ? '#000' : '#e5e5e5',
                        color: (newPassword && confirmNewPassword && newPassword === confirmNewPassword) ? '#fff' : '#999',
                        fontSize: '14px',
                        fontWeight: '500',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        border: 'none',
                        borderRadius: '5px'
                      }}
                      disabled={!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                    >
                      RESET PASSWORD
                    </button>
                  </form>

                  <div className="text-center">
                    <span className="text-muted small">Remember your password? </span>
                    <a 
                      className="text-dark fw-medium small sign-in-link"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/login')}
                    >
                      Sign in
                    </a>
                  </div>
                </>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}