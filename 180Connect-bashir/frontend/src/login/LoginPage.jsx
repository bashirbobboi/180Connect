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

const API_URL = import.meta.env.VITE_API_URL;

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
    const error = validateLoginForm(user, pass);
    if (error) {
      alert(error);
      return;
    }

    const formData = new URLSearchParams();
    formData.append("email", user);
    formData.append("password", pass);
  
    const response = await fetch(`${API_URL}/token`, {
      method: "POST",
      body: formData,
      headers: {
        "accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  
    const data = await response.json();
  
    if (response.ok) {
      localStorage.setItem("token", data.access_token);
      navigate('/email')
      return data;
    } else if (response.status === 401) {
      alert("Invalid email or password");
      throw new Error(data.detail);
    }
    else {
      throw new Error(data.detail);
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
    const error = validateRegisterForm(register_email, pass, first_name, last_name);
    if (error) {
      alert(error);
      return;
    }

    const formData = new URLSearchParams();
    formData.append("email", register_email);
    formData.append("password", pass);
    formData.append("first_name", first_name);
    formData.append("last_name", last_name);
  
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      body: formData,
      headers: {
        "accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
    });
  
    const data = await response.json();
  
    if (response.ok) {
      alert("User created successfully.")
      navigate(0)
      return data;
    } else {
      throw new Error(data.detail);
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
    <div className="bg-whites rounded-1 p-3 m-2" style={{minHeight: '60vh'}}>
      <NavBar logInPage={true}/>
      <div className="container py-4 h-100">
        <div className="row justify-content-center h-100">
          <div className="col-12 col-lg-10">
            <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: "60vh" }}>
              {!createAccount ? (
                /* Login form */
                <form className="row g-3 w-50 bg-light px-3 pb-3 rounded-1 border border-black shadow-sm" onSubmit={(e) => handleLogin(e)}>
                  <h2 className="border-bottom pb-2">Login</h2>
                  <div className='col-md-12'>
                    <div className="cdx-label">
                      <label className="cdx-label__label">
                        <span className="cdx-label__label__text fs-5 fw-light">Email</span>
                      </label>
                      <span id="cdx-demo-description-1" className="cdx-label__description" style={{fontSize: '0.9rem'}}>
                        This can either be your email address or your company username.
                      </span>
                    </div>
                    <div className="col-md-12 cdx-text-input cdx-text-input--has-start-icon">
                      <input className="cdx-text-input__input rounded-1" 
                        placeholder="name@example.com" type="text" 
                        value={email} onChange={(e) => setEmail(e.target.value)}/>
                      <span className="cdx-text-input__icon cdx-text-input__start-icon icon-class--user-avatar"></span>
                    </div>
                  </div>
                  <div className='col-md-12'>
                    <div className="cdx-label">
                      <label className="cdx-label__label d-flex justify-content-between align-items-center">
                        <span className="cdx-label__label__text fs-5 fw-light">Password</span>
                        <a href="#" className="text-primary text-decoration-none small">Forgot password?</a>
                      </label>
                    </div>
                    <div className="col-md-12 cdx-text-input cdx-text-input--has-start-icon">
                      <input className="cdx-text-input__input rounded-1" 
                        placeholder="Enter your password" type="password" 
                        value={password} onChange={(e) => setPassword(e.target.value)} />
                      <span className="cdx-text-input__icon cdx-text-input__start-icon icon-class--lock"></span>
                    </div>
                  </div>
                  <div className="col-12 d-grid pt-3 pb-1">
                    <button type="submit" className="btn btn-dark">Sign in</button>
                    <button className="mt-2 btn btn-outline-dark"
                      onClick={(e) => {
                        e.preventDefault()
                        setCreateAccount(true)}}
                    >Create account</button>
                    
                    <div className="me-auto mt-2">
                      <small className="text-muted text-start mt-3">Or use your Google account to sign in.</small>
                      <GoogleLogin
                        onSuccess={(response) => {
                          handleGoogleSuccess(response)
                        }}
                        onError={() => {
                          console.log('Login Failed');
                        }}
                      />
                    </div>
                  </div>
                </form>
              ) : (
               /* Create Account form */
                <form className="row g-3 w-50 bg-light px-3 pb-3 rounded-1 border border-black shadow-sm" onSubmit={(e) => handleRegister(e)}>
                  <h2 className="border-bottom pb-2">Create account</h2>
                  <div className='col-md-12 p-0 m-0 row g-3'>
                    <div className="col-md-6">
                      <label for="inputFirst" className="form-label fs-5">First name</label>
                      <input type="text" placeholder='Jane' className="form-control border-black rounded-1" 
                        id="inputFirst" value={fname} onChange={(e) => setFName(e.target.value)}/>
                    </div>
                    <div className="col-md-6">
                      <label for="inputLast" className="form-label fs-5">Last name</label>
                      <input type="text" placeholder='Doe' className="form-control border-black rounded-1" 
                        id="inputLast" value={lname} onChange={(e) => setLName(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-12">
                    <label for="inputAddress" className="form-label fs-5">Email address</label>
                    <input type="email" className="form-control border-black rounded-1" 
                      id="inputAddress" placeholder="name@example.com" value={registerEmail} 
                      onChange={(e) => setRegisterEmail(e.target.value)}/>
                  </div>
                  <div className="col-12">
                    <label for="inputPassword" className="form-label fs-5">Password</label>
                    <input type="password" placeholder='Create a strong password' 
                      className="form-control border-black rounded-1" id="inputPassword"
                      value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)}/>
                    <div className="form-text">Password should be at least 8 characters long.</div>
                  </div>
                  <div className="col-12 d-grid pt-3 pb-1">
                    <button type="submit" className="btn btn-dark">Create account</button>
                    <small className="text-muted text-start mt-2">Already have an account?</small>
                    <button className="mt-1 btn btn-outline-dark"
                      onClick={(e) => {
                        e.preventDefault();
                        setCreateAccount(false);
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}