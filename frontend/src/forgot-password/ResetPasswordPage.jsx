import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from "react-router-dom";
import '../styles.less';
import '../App.css';

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
        setEmail('');
        setSent(true);
      } else {
        const data = await res.json();
        alert(data.detail || "Reset failed.");
      }
    } catch {
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="bg-whites rounded-1 p-3 m-2" style={{ minHeight: '60vh' }}>
      <div className="container py-4 h-100">
        <div className="row justify-content-center h-100">
          <div className="col-12 col-lg-10">
            <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: "60vh" }}>
              {sent ? (
                <div className='w-50 bg-light px-3 pb-3 rounded-1 border border-black shadow-sm'>
                  <h2 className="border-bottom py-2">Email sent</h2>
                  <p>
                    An email with instructions on how to reset your password has been sent to the provided email address. Check your spam or junk folder, if you don't see the email in your inbox.
                  </p>
                </div>
              ) : (
                <form className="row g-3 w-50 bg-light px-3 pb-3 rounded-1 border border-black shadow-sm" onSubmit={handleRequestPasswordReset}>
                  <h2 className="border-bottom pb-2">Reset your password</h2>
                  <div className="col-12">
                    <input
                      type="email"
                      placeholder="Email address"
                      className="form-control border-black rounded-1"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="form-text">We will send you an email with instructions on how to reset your password.</div>
                  </div>

                  <div className="col-12 d-grid pt-3 pb-1">
                    <button type="submit" className="btn btn-dark">Send email</button>
                  </div>
                </form>
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
    <div className="bg-whites rounded-1 p-3 m-2" style={{ minHeight: '60vh' }}>
      <div className="container py-4 h-100">
        <div className="row justify-content-center h-100">
          <div className="col-12 col-lg-10">
            <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: "60vh" }}>
              {!token ? (
                <div className='w-50'>
                  <h2 className='mx-auto text-center'>Invalid or missing reset token</h2>
                  <div className="col-12 d-grid pt-3 pb-1">
                    <button className="btn btn-outline-dark mx-auto"
                      onClick={() => navigate('/forgot-password')}
                    >Request a new one</button>
                  </div>
                </div>
              ) : (
                <form className="row g-3 w-50 bg-light px-3 pb-3 rounded-1 border border-black shadow-sm" onSubmit={handlePasswordReset}>
                <h2 className="border-bottom pb-2">Change your password</h2>

                {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
                {successMessage && <div className="alert alert-success">{successMessage}</div>}

                <div className="col-12">
                  <label htmlFor="inputPassword1" className="form-label fs-5">New password</label>
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    className="form-control border-black rounded-1"
                    id="inputPassword1"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div className="form-text">Password should be at least 8 characters long.</div>
                </div>

                <div className="col-12">
                  <label htmlFor="inputPassword2" className="form-label fs-5">Confirm new password</label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    className="form-control border-black rounded-1"
                    id="inputPassword2"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                  {(newPassword !== confirmNewPassword) && <div className="form-text text-danger">Both passwords must match.</div>}
                </div>

                <div className="col-12 d-grid pt-3 pb-1">
                  <button type="submit" className="btn btn-dark">Reset password</button>
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