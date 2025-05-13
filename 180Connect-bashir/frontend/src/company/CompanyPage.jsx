/**
 * Company profile page component that displays company information and email interactions.
 * Provides functionality for viewing company details, sending emails, and tracking communication history.
 */

import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '/src/styles.less';
import '/src/App.css';
import NavBar from '/src/Components/NavBar';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

/**
 * Email template definitions for different communication scenarios
 */
const EMAIL_TEMPLATES = {
  custom: { subject: '', content: '' },
  followup: { 
    subject: 'Follow-up: Partnership Opportunity', 
    content: 'Dear [Company Name],\n\nI hope this email finds you well. I wanted to follow up on our previous conversation about potential partnership opportunities.\n\nLooking forward to hearing from you.\n\nBest regards,\n180connect Team' 
  },
  introduction: { 
    subject: 'Introduction: 180connect Services', 
    content: 'Dear [Company Name],\n\nI am reaching out from 180connect to introduce our services that may benefit your organization.\n\nI would appreciate the opportunity to discuss how we might collaborate.\n\nBest regards,\n180connect Team' 
  },
  resources: { 
    subject: 'New Resources Available', 
    content: 'Dear [Company Name],\n\nWe have recently updated our resource materials that may be of interest to your organization.\n\nPlease let me know if you would like to receive these materials.\n\nBest regards,\n180connect Team' 
  }
};

export default function CompanyPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Company and email state
  const [company, setCompany] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Email composition state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [templateOption, setTemplateOption] = useState('custom');

  // UI state
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [searchPage, setSearchPage] = useState(0);

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

  /**
   * Generates AI-assisted email content
   */
  const generateAIContent = async () => {
    setEmailSubject(`AI-Generated: Collaboration with ${company?.name}`);
    setEmailContent(`Dear ${company?.name} team,\n\nBased on our analysis of your organization's needs and activities, we believe we can provide valuable support to your services.\n\nWould you be available for a brief discussion next week?\n\nBest regards,\n180connect Team`);
  };

  /**
   * Toggles AI assistance for email composition
   */
  const handleAIToggle = () => {
    setUseAI(!useAI);
    if (!useAI) {
      generateAIContent();
    }
  };

  const handleSaveDraft = () => {
    alert('Email draft saved successfully!');
  };

  const handleSendEmail = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/send-emails/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_ids: [company.id], // Send to single client
          subject: emailSubject,
          content: emailContent,
          ai: useAI,
          status: "sent"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const data = await response.json();
      console.log('Email sent:', data);
      
      // Show success message
      const successCount = data.emails.filter(e => e.status === "sent").length;
      const failedCount = data.emails.filter(e => e.status === "failed").length;
      
      if (successCount > 0) {
        alert(`Email sent successfully!`);
        // Reset form
        setEmailSubject('');
        setEmailContent('');
        // Refresh email history
        fetchClientEmails();
      } else {
        alert(`Failed to send email: ${failedCount > 0 ? 'No valid email address for client' : 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  /**
   * Pagination handlers
  */
  const handleNextBtn = () => setSearchPage(searchPage + 20);
  const handlePrevBtn = () => setSearchPage(Math.max(searchPage - 20, 0));
  const handleFirstPageBtn = () => setSearchPage(0);
  const handleLastPageBtn = () => setSearchPage(Math.floor((emails.length - 1) / 20) * 20);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch("`${API_URL}/validate-token", {
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
    const fetchClientEmails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/client-emails/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch emails');
        }

        const data = await response.json();
        console.log(data)
        setCompany(data.client);
        setEmails(data.emails);
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false)
      }
    };

    fetchClientEmails();
  }, []);

  useEffect(() => {
    console.log(company)
  }, [company]);

  return (
    <>
      {!company ? (<></>) : (
        <div className="bg-whites rounded-1 p-3">
          <NavBar />
          
          <div className="container py-4">
            <div className="row justify-content-center">
              <div className="col-10">
                <div className='mb-4 border-bottom border-black pb-3'>
                  <h2 className="cdx-title mb-1">{company.name}</h2>
                  <div className="cdx-label text-muted">{String(company.id).padStart(5, '0')} • {(company.company_type).toUpperCase()}</div>
                </div>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-10">
                <div className="row g-4">
                  <div className="col-md-4">
                    {/* Edit Button at the top left, above Description */}
                    <button
                      className="btn btn-outline-primary mb-3"
                      onClick={() => navigate(`/edit-client/${company.id}`)}
                    >
                      Edit Client
                    </button>
                    {/* About Card */}
                    <div className="cdx-card mb-4 bg-light shadow-sm border-black rounded-1">
                      <div className="cdx-card__text">
                        <div className="cdx-card__text__title">
                          Description
                        </div>
                        <div className="cdx-card__text__description">
                          {company?.activities ? (
                            <>
                              <p className='m-0'>
                                {showFullDescription 
                                  ? company.activities
                                  : company.activities.slice(0, 200) + (company.activities.length > 200 ? '...' : '')}
                              </p>
                              {company.activities.length > 200 && (
                                <button
                                  onClick={() => setShowFullDescription(!showFullDescription)}
                                  className="cdx-button cdx-button--weight-quiet p-0"
                                  style={{ fontSize: '0.875rem' }}
                                >
                                  {showFullDescription ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </>
                          ) : (
                            <p className='fst-italic'>No description</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Contact Information Card */}
                    <div className="cdx-card mb-4 bg-light shadow-sm border-black rounded-1">
                      <div className="cdx-card__text">
                        <div className="cdx-card__text__title">
                          Contact
                        </div>
                        <div className="cdx-card__text__supporting-text">
                          <div className="cdx-description-list">
                            <div className="cdx-description-list__item">
                              <div className="cdx-description-list__term">Email:</div>
                              <div className="cdx-description-list__value text-primary">
                                <a href={`mailto:${company.email}`} className="cdx-link">
                                  {company.email}
                                </a>
                              </div>
                            </div>
                            <div className="cdx-description-list__item">
                              <div className="cdx-description-list__term">Address:</div>
                              <div className="cdx-description-list__value text-dark">{company.address}</div>
                            </div>
                            <div className="cdx-description-list__item">
                              <div className="cdx-description-list__term">Website:</div>
                              <div className="cdx-description-list__value text-primary">
                                <a href={company.website} className="cdx-link" target="_blank" rel="noreferrer">
                                  {company.website}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
    
                  <div className="col-md-8">
                    {/* Email Section */}
                    <section className="mb-4">
                      <div className="cdx-card bg-light shadow-sm border-black rounded-1">
                        <div className="cdx-card__text w-100">
                          <div className="cdx-card__text__title d-flex justify-content-between align-items-center">
                            <h2 className="h5 mb-0">Compose Email</h2>
                            <span className="cdx-toggle-switch">
                              <input
                                className="cdx-toggle-switch__input"
                                type="checkbox"
                                id="useAI" 
                                checked={useAI}
                                onChange={handleAIToggle}
                              />
                              <span className="cdx-toggle-switch__switch">
                                <span className="cdx-toggle-switch__switch__grip"></span>
                              </span>
                              <div className="cdx-toggle-switch__label cdx-label">
                                <label htmlFor="useAI" className="cdx-label__label">
                                  <span className="cdx-label__label__text"> Use AI? </span>
                                </label>
                              </div>
                            </span>
                          </div>
                          <div className="cdx-card__text__description w-100">
                            <form className='' style={{
                              width: '100% !important'
                            }}>
                              <div className="mb-3">
                                <label htmlFor="templateSelect" className="form-label">Email Template</label>
                                <select 
                                  className="form-select" 
                                  id="templateSelect"
                                  value={templateOption}
                                  onChange={handleTemplateChange}
                                  disabled={useAI}
                                >
                                  <option value="custom">Custom Email</option>
                                  <option value="followup">Follow-up Template</option>
                                  <option value="introduction">Introduction Template</option>
                                  <option value="resources">Resources Template</option>
                                </select>
                              </div>
                              <div className="mb-3">
                                <label htmlFor="emailSubject" className="form-label">Subject</label>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  id="emailSubject"
                                  placeholder="Email subject"
                                  value={emailSubject}
                                  onChange={(e) => setEmailSubject(e.target.value)}
                                />
                              </div>
                              <div className="mb-3">
                                <label htmlFor="emailContent" className="form-label">Content</label>
                                <textarea 
                                  className="form-control" 
                                  id="emailContent" 
                                  rows="6"
                                  placeholder="Email content"
                                  value={emailContent}
                                  onChange={(e) => setEmailContent(e.target.value)}
                                ></textarea>
                              </div>
                              <div className="d-flex justify-content-end gap-2">
                                <button 
                                  type="button" 
                                  className="btn btn-outline-secondary"
                                  onClick={handleSaveDraft}
                                >
                                  Save as Draft
                                </button>
                                <button
                                  className="cdx-button cdx-button--action-progressive cdx-button--weight-primary rounded"
                                  onClick={handleSendEmail} disabled={!emailSubject || !emailContent}
                                >
                                  Send Email
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    </section>
        
                    {/* Interactions Table */}
                    <section className="mb-4">
                      <div className="border border-black rounded-1 shadow-sm">
                          <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-black">
                            <div className='text-center mx-auto'>
                                {`Showing results ${searchPage + 1} - ${Math.min(emails.length, searchPage + 20)} of ${emails.length}`}
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
                              <button disabled={searchPage >= (emails.length - 20)} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                                onClick={handleNextBtn}
                              >
                                <span className="cdx-table-pager__icon--next cdx-button__icon" aria-hidden="true"></span>
                              </button>
                              <button disabled={searchPage >= (emails.length - 20)} className="cdx-button cdx-button--icon-only cdx-button--weight-quiet" 
                                onClick={handleLastPageBtn}  
                              >
                                <span className="cdx-table-pager__icon--last cdx-button__icon" aria-hidden="true"></span>
                              </button>
                            </div>
                          </div>
                          {loading ? (
                            <div className="text-center py-5">
                              <div className="spinner-border text-secondary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <p className="mt-2">Loading email history...</p>
                            </div>
                          ) : (
                            <>
                              {emails.length > 0 ? (
                                emails.slice(searchPage, searchPage + 20).map((email, index) => (
                                  <div key={email.id || index}
                                    className={`p-3 ${index !== emails.length - 1 ? 'border-bottom' : ''}`}
                                  >
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <h3 className="h6 mb-0">{email.subject}</h3>
                                          <span className={`badge ${
                                            email.status === 'sent' ? 'bg-success' : 
                                            email.status === 'draft' ? 'bg-secondary' : 
                                            'bg-warning'
                                          } text-white`}>
                                            {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                                          </span>
                                        </div>
                                        <div className="border-start border-4 ps-3 mb-2">
                                          {email.content.split('\n').map((line, i) => (
                                            <p key={i} className="mb-1 small text-muted">
                                              {line}
                                            </p>
                                          ))}
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                          <div className="text-muted small">
                                            {new Date(email.date).toLocaleDateString('en-GB', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-4">
                                  <p className="text-muted mb-0">No email history found</p>
                                </div>
                              )}
                            </>
                          )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
