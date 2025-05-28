/**
 * Navigation bar component with search functionality and authentication status.
 * Provides client search, navigation controls, and dynamic authentication state display.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import '../styles.less';
import '../App.css';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const Logo = ({ link='/' }) => {
    const navigate = useNavigate()
    return (
        <div className="cdx-header__logo d-flex align-items-center gap-2"
            onClick={() => navigate(link)}
            style={{
                cursor: 'pointer'
            }}
        >
            <span className="cdx-header__logo-text px-2"
                style={{
                    fontFamily: "'Quicksand', sans-serif",
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    backgroundColor: '#000',
                    borderRadius: '0.25rem',
                    letterSpacing: '-1px'
                }}
            >
            <img 
                src="https://cdn.prod.website-files.com/60e54ea15f272327f97407a7/60efd71577cf177edbe14a4d_180DC%20Globe.png" 
                alt="180connect logo" 
                className='me-1 mb-1'
                style={{
                    width: '26px',
                    objectFit: 'contain'
                }} 
            />
                180connect
            </span>
        </div>
    )}

/**
 * logInPage - Flag indicating if current page is login page
 */
export default function NavBar ({logInPage=false}) {
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePictureType, setProfilePictureType] = useState(null); 

    // Debounced search query to prevent excessive API calls
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        const fetch_results = async () => {        
            const res = await fetch(`${API_URL}/search-clients?query=${encodeURIComponent(debouncedSearchQuery)}`, {
                headers: {
                'Accept': 'application/json',
                }
            });
            const data = await res.json();

            if(data){
                setResults(data.results)
            }
        }
        if (debouncedSearchQuery) {
            fetch_results()
        }
    }, [debouncedSearchQuery]);

    async function checkAuthStatus() {
        const token = localStorage.getItem("token");
        if (!token) return false;
      
        try {
            const res = await fetch(`${API_URL}/user-profile`, {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            console.log(data)
            if (data.user.profile_picture) {
                setProfilePicture(data.user.profile_picture.data);
                setProfilePictureType(data.user.profile_picture.type);
            }

            if(res.ok)
                return true;
            
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        }

        return false;
    }

    useEffect(() => {
        const checkLogIn = async () => {
            const status = await checkAuthStatus();
            setLoggedIn(status);
            setLoading(false);
        }
        
        checkLogIn();
    }, []);
    
    if(loading) return null;
    
    return (
        <header className="cdx-header mb-3">
            <div className="d-flex justify-content-between align-items-center">
                {/* Logo section */}
                <Logo />
                
                {/* If current page is the login page, then hide search bar and account button */}
                {!logInPage && (
                <>
                    {/* Search section */}
                    <div className="cdx-search-input rounded-1 position-relative" style={{
                        width: '35%'
                    }}>
                        <div className="cdx-text-input cdx-text-input--has-start-icon">
                            <input
                                type="search"
                                placeholder="Search for clients"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="cdx-text-input__input rounded"
                            />
                            <span className="cdx-text-input__icon cdx-text-input__start-icon"></span>
                        </div>
                        
                        {/* Search results dropdown */}
                        {searchQuery && results.length > 0 && (
                            <div className="position-absolute w-100 bg-white border border-black rounded-1 mt-1 shadow-sm" 
                                style={{ maxHeight: '300px', overflowY: 'auto', zIndex: 1000 }}>
                                <div className="p-2 border-bottom bg-light">
                                    <small className="text-muted">
                                        Found {results.length} result{results.length === 1 ? '' : 's'}
                                    </small>
                                </div>
                                {results.slice(0, 500).map((result) => (
                                    <div key={result.id}
                                        className="p-2 border-bottom search-results"
                                        onClick={() => {
                                            navigate(`/company/${result.id}`);
                                            setSearchQuery('');
                                        }}
                                        style={{
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <div className="fw-semibold">{result.name}</div>
                                        <small className="text-muted">
                                            {result.company_type} • {String(result.id).padStart(5, '0')}
                                        </small>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Account buttons */}
                    {/* If user is not logged in, then hide account button  */}
                    {loggedIn ? (
                        // Display user profile picture if it exists
                        profilePicture ? (
                            <div className="my-auto profile-pic" 
                                onClick={() => navigate("/account")}
                            >
                                <img 
                                    title="Account settings"
                                    src={`data:${profilePictureType};base64,${profilePicture}`} 
                                    width={40}
                                    height={40}
                                    className='border border-dark border-1 rounded-1 grayscale'
                                    style={{
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        ) : (
                            <button className="cdx-button rounded-1 my-auto" 
                                onClick={() => navigate("/account")}
                            >
                                <span className="icon-class--user-avatar"></span>
                                Account
                            </button>
                        )
                    ) : (
                        <button
                            className="cdx-button bg-primary text-light rounded-1 my-auto"
                            onClick={() => navigate("/login")}
                        >
                            <span className="icon-class--user-avatar bg-light"></span>
                            Log in
                        </button>
                    )}
                </>
                )}
            </div>
        </header>
    )
}