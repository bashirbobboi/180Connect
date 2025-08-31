import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  TrendingUp, 
  MessageSquare,
  Plus,
  ArrowUpRight,
  Activity,
  BarChart3,
  Users,
  Database,
  Home,
  Settings,
  User,
  LogOut
} from 'lucide-react';
import './styles.less';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function HomePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        totalCompanies: 0,
        emailsSent: 0,
        activeCampaigns: 0,
        interactions: 0,
        companyTypes: {},
        recentActivity: []
    });
    const [userProfile, setUserProfile] = useState(null);

    // Helper function to get activity icon
    const getActivityIcon = (type) => {
        switch (type) {
            case 'email':
                return <Mail className="text-white" size={12} />;
            case 'interaction':
                return <MessageSquare className="text-white" size={12} />;
            case 'company_added':
                return <Building2 className="text-white" size={12} />;
            default:
                return <Activity className="text-white" size={12} />;
        }
    };

    // Check authentication and fetch user profile
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
                    return;
                }

                // Fetch user profile
                const profileRes = await fetch(`${API_URL}/user-profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    setUserProfile(profile);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");
                
                // Fetch all clients to calculate statistics
                const clientsRes = await fetch(`${API_URL}/all-clients`, {
                    headers: {
                        'Accept': 'application/json',
                        Authorization: `Bearer ${token}`,
                    }
                });

                if (clientsRes.ok) {
                    const clients = await clientsRes.json();
                    
                    // Calculate company types
                    const companyTypes = {};
                    clients.forEach(client => {
                        const type = client.company_type || 'Unknown';
                        companyTypes[type] = (companyTypes[type] || 0) + 1;
                    });

                    // Create recent activity from recent clients (mock data for now)
                    const recentActivity = clients.slice(0, 3).map(client => ({
                        id: client.id,
                        type: 'company_added',
                        title: `New company added: ${client.name}`,
                        subtitle: client.name,
                        timestamp: '27 Aug at 01:50' // Mock timestamp
                    }));

                    setDashboardData({
                        totalCompanies: clients.length,
                        emailsSent: 0, // TODO: Fetch from email endpoints
                        activeCampaigns: 0, // TODO: Implement campaigns
                        interactions: 0, // TODO: Implement interactions tracking
                        companyTypes,
                        recentActivity
                    });
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex min-vh-100 bg-light">
            {/* Left Sidebar */}
            <div className="bg-white border-end" style={{ width: '250px', minHeight: '100vh' }}>
                {/* Logo Section */}
                <div className="p-3 border-bottom">
                    <button
                        onClick={() => handleNavigation("/")}
                        className="btn btn-link text-decoration-none p-0 w-100"
                    >
                        <div className="d-flex align-items-center">
                            <div className="bg-primary rounded me-2 d-flex align-items-center justify-content-center" 
                                 style={{ width: '32px', height: '32px' }}>
                                <Building2 className="text-white" size={20} />
                            </div>
                            <div className="text-start">
                                <div className="fw-bold text-dark">180Connect</div>
                                <div className="text-muted small">CRM Platform</div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="p-3">
                    <div className="nav flex-column">
                        <button 
                            className="nav-link btn btn-link text-start p-2 mb-1 rounded bg-primary text-white d-flex align-items-center border-0"
                            onClick={() => handleNavigation('/')}
                            style={{ transition: 'all 0.2s ease' }}
                        >
                            <BarChart3 className="me-2" size={18} />
                            Dashboard
                        </button>
                        <button 
                            className="nav-link btn btn-link text-start p-2 mb-1 rounded text-dark d-flex align-items-center border-0"
                            onClick={() => handleNavigation('/email')}
                            style={{ transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => e.target.classList.add('bg-light')}
                            onMouseLeave={(e) => e.target.classList.remove('bg-light')}
                        >
                            <Building2 className="me-2" size={18} />
                            Companies
                        </button>
                        <button 
                            className="nav-link btn btn-link text-start p-2 mb-1 rounded text-dark d-flex align-items-center border-0"
                            onClick={() => handleNavigation('/email')}
                            style={{ transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => e.target.classList.add('bg-light')}
                            onMouseLeave={(e) => e.target.classList.remove('bg-light')}
                        >
                            <Mail className="me-2" size={18} />
                            Email Campaigns
                        </button>
                        <button 
                            className="nav-link btn btn-link text-start p-2 mb-1 rounded text-dark d-flex align-items-center border-0"
                            onClick={() => handleNavigation('/email')}
                            style={{ transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => e.target.classList.add('bg-light')}
                            onMouseLeave={(e) => e.target.classList.remove('bg-light')}
                        >
                            <Database className="me-2" size={18} />
                            Data Import
                        </button>
                        <button 
                            className="nav-link btn btn-link text-start p-2 mb-1 rounded text-dark d-flex align-items-center border-0"
                            onClick={() => handleNavigation('/account')}
                            style={{ transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => e.target.classList.add('bg-light')}
                            onMouseLeave={(e) => e.target.classList.remove('bg-light')}
                        >
                            <Users className="me-2" size={18} />
                            Team
                        </button>
                    </div>
                </nav>

                {/* User Profile Section */}
                <div className="mt-auto p-3 border-top" style={{ position: 'absolute', bottom: '0', width: '250px' }}>
                    {userProfile && (
                        <div className="dropdown">
                            <button className="btn btn-link text-start p-0 w-100 text-decoration-none" 
                                    data-bs-toggle="dropdown" aria-expanded="false">
                                <div className="d-flex align-items-center">
                                    <div className="bg-secondary rounded-circle me-2 d-flex align-items-center justify-content-center text-white" 
                                         style={{ width: '32px', height: '32px' }}>
                                        {userProfile.first_name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-medium">{userProfile.first_name} {userProfile.last_name}</div>
                                        <div className="text-muted small">{userProfile.email}</div>
                                    </div>
                                    <span className="badge bg-primary">admin</span>
                                </div>
                            </button>
                            <ul className="dropdown-menu">
                                <li><button className="dropdown-item d-flex align-items-center" onClick={() => handleNavigation('/')}>
                                    <Home className="me-2" size={16} />
                                    Home
                                </button></li>
                                <li><button className="dropdown-item d-flex align-items-center" onClick={() => handleNavigation('/account')}>
                                    <Settings className="me-2" size={16} />
                                    Admin Settings
                                </button></li>
                                <li><button className="dropdown-item d-flex align-items-center" onClick={() => handleNavigation('/account')}>
                                    <User className="me-2" size={16} />
                                    Account Settings
                                </button></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><button className="dropdown-item text-danger d-flex align-items-center" onClick={handleSignOut}>
                                    <LogOut className="me-2" size={16} />
                                    Sign out
                                </button></li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 p-4">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="h2 mb-1">Dashboard</h1>
                    <p className="text-muted">Welcome to 180Connect CRM - Your client outreach platform</p>
                </div>

                {/* Stats Cards */}
                <div className="row g-4 mb-4">
                    <div className="col-md-3">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 className="card-title text-muted mb-1">Total Companies</h5>
                                        <h2 className="mb-0">{dashboardData.totalCompanies}</h2>
                                        <small className="text-muted">0 contacted</small>
                                    </div>
                                    <Building2 className="text-muted" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 className="card-title text-muted mb-1">Emails Sent</h5>
                                        <h2 className="mb-0">{dashboardData.emailsSent}</h2>
                                        <small className="text-muted">0% success rate</small>
                                    </div>
                                    <Mail className="text-muted" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 className="card-title text-muted mb-1">Active Campaigns</h5>
                                        <h2 className="mb-0">{dashboardData.activeCampaigns}</h2>
                                        <small className="text-muted">0 total campaigns</small>
                                    </div>
                                    <TrendingUp className="text-muted" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h5 className="card-title text-muted mb-1">Interactions</h5>
                                        <h2 className="mb-0">{dashboardData.interactions}</h2>
                                        <small className="text-muted">This week</small>
                                    </div>
                                    <MessageSquare className="text-muted" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Row */}
                <div className="row g-4">
                    {/* Company Overview */}
                    <div className="col-md-8">
                        <div className="card h-100">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Company Overview</h5>
                                <button className="btn btn-link btn-sm text-decoration-none d-flex align-items-center" 
                                        onClick={() => handleNavigation('/email')}>
                                    View all
                                    <ArrowUpRight className="ms-1" size={14} />
                                </button>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <h6>By Type</h6>
                                    {Object.entries(dashboardData.companyTypes).slice(0, 2).map(([type, count]) => (
                                        <div key={type} className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-capitalize">{type === 'charity' ? 'Charity' : 'CIC'}</span>
                                            <span>{count}</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h6>By Priority</h6>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>High</span>
                                        <span className="badge bg-danger rounded-pill">1</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="col-md-4">
                        <div className="card h-100">
                            <div className="card-header">
                                <h5 className="mb-0">Recent Activity</h5>
                            </div>
                            <div className="card-body">
                                {dashboardData.recentActivity.length > 0 ? (
                                    dashboardData.recentActivity.map((activity, index) => (
                                        <div key={activity.id} className={`d-flex align-items-start ${index !== dashboardData.recentActivity.length - 1 ? 'mb-3' : ''}`}>
                                            <div className="bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center" 
                                                 style={{ width: '24px', height: '24px', minWidth: '24px' }}>
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="fw-medium small">{activity.title}</div>
                                                <div className="text-muted small">{activity.subtitle}</div>
                                                <div className="text-muted small">{activity.timestamp}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted">No recent activity</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4">
                    <h5 className="mb-3">Quick Actions</h5>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <button className="btn btn-outline-primary w-100 p-3 d-flex flex-column align-items-center" 
                                    onClick={() => handleNavigation('/email')}>
                                <Building2 className="mb-2" size={24} />
                                Add Company
                            </button>
                        </div>
                        <div className="col-md-4">
                            <button className="btn btn-outline-primary w-100 p-3 d-flex flex-column align-items-center" 
                                    onClick={() => handleNavigation('/email')}>
                                <Mail className="mb-2" size={24} />
                                New Campaign
                            </button>
                        </div>
                        <div className="col-md-4">
                            <button className="btn btn-outline-primary w-100 p-3 d-flex flex-column align-items-center" 
                                    onClick={() => handleNavigation('/email')}>
                                <Database className="mb-2" size={24} />
                                Import Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
