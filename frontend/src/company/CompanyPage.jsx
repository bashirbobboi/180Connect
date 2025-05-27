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

const API_URL = import.meta.env.VITE_API_URL;

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

const PagerButton = ({ disabled, onClick, icon }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className="cdx-button cdx-button--icon-only cdx-button--weight-quiet"
  >
    <span className={`cdx-table-pager__icon--${icon} cdx-button__icon`} aria-hidden="true"></span>
  </button>
);

const LoadingSpinner = () => (
  <div className="text-center py-5">
    <div className="spinner-border text-secondary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <p className="mt-2">Loading email history...</p>
  </div>
);

const EmailCard = ({ email, isLast }) => (
  <div className={`p-3 ${!isLast ? 'border-bottom' : ''}`}>
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
            <p key={i} className="mb-1 small text-muted">{line}</p>
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
);

const ContactCard = ({ company }) => (
  <div className="card mb-4 p-0 bg-light shadow-sm border-black rounded-1">
    <div className="card-body">
      <h6 className="card-title">Contact</h6>
      {(company.email || company.address || company.website) ? (
        <ul className="list-group list-group-flush border-0 p-0 bg-transparent" 
          style={{ fontSize: "0.8rem" }}
        >
        {company?.email && (
          <li className="list-group-item border-0 p-0 bg-transparent">
            {"Email: "} 
            <a 
              href={`mailto:${company.email}`} 
              className="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">
              {company.email}
            </a>
          </li>
        )}
        {company?.website && (
          <li className="list-group-item border-0 p-0 bg-transparent">
          {"Website: "} 
          <a 
            href={company.website}
            target="_blank" rel="noreferrer"
            className="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">
            {company.website}
          </a>
        </li>
        )}
        {company?.address && company?.address !== "N/A" && (
          <li className="list-group-item border-0 p-0 bg-transparent">{`Address: ${company.address}`}
          </li>
        )}
        </ul>
      ) : (
        <div className="text-start" style={{ fontSize: '0.8rem' }}>
          <p className='fst-italic'>No contact found</p>
        </div>
      )}
    </div>
  </div>
);

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

  const handleSendEmail = () => {
    alert('Email sent successfully!');
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
      {loading 
      ? (
        <div className="bg-white min-vh-100 rounded-1 p-3 position-relative">
          <NavBar />
          <div className="spinner-border position-absolute top-50 start-50" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) 
      : (
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
                    {/* About Card */}
                    <div className="card mb-4 p-0 bg-light shadow-sm border-black rounded-1">
                      <div className='card-body pb-0'>
                        <h6 className="card-title">Description</h6>
                        <div className="card-text" style={{ fontSize: '0.8rem' }}>
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
                                  className="btn btn-link text-dark-emphasis pb-2 mt-1 p-0"
                                  style={{ fontSize: '0.8rem' }}
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
                    <ContactCard company={company} />
                  </div>
    
                  <div className="col-md-8">
                    {/* Email Section */}
                    <section className="mb-4">
                      <div className="cdx-card bg-light shadow-sm border-black rounded-1">
                        <div className="cdx-card__text w-100">
                          <div className="cdx-card__text__title d-flex justify-content-between align-items-center">
                            <h2 className="h5 mb-0">Compose Email</h2>
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
                                  className="btn btn-primary"
                                  onClick={handleSendEmail} disabled={!emailSubject || !emailContent || !(company.email)}
                                >
                                  Send
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
                        {emails.length > 0 && (
                          <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-black">
                            <div className="px-1">
                              <PagerButton disabled={searchPage === 0} onClick={handleFirstPageBtn} icon="first" />
                              <PagerButton disabled={searchPage === 0} onClick={handlePrevBtn} icon="previous" />
                            </div>

                            <div className="text-center mx-auto">
                              {`Showing results ${searchPage + 1} - ${Math.min(emails.length, searchPage + 20)} of ${emails.length}`}
                            </div>

                            <div className="px-1">
                              <PagerButton disabled={searchPage >= emails.length - 20} onClick={handleNextBtn} icon="next" />
                              <PagerButton disabled={searchPage >= emails.length - 20} onClick={handleLastPageBtn} icon="last" />
                            </div>
                          </div>
                        )}

                        {loading ? (
                          <LoadingSpinner />
                        ) : emails.length > 0 ? (
                          emails.slice(searchPage, searchPage + 20).map((email, index) => (
                            <EmailCard key={email.id || index} email={email} isLast={index === emails.length - 1} />
                          ))
                        ) : (
                          <div className="text-center py-5">
                            <p className="text-muted mb-0">No email history found</p>
                          </div>
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