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
  
  // Registration form state
  const [fname, setFName] = useState('');
  const [lname, setLName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  const navigate = useNavigate();

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
        alert(error);
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
        alert("Login successful! Redirecting...");
        navigate('/email');
        return data;
      } else if (response.status === 401) {
        alert("Invalid email or password");
        throw new Error(data.detail);
      } else {
        alert(`Login failed: ${data.detail || 'Unknown error'}`);
        throw new Error(data.detail);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (!error.message.includes("Invalid email or password")) {
        alert(`Login failed: ${error.message}`);
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
        alert(error);
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
        alert("Account created successfully! Logging you in...");
        
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
          navigate('/email');
        } else {
          alert("Account created, but failed to log in automatically. Please log in manually.");
          navigate('/login');
        }
        return data;
      } else {
        alert(`Registration failed: ${data.detail || 'Unknown error'}`);
        throw new Error(data.detail);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(`Registration failed: ${error.message}`);
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
    <div className="login-page min-vh-100 d-flex flex-column">
      <NavBar logInPage={true}/>
      <div className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4">
              {!createAccount ? (
                /* Login form */
                <div className="login-form-container form-transition bg-white rounded-4 shadow-sm p-4 p-md-5" style={{ border: '1px solid #e9ecef' }}>
                  <div className="login-header text-center mb-4">
                    <h1 className="h3 fw-normal text-dark mb-2">Welcome back</h1>
                    <p className="text-muted small mb-0">Sign in to your account</p>
                  </div>
                    <form onSubmit={(e) => handleLogin(e)}>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label text-dark fw-medium small">Email address</label>
                        <input 
                          type="email" 
                          className="form-control form-control-lg border-0 bg-light rounded-3"
                          id="email"
                          placeholder="Enter your email"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            padding: '12px 16px',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label htmlFor="password" className="form-label text-dark fw-medium small mb-0">Password</label>
                          <a 
                            className="text-decoration-none small text-muted"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate('/forgot-password')}
                          >
                            Forgot password?
                          </a>
                        </div>
                        <input 
                          type="password" 
                          className="form-control form-control-lg border-0 bg-light rounded-3"
                          id="password"
                          placeholder="Enter your password"
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            padding: '12px 16px',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-dark btn-lg w-100 rounded-3 mb-3"
                        style={{ 
                          padding: '12px',
                          fontSize: '16px',
                          fontWeight: '500'
                        }}
                      >
                        Sign in
                      </button>
                      
                      <div className="text-center mb-3">
                        <span className="text-muted small">or</span>
                      </div>
                      
                      <div className="d-grid mb-3">
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
                        />
                      </div>
                      
                      <div className="text-center">
                        <span className="text-muted small">Don't have an account? </span>
                        <a 
                          className="text-dark text-decoration-none fw-medium small"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.preventDefault()
                            setCreateAccount(true)
                          }}
                        >
                          Sign up
                        </a>
                      </div>
                    </form>
                  </div>
              ) : (
               /* Create Account form */
                <div className="login-form-container form-transition bg-white rounded-4 shadow-sm p-4 p-md-5" style={{ border: '1px solid #e9ecef' }}>
                  <div className="login-header text-center mb-4">
                    <h1 className="h3 fw-normal text-dark mb-2">Create your account</h1>
                    <p className="text-muted small mb-0">Join 180 Degrees Consulting</p>
                  </div>
                  <form onSubmit={(e) => handleRegister(e)}>
                    <div className="row mb-3">
                      <div className="col-6">
                        <label htmlFor="firstName" className="form-label text-dark fw-medium small">First name</label>
                        <input 
                          type="text" 
                          className="form-control form-control-lg border-0 bg-light rounded-3"
                          id="firstName"
                          placeholder="Jane"
                          value={fname} 
                          onChange={(e) => setFName(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            padding: '12px 16px',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        />
                      </div>
                      <div className="col-6">
                        <label htmlFor="lastName" className="form-label text-dark fw-medium small">Last name</label>
                        <input 
                          type="text" 
                          className="form-control form-control-lg border-0 bg-light rounded-3"
                          id="lastName"
                          placeholder="Doe"
                          value={lname} 
                          onChange={(e) => setLName(e.target.value)}
                          style={{ 
                            fontSize: '16px',
                            padding: '12px 16px',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="registerEmail" className="form-label text-dark fw-medium small">Email address</label>
                      <input 
                        type="email" 
                        className="form-control form-control-lg border-0 bg-light rounded-3"
                        id="registerEmail"
                        placeholder="Your university or work email"
                        value={registerEmail} 
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        style={{ 
                          fontSize: '16px',
                          padding: '12px 16px',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="registerPassword" className="form-label text-dark fw-medium small">Password</label>
                      <input 
                        type="password" 
                        className="form-control form-control-lg border-0 bg-light rounded-3"
                        id="registerPassword"
                        placeholder="Choose a secure password"
                        value={registerPassword} 
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        style={{ 
                          fontSize: '16px',
                          padding: '12px 16px',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      />
                      <div className="form-text text-muted small mt-1">
                        Must be 8+ characters including a number and letter
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-dark btn-lg w-100 rounded-3 mb-3"
                      style={{ 
                        padding: '12px',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    >
                      Create account
                    </button>
                    
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
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}