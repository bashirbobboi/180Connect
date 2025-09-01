import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function AddClientForm({ showForm, onClose, onClientAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    company_type: '',
    status: 'active',
    address: '',
    email: '',
    postcode: '',
    city: '',
    region: '',
    website: '',
    activities: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/add-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to add client');
      }

      const data = await response.json();

      
      // Reset form
      setFormData({
        name: '',
        company_type: '',
        status: 'active',
        address: '',
        email: '',
        postcode: '',
        city: '',
        region: '',
        website: '',
        activities: ''
      });

      // Notify parent component
      if (onClientAdded) {
        onClientAdded(data.client);
      }

    } catch (error) {
      console.error('Failed to add client:', error);
      alert('Failed to add client. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!showForm) return null;
  
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Add New Client</h5>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label">Company Name *</label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="company_type" className="form-label">Company Type *</label>
              <input
                type="text"
                className="form-control"
                id="company_type"
                name="company_type"
                value={formData.company_type}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="website" className="form-label">Website</label>
              <input
                type="url"
                className="form-control"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="address" className="form-label">Address</label>
            <textarea
              className="form-control"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
            />
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="postcode" className="form-label">Postcode</label>
              <input
                type="text"
                className="form-control"
                id="postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label htmlFor="city" className="form-label">City</label>
              <input
                type="text"
                className="form-control"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label htmlFor="region" className="form-label">Region</label>
              <input
                type="text"
                className="form-control"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="activities" className="form-label">Activities</label>
            <textarea
              className="form-control"
              id="activities"
              name="activities"
              value={formData.activities}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
