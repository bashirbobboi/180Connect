/**
 * Login and registration page component.
 * Handles user authentication through email/password and Google OAuth.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import '../styles.less';
import '../App.css';
import NavBar from '/src/Components/NavBar';
import { GoogleLogin } from '@react-oauth/google';
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
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const navigate = useNavigate();

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
        setTimeout(() => navigate('/email'), 1500); // Delay navigation to show notification
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
          setTimeout(() => navigate('/email'), 1500); // Delay navigation to show notification
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
        navigate('/email')
      }      
    } catch (error) {
      console.error('Error during Google authentication:', error);
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f7f7f7' }}>
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
      {/* Header with create account */}
      <div className="d-flex justify-content-end align-items-center p-4">
        <button 
          className="css-1uj0sxn"
          onClick={(e) => {
            e.preventDefault()
            setCreateAccount(true)
          }}
        >
          CREATE ACCOUNT
        </button>
      </div>

      {!createAccount ? (
        /* Login Page */
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-10 col-xl-8">
                
                {/* Logo and Title */}
                <div className="text-center mb-5">
                  <div className="mb-4">
                    <img 
                      src="/connectlogo.png" 
                      alt="180Connect Logo" 
                      width="200" 
                      height="" 
                      className="mb-3 logo-animation"
                    />
                  </div>
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
                          <input 
                            type="email"
                            className="form-control border-0 border-bottom border-dark rounded-0 bg-transparent px-0 py-2"
                            placeholder="name@180dc.com"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ 
                              fontSize: '16px',
                              boxShadow: 'none',
                              borderRadius: '0 !important'
                            }}
                          />
                        </div>

                        <div className="mb-4">
                          <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                            PASSWORD
                          </label>
                          <div className="position-relative">
                            <input 
                              type={showPassword ? "text" : "password"}
                              className="form-control border-0 border-bottom border-dark rounded-0 bg-transparent px-0 py-2 pe-4"
                              placeholder="Password"
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)}
                              style={{ 
                                fontSize: '16px',
                                boxShadow: 'none',
                                borderRadius: '0 !important'
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

                        <button 
                          type="submit"
                          className="btn w-100 py-3 mb-4"
                          style={{ 
                            backgroundColor: email && password ? '#000' : '#e5e5e5',
                            color: email && password ? '#fff' : '#999',
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

                      <div className="text-center">
                        <a 
                          href="#"
                          className="text-dark text-decoration-none"
                          style={{ fontSize: '12px', fontWeight: '500', letterSpacing: '1px' }}
                          onClick={() => navigate('/forgot-password')}
                        >
                          CAN'T LOG IN?
                        </a>
                      </div>

                      {/* Mobile OR divider */}
                      <div className="d-block d-md-none mt-5">
                        <div className="d-flex align-items-center">
                          <div className="css-amgugu"></div>
                          <div className="px-3" style={{ fontSize: '11px', color: '#999', letterSpacing: '0.5px' }}>
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
                      <div className="position-absolute" style={{ 
                        backgroundColor: '#f7f7f7', 
                        padding: '8px 12px', 
                        fontSize: '11px', 
                        color: '#999', 
                        letterSpacing: '0.5px' 
                      }}>
                        OR
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Social Login */}
                  <div className="col-12 col-md-5">
                    <div className="ps-md-4 d-flex flex-column justify-content-center" style={{ minHeight: '300px' }}>
                      <GoogleLogin
                        onSuccess={(response) => {
                          handleGoogleSuccess(response)
                        }}
                        onError={() => {
                          console.log('Login Failed');
                        }}
                        theme="outline"
                        size="large"
                        width="100%"
                        text="continue_with"
                      />
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
                  <div className="mb-4">
                    <img 
                      src="/connectlogo.png" 
                      alt="180Connect Logo" 
                      width="50" 
                      height="50" 
                      className="mb-3 logo-animation"
                    />
                  </div>
                  <h1 className="css-1llmlc0 mb-5">Create your 180Connect account</h1>
                </div>

                {/* Registration Form */}
                <form onSubmit={(e) => handleRegister(e)}>
                  <div className="row mb-4">
                    <div className="col-6">
                      <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                        FIRST NAME
                      </label>
                      <input 
                        type="text"
                        className="form-control border-0 border-bottom border-dark rounded-0 bg-transparent px-0 py-2"
                        placeholder="Jane"
                        value={fname} 
                        onChange={(e) => setFName(e.target.value)}
                        style={{ 
                          fontSize: '16px',
                          boxShadow: 'none',
                          borderRadius: '0 !important'
                        }}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                        LAST NAME
                      </label>
                      <input 
                        type="text"
                        className="form-control border-0 border-bottom border-dark rounded-0 bg-transparent px-0 py-2"
                        placeholder="Doe"
                        value={lname} 
                        onChange={(e) => setLName(e.target.value)}
                        style={{ 
                          fontSize: '16px',
                          boxShadow: 'none',
                          borderRadius: '0 !important'
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                      EMAIL ADDRESS
                    </label>
                    <input 
                      type="email"
                      className="form-control border-0 border-bottom border-dark rounded-0 bg-transparent px-0 py-2"
                      placeholder="name@example.com"
                      value={registerEmail} 
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      style={{ 
                        fontSize: '16px',
                        boxShadow: 'none',
                        borderRadius: '0 !important'
                      }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-uppercase text-muted small fw-medium mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                      PASSWORD
                    </label>
                    <div className="position-relative">
                      <input 
                        type={showRegisterPassword ? "text" : "password"}
                        className="form-control border-0 border-bottom border-dark rounded-0 bg-transparent px-0 py-2 pe-4"
                        placeholder="Choose a secure password"
                        value={registerPassword} 
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        style={{ 
                          fontSize: '16px',
                          boxShadow: 'none',
                          borderRadius: '0 !important'
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
                    <div className="form-text text-muted small mt-1" style={{ fontSize: '11px' }}>
                      Must be 8+ characters including a number and letter
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

                <div className="text-center">
                  <span className="text-muted small">Already have an account? </span>
                  <a 
                    className="text-dark text-decoration-none fw-medium small"
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