/**
 * Email management page component for composing and sending bulk emails.
 * Provides email composition, client filtering, and batch sending capabilities.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.less';
import '../App.css';
import NavBar from '/src/Components/NavBar';
import AddClientForm from '../Components/AddClientForm.jsx';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Email template definitions for different communication scenarios
 */
const EMAIL_TEMPLATES = {
  custom: { subject: '', content: '' },
  introduction: { 
    subject: 'Partnership Opportunity with 180 Degrees Consulting Sheffield', 
    content: `Hi there,

Hope you're well!

My name is Rory Cattini, and I am the Client Acquisition Manager at 180 Degrees Consulting Sheffield. We are a student lead consultancy with our members studying at the University of Sheffield. We partner with charities, non profit organisations and social enterprises, to deliver innovative and practical solutions tailored specifically to our clients' key business challenges, all for just a very minimal cost.

I wanted to reach out to explore a potential collaboration. Our consulting teams operate in areas such as strategic planning, operational efficiency, marketing, and impact measurement, and are supported by mentors from leading consultancy firms such as Mckinsey and Oliver Wyman, ensuring high quality deliverables and professional guidance throughout each project.

So far, we have successfully completed 5 projects with 4 different clients in our 1st year as an organisation, working with a wide range of non profit organisations including Healthwatch who have provided over 1 million people access to healthcare advice and information. We are currently looking to source new clients for our upcoming autumn project cycle and believe your organisation has significant potential for an impactful project.

I have attached our Client Information Booklet, which outlines our services and previous projects we have completed in more detail. We would love to schedule a meeting to explore how we can support you as we approach our next project cycle.

If this is something you are interested in, please book a time to meet with us here: https://calendly.com/rcattini1-180dc/30min

I look forward to hearing from you!

Kind regards,
Rory Cattini
Client Acquisition Manager
180 Degrees Consulting Sheffield` 
  },
  followup: { 
    subject: 'Follow-up: Potential Collaboration with 180 Degrees Consulting Sheffield', 
    content: `Hi there,

Hope you're well!

I wanted to follow up on my previous email about a potential collaboration with 180 Degrees Consulting Sheffield. We are a student lead consultancy with our members studying at the University of Sheffield, and we partner with charities, non profit organisations and social enterprises to deliver innovative and practical solutions.

Our consulting teams operate in areas such as strategic planning, operational efficiency, marketing, and impact measurement, and are supported by mentors from leading consultancy firms such as Mckinsey and Oliver Wyman.

We are currently looking to source new clients for our upcoming autumn project cycle and believe your organisation has significant potential for an impactful project.

If you're interested in learning more, please book a time to meet with us here: https://calendly.com/rcattini1-180dc/30min

I look forward to hearing from you!

Kind regards,
Rory Cattini
Client Acquisition Manager
180 Degrees Consulting Sheffield` 
  },
  resources: { 
    subject: 'Client Information: 180 Degrees Consulting Sheffield', 
    content: `Hi there,

Hope you're well!

I wanted to share some information about 180 Degrees Consulting Sheffield and our services. We are a student lead consultancy with our members studying at the University of Sheffield, and we partner with charities, non profit organisations and social enterprises to deliver innovative and practical solutions.

Our consulting teams operate in areas such as strategic planning, operational efficiency, marketing, and impact measurement, and are supported by mentors from leading consultancy firms such as Mckinsey and Oliver Wyman.

I have attached our Client Information Booklet, which outlines our services and previous projects we have completed in more detail. We would love to schedule a meeting to explore how we can support you as we approach our next project cycle.

If this is something you are interested in, please book a time to meet with us here: https://calendly.com/rcattini1-180dc/30min

I look forward to hearing from you!

Kind regards,
Rory Cattini
Client Acquisition Manager
180 Degrees Consulting Sheffield` 
  }
};

// Add this mapping object near the top of the file, after the imports
const COMPANY_TYPE_MAPPING = {
  'charity': 'Charity',
  'ltd': 'CIC',
  'private-limited-guarant-nsc': 'Non-Profit Company',
  'charitable-incorporated-organisation': 'CIC',
  'scottish-charitable-incorporated-organisation': 'Scottish Charitable Organisation',
  'further-education-or-sixth-form-college-corporation': 'Educational Institution',
  'community-interest-company': 'Community Interest Company',
  'royal-charter': 'Royal Charter',
  'united-kingdom-societas': 'UK Societas'
};

export default function EmailPage() {
  // Email composition state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [templateOption, setTemplateOption] = useState('custom');

  // Client management state
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    company_type: 'all',
    status: 'all',
    regions: [],
    cities: [],
    source: 'all'
  });

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPage, setSearchPage] = useState(0);
  const [filterResults, setFilterResults] = useState(null);

  // Location data state
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  const [showAddClientForm, setShowAddClientForm] = useState(false);

  const navigate = useNavigate();

  /**
   * Fetches client data and updates location filters
   */
  useEffect(() => {
    const fetch_results = async () => {    
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/all-clients`, {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });
      const data = await res.json();
      if(data){
        setClients(data);
        const uniqueRegions = [...new Set(
          data
            .map(client => client.region)
            .filter(Boolean)
        )].sort();

        const uniqueCities = [...new Set(
          data
            .map(client => client.city)
            .filter(Boolean)
        )].sort();

        setRegions(uniqueRegions);
        setCities(uniqueCities);
        setLoading(false);
      }
    }
    fetch_results();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/validate-token`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          localStorage.removeItem("token");
          navigate('/login');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    setSearchPage(0)
  }, [filters])

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (searchQuery && !client.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filters.company_type !== 'all' && 
          COMPANY_TYPE_MAPPING[client.company_type] !== filters.company_type) {
        return false;
      }
    
      if (filters.status !== 'all' && client.status !== filters.status) {
        return false;
      }
      if (filters.regions.length > 0 && !filters.regions.includes(client.region)) {
        return false;
      }
      if (filters.cities.length > 0 && !filters.cities.includes(client.city)) {
        return false;
      }
      if (filters.source !== 'all' && client.source !== filters.source) {
        return false;
      }
      return true;
    });
  }, [clients, searchQuery, filters]);
  
  useEffect(() => {
    const slicedResults = filteredClients.slice(searchPage, searchPage + 20);
    if (JSON.stringify(slicedResults) !== JSON.stringify(filterResults)) {
      setFilterResults(slicedResults);
    }
  }, [searchPage, filteredClients]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/send-emails/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_ids: selectedClients,
          subject: emailSubject,
          content: emailContent,
          status: "sent"
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to send emails');
      }
  
      const data = await response.json();
      console.log('Emails processed:', data);
      
      // Show success message with details
      const successCount = data.emails.filter(e => e.status === "sent").length;
      const failedCount = data.emails.filter(e => e.status === "failed").length;
      
      alert(`Emails processed:\n${successCount} sent successfully\n${failedCount} failed`);
      
      // Reset form
      setEmailSubject('');
      setEmailContent('');
      setSelectedClients([]);
      
    } catch (error) {
      console.error('Failed to send emails:', error);
      alert('Failed to send emails. Please try again.');
    }
  };

  const handleTemplateChange = (e) => {
    const selected = e.target.value;
    setTemplateOption(selected);
    
    if (selected !== 'custom') {
      setEmailSubject(EMAIL_TEMPLATES[selected].subject);
      setEmailContent(EMAIL_TEMPLATES[selected].content);
    } else {
      setEmailSubject('');
      setEmailContent('');
    }
  };

  const handleSelectClient = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(client => client.id));
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };

  const getUniqueCompanyTypes = (clientsList) => {
    const types = clientsList
      .map(client => COMPANY_TYPE_MAPPING[client.company_type] || client.company_type)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    
    return types;
  };

  const getUniqueSources = (clientsList) => {
    return [...new Set(
      clientsList
        .map(client => client.source)
        .filter(Boolean)
    )].sort();
  };

  // Pagination control handlers
  const handleNextBtn = () => setSearchPage(prev => prev + 20);
  const handlePrevBtn = () => setSearchPage(prev => Math.max(prev - 20, 0));
  const handleFirstPageBtn = () => setSearchPage(0);
  const handleLastPageBtn = () => {
      setSearchPage(Math.floor((filteredClients.length - 1) / 20) * 20);
  };

  return (
    <div className="bg-white min-vh-100 rounded-1 p-3 position-relative">
      { <NavBar /> }
      {loading 
      ? (
          <div className="spinner-border position-absolute top-50 start-50" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        ) : (
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              <h2 className="mb-4 border-bottom border-black pb-3">Email Management</h2>
              
              {/* Top section - Email Composition */}
              <div className="row mb-4 mt-2">
                <form className="col-12" onSubmit={(e) => handleSubmit(e)}>
                  <div className="border p-4 bg-light border-black rounded-1 shadow-sm">
                    <div className="d-flex justify-content-between mb-3">
                      <h2 className="h5 mb-0">Compose Email</h2>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                          <div className="mb-3">
                            <label htmlFor="templateSelect" className="form-label">Email Template</label>
                            <select className="form-select form-select-sm" 
                              id="templateSelect"
                              value={templateOption}
                              onChange={handleTemplateChange}
                            >
                              <option value="custom">Custom Email</option>
                              <option value="followup">Follow-up Template</option>
                              <option value="introduction">Introduction Template</option>
                              <option value="resources">Resources Template</option>
                            </select>
                          </div>
                        <div>
                          <label htmlFor="emailSubject" className="form-label">Subject</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            id="emailSubject"
                            placeholder="Email subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-8">
                        <label htmlFor="emailContent" className="form-label">
                          Content
                        </label>
                        <textarea 
                          className="form-control" 
                          id="emailContent" 
                          rows="7"
                          placeholder="Email content"
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                        ></textarea>
                      </div>
                    </div>

                    <div className="mt-3 d-flex justify-content-end gap-2 text-end">
                      <button className="btn btn-primary"
                        disabled={selectedClients.length === 0 || !emailSubject || !emailContent}
                      >
                        Send ({selectedClients.length})
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Middle section - Filter sidebar (left) and Results (right) */}
              <div className="row g-4">
                {/* Left sidebar - Filters */}
                <div className="col-md-4 col-lg-3">
                  <div className="bg-light border border-black rounded-1 p-3 shadow-sm">
                    <h3 className="h6 mb-3 pb-2 border-bottom">Filters</h3>
                    <div className="mb-3">
                      <label htmlFor="typeFilter" className="form-label small">Company Type</label>
                      <select id="typeFilter" 
                        className="form-select form-select-sm"
                        value={filters.company_type}
                        onChange={(e) => handleFilterChange('company_type', e.target.value)}
                      >
                        <option value="all">All Types</option>
                        {getUniqueCompanyTypes(clients).map(type => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="statusFilter" className="form-label small">Status</label>
                      <select 
                        id="statusFilter" 
                        className="form-select form-select-sm"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="sourceFilter" className="form-label small">Source</label>
                      <select 
                        id="sourceFilter" 
                        className="form-select form-select-sm"
                        value={filters.source}
                        onChange={(e) => handleFilterChange('source', e.target.value)}
                      >
                        <option value="all">All Sources</option>
                        {getUniqueSources(clients).map(source => (
                          <option key={source} value={source}>
                            {source}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small d-block">Region</label>
                      <div className="d-flex flex-column gap-2">
                        {regions.map(region => (
                          <div key={region} className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`region-${region}`}
                              checked={filters.regions?.includes(region)}
                              onChange={(e) => {
                                const newRegions = e.target.checked 
                                  ? [...(filters.regions || []), region]
                                  : filters.regions?.filter(r => r !== region) || [];
                                handleFilterChange('regions', newRegions);
                              }}
                            />
                            <label className="form-check-label small" htmlFor={`region-${region}`}>
                              {region}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small d-block">City</label>
                      <div className="d-flex flex-column gap-2">
                        {cities.map(city => (
                          <div key={city} className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`city-${city}`}
                              checked={filters.cities?.includes(city)}
                              onChange={(e) => {
                                const newCities = e.target.checked 
                                  ? [...(filters.cities || []), city]
                                  : filters.cities?.filter(c => c !== city) || [];
                                handleFilterChange('cities', newCities);
                              }}
                            />
                            <label className="form-check-label small" htmlFor={`city-${city}`}>
                              {city}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => {
                        setFilters({
                          company_type: 'all',
                          status: 'all',
                          regions: [],
                          cities: [],
                          source: 'all'
                        });
                        setSearchQuery('');
                        setSearchPage(0);
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Right content - Client Results */}
                <div className="col-md-8 col-lg-9">
                  {/* Search input and Add Client button */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center gap-1">
                      <div className="input-group border-black border rounded flex-grow-1">
                        <input 
                          type="text" 
                          className="form-control border-0"
                          placeholder="Search clients"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button 
                        className="btn btn-outline-dark my-auto"
                        onClick={() => setShowAddClientForm(true)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {/* Search results count */}
                  {searchQuery.length > 0 && 
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="text-muted small">
                        {filteredClients.length} {filteredClients.length === 1 ? 'result' : 'results'} found
                        {searchQuery && <span> for "<strong>{searchQuery}</strong>"</span>}
                      </div>
                    </div>
                  }

                  {/* Results List */}
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-secondary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading clients...</p>
                    </div>
                  ) : (
                    <div className="border border-black rounded-1 shadow-sm">
                      {/* Results header with pagination */}
                      <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-black">
                        <div className=''>
                          <button 
                            className="btn btn-sm btn-outline-secondary ms-1"
                            onClick={handleSelectAll}
                            disabled={filteredClients.length === 0}
                          >
                            {selectedClients.length === filteredClients.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className='text-center mx-auto'>
                          {`Showing results ${searchPage + 1} - ${Math.min(filteredClients.length, searchPage + 20)} of ${filteredClients.length}`}
                        </div>
                        <div className="me-1 px-3">
                          <button disabled={searchPage == 0} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                            onClick={handleFirstPageBtn}  
                          >
                            <span className="cdx-table-pager__icon--first cdx-button__icon" aria-hidden="true"></span>
                          </button>
                          <button disabled={searchPage == 0} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                            onClick={handlePrevBtn}
                          >
                            <span className="cdx-table-pager__icon--previous cdx-button__icon" aria-hidden="true"></span>
                          </button>
                          <button disabled={searchPage >= (filteredClients.length - 20)} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                            onClick={handleNextBtn}
                          >
                            <span className="cdx-table-pager__icon--next cdx-button__icon" aria-hidden="true"></span>
                          </button>
                          <button disabled={searchPage >= (filteredClients.length - 20)} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                            onClick={handleLastPageBtn}  
                          >
                            <span className="cdx-table-pager__icon--last cdx-button__icon" aria-hidden="true"></span>
                          </button>
                        </div>
                      </div>
                      {filterResults.length > 0 ? (
                        filterResults.map((client, index) => (
                          <div key={client.id} className={`search-results p-3 ${index !== filterResults.length - 1 ? 'border-bottom' : ''}`}>
                            <div className="d-flex">
                              <div className="me-3">
                                <input 
                                  className="form-check-input mt-1" 
                                  type="checkbox" 
                                  id={`client-${client.id}`}
                                  checked={selectedClients.includes(client.id)}
                                  onChange={() => handleSelectClient(client.id)}
                                />
                              </div>
                              <div onClick={() => navigate(`/company/${client.id}`)}>
                                <h3 className="h6 mb-1">{client.name}</h3>
                                <div className="text-primary mb-2 small">{client.email}</div>
                                <div className="d-flex flex-wrap gap-2 mb-1">
                                  <span className="badge bg-light text-dark border">
                                    {COMPANY_TYPE_MAPPING[client.company_type] || client.company_type}
                                  </span>
                                  <span className="badge bg-light text-dark border">{client.size}</span>
                                  <span className="badge bg-light text-dark border">{client.region || 'No region'}</span>
                                  <span className="badge bg-light text-dark border">{client.city || 'No city'}</span>
                                  {client.source && (
                                    <span className="badge bg-secondary text-light">
                                      Source: {client.source}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">No clients match your criteria</p>
                        </div>
                      )}

                      {/* Footer pagination (duplicate of header) */}
                      <div className="d-flex justify-content-between align-items-center mb-2 border-top border-black">
                        <div className=''>
                          <button 
                            className="btn btn-sm btn-outline-secondary ms-1"
                            onClick={handleSelectAll}
                            disabled={filterResults.length === 0}
                          >
                            {selectedClients.length === filterResults.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className='text-center mx-auto'>
                          {`Showing results ${searchPage + 1} - ${Math.min(filteredClients.length, searchPage + 20)} of ${filteredClients.length}`}
                        </div>
                        <div className="me-1 px-3">
                          <button disabled={searchPage == 0} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                            onClick={handleFirstPageBtn}  
                          >
                            <span className="cdx-table-pager__icon--first cdx-button__icon" aria-hidden="true"></span>
                          </button>
                          <button disabled={searchPage == 0} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                            onClick={handlePrevBtn}
                          >
                            <span className="cdx-table-pager__icon--previous cdx-button__icon" aria-hidden="true"></span>
                          </button>
                          <button disabled={searchPage >= (filteredClients.length - 20)} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                            onClick={handleNextBtn}
                          >
                            <span className="cdx-table-pager__icon--next cdx-button__icon" aria-hidden="true"></span>
                          </button>
                          <button disabled={searchPage >= (filteredClients.length - 20)} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                            onClick={handleLastPageBtn}  
                          >
                            <span className="cdx-table-pager__icon--last cdx-button__icon" aria-hidden="true"></span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddClientForm && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center z-3">
          <div className="w-50 bg-white rounded p-4 position-relative">
            <AddClientForm 
              showForm={showAddClientForm}
              onClose={() => setShowAddClientForm(false)}
              onClientAdded={(new_client) => {
                setClients([...clients, new_client]);
                setShowAddClientForm(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}