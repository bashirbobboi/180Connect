import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.less';
import '../App.css';
import NavBar from '../Components/NavBar';

const COMPANY_TYPES = [
  "Charity",
  "CIC",
  "Social Enterprise",
  "Nonprofit",
  "Limited Company",
  "Other"
];

export default function EditClientPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(``${API_URL}/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          company_type: data.company_type || COMPANY_TYPES[0],
          status: data.status || 'active',
          address: data.address || '',
          email: data.email || '',
          postcode: data.postcode || '',
          city: data.city || '',
          region: data.region || '',
          website: data.website || '',
          client_mission: data.activities || ''
        });
      }
      setLoading(false);
    };
    fetchClient();
  }, [clientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        activities: formData.client_mission
      };
      delete payload.client_mission;

      const response = await fetch(``${API_URL}/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      alert('Client updated!');
      navigate(`/company/${clientId}`);
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('Failed to update client. Please try again.');
    }
  };

  if (loading || !formData) return <div>Loading...</div>;

  return (
    <div className="bg-white min-vh-100 rounded-1 p-3">
      <NavBar />
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Edit Client</h2>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/company/${clientId}`)}
              >
                Cancel
              </button>
            </div>
            <div className="card border-black">
              <div className="card-body">
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
                      <select
                        className="form-select"
                        id="company_type"
                        name="company_type"
                        value={formData.company_type}
                        onChange={handleChange}
                        required
                      >
                        {COMPANY_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
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
                        placeholder="https://example.com"
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
                    <label htmlFor="client_mission" className="form-label">Client Mission</label>
                    <textarea
                      className="form-control"
                      id="client_mission"
                      name="client_mission"
                      value={formData.client_mission}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
