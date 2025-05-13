/**
 * Account settings page component that allows users to view and edit their profile information.
 * Handles both regular and Google OAuth authenticated users with different editing capabilities.
 */

import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '/src/styles.less';
import '/src/App.css';
import NavBar from '/src/Components/NavBar';
import { useNavigate } from 'react-router-dom';

export default function AccountPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_google_user: false
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureType, setProfilePictureType] = useState(null);  
  const [showPictureMenu, setShowPictureMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  async function checkAuthStatus() {
    const token = localStorage.getItem("token");
    if (!token) return false;
  
    const res = await fetch("http://localhost:8000/validate-token", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if(res.ok)
        return true;
    else
        return false
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('http://localhost:8000/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handlePictureMenuClick = () => {
    setShowPictureMenu(!showPictureMenu);
  };
  
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetch('http://localhost:8000/upload-profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
  
      if (response.ok) {
        // Refresh profile picture
        const profileRes = await fetch('http://localhost:8000/user-profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await profileRes.json();
        if (data.user.profile_picture) {
          setProfilePicture(data.user.profile_picture.data);
          setProfilePictureType(data.user.profile_picture.type);
        }
        setSuccess('Profile picture updated successfully');
      } else {
        setError('Failed to upload profile picture');
      }
    } catch {
      setError('Failed to upload profile picture');
    }
    setShowPictureMenu(false);
  };

  const handleDeleteProfilePicture = async () => {
    try {
      const response = await fetch('http://localhost:8000/delete-profile-picture', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (response.ok) {
        setProfilePicture(null);
        setProfilePictureType(null);
        setShowPictureMenu(false);
        window.location.reload()
        setSuccess('Profile picture removed successfully');
      } else {
        setError('Failed to remove profile picture');
      }
    } catch {
      setError('Failed to remove profile picture');
    }
  }

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:8000/user-profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log(data)
          setUserProfile({
            ...userProfile,
            email: data.user.email,
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
            password: data.user.password || '',
            is_google_user: data.user.is_google_user,
          });
          setEditForm({
            ...editForm,
            email: data.user.email,
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
          });

          if(data.user.profile_picture) {
            setProfilePicture(data.user.profile_picture.data);
            setProfilePictureType(data.user.profile_picture.type);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    const checkLogIn = async () => {
      const status = await checkAuthStatus();
      setLoggedIn(status);
      if (status) {
        fetchUserProfile();
      }
    };
    
    checkLogIn();
  }, []);

  useEffect(() => {
    console.log(userProfile)
  }, [userProfile]);

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (userProfile.password !== editForm.currentPassword) {
      setError('Current password is wrong.');
      return;
    }

    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch('http://localhost:8000/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile({
          email: data.user.email,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
        });
        setSuccess('Profile updated successfully');
        setIsEditing(false);
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to update profile');
      }
    } catch {
      setError('An error occurred while updating profile');
    }
  };

  const handleCheckDataChange = () => {
    return !(
      userProfile.first_name !== editForm.first_name ||
      userProfile.last_name !== editForm.last_name ||
      userProfile.email !== editForm.email ||
      editForm.newPassword.length > 0
    );
  }

  return (
    <div className="bg-white min-vh-100 rounded-1 p-3">
      <NavBar />
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <h2 className="mb-4 border-bottom border-black pb-3">Account Settings</h2>
            <div className="row mb-4 mt-2">
            {loggedIn ? (
              <>
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="row g-3 w-50 bg-light px-3 pb-3 rounded-1 border border-black shadow-sm mx-auto">
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        disabled={userProfile.is_google_user}
                        name="email"
                        className="form-control"
                        value={editForm.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        className="form-control"
                        value={editForm.first_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        className="form-control"
                        value={editForm.last_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        disabled={userProfile.is_google_user}
                        name="currentPassword"
                        className="form-control"
                        value={editForm.currentPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">New Password (leave blank to keep current)</label>
                      <input
                        type="password"
                        disabled={userProfile.is_google_user}
                        name="newPassword"
                        className="form-control"
                        value={editForm.newPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        disabled={userProfile.is_google_user}
                        name="confirmPassword"
                        className="form-control"
                        value={editForm.confirmPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-danger w-100 mt-2 btn-sm fw-semibold" type="button" onClick={() => {
                          setIsEditing(!isEditing)
                          setEditForm({
                            ...editForm,
                            email: userProfile.email,
                            first_name: userProfile.first_name || '',
                            last_name: userProfile.last_name || '',
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                          setError('')
                        }
                      }>Cancel</button>
                      <button className="btn btn-primary w-100 mt-2 btn-sm fw-semibold" type="submit"
                        disabled={handleCheckDataChange()}
                      >Save changes</button>
                    </div>
                  </form>
                ) : (
                  <div className="row g-3 w-50 bg-light px-3 pb-3 rounded-1 border border-black shadow-sm mx-auto">
                    <div className="mb-3">
                      <label className="form-label text-muted small">Email</label>
                      <div>{userProfile.email}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small">Name</label>
                      <div>{userProfile.first_name} {userProfile.last_name}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small">Password</label>
                      <div>
                        {'•'.repeat(8)}
                      </div>
                    </div>

                    {/* Profile picture section */}
                    <div className="mb-3">
                      <label className="form-label text-muted small">Profile picture</label>
                      <div className='d-flex position-relative w-50 mx-auto'>
                        {profilePicture ? (
                          <div className='position-relative w-100'>
                            <div className='position-relative'>
                              <div 
                                className='position-absolute bg-dark border-light fw-semibold text-white px-2 py-1 rounded-1'
                                style={{
                                  top: '5px',
                                  right: '20px',
                                  fontSize: '1.1rem',
                                  cursor: 'pointer',
                                }}
                                onClick={handlePictureMenuClick}
                              >
                                <span className="icon-class--edit bg-white"></span>
                              </div>
                              {showPictureMenu && (
                                <div 
                                  className='position-absolute bg-white border shadow-sm rounded-1 py-1'
                                  style={{
                                    top: '40px',
                                    right: '15px',
                                    width: '150px',
                                    zIndex: 1000
                                  }}
                                >
                                  <label className='d-block px-3 py-1 mb-0'
                                    style={{cursor: 'pointer'}}
                                  >
                                    <input
                                      type="file"
                                      className="d-none"
                                      accept="image/*"
                                      onChange={handleProfilePictureUpload}
                                    />
                                    Change
                                  </label>
                                  <div 
                                    className='px-3 py-1 text-danger'
                                    style={{cursor: 'pointer'}}
                                    onClick={handleDeleteProfilePicture}
                                  >
                                    Remove
                                  </div>
                                </div>
                              )}
                            </div>
                            <img 
                              className='d-block mx-auto'
                              src={`data:${profilePictureType};base64,${profilePicture}`}
                              style={{ 
                                borderRadius: '50%', 
                                width: '200px',
                                height: '200px',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                        ) : (
                          // No profile picture state
                          <div className="text-center w-100">
                            <div 
                              className="bg-light d-flex align-items-center justify-content-center rounded-circle mb-3 mx-auto"
                              style={{ 
                                width: '200px', 
                                height: '200px',
                                border: '2px dashed #dee2e6'
                              }}
                            >
                              <span className="icon-class--user-avatar" 
                                style={{ 
                                  fontSize: '4rem',
                                  opacity: 0.5
                                }}
                              ></span>
                            </div>
                            <label 
                              className="btn btn-outline-secondary btn-sm"
                              style={{cursor: 'pointer'}}
                            >
                              <input
                                type="file"
                                className="d-none"
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                              />
                              Upload profile picture
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="d-grid gap-2 d-md-block w-100 mt-4 border-top">
                      <button className="btn btn-primary w-100 mt-3 btn-sm fw-semibold" type="button" onClick={() => setIsEditing(!isEditing)}>Edit Profile</button>
                      <button className="btn btn-danger w-100 mt-2 btn-sm fw-semibold" type="button" onClick={handleLogout}>Log out</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className='text-center py-5'>
                <p className='fs-4 text-muted fw-lighter'>
                  Please log in before accessing this page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}