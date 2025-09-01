
/**
 * Login and registration page component.
 * Handles user authentication through email/password and Google OAuth.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import '../styles.less';
import '../App.css';
import NavBar from '/src/Components/NavBar';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const API_URL = import.meta.env.VITE_API_URL;

console.log("LoginPage API_URL:", API_URL);

export default function LoginPage() {
  // Authentication form state
  const [createAccount, setCreateAccount] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration form state
  const [fname, setFName] = useState('');
  const [lname, setLName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Force Google button container background to match page background
  useEffect(() => {
    const timer = setTimeout(() => {
      const googleContainer = document.querySelector('.google-login-container');
      if (googleContainer) {
        googleContainer.style.setProperty('background', '#f7f7f7', 'important');
        googleContainer.style.setProperty('background-color', '#f7f7f7', 'important');
      }
    }, 1000); // Wait for Google button to fully load

    return () => clearTimeout(timer);
  }, [createAccount]); // Re-run when switching between login/register
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const navigate = useNavigate();

  // Google OAuth hook
  const googleLogin = useGoogleLogin({
    onSuccess: (response) => {
      handleGoogleSuccess(response);
    },
    onError: () => {
      console.log('Login Failed');
    },
  });

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  function validateLoginForm(checkEmail, checkPassword) {
    if (!checkEmail || !checkPassword) {
      return "Email and password are required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(checkEmail)) {
      return "Invalid email format.";
    }
    return null;
  }
  
  async function login(user, pass) {
    try {
      const error = validateLoginForm(user, pass);
      if (error) {
        showNotification(error, 'error');
        return;
      }

      console.log("Starting login for:", user);

      const formData = new URLSearchParams();
      formData.append("email", user);
      formData.append("password", pass);
    
      console.log("Sending login request to:", `${API_URL}/token`);
      
      const response = await fetch(`${API_URL}/token`, {
        method: "POST",
        body: formData,
        headers: {
          "accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      
      console.log("Login response status:", response.status);
      const data = await response.json();
      console.log("Login response data:", data);
    
      if (response.ok) {
        console.log("Login successful, storing token and navigating...");
        localStorage.setItem("token", data.access_token);
        showNotification("Login successful! Redirecting...", 'success');
        setTimeout(() => navigate('/'), 1500); // Delay navigation to show notification
        return data;
      } else if (response.status === 401) {
        showNotification("Invalid email or password", 'error');
        throw new Error(data.detail);
      } else {
        showNotification(`Login failed: ${data.detail || 'Unknown error'}`, 'error');
        throw new Error(data.detail);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (!error.message.includes("Invalid email or password")) {
        showNotification(`Login failed: ${error.message}`, 'error');
      }
    }
  }

  function validateRegisterForm(checkEmail, checkPassword, checkFirstName, checkLastName) {
    if (!checkEmail || !checkPassword || !checkFirstName || !checkLastName) {
      return "All fields are required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(checkEmail)) {
      return "Invalid email format.";
    }
    if (checkPassword.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return null;
  }

  async function register(register_email, pass, first_name, last_name) {
    try {
      const error = validateRegisterForm(register_email, pass, first_name, last_name);
      if (error) {
        showNotification(error, 'error');
        return;
      }

      console.log("Starting registration for:", register_email);

      const formData = new URLSearchParams();
      formData.append("email", register_email);
      formData.append("password", pass);
      formData.append("first_name", first_name);
      formData.append("last_name", last_name);
    
      console.log("Sending registration request to:", `${API_URL}/register`);
      
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        body: formData,
        headers: {
          "accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        },
      });
    
      const data = await response.json();
      console.log("Registration response:", response.status, data);
    
      if (response.ok) {
        showNotification("Account created successfully! Logging you in...", 'success');
        
        // Automatically log in the user
        const loginFormData = new URLSearchParams();
        loginFormData.append("email", register_email);
        loginFormData.append("password", pass);

        const loginResponse = await fetch(`${API_URL}/token`, {
          method: "POST",
          body: loginFormData,
          headers: {
            "accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        const loginData = await loginResponse.json();
        console.log("Login response:", loginResponse.status, loginData);

        if (loginResponse.ok) {
          localStorage.setItem("token", loginData.access_token);
          setTimeout(() => navigate('/'), 1500); // Delay navigation to show notification
        } else {
          showNotification("Account created, but failed to log in automatically. Please log in manually.", 'error');
          setTimeout(() => navigate('/login'), 1500);
        }
        return data;
      } else {
        showNotification(`Registration failed: ${data.detail || 'Unknown error'}`, 'error');
        throw new Error(data.detail);
      }
    } catch (error) {
      console.error("Registration error:", error);
      showNotification(`Registration failed: ${error.message}`, 'error');
    }
  }

  const handleLogin = (event) => {
    event.preventDefault();
    login(email, password);
  }

  const handleRegister = (event) => {
    event.preventDefault();
    register(registerEmail, registerPassword, fname, lname);
  }

  /**
   * Handles successful Google OAuth login
   * googleResponse - Response from Google OAuth
   */
  const handleGoogleSuccess = async (googleResponse) => {
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleResponse.credential // The token from Google
        })
      });
      
      const data = await response.json();
      if(response.ok){
        localStorage.setItem("token", data.access_token);
        navigate('/')
      }      
    } catch (error) {
      console.error('Error during Google authentication:', error);
    }
  };

  return (
    <div className="min-vh-100 login-page">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === 'success' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
            </div>
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}
      {/* Header with logo and conditional button */}
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
        
        {/* Button in top right */}
        <button 
          className="css-1uj0sxn create-account-hover"
          onClick={(e) => {
            e.preventDefault()
            setCreateAccount(!createAccount)
          }}
        >
          {createAccount ? 'LOG IN' : 'CREATE ACCOUNT'}
        </button>
      </div>

      {!createAccount ? (
        /* Login Page */
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-10 col-xl-8">
                
                {/* Title Only */}
                <div className="text-center mb-5">
                  <h1 className="css-1llmlc0 mb-5">Log into 180Connect</h1>
                </div>

                {/* Main Content Row */}
                <div className="row gx-0 align-items-center" style={{ minHeight: '400px' }}>
                  {/* Left Column - Login Form */}
                  <div className="col-12 col-md-5">
                    <div className="pe-md-4">
                      <form onSubmit={(e) => handleLogin(e)}>
                        <div className="mb-4">
                          <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                            EMAIL ADDRESS
                          </label>
                          <div className="input-container">
                            <input 
                              type="email"
                              className="form-control px-0 py-2"
                              placeholder="name@180dc.com"
                              value={email} 
                              onChange={(e) => setEmail(e.target.value)}
                              style={{ 
                                fontSize: '16px',
                                boxShadow: 'none'
                              }}
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                            PASSWORD
                          </label>
                          <div className="input-container">
                            <div className="position-relative">
                              <input 
                                type={showPassword ? "text" : "password"}
                                className="form-control px-0 py-2 pe-4"
                                placeholder="Password"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ 
                                  fontSize: '16px',
                                  boxShadow: 'none'
                                }}
                              />
                              <button 
                                type="button"
                                className="btn btn-link p-0 text-dark position-absolute"
                                style={{ 
                                  fontSize: '16px',
                                  right: '0',
                                  top: '50%',
                                  transform: 'translateY(-50%)'
                                }}
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="btn w-100 py-3 mb-4"
                          style={{ 
                            backgroundColor: email && password ? '#000' : '#e5e5e5',
                            color: email && password ? '#fff' : '#000',
                            fontSize: '14px',
                            fontWeight: '500',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            border: 'none',
                            borderRadius: '5px'
                          }}
                          disabled={!email || !password}
                        >
                          LOG IN
                        </button>
                      </form>

                      {/* Forgot Password Link */}
                      <div className="text-center mb-4">
                        <a 
                          href="#"
                          className="text-dark fw-medium small sign-in-link"
                          style={{ cursor: 'pointer', fontSize: '12px' }}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/forgot-password';
                          }}
                        >
                          Forgot password?
                        </a>
                      </div>

                      {/* Mobile OR divider */}
                      <div className="d-block d-md-none mt-5">
                        <div className="d-flex align-items-center">
                          <div className="css-amgugu"></div>
                          <div className="px-3" style={{ fontSize: '11px', color: '#000', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                            OR
                          </div>
                          <div className="css-amgugu"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Vertical Divider */}
                  <div className="col-2 d-none d-md-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                    <div className="position-relative d-flex align-items-center justify-content-center" style={{ height: '100%' }}>
                      <div className="css-amgugu"></div>
                      <div className="position-absolute or-divider-background" style={{ 
                        backgroundColor: 'transparent', 
                        padding: '8px 12px', 
                        fontSize: '11px', 
                        color: '#000', 
                        letterSpacing: '0.5px',
                        fontWeight: 'bold'
                      }}>
                        OR
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Social Login */}
                  <div className="col-12 col-md-5">
                    <div className="ps-md-4 d-flex flex-column justify-content-center" style={{ minHeight: '300px' }}>
                      <div className="social-buttons-container">
                        {/* Custom Google Button */}
                        <div 
                          className="custom-google-button"
                          onClick={() => googleLogin()}
                        >
                          <svg className="google-icon" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Sign in with Google
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Create Account Page */
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-6 col-xl-5">
                
                {/* Logo and Title */}
                <div className="text-center mb-5">
                  <h1 className="css-1llmlc0 mb-5">Create your 180Connect account</h1>
                </div>

                {/* Registration Form */}
                <form onSubmit={(e) => handleRegister(e)}>
                  <div className="row mb-4">
                    <div className="col-6">
                      <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                        FIRST NAME
                      </label>
                      <div className="input-container">
                        <input 
                          type="text"
                          className="form-control px-0 py-2"
                          placeholder="Jane"
                          value={fname} 
                          onChange={(e) => setFName(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            boxShadow: 'none'
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                        LAST NAME
                      </label>
                      <div className="input-container">
                        <input 
                          type="text"
                          className="form-control px-0 py-2"
                          placeholder="Doe"
                          value={lname} 
                          onChange={(e) => setLName(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            boxShadow: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                      EMAIL ADDRESS
                    </label>
                    <div className="input-container">
                      <input 
                        type="email"
                        className="form-control px-0 py-2"
                        placeholder="name@180dc.com"
                        value={registerEmail} 
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        style={{ 
                          fontSize: '16px',
                          boxShadow: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                      PASSWORD
                    </label>
                    <div className="input-container">
                      <div className="position-relative">
                        <input 
                          type={showRegisterPassword ? "text" : "password"}
                          className="form-control px-0 py-2 pe-4"
                          placeholder="Choose a secure password"
                          value={registerPassword} 
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            boxShadow: 'none'
                          }}
                        />
                        <button 
                          type="button"
                          className="btn btn-link p-0 text-dark position-absolute"
                          style={{ 
                            fontSize: '16px',
                            right: '0',
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }}
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        >
                          {showRegisterPassword ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="form-text text-muted small mt-1" style={{ fontSize: '11px' }}>
                      Must be 6+ characters 
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="btn w-100 py-3 mb-4"
                    style={{ 
                      backgroundColor: fname && lname && registerEmail && registerPassword ? '#000' : '#e5e5e5',
                      color: fname && lname && registerEmail && registerPassword ? '#fff' : '#999',
                      fontSize: '14px',
                      fontWeight: '500',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      border: 'none',
                      borderRadius: '4px'
                    }}
                    disabled={!fname || !lname || !registerEmail || !registerPassword}
                  >
                    CREATE ACCOUNT
                  </button>
                </form>

        

                {/* Google Sign Up Button */}
                <div className="mb-4">
                  <div 
                    className="custom-google-button"
                    onClick={() => googleLogin()}
                  >
                    <svg className="google-icon" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-muted small">Already have an account? </span>
                  <a 
                    className="text-dark fw-medium small sign-in-link"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault()
                      setCreateAccount(false)
                    }}
                  >
                    Sign in
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}